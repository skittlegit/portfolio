import { createClient } from "@/lib/supabase/client";
import { ADMIN_USERNAME } from "@/lib/whitelist";

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
  relation_type: string;
  updated_at: string;
};

export type CustomFamilyMember = {
  id: string;
  name: string;
  title: string;
  avatar_emoji: string;
  parent_id: string | null;
  relation_type: string;
  created_by: string;
  created_at: string;
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
): Promise<{ result: string; won: boolean; bet: number; payout?: number; new_balance: number }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("play_coinflip", {
    bet_amount: betAmount,
    player_choice: choice,
  });
  if (error) throw new Error(error.message);
  return data as { result: string; won: boolean; bet: number; payout?: number; new_balance: number };
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

/* ── Admin helpers ── */

async function requireAdmin(): Promise<string> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not logged in");
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userData.user.id)
    .single();
  if (!profile?.username || profile.username.toLowerCase() !== ADMIN_USERNAME)
    throw new Error("Admin only");
  return userData.user.id;
}

export async function adminSetBalance(userId: string, newBalance: number): Promise<void> {
  await requireAdmin();
  const supabase = createClient();
  if (newBalance < 0) throw new Error("Balance cannot be negative");
  const { error } = await supabase
    .from("user_currency")
    .upsert({ user_id: userId, balance: newBalance, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
  await supabase.from("currency_transactions").insert({
    from_user_id: null,
    to_user_id: userId,
    amount: newBalance,
    type: "admin_set",
    note: `Balance set to ${newBalance} by admin`,
  });
}

export async function adminCancelBet(betId: string): Promise<void> {
  await requireAdmin();
  const supabase = createClient();
  const { data: bet } = await supabase
    .from("custom_bets")
    .select("status, title")
    .eq("id", betId)
    .single();
  if (!bet) throw new Error("Bet not found");
  if (bet.status === "resolved" || bet.status === "cancelled") throw new Error("Bet is already " + bet.status);
  // Refund all entries
  const { data: entries } = await supabase
    .from("bet_entries")
    .select("user_id, amount")
    .eq("bet_id", betId);
  if (entries && entries.length > 0) {
    for (const entry of entries) {
      const { data: balData } = await supabase
        .from("user_currency")
        .select("balance")
        .eq("user_id", entry.user_id)
        .single();
      const bal = balData?.balance ?? 0;
      await supabase
        .from("user_currency")
        .update({ balance: bal + entry.amount, updated_at: new Date().toISOString() })
        .eq("user_id", entry.user_id);
      await supabase.from("currency_transactions").insert({
        from_user_id: null,
        to_user_id: entry.user_id,
        amount: entry.amount,
        type: "game_win",
        note: `Refund: bet "${bet.title}" cancelled by admin`,
      });
    }
  }
  await supabase.from("custom_bets").update({ status: "cancelled" }).eq("id", betId);
}

export async function adminResolveBet(betId: string, winningSide: "for" | "against"): Promise<void> {
  await requireAdmin();
  const supabase = createClient();
  const { data: bet } = await supabase
    .from("custom_bets")
    .select("*")
    .eq("id", betId)
    .single();
  if (!bet) throw new Error("Bet not found");
  if (bet.status === "resolved" || bet.status === "cancelled") throw new Error("Bet is already " + bet.status);
  const { data: entries } = await supabase
    .from("bet_entries")
    .select("*")
    .eq("bet_id", betId);
  if (!entries || entries.length === 0) {
    await supabase.from("custom_bets").update({ status: "resolved", outcome: winningSide }).eq("id", betId);
    return;
  }
  const winners = entries.filter((e: BetEntry) => e.side === winningSide);
  const totalPool = entries.reduce((s: number, e: BetEntry) => s + e.amount, 0);
  const winnerPool = winners.reduce((s: number, e: BetEntry) => s + e.amount, 0);
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
        note: `Won bet: ${bet.title} (admin resolved)`,
      });
    }
  }
  if (winners.length === 0) {
    const losers = entries.filter((e: BetEntry) => e.side !== winningSide);
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

export async function adminEditBet(betId: string, title: string, description: string): Promise<void> {
  await requireAdmin();
  const supabase = createClient();
  if (!title.trim()) throw new Error("Title is required");
  const { error } = await supabase
    .from("custom_bets")
    .update({ title: title.trim(), description: description.trim() })
    .eq("id", betId);
  if (error) throw new Error(error.message);
}

/* ── Admin family tree helpers ── */

export async function adminUpsertFamilyNode(
  userId: string,
  title: string,
  parentUserId: string | null,
  relationType: string = "child"
): Promise<void> {
  await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase
    .from("family_tree")
    .upsert({
      user_id: userId,
      title,
      parent_user_id: parentUserId || null,
      relation_type: relationType,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
}

export async function getFamilyTree(): Promise<FamilyNode[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("family_tree")
    .select("user_id, title, parent_user_id, relation_type, updated_at");
  return (data || []).map((n: Record<string, unknown>) => ({
    ...n,
    relation_type: (n.relation_type as string) || "child",
  })) as FamilyNode[];
}

export async function upsertFamilyNode(
  title: string,
  parentUserId: string | null,
  relationType: string = "child"
): Promise<void> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not logged in");
  const { error } = await supabase
    .from("family_tree")
    .upsert({
      user_id: userData.user.id,
      title,
      parent_user_id: parentUserId || null,
      relation_type: relationType,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
}

/* ── Custom Family Members (non-user members) ── */

export async function getCustomFamilyMembers(): Promise<CustomFamilyMember[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("custom_family_members")
    .select("*")
    .order("created_at", { ascending: true });
  return (data || []) as CustomFamilyMember[];
}

export async function addCustomFamilyMember(
  name: string,
  title: string,
  avatarEmoji: string,
  parentId: string | null,
  relationType: string
): Promise<string> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not logged in");
  if (!name.trim()) throw new Error("Name is required");
  const { data, error } = await supabase
    .from("custom_family_members")
    .insert({
      name: name.trim(),
      title: title.trim() || "Member",
      avatar_emoji: avatarEmoji || "👤",
      parent_id: parentId || null,
      relation_type: relationType || "child",
      created_by: userData.user.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function updateCustomFamilyMember(
  id: string,
  name: string,
  title: string,
  avatarEmoji: string,
  parentId: string | null,
  relationType: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("custom_family_members")
    .update({
      name: name.trim(),
      title: title.trim() || "Member",
      avatar_emoji: avatarEmoji || "👤",
      parent_id: parentId || null,
      relation_type: relationType || "child",
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteCustomFamilyMember(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("custom_family_members")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

const FAIR_DICE_MULTIPLIERS: Record<number, number> = {
  3: 1.04,
  5: 1.31,
  7: 2.28,
  9: 5.7,
  10: 11.4,
};

function secureRandomInt(min: number, max: number): number {
  const range = max - min + 1;
  if (range <= 0) return min;

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const maxUint = 0xffffffff;
    const cutoff = maxUint - (maxUint % range);
    const buf = new Uint32Array(1);
    let value = 0;

    do {
      crypto.getRandomValues(buf);
      value = buf[0];
    } while (value >= cutoff);

    return min + (value % range);
  }

  return min + Math.floor(Math.random() * range);
}

/* ── Dice roll game ── */

export async function playDiceRoll(
  betAmount: number,
  targetOver: number
): Promise<{ roll: number; won: boolean; bet: number; payout?: number; multiplier?: number; new_balance: number }> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not logged in");

  if (betAmount <= 0) throw new Error("Bet must be positive");
  if (!(targetOver in FAIR_DICE_MULTIPLIERS)) throw new Error("Target must be one of 3, 5, 7, 9, 10");

  const { data: rpcData, error: rpcError } = await supabase.rpc("play_dice_roll", {
    bet_amount: betAmount,
    target_over: targetOver,
  });

  if (!rpcError && rpcData) {
    return rpcData as { roll: number; won: boolean; bet: number; payout?: number; multiplier?: number; new_balance: number };
  }

  const missingRpc =
    !!rpcError &&
    (rpcError.code === "PGRST202" ||
      /play_dice_roll/i.test(rpcError.message));

  if (rpcError && !missingRpc) {
    throw new Error(rpcError.message);
  }

  const { data: balData } = await supabase
    .from("user_currency")
    .select("balance")
    .eq("user_id", userData.user.id)
    .single();
  const balance = balData?.balance ?? 0;
  if (betAmount > balance) throw new Error("Insufficient balance");

  const die1 = secureRandomInt(1, 6);
  const die2 = secureRandomInt(1, 6);
  const roll = die1 + die2;
  const won = roll > targetOver;
  const multiplier = FAIR_DICE_MULTIPLIERS[targetOver];
  const payout = won ? Math.floor(betAmount * multiplier) : 0;
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
    note: `Dice: rolled ${roll} (target > ${targetOver}, x${multiplier})`,
  });

  return { roll, won, bet: betAmount, payout, multiplier, new_balance: newBalance };
}

/* ── Number Guess game ── */

export async function playNumberGuess(
  betAmount: number,
  guess: number
): Promise<{ number: number; won: boolean; bet: number; payout?: number; new_balance: number }> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not logged in");

  if (betAmount <= 0) throw new Error("Bet must be positive");
  if (guess < 1 || guess > 20) throw new Error("Guess must be 1-20");

  const { data: rpcData, error: rpcError } = await supabase.rpc("play_number_guess", {
    bet_amount: betAmount,
    guessed_number: guess,
  });

  if (!rpcError && rpcData) {
    return rpcData as { number: number; won: boolean; bet: number; payout?: number; new_balance: number };
  }

  const missingRpc =
    !!rpcError &&
    (rpcError.code === "PGRST202" ||
      /play_number_guess/i.test(rpcError.message));

  if (rpcError && !missingRpc) {
    throw new Error(rpcError.message);
  }

  const { data: balData } = await supabase
    .from("user_currency")
    .select("balance")
    .eq("user_id", userData.user.id)
    .single();
  const balance = balData?.balance ?? 0;
  if (betAmount > balance) throw new Error("Insufficient balance");

  const number = secureRandomInt(1, 20);
  const won = number === guess;
  const payout = won ? Math.floor(betAmount * 19) : 0;
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
    note: `Number guess: picked ${guess}, was ${number} (x19 payout)`,
  });

  return { number, won, bet: betAmount, payout, new_balance: newBalance };
}

/* ── Custom Bets ── */

export type CustomBet = {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  amount: number;
  status: "open" | "closed" | "resolved" | "cancelled";
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
  if (amount <= 0) throw new Error("Amount must be positive");
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
  if (bet.status !== "open" && bet.status !== "closed") throw new Error("Bet is already resolved");

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

/* ── Bet management (close, edit, cancel) ── */

export async function closeBet(betId: string): Promise<void> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not logged in");
  const { data: bet } = await supabase
    .from("custom_bets")
    .select("creator_id, status")
    .eq("id", betId)
    .single();
  if (!bet) throw new Error("Bet not found");
  if (bet.creator_id !== userData.user.id) throw new Error("Only the creator can close");
  if (bet.status !== "open") throw new Error("Bet is not open");
  const { error } = await supabase
    .from("custom_bets")
    .update({ status: "closed" })
    .eq("id", betId);
  if (error) throw new Error(error.message);
}

export async function editBet(
  betId: string,
  title: string,
  description: string
): Promise<void> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not logged in");
  const { data: bet } = await supabase
    .from("custom_bets")
    .select("creator_id, status")
    .eq("id", betId)
    .single();
  if (!bet) throw new Error("Bet not found");
  if (bet.creator_id !== userData.user.id) throw new Error("Only the creator can edit");
  if (bet.status !== "open" && bet.status !== "closed") throw new Error("Cannot edit resolved/cancelled bet");
  if (!title.trim()) throw new Error("Title is required");
  const { error } = await supabase
    .from("custom_bets")
    .update({ title: title.trim(), description: description.trim() })
    .eq("id", betId);
  if (error) throw new Error(error.message);
}

export async function cancelBet(betId: string): Promise<void> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not logged in");
  const { data: bet } = await supabase
    .from("custom_bets")
    .select("creator_id, status, title")
    .eq("id", betId)
    .single();
  if (!bet) throw new Error("Bet not found");
  if (bet.creator_id !== userData.user.id) throw new Error("Only the creator can cancel");
  if (bet.status === "resolved" || bet.status === "cancelled") throw new Error("Bet is already " + bet.status);

  // Refund all entries
  const { data: entries } = await supabase
    .from("bet_entries")
    .select("user_id, amount")
    .eq("bet_id", betId);
  if (entries && entries.length > 0) {
    for (const entry of entries) {
      const { data: balData } = await supabase
        .from("user_currency")
        .select("balance")
        .eq("user_id", entry.user_id)
        .single();
      const bal = balData?.balance ?? 0;
      await supabase
        .from("user_currency")
        .update({ balance: bal + entry.amount, updated_at: new Date().toISOString() })
        .eq("user_id", entry.user_id);
      await supabase.from("currency_transactions").insert({
        from_user_id: null,
        to_user_id: entry.user_id,
        amount: entry.amount,
        type: "game_win",
        note: `Refund: bet "${bet.title}" cancelled`,
      });
    }
  }

  const { error } = await supabase
    .from("custom_bets")
    .update({ status: "cancelled" })
    .eq("id", betId);
  if (error) throw new Error(error.message);
}

export async function adminDeleteBet(betId: string): Promise<void> {
  await requireAdmin();
  const supabase = createClient();
  const { data: bet } = await supabase
    .from("custom_bets")
    .select("status")
    .eq("id", betId)
    .single();
  if (!bet) throw new Error("Bet not found");
  if (bet.status === "open" || bet.status === "closed")
    throw new Error("Resolve or cancel the bet first");
  await supabase.from("bet_entries").delete().eq("bet_id", betId);
  const { error } = await supabase.from("custom_bets").delete().eq("id", betId);
  if (error) throw new Error(error.message);
}

export async function adminResetAllBalances(): Promise<void> {
  await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase
    .from("user_currency")
    .update({ balance: 0, updated_at: new Date().toISOString() })
    .neq("balance", 0);
  if (error) throw new Error(error.message);
  await supabase.from("currency_transactions").insert({
    from_user_id: null,
    to_user_id: null,
    amount: 0,
    type: "admin_set",
    note: "All balances reset to 0 by admin",
  });
}
