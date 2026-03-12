import { createClient } from "@/lib/supabase/client";
import { WHITELIST, isAdmin } from "@/lib/whitelist";

export type Conversation = {
  id: string;
  is_group: boolean;
  group_name: string | null;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  image_url: string | null;
  reply_to: string | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
};

export type Reaction = {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
};

export type ConversationWithParticipant = {
  conversation: Conversation;
  otherUser: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  participants: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  }[];
  lastMessage: Message | null;
  unreadCount: number;
};

export async function getConversations(): Promise<ConversationWithParticipant[]> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  // Get all conversation IDs for this user
  const { data: participations } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userData.user.id);

  if (!participations?.length) return [];

  const convIds = participations.map((p) => p.conversation_id);

  // Get conversations
  const { data: conversations } = await supabase
    .from("conversations")
    .select("*")
    .in("id", convIds)
    .order("updated_at", { ascending: false });

  if (!conversations?.length) return [];

  // Get all participants for these conversations
  const { data: allParticipants } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id")
    .in("conversation_id", convIds);

  // Get profiles for all participants (excluding self)
  const otherUserIds = [...new Set(
    (allParticipants || [])
      .filter((p) => p.user_id !== userData.user!.id)
      .map((p) => p.user_id)
  )];
  const { data: profiles } = otherUserIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", otherUserIds)
    : { data: [] };

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  // Build participant lists per conversation
  const convParticipantsMap = new Map<string, typeof profiles>();
  for (const p of allParticipants || []) {
    if (p.user_id === userData.user.id) continue;
    const list = convParticipantsMap.get(p.conversation_id) || [];
    const prof = profileMap.get(p.user_id);
    if (prof) list.push(prof);
    convParticipantsMap.set(p.conversation_id, list);
  }

  const results: ConversationWithParticipant[] = [];
  for (const conv of conversations) {
    const participants = convParticipantsMap.get(conv.id) || [];
    const firstOther = participants[0] || {
      id: "",
      username: null,
      display_name: null,
      avatar_url: null,
    };

    const { data: lastMessages } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conv.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1);

    // Get read receipt
    const { data: receipt } = await supabase
      .from("read_receipts")
      .select("last_read_at")
      .eq("conversation_id", conv.id)
      .eq("user_id", userData.user.id)
      .maybeSingle();

    // Count unread
    let unreadCount = 0;
    if (receipt?.last_read_at) {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .neq("sender_id", userData.user.id)
        .is("deleted_at", null)
        .gt("created_at", receipt.last_read_at);
      unreadCount = count || 0;
    } else {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .neq("sender_id", userData.user.id)
        .is("deleted_at", null);
      unreadCount = count || 0;
    }

    results.push({
      conversation: {
        ...conv,
        is_group: conv.is_group ?? false,
        group_name: conv.group_name ?? null,
      },
      otherUser: firstOther,
      participants,
      lastMessage: lastMessages?.[0] || null,
      unreadCount,
    });
  }

  return results;
}

export async function getOrCreateConversation(otherUserId: string): Promise<string> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not logged in");

  // Check if a DM conversation already exists between these two users
  const { data: myConvs } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userData.user.id);

  if (myConvs?.length) {
    const { data: shared } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", otherUserId)
      .in(
        "conversation_id",
        myConvs.map((c) => c.conversation_id)
      );

    // Filter to only non-group conversations
    if (shared?.length) {
      const sharedIds = shared.map((s) => s.conversation_id);
      const { data: dmConvs } = await supabase
        .from("conversations")
        .select("id")
        .eq("is_group", false)
        .in("id", sharedIds)
        .limit(1);
      if (dmConvs?.[0]) return dmConvs[0].id;
    }
  }

  // Create new DM conversation — use client-generated UUID to avoid
  // RLS blocking the RETURNING clause (not a participant yet at insert time)
  const newId = crypto.randomUUID();
  const { error: convError } = await supabase
    .from("conversations")
    .insert({ id: newId });

  if (convError) throw new Error(convError.message);

  // Add participants
  const { error: partError } = await supabase.from("conversation_participants").insert([
    { conversation_id: newId, user_id: userData.user.id },
    { conversation_id: newId, user_id: otherUserId },
  ]);

  if (partError) throw new Error(partError.message);

  return newId;
}

