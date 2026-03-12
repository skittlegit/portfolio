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

-- ── Dedup existing data (safe to run multiple times) ─────────────────────────

-- Remove duplicate group chats — keep the oldest per group_name
delete from conversations
where is_group = true
  and group_name is not null
  and id not in (
    select distinct on (group_name) id
    from conversations
    where is_group = true and group_name is not null
    order by group_name, created_at asc
  );

-- Remove duplicate DMs between the same pair of users — keep the oldest
delete from conversations
where is_group = false
  and id not in (
    select distinct on (least(p1.user_id::text, p2.user_id::text) || ',' || greatest(p1.user_id::text, p2.user_id::text)) c.id
    from conversations c
    join conversation_participants p1 on p1.conversation_id = c.id
    join conversation_participants p2 on p2.conversation_id = c.id and p2.user_id <> p1.user_id
    where c.is_group = false
    order by least(p1.user_id::text, p2.user_id::text) || ',' || greatest(p1.user_id::text, p2.user_id::text), c.created_at asc
  );

-- Unique constraint so group names can never duplicate again
drop index if exists conversations_group_name_unique_idx;
create unique index conversations_group_name_unique_idx
  on conversations (group_name)
  where is_group = true and group_name is not null;

-- ── Storage: chat-media bucket ───────────────────────────────────────────────
-- Run once in Supabase Dashboard > Storage, or via this SQL:

insert into storage.buckets (id, name, public)
  values ('chat-media', 'chat-media', true)
  on conflict (id) do nothing;

drop policy if exists "Whitelisted users can upload chat media" on storage.objects;
create policy "Whitelisted users can upload chat media"
  on storage.objects for insert
  with check (bucket_id = 'chat-media' and auth.uid() is not null);

drop policy if exists "Anyone can view chat media" on storage.objects;
create policy "Anyone can view chat media"
  on storage.objects for select
  using (bucket_id = 'chat-media');

drop policy if exists "Users can delete own chat media" on storage.objects;
create policy "Users can delete own chat media"
  on storage.objects for delete
  using (bucket_id = 'chat-media' and (storage.foldername(name))[1] = auth.uid()::text);

-- ── Currency system ───────────────────────────────────────────────────────────

create table if not exists user_currency (
  user_id uuid references auth.users(id) on delete cascade primary key,
  balance integer not null default 500 check (balance >= 0),
  updated_at timestamptz default now() not null
);

create table if not exists currency_transactions (
  id uuid default gen_random_uuid() primary key,
  from_user_id uuid references auth.users(id) on delete set null,
  to_user_id uuid references auth.users(id) on delete set null,
  amount integer not null check (amount > 0),
  note text,
  type text not null default 'transfer', -- 'transfer' | 'game_win' | 'game_loss'
  created_at timestamptz default now() not null
);

alter table user_currency enable row level security;
alter table currency_transactions enable row level security;

drop policy if exists "Authenticated can view balances" on user_currency;
create policy "Authenticated can view balances"
  on user_currency for select using (auth.uid() is not null);

drop policy if exists "Users can init own balance" on user_currency;
create policy "Users can init own balance"
  on user_currency for insert with check (user_id = auth.uid());

drop policy if exists "Users can update own balance" on user_currency;
create policy "Users can update own balance"
  on user_currency for update using (user_id = auth.uid());

drop policy if exists "Authenticated can view transactions" on currency_transactions;
create policy "Authenticated can view transactions"
  on currency_transactions for select using (auth.uid() is not null);

drop policy if exists "Authenticated can insert transactions" on currency_transactions;
create policy "Authenticated can insert transactions"
  on currency_transactions for insert with check (auth.uid() is not null);

-- Atomic transfer function (SECURITY DEFINER bypasses RLS for internal updates)
create or replace function transfer_currency(
  from_uid uuid,
  to_uid uuid,
  transfer_amount integer,
  transfer_note text default null
)
returns void
language plpgsql
security definer
as $$
declare
  sender_balance integer;
