import { createClient } from "@/lib/supabase/client";

export type Conversation = {
  id: string;
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

  // Get other participants
  const { data: allParticipants } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id")
    .in("conversation_id", convIds)
    .neq("user_id", userData.user.id);

  // Get profiles for other participants
  const otherUserIds = [...new Set(allParticipants?.map((p) => p.user_id) || [])];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", otherUserIds);

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
  const participantMap = new Map(
    allParticipants?.map((p) => [p.conversation_id, p.user_id]) || []
  );

  // Get last message for each conversation
  const results: ConversationWithParticipant[] = [];
  for (const conv of conversations) {
    const otherUserId = participantMap.get(conv.id);
    const otherProfile = otherUserId ? profileMap.get(otherUserId) : null;

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
      conversation: conv,
      otherUser: otherProfile || {
        id: otherUserId || "",
        username: null,
        display_name: null,
        avatar_url: null,
      },
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

  // Check if conversation already exists
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

    if (shared?.length) {
      return shared[0].conversation_id;
    }
  }

  // Create new conversation
  const { data: conv, error: convError } = await supabase
    .from("conversations")
    .insert({})
    .select("id")
    .single();

  if (convError || !conv) throw convError || new Error("Failed to create conversation");

  // Add participants
  await supabase.from("conversation_participants").insert([
    { conversation_id: conv.id, user_id: userData.user.id },
    { conversation_id: conv.id, user_id: otherUserId },
  ]);

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