export async function getOrCreateGroupChat(
  groupName: string,
  memberIds: string[]
): Promise<string> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not logged in");

  // Look for existing group with this name — search directly so
  // duplicates don't cause maybeSingle() to throw
  const { data: existingGroups } = await supabase
    .from("conversations")
    .select("id")
    .eq("is_group", true)
    .eq("group_name", groupName)
    .limit(1);

  if (existingGroups?.[0]) return existingGroups[0].id;

  // Create new group conversation — use client-generated UUID to avoid
  // RLS blocking the RETURNING clause
  const newId = crypto.randomUUID();
  const { error: convError } = await supabase
    .from("conversations")
    .insert({ id: newId, is_group: true, group_name: groupName });

  if (convError) throw new Error(convError.message);

  // Add all members + self
  const allMembers = [...new Set([userData.user.id, ...memberIds])];
  const { error: partError } = await supabase
    .from("conversation_participants")
    .insert(allMembers.map((uid) => ({ conversation_id: newId, user_id: uid })));

  if (partError) throw new Error(partError.message);

  return newId;
}

export async function getMessages(conversationId: string, limit = 50, before?: string) {
  const supabase = createClient();
  let query = supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data } = await query;
  return (data || []).reverse();
}

export async function sendMessage(
  conversationId: string,
  content: string,
  replyTo?: string,
  imageUrl?: string
) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not logged in");

  const { error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: userData.user.id,
      content,
      reply_to: replyTo || null,
      image_url: imageUrl || null,
    });

  if (error) throw new Error(error.message);

  // Update conversation timestamp
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
}

export async function editMessage(messageId: string, content: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("messages")
    .update({ content, edited_at: new Date().toISOString() })
    .eq("id", messageId);

  if (error) throw error;
}

export async function deleteMessage(messageId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", messageId);

  if (error) throw error;
}

export async function addReaction(messageId: string, emoji: string) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not logged in");

  const { error } = await supabase
    .from("message_reactions")
    .insert({
      message_id: messageId,
      user_id: userData.user.id,
      emoji,
    });

  if (error && error.code !== "23505") throw error; // Ignore duplicate
}

export async function removeReaction(messageId: string, emoji: string) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not logged in");

  await supabase
    .from("message_reactions")
    .delete()
    .eq("message_id", messageId)
    .eq("user_id", userData.user.id)
    .eq("emoji", emoji);
}

export async function getReactions(messageIds: string[]): Promise<Reaction[]> {
  if (!messageIds.length) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from("message_reactions")
    .select("*")
    .in("message_id", messageIds);

  return data || [];
}

export async function markRead(conversationId: string) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;

  await supabase.from("read_receipts").upsert({
    conversation_id: conversationId,
    user_id: userData.user.id,
    last_read_at: new Date().toISOString(),
  });
}

export async function getWhitelistedUsers() {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url");
  const lowerWhitelist = WHITELIST.usernames.map(u => u.toLowerCase());
  return (data || []).filter(p =>
    p.username && lowerWhitelist.includes(p.username.toLowerCase())
  );
}

