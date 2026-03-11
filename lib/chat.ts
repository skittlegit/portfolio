import { createClient } from "@/lib/supabase/client";

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
      for (const s of shared) {
        const { data: conv } = await supabase
          .from("conversations")
          .select("*")
          .eq("id", s.conversation_id)
          .maybeSingle();
        if (conv && !conv.is_group) {
          return conv.id;
        }
      }
    }
  }

  // Create new DM conversation
  const { data: conv, error: convError } = await supabase
    .from("conversations")
    .insert({})
    .select("id")
    .single();

  if (convError || !conv) throw convError || new Error("Failed to create conversation");

  // Add participants
  const { error: partError } = await supabase.from("conversation_participants").insert([
    { conversation_id: conv.id, user_id: userData.user.id },
    { conversation_id: conv.id, user_id: otherUserId },
  ]);

  if (partError) throw partError;

  return conv.id;
}

export async function getOrCreateGroupChat(
  groupName: string,
  memberIds: string[]
): Promise<string> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not logged in");

  // Look for existing group with this name
  const { data: myConvs } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userData.user.id);

  if (myConvs?.length) {
    const { data: existingGroup } = await supabase
      .from("conversations")
      .select("id")
      .eq("is_group", true)
      .eq("group_name", groupName)
      .in("id", myConvs.map((c) => c.conversation_id))
      .maybeSingle();

    if (existingGroup) return existingGroup.id;
  }

  // Create new group conversation
  const { data: conv, error: convError } = await supabase
    .from("conversations")
    .insert({ is_group: true, group_name: groupName })
    .select("id")
    .single();

  if (convError || !conv) throw convError || new Error("Failed to create group");

  // Add all members + self
  const allMembers = [...new Set([userData.user.id, ...memberIds])];
  const { error: partError } = await supabase
    .from("conversation_participants")
    .insert(allMembers.map((uid) => ({ conversation_id: conv.id, user_id: uid })));

  if (partError) throw partError;

  return conv.id;
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

export async function sendMessage(conversationId: string, content: string, replyTo?: string) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: userData.user.id,
      content,
      reply_to: replyTo || null,
    })
    .select()
    .single();

  if (error) throw error;

  // Update conversation timestamp
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return data;
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

  return data || [];
}
