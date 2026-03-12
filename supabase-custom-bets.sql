-- Custom Bets tables for the 165 game section
-- Run this in Supabase SQL Editor

-- Custom bets table
CREATE TABLE IF NOT EXISTS custom_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  amount INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'resolved')),
  outcome TEXT CHECK (outcome IN ('for', 'against', NULL)),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bet entries (users joining a bet)
CREATE TABLE IF NOT EXISTS bet_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_id UUID NOT NULL REFERENCES custom_bets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('for', 'against')),
  amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(bet_id, user_id)
);

-- Enable RLS
ALTER TABLE custom_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bet_entries ENABLE ROW LEVEL SECURITY;

-- Policies: all authenticated users can read
CREATE POLICY "Anyone can read custom_bets"
  ON custom_bets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create bets"
  ON custom_bets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creator can update own bets"
  ON custom_bets FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id);

CREATE POLICY "Anyone can read bet_entries"
  ON bet_entries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can join bets"
  ON bet_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_custom_bets_status ON custom_bets(status);
CREATE INDEX IF NOT EXISTS idx_custom_bets_creator ON custom_bets(creator_id);
CREATE INDEX IF NOT EXISTS idx_bet_entries_bet_id ON bet_entries(bet_id);
CREATE INDEX IF NOT EXISTS idx_bet_entries_user_id ON bet_entries(user_id);
