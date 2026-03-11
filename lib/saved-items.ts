import { createClient } from "@/lib/supabase/client";

export type SavedItemType = "qr-code" | "palette" | "gradient" | "pattern" | "vector-art" | "shape";

export type SavedItem = {
  id: string;
  type: SavedItemType;
  name: string;
  data: Record<string, unknown>;
  preview: string | null;
  created_at: string;
};

const supabase = createClient();

export async function saveItem(
  type: SavedItemType,
  name: string,
  data: Record<string, unknown>,
  preview?: string
) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not logged in");

  const { error } = await supabase.from("saved_items").insert({
    user_id: userData.user.id,
    type,
    name,
    data,
    preview: preview ?? null,
  });

  if (error) throw error;
}

export async function getSavedItems(): Promise<SavedItem[]> {
  const { data, error } = await supabase
    .from("saved_items")
    .select("id, type, name, data, preview, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function deleteSavedItem(id: string) {
  const { error } = await supabase
    .from("saved_items")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
