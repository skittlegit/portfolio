import { createClient } from "@/lib/supabase/client";

export type UserBalance = {
  user_id: string;
  balance: number;
  updated_at: string;
};

export type CurrencyTransaction = {
  id: string;
  from_user_id: string | null;
  to_user_id: string | null;
  amount: number;
  note: string | null;
  type: string;
  created_at: string;
};

export type FamilyNode = {
  user_id: string;
  title: string;
  parent_user_id: string | null;
  updated_at: string;
};

export async function ensureBalance(): Promise<void> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  await supabase
    .from("user_currency")
    .upsert({ user_id: userData.user.id, balance: 500 }, { onConflict: "user_id", ignoreDuplicates: true });
}

export async function getMyBalance(): Promise<number> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return 0;
  await ensureBalance();
  const { data } = await supabase
    .from("user_currency")
    .select("balance")
    .eq("user_id", userData.user.id)
    .single();
  return data?.balance ?? 500;
}

export async function getAllBalances(): Promise<UserBalance[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("user_currency")
    .select("user_id, balance, updated_at")
    .order("balance", { ascending: false });
  return data || [];
}

export async function transferCurrency(
  toUserId: string,
  amount: number,
  note?: string
): Promise<void> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not logged in");
  const { error } = await supabase.rpc("transfer_currency", {
    from_uid: userData.user.id,
    to_uid: toUserId,
    transfer_amount: amount,
    transfer_note: note || null,
  });
  if (error) throw new Error(error.message);
}

export async function playCoinFlip(
  betAmount: number,
  choice: "heads" | "tails"
): Promise<{ result: string; won: boolean; bet: number; new_balance: number }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("play_coinflip", {
    bet_amount: betAmount,
    player_choice: choice,
  });
  if (error) throw new Error(error.message);
  return data as { result: string; won: boolean; bet: number; new_balance: number };
}

export async function getMyTransactions(limit = 30): Promise<CurrencyTransaction[]> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const { data } = await supabase
    .from("currency_transactions")
    .select("*")
    .or(`from_user_id.eq.${userData.user.id},to_user_id.eq.${userData.user.id}`)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}

