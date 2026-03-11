import { createClient } from "@/lib/supabase/client";

export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export async function getProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .single();

  if (error) return null;
  return data;
}

export async function updateProfile(updates: {
  username?: string;
  display_name?: string;
  avatar_url?: string;
}) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not logged in");

  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: userData.user.id,
      ...updates,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (error) return false;
  // Available if no row, or the row belongs to the current user
  return !data || data.id === userData.user?.id;
}

export async function uploadAvatar(file: File): Promise<string> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not logged in");

  const ext = file.name.split(".").pop();
  const fileName = `${userData.user.id}.${ext}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
  return data.publicUrl;
}