begin
  if transfer_amount <= 0 then raise exception 'Amount must be positive'; end if;
  if from_uid = to_uid then raise exception 'Cannot transfer to yourself'; end if;

  insert into user_currency (user_id, balance) values (from_uid, 500) on conflict (user_id) do nothing;
  insert into user_currency (user_id, balance) values (to_uid, 500) on conflict (user_id) do nothing;

  select balance into sender_balance from user_currency where user_id = from_uid for update;
  if sender_balance < transfer_amount then raise exception 'Insufficient balance'; end if;

  update user_currency set balance = balance - transfer_amount, updated_at = now() where user_id = from_uid;
  update user_currency set balance = balance + transfer_amount, updated_at = now() where user_id = to_uid;

  insert into currency_transactions (from_user_id, to_user_id, amount, note, type)
    values (from_uid, to_uid, transfer_amount, transfer_note, 'transfer');
end;
$$;

-- Coin flip game function
create or replace function play_coinflip(
  bet_amount integer,
  player_choice text  -- 'heads' or 'tails'
)
returns jsonb
language plpgsql
security definer
as $$
declare
  player_id uuid := auth.uid();
  current_balance integer;
  flip_result text;
  won boolean;
  new_balance integer;
begin
  if bet_amount <= 0 then raise exception 'Bet must be positive'; end if;
  if bet_amount > 200 then raise exception 'Maximum bet is 200'; end if;
  if player_choice not in ('heads', 'tails') then raise exception 'Choice must be heads or tails'; end if;

  insert into user_currency (user_id, balance) values (player_id, 500) on conflict (user_id) do nothing;
  select balance into current_balance from user_currency where user_id = player_id for update;
  if current_balance < bet_amount then raise exception 'Insufficient balance'; end if;

  flip_result := case when random() < 0.5 then 'heads' else 'tails' end;
  won := flip_result = player_choice;
  new_balance := current_balance + case when won then bet_amount else -bet_amount end;

  update user_currency set balance = new_balance, updated_at = now() where user_id = player_id;

  insert into currency_transactions (from_user_id, to_user_id, amount, note, type)
    values (
      case when won then null else player_id end,
      case when won then player_id else null end,
      bet_amount,
      'Coin flip — ' || flip_result,
      case when won then 'game_win' else 'game_loss' end
    );

  return jsonb_build_object(
    'result', flip_result,
    'won', won,
    'bet', bet_amount,
    'new_balance', new_balance
  );
end;
$$;

-- ── Family tree ───────────────────────────────────────────────────────────────

create table if not exists family_tree (
  user_id uuid references auth.users(id) on delete cascade primary key,
  title text not null default 'Member',
  parent_user_id uuid references auth.users(id) on delete set null,
  updated_at timestamptz default now() not null
);

alter table family_tree enable row level security;

drop policy if exists "Authenticated can view family tree" on family_tree;
create policy "Authenticated can view family tree"
  on family_tree for select using (auth.uid() is not null);

drop policy if exists "Users can insert own family node" on family_tree;
create policy "Users can insert own family node"
  on family_tree for insert with check (user_id = auth.uid());

drop policy if exists "Users can update own family node" on family_tree;
create policy "Users can update own family node"
  on family_tree for update using (user_id = auth.uid());

-- ── Follow system ─────────────────────────────────────────────────────────────

create table if not exists user_follows (
  follower_id uuid references auth.users(id) on delete cascade not null,
  following_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

alter table user_follows enable row level security;

drop policy if exists "Authenticated can view follows" on user_follows;
create policy "Authenticated can view follows"
  on user_follows for select using (auth.uid() is not null);

drop policy if exists "Users can follow" on user_follows;
create policy "Users can follow"
  on user_follows for insert with check (follower_id = auth.uid());

drop policy if exists "Users can unfollow" on user_follows;
create policy "Users can unfollow"
  on user_follows for delete using (follower_id = auth.uid());

-- ── User presence ─────────────────────────────────────────────────────────────

create table if not exists user_presence (
  user_id uuid references auth.users(id) on delete cascade primary key,
  last_seen timestamptz default now() not null
);

alter table user_presence enable row level security;

drop policy if exists "Authenticated can view presence" on user_presence;
create policy "Authenticated can view presence"
  on user_presence for select using (auth.uid() is not null);

drop policy if exists "Users can upsert own presence" on user_presence;
create policy "Users can upsert own presence"
  on user_presence for insert with check (user_id = auth.uid());

drop policy if exists "Users can update own presence" on user_presence;
create policy "Users can update own presence"
  on user_presence for update using (user_id = auth.uid());

-- Realtime for read_receipts
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'read_receipts'
  ) then
    alter publication supabase_realtime add table read_receipts;
  end if;
end $$;