export async function getAllTransactions(limit = 50): Promise<CurrencyTransaction[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("currency_transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}

export async function getFamilyTree(): Promise<FamilyNode[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("family_tree")
    .select("user_id, title, parent_user_id, updated_at");
  return data || [];
}

export async function upsertFamilyNode(title: string, parentUserId: string | null): Promise<void> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not logged in");
  const { error } = await supabase
    .from("family_tree")
    .upsert({
      user_id: userData.user.id,
      title,
      parent_user_id: parentUserId || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
}

/* ── Dice roll game (client-side RNG, uses same currency table) ── */

export async function playDiceRoll(
  betAmount: number,
  targetOver: number
): Promise<{ roll: number; won: boolean; bet: number; new_balance: number }> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not logged in");

  // Validate
  if (betAmount <= 0 || betAmount > 200) throw new Error("Bet must be 1-200");
  if (targetOver < 2 || targetOver > 11) throw new Error("Target must be 2-11");

  // Check balance
  const { data: balData } = await supabase
    .from("user_currency")
    .select("balance")
    .eq("user_id", userData.user.id)
    .single();
  const balance = balData?.balance ?? 0;
  if (betAmount > balance) throw new Error("Insufficient balance");

  // Roll two dice
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  const roll = die1 + die2;
  const won = roll > targetOver;

  // Payout: higher target = higher multiplier
  // Probability of rolling > N with 2d6:
  const payoutMultipliers: Record<number, number> = {
    2: 1.1, 3: 1.2, 4: 1.4, 5: 1.6, 6: 1.9, 7: 2.4,
    8: 3.0, 9: 4.0, 10: 6.0, 11: 12.0,
  };
  const multiplier = payoutMultipliers[targetOver] || 2;
  const payout = won ? Math.floor(betAmount * multiplier) : 0;
  const delta = won ? payout - betAmount : -betAmount;
  const newBalance = balance + delta;

  // Update balance
  await supabase
    .from("user_currency")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("user_id", userData.user.id);

  // Record transaction
  await supabase.from("currency_transactions").insert({
    from_user_id: won ? null : userData.user.id,
    to_user_id: won ? userData.user.id : null,
    amount: won ? payout : betAmount,
    type: won ? "game_win" : "game_loss",
    note: `Dice: rolled ${roll} (target > ${targetOver})`,
  });

  return { roll, won, bet: betAmount, new_balance: newBalance };
}

/* ── Number Guess game ── */

export async function playNumberGuess(
  betAmount: number,
  guess: number
): Promise<{ number: number; won: boolean; bet: number; new_balance: number }> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not logged in");

  if (betAmount <= 0 || betAmount > 200) throw new Error("Bet must be 1-200");
  if (guess < 1 || guess > 10) throw new Error("Guess must be 1-10");

  const { data: balData } = await supabase
    .from("user_currency")
    .select("balance")
    .eq("user_id", userData.user.id)
    .single();
  const balance = balData?.balance ?? 0;
  if (betAmount > balance) throw new Error("Insufficient balance");

  const number = Math.floor(Math.random() * 10) + 1;
  const won = number === guess;
  const payout = won ? betAmount * 8 : 0; // 8x payout for 1/10 chance
  const delta = won ? payout - betAmount : -betAmount;
  const newBalance = balance + delta;

  await supabase
    .from("user_currency")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("user_id", userData.user.id);

  await supabase.from("currency_transactions").insert({
    from_user_id: won ? null : userData.user.id,
    to_user_id: won ? userData.user.id : null,
    amount: won ? payout : betAmount,
    type: won ? "game_win" : "game_loss",
    note: `Number guess: picked ${guess}, was ${number}`,
  });

  return { number, won, bet: betAmount, new_balance: newBalance };
}

/* ── Custom Bets ── */

export type CustomBet = {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  amount: number;
  status: "open" | "closed" | "resolved";
  outcome: string | null;
  created_at: string;
};

export type BetEntry = {
  id: string;
  bet_id: string;
  user_id: string;
  side: "for" | "against";
  amount: number;
  created_at: string;
};

export async function getCustomBets(): Promise<CustomBet[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("custom_bets")
    .select("*")
    .order("created_at", { ascending: false });
  return (data || []) as CustomBet[];
}

export async function getBetEntries(betId: string): Promise<BetEntry[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("bet_entries")
    .select("*")
    .eq("bet_id", betId)
    .order("created_at", { ascending: true });
  return (data || []) as BetEntry[];
}

export async function createCustomBet(
  title: string,
  description: string,
  amount: number
): Promise<string> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not logged in");
  if (amount <= 0 || amount > 500) throw new Error("Amount must be 1-500");
  if (!title.trim()) throw new Error("Title is required");

  const { data, error } = await supabase
    .from("custom_bets")
    .insert({
      creator_id: userData.user.id,
      title: title.trim(),
      description: description.trim(),
      amount,
      status: "open",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function joinBet(
  betId: string,
  side: "for" | "against",
  amount: number
): Promise<void> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not logged in");

  // Check balance
  const { data: balData } = await supabase
    .from("user_currency")
    .select("balance")
    .eq("user_id", userData.user.id)
    .single();
  const balance = balData?.balance ?? 0;
  if (amount > balance) throw new Error("Insufficient balance");

  // Check not already in this bet
  const { data: existing } = await supabase
    .from("bet_entries")
    .select("id")
    .eq("bet_id", betId)
    .eq("user_id", userData.user.id);
  if (existing && existing.length > 0) throw new Error("You already joined this bet");

  // Deduct balance
  await supabase
    .from("user_currency")
    .update({ balance: balance - amount, updated_at: new Date().toISOString() })
    .eq("user_id", userData.user.id);

  // Insert entry
  const { error } = await supabase.from("bet_entries").insert({
    bet_id: betId,
    user_id: userData.user.id,
    side,
    amount,
  });
  if (error) throw new Error(error.message);

  // Record transaction
  await supabase.from("currency_transactions").insert({
    from_user_id: userData.user.id,
    to_user_id: null,
    amount,
    type: "bet_entry",
    note: `Joined bet: ${side}`,
  });
}

export async function resolveBet(
  betId: string,
  winningSide: "for" | "against"
): Promise<void> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not logged in");

  // Check creator
  const { data: bet } = await supabase
    .from("custom_bets")
    .select("*")
    .eq("id", betId)
    .single();
  if (!bet) throw new Error("Bet not found");
  if (bet.creator_id !== userData.user.id) throw new Error("Only the creator can resolve");
  if (bet.status !== "open") throw new Error("Bet is already resolved");

  // Get all entries
  const { data: entries } = await supabase
    .from("bet_entries")
    .select("*")
    .eq("bet_id", betId);
  if (!entries || entries.length === 0) {
    // No entries, just close
    await supabase.from("custom_bets").update({ status: "resolved", outcome: winningSide }).eq("id", betId);
    return;
  }

  const winners = entries.filter((e: BetEntry) => e.side === winningSide);
  const losers = entries.filter((e: BetEntry) => e.side !== winningSide);
  const totalPool = entries.reduce((s: number, e: BetEntry) => s + e.amount, 0);
  const winnerPool = winners.reduce((s: number, e: BetEntry) => s + e.amount, 0);

  // Distribute winnings proportionally
  for (const winner of winners) {
    const share = winnerPool > 0 ? Math.floor((winner.amount / winnerPool) * totalPool) : 0;
    if (share > 0) {
      const { data: balData } = await supabase
        .from("user_currency")
        .select("balance")
        .eq("user_id", winner.user_id)
        .single();
      const bal = balData?.balance ?? 0;
      await supabase.from("user_currency")
        .update({ balance: bal + share, updated_at: new Date().toISOString() })
        .eq("user_id", winner.user_id);
      await supabase.from("currency_transactions").insert({
        from_user_id: null,
        to_user_id: winner.user_id,
        amount: share,
        type: "game_win",
        note: `Won bet: ${bet.title}`,
      });
    }
  }

  // If no winners, refund losers
  if (winners.length === 0) {
    for (const loser of losers) {
      const { data: balData } = await supabase
        .from("user_currency")
        .select("balance")
        .eq("user_id", loser.user_id)
        .single();
      const bal = balData?.balance ?? 0;
      await supabase.from("user_currency")
        .update({ balance: bal + loser.amount, updated_at: new Date().toISOString() })
        .eq("user_id", loser.user_id);
    }
  }

  await supabase.from("custom_bets").update({ status: "resolved", outcome: winningSide }).eq("id", betId);
}
