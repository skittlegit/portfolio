-- Chat system tables for /165
-- Safe to run multiple times (idempotent)

-- ── Helper function (SECURITY DEFINER avoids self-referential RLS issues) ────

create or replace function is_conversation_participant(conv_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from conversation_participants
    where conversation_id = conv_id
      and user_id = auth.uid()
  );
$$;

-- ── Tables ──────────────────────────────────────────────────────────────────

create table if not exists conversations (
  id uuid default gen_random_uuid() primary key,
  is_group boolean default false not null,
  group_name text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Add group columns if missing (safe on fresh installs too)
alter table conversations add column if not exists is_group boolean default false not null;
alter table conversations add column if not exists group_name text;

create table if not exists conversation_participants (
  conversation_id uuid references conversations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  joined_at timestamptz default now() not null,
  primary key (conversation_id, user_id)
);

create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references conversations(id) on delete cascade not null,
  sender_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  image_url text,
  reply_to uuid references messages(id) on delete set null,
  created_at timestamptz default now() not null,
  edited_at timestamptz,
  deleted_at timestamptz
);

create table if not exists message_reactions (
  id uuid default gen_random_uuid() primary key,
  message_id uuid references messages(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  emoji text not null,
  created_at timestamptz default now() not null,
  unique(message_id, user_id, emoji)
);

create table if not exists read_receipts (
  conversation_id uuid references conversations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  last_read_at timestamptz default now() not null,
  primary key (conversation_id, user_id)
);

-- ── Indexes ──────────────────────────────────────────────────────────────────

create index if not exists messages_conversation_idx on messages(conversation_id, created_at desc);
create index if not exists messages_sender_idx on messages(sender_id);
create index if not exists conversation_participants_user_idx on conversation_participants(user_id);
create index if not exists message_reactions_message_idx on message_reactions(message_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────

alter table conversations enable row level security;
alter table conversation_participants enable row level security;
alter table messages enable row level security;
alter table message_reactions enable row level security;
alter table read_receipts enable row level security;

-- ── Policies (drop first so re-runs don't error) ─────────────────────────────

-- Conversations
drop policy if exists "Users can view own conversations" on conversations;
create policy "Users can view own conversations"
  on conversations for select
  using (is_conversation_participant(id));

drop policy if exists "Authenticated users can create conversations" on conversations;
create policy "Authenticated users can create conversations"
  on conversations for insert
  with check (auth.uid() is not null);

drop policy if exists "Participants can update conversation" on conversations;
create policy "Participants can update conversation"
  on conversations for update
  using (is_conversation_participant(id));

-- Participants
drop policy if exists "Users can view participants in own conversations" on conversation_participants;
create policy "Users can view participants in own conversations"
  on conversation_participants for select
  using (is_conversation_participant(conversation_id));

drop policy if exists "Authenticated users can add participants" on conversation_participants;
create policy "Authenticated users can add participants"
  on conversation_participants for insert
  with check (auth.uid() is not null);

-- Messages
drop policy if exists "Users can view messages in own conversations" on messages;
create policy "Users can view messages in own conversations"
  on messages for select
  using (is_conversation_participant(conversation_id));

drop policy if exists "Users can send messages to own conversations" on messages;
create policy "Users can send messages to own conversations"
  on messages for insert
  with check (
    sender_id = auth.uid() and
    is_conversation_participant(conversation_id)
  );

drop policy if exists "Users can edit own messages" on messages;
create policy "Users can edit own messages"
  on messages for update
  using (sender_id = auth.uid());

-- Reactions
drop policy if exists "Users can view reactions in own conversations" on message_reactions;
create policy "Users can view reactions in own conversations"
  on message_reactions for select
  using (
    message_id in (select id from messages where is_conversation_participant(conversation_id))
  );

drop policy if exists "Users can add reactions" on message_reactions;
create policy "Users can add reactions"
  on message_reactions for insert
  with check (user_id = auth.uid());

drop policy if exists "Users can remove own reactions" on message_reactions;
create policy "Users can remove own reactions"
  on message_reactions for delete
  using (user_id = auth.uid());

-- Read receipts
drop policy if exists "Users can view read receipts in own conversations" on read_receipts;
create policy "Users can view read receipts in own conversations"
  on read_receipts for select
  using (is_conversation_participant(conversation_id));

drop policy if exists "Users can update own read receipts" on read_receipts;
create policy "Users can update own read receipts"
  on read_receipts for insert
  with check (user_id = auth.uid());

drop policy if exists "Users can upsert own read receipts" on read_receipts;
create policy "Users can upsert own read receipts"
  on read_receipts for update
  using (user_id = auth.uid());

-- ── Realtime ─────────────────────────────────────────────────────────────────

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'message_reactions'
  ) then
    alter publication supabase_realtime add table message_reactions;
  end if;
end $$;
