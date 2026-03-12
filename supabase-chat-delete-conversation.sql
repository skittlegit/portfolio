-- Migration: reliable DM/group deletion for participants
-- Run in Supabase SQL Editor

create or replace function delete_conversation_for_user(conv_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not logged in';
  end if;

  if not exists (
    select 1
    from conversation_participants
    where conversation_id = conv_id
      and user_id = uid
  ) then
    raise exception 'Not a participant of this conversation';
  end if;

  -- Cascades to messages, reactions, read receipts and participants.
  delete from conversations where id = conv_id;
end;
$$;

grant execute on function delete_conversation_for_user(uuid) to authenticated;