export async function uploadChatFile(file: File): Promise<string> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not logged in");

  const MAX_IMAGE = 5 * 1024 * 1024;   // 5 MB
  const MAX_VIDEO = 20 * 1024 * 1024;  // 20 MB
  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");

  if (!isImage && !isVideo) throw new Error("Only images and videos are supported");
  if (isImage && file.size > MAX_IMAGE) throw new Error("Image must be under 5 MB");
  if (isVideo && file.size > MAX_VIDEO) throw new Error("Video must be under 20 MB");

  const ext = file.name.split(".").pop() || "bin";
  const path = `${userData.user.id}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("chat-media")
    .upload(path, file, { upsert: false });

  if (error) throw new Error(error.message);

  const { data: urlData } = supabase.storage
    .from("chat-media")
    .getPublicUrl(path);

  return urlData.publicUrl;
}

// ── Follow system ──────────────────────────────────────────────────────────

export async function followUser(userId: string): Promise<void> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not logged in");
  const { error } = await supabase.from("user_follows").insert({
    follower_id: userData.user.id,
    following_id: userId,
  });
  if (error && error.code !== "23505") throw new Error(error.message);
}

export async function unfollowUser(userId: string): Promise<void> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not logged in");
  await supabase.from("user_follows").delete()
    .eq("follower_id", userData.user.id)
    .eq("following_id", userId);
}

export async function getFollowData(userId: string): Promise<{
  followers: number;
  following: number;
  isFollowing: boolean;
}> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const [{ count: followers }, { count: following }, followCheck] = await Promise.all([
    supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
    supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
    userData.user
      ? supabase.from("user_follows").select("follower_id").eq("follower_id", userData.user.id).eq("following_id", userId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  return {
    followers: followers || 0,
    following: following || 0,
    isFollowing: !!followCheck.data,
  };
}

// ── Presence ──────────────────────────────────────────────────────────────

export async function updatePresence(): Promise<void> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  await supabase.from("user_presence").upsert({
    user_id: userData.user.id,
    last_seen: new Date().toISOString(),
  }, { onConflict: "user_id" });
}

export async function getUserPresence(userIds: string[]): Promise<Record<string, string>> {
  if (!userIds.length) return {};
  const supabase = createClient();
  const { data } = await supabase
    .from("user_presence")
    .select("user_id, last_seen")
    .in("user_id", userIds);
  const map: Record<string, string> = {};
  for (const row of data || []) map[row.user_id] = row.last_seen;
  return map;
}

// ── Read receipts (detailed) ──────────────────────────────────────────────

export async function getReadReceipts(convId: string): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data } = await supabase
    .from("read_receipts")
    .select("user_id, last_read_at")
    .eq("conversation_id", convId);
  const map: Record<string, string> = {};
  for (const row of data || []) map[row.user_id] = row.last_read_at;
  return map;
}

// ── Sync whitelist users into group ──────────────────────────────────────

export async function syncGroupMembers(convId: string): Promise<void> {
  const supabase = createClient();
  const users = await getWhitelistedUsers();
  const { data: existing } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", convId);
  const existingIds = new Set((existing || []).map(p => p.user_id));
  const missing = users.filter(u => !existingIds.has(u.id));
  if (missing.length > 0) {
    await supabase.from("conversation_participants").insert(
      missing.map(u => ({ conversation_id: convId, user_id: u.id }))
    );
  }
}

// ── Forward message ──────────────────────────────────────────────────────

export async function forwardMessage(
  messageId: string,
  targetConvId: string
): Promise<void> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not logged in");
  const { data: origMsg } = await supabase
    .from("messages")
    .select("content, image_url")
    .eq("id", messageId)
    .single();
  if (!origMsg) throw new Error("Message not found");
  const content = origMsg.content?.trim() ? `↪ ${origMsg.content}` : " ";
  await sendMessage(targetConvId, content, undefined, origMsg.image_url || undefined);
}

// ── Admin: add user to group chat ────────────────────────────────────────

export async function adminAddGroupMember(convId: string, userId: string): Promise<void> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not logged in");
  const { data: profile } = await supabase.from("profiles").select("username").eq("id", userData.user.id).single();
  if (!isAdmin(profile?.username)) throw new Error("Admin only");
  const { data: existing } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", convId)
    .eq("user_id", userId);
  if (existing && existing.length > 0) return; // already a member
  await supabase.from("conversation_participants").insert({ conversation_id: convId, user_id: userId });
}

export async function getAllRegisteredUsers(): Promise<{ id: string; display_name: string | null; username: string | null; avatar_url: string | null }[]> {
  const supabase = createClient();
  const { data } = await supabase.from("profiles").select("id, display_name, username, avatar_url");
  return data || [];
}
