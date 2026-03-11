-- Run this in your Supabase SQL Editor AFTER the saved_items setup

-- Profiles table for usernames, display names, and avatar URLs
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table profiles enable row level security;

-- Anyone can read profiles (for username uniqueness checks)
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (true);

-- Users can insert their own profile
create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Index for fast username lookups
create index profiles_username_idx on profiles(username);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
