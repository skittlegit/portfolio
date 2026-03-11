-- Chat system tables for /165
-- Run this in Supabase SQL Editor

-- Conversations (DMs and group chats)
create table conversations (
  id uuid default gen_random_uuid() primary key,
  is_group boolean default false not null,
  group_name text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Conversation participants (who is in each conversation)
create table conversation_participants (
  conversation_id uuid references conversations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  joined_at timestamptz default now() not null,
  primary key (conversation_id, user_id)
);

-- Messages
create table messages (
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

-- Message reactions (emoji reactions)
create table message_reactions (
  id uuid default gen_random_uuid() primary key,
  message_id uuid references messages(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  emoji text not null,
  created_at timestamptz default now() not null,
  unique(message_id, user_id, emoji)
);

-- Read receipts
create table read_receipts (
  conversation_id uuid references conversations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  last_read_at timestamptz default now() not null,
  primary key (conversation_id, user_id)
);

-- Indexes
create index messages_conversation_idx on messages(conversation_id, created_at desc);
create index messages_sender_idx on messages(sender_id);
create index conversation_participants_user_idx on conversation_participants(user_id);
create index message_reactions_message_idx on message_reactions(message_id);

-- Enable RLS
alter table conversations enable row level security;
alter table conversation_participants enable row level security;
alter table messages enable row level security;
alter table message_reactions enable row level security;
alter table read_receipts enable row level security;

-- RLS Policies

-- Conversations: can see if you're a participant
create policy "Users can view own conversations"
  on conversations for select
  using (
    id in (
      select conversation_id from conversation_participants
      where user_id = auth.uid()
    )
  );

create policy "Authenticated users can create conversations"
  on conversations for insert
  with check (auth.uid() is not null);

create policy "Participants can update conversation"
  on conversations for update
  using (
    id in (
      select conversation_id from conversation_participants
      where user_id = auth.uid()
    )
  );

-- Participants: can see co-participants in own conversations
create policy "Users can view participants in own conversations"
  on conversation_participants for select
  using (
    conversation_id in (
      select conversation_id from conversation_participants
      where user_id = auth.uid()
    )
  );

create policy "Authenticated users can add participants"
  on conversation_participants for insert
  with check (auth.uid() is not null);

-- Messages: can see messages in own conversations
create policy "Users can view messages in own conversations"
  on messages for select
  using (
    conversation_id in (
      select conversation_id from conversation_participants
      where user_id = auth.uid()
    )
  );

create policy "Users can send messages to own conversations"
  on messages for insert
  with check (
    sender_id = auth.uid() and
    conversation_id in (
      select conversation_id from conversation_participants
      where user_id = auth.uid()
    )
  );

create policy "Users can edit own messages"
  on messages for update
  using (sender_id = auth.uid());

-- Reactions
create policy "Users can view reactions in own conversations"
  on message_reactions for select
  using (
    message_id in (
      select m.id from messages m
      join conversation_participants cp on cp.conversation_id = m.conversation_id
      where cp.user_id = auth.uid()
    )
  );

create policy "Users can add reactions"
  on message_reactions for insert
  with check (user_id = auth.uid());

create policy "Users can remove own reactions"
  on message_reactions for delete
  using (user_id = auth.uid());

-- Read receipts
create policy "Users can view read receipts in own conversations"
  on read_receipts for select
  using (
    conversation_id in (
      select conversation_id from conversation_participants
      where user_id = auth.uid()
    )
  );

create policy "Users can update own read receipts"
  on read_receipts for insert
  with check (user_id = auth.uid());

create policy "Users can upsert own read receipts"
  on read_receipts for update
  using (user_id = auth.uid());

-- Enable realtime for messages and reactions
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table message_reactions;
