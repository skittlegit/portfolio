-- Migration: fairer game odds + server-side RNG for all core games
-- Run in Supabase SQL Editor

-- Coin flip: 50/50 with 5% house edge via 1.9x gross payout.
create or replace function play_coinflip(
  bet_amount integer,
  player_choice text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  player_id uuid := auth.uid();
  current_balance integer;
  flip_result text;
  won boolean;
  payout integer;
  new_balance integer;
begin
  if player_id is null then raise exception 'Not logged in'; end if;
  if bet_amount <= 0 then raise exception 'Bet must be positive'; end if;
  if player_choice not in ('heads', 'tails') then raise exception 'Choice must be heads or tails'; end if;

  insert into user_currency (user_id, balance)
    values (player_id, 500)
    on conflict (user_id) do nothing;

  select balance into current_balance
  from user_currency
  where user_id = player_id
  for update;

  if current_balance < bet_amount then raise exception 'Insufficient balance'; end if;

  flip_result := case when random() < 0.5 then 'heads' else 'tails' end;
  won := flip_result = player_choice;
  payout := case when won then floor(bet_amount * 1.9) else 0 end;
  new_balance := current_balance + case when won then payout - bet_amount else -bet_amount end;

  update user_currency
  set balance = new_balance,
      updated_at = now()
  where user_id = player_id;

  insert into currency_transactions (from_user_id, to_user_id, amount, note, type)
  values (
    case when won then null else player_id end,
    case when won then player_id else null end,
    case when won then payout else bet_amount end,
    'Coin flip - ' || flip_result || ' (x1.9 payout)',
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

-- Dice roll: 2d6 over target, ~5% house edge multipliers.
create or replace function play_dice_roll(
  bet_amount integer,
  target_over integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  player_id uuid := auth.uid();
  current_balance integer;
  die1 integer;
  die2 integer;
  roll_total integer;
  won boolean;
  multiplier numeric;
  payout integer;
  new_balance integer;
begin
  if player_id is null then raise exception 'Not logged in'; end if;
  if bet_amount <= 0 then raise exception 'Bet must be positive'; end if;

  if target_over = 3 then multiplier := 1.04;
  elsif target_over = 5 then multiplier := 1.31;
  elsif target_over = 7 then multiplier := 2.28;
  elsif target_over = 9 then multiplier := 5.7;
  elsif target_over = 10 then multiplier := 11.4;
  else raise exception 'Target must be one of 3, 5, 7, 9, 10';
  end if;

  insert into user_currency (user_id, balance)
    values (player_id, 500)
    on conflict (user_id) do nothing;

  select balance into current_balance
  from user_currency
  where user_id = player_id
  for update;

  if current_balance < bet_amount then raise exception 'Insufficient balance'; end if;

  die1 := floor(random() * 6 + 1);
  die2 := floor(random() * 6 + 1);
  roll_total := die1 + die2;
  won := roll_total > target_over;
  payout := case when won then floor(bet_amount * multiplier) else 0 end;
  new_balance := current_balance + case when won then payout - bet_amount else -bet_amount end;

  update user_currency
  set balance = new_balance,
      updated_at = now()
  where user_id = player_id;

  insert into currency_transactions (from_user_id, to_user_id, amount, note, type)
  values (
    case when won then null else player_id end,
    case when won then player_id else null end,
    case when won then payout else bet_amount end,
    'Dice - rolled ' || roll_total || ' (target > ' || target_over || ', x' || multiplier || ')',
    case when won then 'game_win' else 'game_loss' end
  );

  return jsonb_build_object(
    'roll', roll_total,
    'won', won,
    'bet', bet_amount,
    'payout', payout,
    'multiplier', multiplier,
    'new_balance', new_balance
  );
end;
$$;

-- Number guess: 1-20 exact hit, 19x gross payout (~5% edge).
create or replace function play_number_guess(
  bet_amount integer,
  guessed_number integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  player_id uuid := auth.uid();
  current_balance integer;
  rolled_number integer;
  won boolean;
  payout integer;
  new_balance integer;
begin
  if player_id is null then raise exception 'Not logged in'; end if;
  if bet_amount <= 0 then raise exception 'Bet must be positive'; end if;
  if guessed_number < 1 or guessed_number > 20 then raise exception 'Guess must be 1-20'; end if;

  insert into user_currency (user_id, balance)
    values (player_id, 500)
    on conflict (user_id) do nothing;

  select balance into current_balance
  from user_currency
  where user_id = player_id
  for update;

  if current_balance < bet_amount then raise exception 'Insufficient balance'; end if;

  rolled_number := floor(random() * 20 + 1);
  won := rolled_number = guessed_number;
  payout := case when won then floor(bet_amount * 19) else 0 end;
  new_balance := current_balance + case when won then payout - bet_amount else -bet_amount end;

  update user_currency
  set balance = new_balance,
      updated_at = now()
  where user_id = player_id;

  insert into currency_transactions (from_user_id, to_user_id, amount, note, type)
  values (
    case when won then null else player_id end,
    case when won then player_id else null end,
    case when won then payout else bet_amount end,
    'Number guess - picked ' || guessed_number || ', was ' || rolled_number || ' (x19 payout)',
    case when won then 'game_win' else 'game_loss' end
  );

  return jsonb_build_object(
    'number', rolled_number,
    'won', won,
    'bet', bet_amount,
    'payout', payout,
    'new_balance', new_balance
  );
end;
$$;

grant execute on function play_coinflip(integer, text) to authenticated;
grant execute on function play_dice_roll(integer, integer) to authenticated;
grant execute on function play_number_guess(integer, integer) to authenticated;
