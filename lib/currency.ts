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
