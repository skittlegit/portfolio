-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

create table saved_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null,        -- 'qr-code', 'palette', 'gradient', 'pattern', 'vector-art', 'shape'
  name text not null,
  data jsonb not null,
  preview text,              -- CSS gradient string or data URL for visual preview
  created_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table saved_items enable row level security;

-- Users can only read their own items
create policy "Users can read own items"
  on saved_items for select
  using (auth.uid() = user_id);

-- Users can only insert their own items
create policy "Users can insert own items"
  on saved_items for insert
  with check (auth.uid() = user_id);

-- Users can only delete their own items
create policy "Users can delete own items"
  on saved_items for delete
  using (auth.uid() = user_id);

-- Index for fast lookups
create index saved_items_user_id_idx on saved_items(user_id);
