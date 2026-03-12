-- Migration: Fix RLS for admin, harder coinflip, reset balances
-- Run this in your Supabase SQL Editor

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. Fix RLS on user_currency so admin (skittle) can set any user's balance
-- ══════════════════════════════════════════════════════════════════════════════

-- Helper: check if current user is admin
create or replace function is_admin_user()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and lower(username) = 'skittle'
  );
$$;

-- Replace INSERT policy to allow admin
drop policy if exists "Users can insert own balance" on user_currency;
create policy "Users can insert own balance"
  on user_currency for insert
  with check (user_id = auth.uid() or is_admin_user());

-- Replace UPDATE policy to allow admin
drop policy if exists "Users can update own balance" on user_currency;
create policy "Users can update own balance"
  on user_currency for update
  using (user_id = auth.uid() or is_admin_user());

-- Allow admin to delete (for reset all)
drop policy if exists "Admin can delete balances" on user_currency;
create policy "Admin can delete balances"
  on user_currency for delete
  using (is_admin_user());

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. Update coinflip: remove max bet, reduce payout (win only 0.8x your bet)
-- ══════════════════════════════════════════════════════════════════════════════

create or replace function play_coinflip(
  bet_amount integer,
  player_choice text
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
  payout integer;
  new_balance integer;
begin
  if bet_amount <= 0 then raise exception 'Bet must be positive'; end if;
  if player_choice not in ('heads', 'tails') then raise exception 'Choice must be heads or tails'; end if;

  insert into user_currency (user_id, balance) values (player_id, 500) on conflict (user_id) do nothing;
  select balance into current_balance from user_currency where user_id = player_id for update;
  if current_balance < bet_amount then raise exception 'Insufficient balance'; end if;

  -- 50/50 chance but payout is only 0.8x (house takes 20%)
  flip_result := case when random() < 0.5 then 'heads' else 'tails' end;
  won := flip_result = player_choice;
  payout := case when won then floor(bet_amount * 0.8) else 0 end;
  new_balance := current_balance + case when won then payout else -bet_amount end;

  update user_currency set balance = new_balance, updated_at = now() where user_id = player_id;

  insert into currency_transactions (from_user_id, to_user_id, amount, note, type)
    values (
      case when won then null else player_id end,
      case when won then player_id else null end,
      case when won then payout else bet_amount end,
      'Coin flip — ' || flip_result,
      case when won then 'game_win' else 'game_loss' end
    );

  return jsonb_build_object(
    'result', flip_result,
    'won', won,
    'bet', bet_amount,
    'payout', payout,
    'new_balance', new_balance
  );
end;
$$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. Fix family tree RLS so admin can manage any node
-- ══════════════════════════════════════════════════════════════════════════════

drop policy if exists "Users can insert own family node" on family_tree;
create policy "Users can insert own family node"
  on family_tree for insert
  with check (user_id = auth.uid() or is_admin_user());

drop policy if exists "Users can update own family node" on family_tree;
create policy "Users can update own family node"
  on family_tree for update
  using (user_id = auth.uid() or is_admin_user());

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. Remove transfer_currency max bet limit (was 200 in the check)
-- ══════════════════════════════════════════════════════════════════════════════

-- The transfer_currency function doesn't have a max bet limit, so no change needed.
-- The coinflip function above already removes the max bet limit.

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. Fix custom_bets status CHECK to allow 'cancelled'
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE custom_bets DROP CONSTRAINT IF EXISTS custom_bets_status_check;
ALTER TABLE custom_bets ADD CONSTRAINT custom_bets_status_check
  CHECK (status IN ('open', 'closed', 'resolved', 'cancelled'));

-- Allow admin to update any bet (not just creator)
DROP POLICY IF EXISTS "Creators can update own bets" ON custom_bets;
CREATE POLICY "Creators or admin can update bets"
  ON custom_bets FOR UPDATE
  USING (creator_id = auth.uid() OR is_admin_user());

-- Allow deletion of bets (creator or admin)
DROP POLICY IF EXISTS "Admin can delete bets" ON custom_bets;
CREATE POLICY "Admin can delete bets"
  ON custom_bets FOR DELETE
  USING (creator_id = auth.uid() OR is_admin_user());

-- Allow admin to delete bet entries (for cleanup)
DROP POLICY IF EXISTS "Admin can delete bet entries" ON bet_entries;
CREATE POLICY "Admin can delete bet entries"
  ON bet_entries FOR DELETE
  USING (is_admin_user());
