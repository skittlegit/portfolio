"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  Smile,
  CornerUpLeft,
  Pencil,
  Trash2,
  X,
  ArrowLeft,
  Plus,
  User,
  Search,
  Check,
  CheckCheck,
} from "lucide-react";
import ToolLayout from "../components/ToolLayout";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { isWhitelisted } from "@/lib/whitelist";
import { createClient } from "@/lib/supabase/client";
import {
  getConversations,
  getOrCreateConversation,
  getOrCreateGroupChat,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  getReactions,
  markRead,
  getWhitelistedUsers,
  type Message,
  type Reaction,
  type ConversationWithParticipant,
} from "@/lib/chat";

const EMOJI_LIST = ["❤️", "😂", "😮", "😢", "😡", "👍", "👎", "🔥", "💯", "🎉"];

type ChatUser = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

export default function Page165() {
  const { fg, fgMuted, isDark } = useTheme();
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  // Chat state
  const [conversations, setConversations] = useState<ConversationWithParticipant[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [showEmojiFor, setShowEmojiFor] = useState<string | null>(null);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [allUsers, setAllUsers] = useState<ChatUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = useMemo(() => createClient(), []);

  const borderSubtle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const bgSubtle = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const bgHover = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const myBubble = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
  const theirBubble = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";

  // Auth check
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?next=/165");
      return;
    }
    if (isWhitelisted(user.email, profile?.username)) {
      setAuthorized(true);
    } else {
      router.replace("/");
    }
  }, [loading, user, profile, router]);

  // Load conversations + ensure the group chat exists
  const loadConversations = useCallback(async () => {
    if (!authorized) return;
    try {
      // Try to create group chat but don't let it block conversation loading
      try {
        const users = await getWhitelistedUsers();
        const otherIds = users.filter((u) => u.id !== user?.id).map((u) => u.id);
        if (otherIds.length > 0) {
          await getOrCreateGroupChat("165 Group", otherIds);
        }
      } catch {
        // Group chat columns may not exist yet — skip silently
      }
      const convs = await getConversations();
      setConversations(convs);
    } catch (err) {
      console.error("Chat load error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("relation") && msg.includes("does not exist")) {
        setChatError("Chat tables not found. Please run the SQL setup in Supabase.");
      } else {
        setChatError(msg || "Failed to load conversations");
      }
    }
  }, [authorized, user?.id]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeConvId) return;
    setLoadingMsgs(true);
    (async () => {
      const msgs = await getMessages(activeConvId);
      setMessages(msgs);
      const rxns = await getReactions(msgs.map((m) => m.id));
      setReactions(rxns);
      await markRead(activeConvId);
      setLoadingMsgs(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    })();
  }, [activeConvId]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!activeConvId) return;

    const channel = supabase
      .channel(`messages:${activeConvId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConvId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMessages((prev) => [...prev, payload.new as Message]);
            markRead(activeConvId);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
          } else if (payload.eventType === "UPDATE") {
            setMessages((prev) =>
              prev.map((m) => (m.id === (payload.new as Message).id ? (payload.new as Message) : m))
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reactions",
        },
        async () => {
          // Refresh reactions
          const msgIds = messages.map((m) => m.id);
          if (msgIds.length) {
            const rxns = await getReactions(msgIds);
            setReactions(rxns);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConvId, supabase, messages]);

  const activeConv = conversations.find((c) => c.conversation.id === activeConvId);

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || !activeConvId) return;

    setChatError(null);
    try {
      if (editingMsg) {
        await editMessage(editingMsg.id, text);
        setEditingMsg(null);
      } else {
        await sendMessage(activeConvId, text, replyTo?.id);
        setReplyTo(null);
      }
      setInputValue("");
      inputRef.current?.focus();
    } catch (err) {
      setChatError(err instanceof Error ? err.message : "Failed to send message");
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    const existing = reactions.find(
      (r) => r.message_id === messageId && r.user_id === user?.id && r.emoji === emoji
    );
    if (existing) {
      await removeReaction(messageId, emoji);
      setReactions((prev) => prev.filter((r) => r.id !== existing.id));
    } else {
      await addReaction(messageId, emoji);
      const rxns = await getReactions([messageId]);
      setReactions((prev) => [
        ...prev.filter((r) => r.message_id !== messageId),
        ...rxns,
      ]);
    }
    setShowEmojiFor(null);
  };

  const handleDelete = async (messageId: string) => {
    await deleteMessage(messageId);
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  const startNewChat = async (otherUserId: string) => {
    setChatError(null);
    try {
      const convId = await getOrCreateConversation(otherUserId);
      await loadConversations();
      setActiveConvId(convId);
      setShowNewChat(false);
      setMobileShowChat(true);
    } catch (err) {
      setChatError(err instanceof Error ? err.message : "Failed to start conversation");
    }
  };

  const loadUsers = async () => {
    const users = await getWhitelistedUsers();
    setAllUsers(users.filter((u) => u.id !== user?.id));
  };

  const filteredUsers = allUsers.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      (u.username?.toLowerCase().includes(q) ?? false) ||
      (u.display_name?.toLowerCase().includes(q) ?? false)
    );
  });

  const getReplyMsg = (replyId: string | null) => {
    if (!replyId) return null;
    return messages.find((m) => m.id === replyId);
  };

  const getUserName = (userId: string) => {
    if (userId === user?.id)
      return profile?.display_name || profile?.username || "You";
    // Check participants list (works for both DMs and groups)
    const participants = activeConv?.participants || [];
    const found = participants.find((p) => p.id === userId);
    if (found) return found.display_name || found.username || "User";
    const other = activeConv?.otherUser;
    if (other && other.id === userId)
      return other.display_name || other.username || "User";
    return "User";
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    if (diffDays === 0) return time;
    if (diffDays === 1) return `Yesterday ${time}`;
    if (diffDays < 7) return `${d.toLocaleDateString("en-US", { weekday: "short" })} ${time}`;
    return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${time}`;
  };

  if (loading || !authorized) {
    return (
      <ToolLayout title="165" description="" backHref="/" backLabel="Home">
        <p style={{ color: fgMuted }}>Loading...</p>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout title="165" description="" backHref="/" backLabel="Home">
      {chatError && (
        <div
          style={{
            padding: "8px 14px",
            marginBottom: 12,
            borderRadius: 8,
            backgroundColor: isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.08)",
            color: "#ef4444",
            fontSize: 13,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{chatError}</span>
          <button
            onClick={() => setChatError(null)}
            style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 4, lineHeight: 0 }}
          >
            <X size={14} />
          </button>
        </div>
      )}
      <div
        style={{
          display: "flex",
          height: "calc(100dvh - 160px)",
          border: `1px solid ${borderSubtle}`,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {/* Sidebar — conversation list */}
        <div
          style={{
            width: 320,
            borderRight: `1px solid ${borderSubtle}`,
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
          }}
          className={mobileShowChat ? "hidden md:flex" : "flex"}
        >
          {/* Sidebar header */}
          <div
            style={{
              padding: "16px 16px 12px",
              borderBottom: `1px solid ${borderSubtle}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h2 className="text-sm font-medium tracking-tight">Messages</h2>
            <button
              onClick={() => {
                setShowNewChat(true);
                loadUsers();
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                lineHeight: 0,
                color: fgMuted,
              }}
              title="New conversation"
            >
              <Plus size={18} strokeWidth={1.5} />
            </button>
          </div>

          {/* Conversation list */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {conversations.length === 0 ? (
              <p className="text-sm p-4" style={{ color: fgMuted }}>
                No conversations yet. Start one!
              </p>
            ) : (
              conversations.map((c) => {
                const isGroup = c.conversation.is_group;
                const convName = isGroup
                  ? c.conversation.group_name || "Group"
                  : c.otherUser.display_name || c.otherUser.username || "User";
                return (
                <button
                  key={c.conversation.id}
                  onClick={() => {
                    setActiveConvId(c.conversation.id);
                    setMobileShowChat(true);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    background:
                      activeConvId === c.conversation.id ? bgHover : "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "inherit",
                    borderBottom: `1px solid ${borderSubtle}`,
                  }}
                >
                  {/* Avatar */}
                  {isGroup ? (
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        backgroundColor: bgSubtle,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontSize: 16,
                      }}
                    >
                      👥
                    </div>
                  ) : c.otherUser.avatar_url ? (
                    <img
                      src={c.otherUser.avatar_url}
                      alt=""
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        backgroundColor: bgSubtle,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <User size={18} strokeWidth={1} style={{ color: fgMuted }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center justify-between">
                      <span
                        className="text-sm"
                        style={{
                          fontWeight: c.unreadCount > 0 ? 600 : 400,
                          color: fg,
                        }}
                      >
                        {convName}
                      </span>
                      {c.lastMessage && (
                        <span className="text-xs" style={{ color: fgMuted }}>
                          {formatTime(c.lastMessage.created_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p
                        className="text-xs truncate"
                        style={{
                          color: fgMuted,
                          maxWidth: 180,
                          fontWeight: c.unreadCount > 0 ? 500 : 400,
                        }}
                      >
                        {c.lastMessage?.content || "No messages yet"}
                      </p>
                      {c.unreadCount > 0 && (
                        <span
                          style={{
                            backgroundColor: fg,
                            color: isDark ? "#000" : "#fff",
                            fontSize: 10,
                            fontWeight: 600,
                            borderRadius: 10,
                            padding: "1px 6px",
                            minWidth: 18,
                            textAlign: "center",
                          }}
                        >
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
          className={!mobileShowChat ? "hidden md:flex" : "flex"}
        >
          {!activeConvId ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <p className="text-sm" style={{ color: fgMuted }}>
                Select a conversation or start a new one
              </p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: `1px solid ${borderSubtle}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <button
                  onClick={() => setMobileShowChat(false)}
                  className="md:hidden"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    lineHeight: 0,
                    color: fgMuted,
                  }}
                >
                  <ArrowLeft size={18} />
                </button>
                {activeConv?.conversation.is_group ? (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      backgroundColor: bgSubtle,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                    }}
                  >
                    👥
                  </div>
                ) : activeConv?.otherUser.avatar_url ? (
                  <img
                    src={activeConv.otherUser.avatar_url}
                    alt=""
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      backgroundColor: bgSubtle,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <User size={14} strokeWidth={1} style={{ color: fgMuted }} />
                  </div>
                )}
                <span className="text-sm font-medium">
                  {activeConv?.conversation.is_group
                    ? activeConv.conversation.group_name || "Group"
                    : activeConv?.otherUser.display_name ||
                      activeConv?.otherUser.username ||
                      "User"}
                </span>
              </div>

              {/* Messages */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                {loadingMsgs ? (
                  <p className="text-sm text-center" style={{ color: fgMuted }}>
                    Loading...
                  </p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-center my-auto" style={{ color: fgMuted }}>
                    No messages yet. Say hello!
                  </p>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === user?.id;
                    const msgReactions = reactions.filter(
                      (r) => r.message_id === msg.id
                    );
                    const replyMsg = getReplyMsg(msg.reply_to);

                    // Group reactions by emoji
                    const emojiGroups: Record<string, { count: number; users: string[]; myReaction: boolean }> = {};
                    for (const r of msgReactions) {
                      if (!emojiGroups[r.emoji]) {
                        emojiGroups[r.emoji] = { count: 0, users: [], myReaction: false };
                      }
                      emojiGroups[r.emoji].count++;
                      emojiGroups[r.emoji].users.push(r.user_id);
                      if (r.user_id === user?.id) emojiGroups[r.emoji].myReaction = true;
                    }

                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: isMine ? "flex-end" : "flex-start",
                          marginBottom: Object.keys(emojiGroups).length > 0 ? 16 : 2,
                          position: "relative" as const,
                        }}
                      >
                        {/* Reply reference */}
                        {replyMsg && (
                          <div
                            className="text-xs mb-1 px-3 py-1 rounded"
                            style={{
                              backgroundColor: bgSubtle,
                              color: fgMuted,
                              maxWidth: 280,
                              borderLeft: `2px solid ${fgMuted}`,
                            }}
                          >
                            <span style={{ fontWeight: 500 }}>
                              {getUserName(replyMsg.sender_id)}
                            </span>
                            <p className="truncate">{replyMsg.content}</p>
                          </div>
                        )}

                        {/* Message bubble */}
                        <div
                          style={{
                            position: "relative",
                            maxWidth: "75%",
                          }}
                        >
                          {/* Sender name in group chats */}
                          {activeConv?.conversation.is_group && !isMine && (
                            <p
                              className="text-xs mb-1 ml-2"
                              style={{ color: fgMuted, fontWeight: 500 }}
                            >
                              {getUserName(msg.sender_id)}
                            </p>
                          )}
                          <div
                            style={{
                              backgroundColor: isMine ? myBubble : theirBubble,
                              borderRadius: 16,
                              borderTopRightRadius: isMine ? 4 : 16,
                              borderTopLeftRadius: isMine ? 16 : 4,
                              padding: "8px 14px",
                              position: "relative",
                            }}
                          >
                            <p className="text-sm" style={{ wordBreak: "break-word" }}>
                              {msg.content}
                            </p>
                            <div
                              className="flex items-center gap-1 mt-1"
                              style={{ justifyContent: isMine ? "flex-end" : "flex-start" }}
                            >
                              <span className="text-xs" style={{ color: fgMuted, opacity: 0.7 }}>
                                {formatTime(msg.created_at)}
                              </span>
                              {msg.edited_at && (
                                <span className="text-xs" style={{ color: fgMuted, opacity: 0.5 }}>
                                  · edited
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Message actions */}
                          <div
                            className="message-actions"
                            style={{
                              position: "absolute",
                              top: -8,
                              ...(isMine ? { left: -8 } : { right: -8 }),
                              display: "flex",
                              gap: 2,
                              opacity: 0,
                              transition: "opacity 0.15s",
                              backgroundColor: isDark ? "#1a1a1a" : "#fff",
                              borderRadius: 8,
                              border: `1px solid ${borderSubtle}`,
                              padding: 2,
                            }}
                          >
                            <button
                              onClick={() => {
                                setShowEmojiFor(
                                  showEmojiFor === msg.id ? null : msg.id
                                );
                              }}
                              title="React"
                              style={actionBtnStyle(fgMuted)}
                            >
                              <Smile size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setReplyTo(msg);
                                inputRef.current?.focus();
                              }}
                              title="Reply"
                              style={actionBtnStyle(fgMuted)}
                            >
                              <CornerUpLeft size={14} />
                            </button>
                            {isMine && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingMsg(msg);
                                    setInputValue(msg.content);
                                    inputRef.current?.focus();
                                  }}
                                  title="Edit"
                                  style={actionBtnStyle(fgMuted)}
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={() => handleDelete(msg.id)}
                                  title="Delete"
                                  style={actionBtnStyle("#ef4444")}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>

                          {/* Emoji picker */}
                          {showEmojiFor === msg.id && (
                            <div
                              style={{
                                position: "absolute",
                                bottom: "100%",
                                ...(isMine ? { right: 0 } : { left: 0 }),
                                marginBottom: 4,
                                backgroundColor: isDark ? "#1a1a1a" : "#fff",
                                border: `1px solid ${borderSubtle}`,
                                borderRadius: 12,
                                padding: "6px 8px",
                                display: "flex",
                                gap: 2,
                                zIndex: 10,
                                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                              }}
                            >
                              {EMOJI_LIST.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => handleReaction(msg.id, emoji)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    fontSize: 18,
                                    cursor: "pointer",
                                    padding: "4px 2px",
                                    borderRadius: 6,
                                    lineHeight: 1,
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.backgroundColor = bgHover)
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.backgroundColor = "transparent")
                                  }
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Reactions display */}
                          {Object.keys(emojiGroups).length > 0 && (
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 4,
                                marginTop: 4,
                                justifyContent: isMine ? "flex-end" : "flex-start",
                              }}
                            >
                              {Object.entries(emojiGroups).map(([emoji, data]) => (
                                <button
                                  key={emoji}
                                  onClick={() => handleReaction(msg.id, emoji)}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3,
                                    padding: "2px 6px",
                                    borderRadius: 10,
                                    border: `1px solid ${
                                      data.myReaction ? fg : borderSubtle
                                    }`,
                                    backgroundColor: data.myReaction ? bgHover : "transparent",
                                    fontSize: 13,
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                    lineHeight: 1.3,
                                  }}
                                >
                                  <span>{emoji}</span>
                                  {data.count > 1 && (
                                    <span className="text-xs" style={{ color: fgMuted }}>
                                      {data.count}
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply/Edit indicator */}
              {(replyTo || editingMsg) && (
                <div
                  style={{
                    padding: "8px 16px",
                    borderTop: `1px solid ${borderSubtle}`,
                    backgroundColor: bgSubtle,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <span className="text-xs font-medium" style={{ color: fgMuted }}>
                      {editingMsg ? "Editing message" : `Replying to ${getUserName(replyTo!.sender_id)}`}
                    </span>
                    <p className="text-xs truncate" style={{ color: fgMuted, maxWidth: 300 }}>
                      {editingMsg?.content || replyTo?.content}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setReplyTo(null);
                      setEditingMsg(null);
                      setInputValue("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 4,
                      lineHeight: 0,
                      color: fgMuted,
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Input */}
              <div
                style={{
                  padding: "12px 16px",
                  borderTop: `1px solid ${borderSubtle}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  className="tool-input"
                  style={{
                    flex: 1,
                    fontSize: 14,
                    padding: "10px 14px",
                    borderRadius: 20,
                  }}
                  placeholder="Message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                    if (e.key === "Escape") {
                      setReplyTo(null);
                      setEditingMsg(null);
                      setInputValue("");
                    }
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: inputValue.trim() ? "pointer" : "default",
                    padding: 8,
                    lineHeight: 0,
                    color: inputValue.trim() ? fg : fgMuted,
                    opacity: inputValue.trim() ? 1 : 0.4,
                    transition: "opacity 0.15s",
                  }}
                >
                  <Send size={18} strokeWidth={1.5} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* New chat modal */}
        {showNewChat && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 50,
            }}
            onClick={() => setShowNewChat(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: isDark ? "#111" : "#fff",
                borderRadius: 16,
                width: "90%",
                maxWidth: 400,
                maxHeight: "70vh",
                display: "flex",
                flexDirection: "column",
                border: `1px solid ${borderSubtle}`,
              }}
            >
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: `1px solid ${borderSubtle}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <h3 className="text-sm font-medium">New Message</h3>
                <button
                  onClick={() => setShowNewChat(false)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    lineHeight: 0,
                    color: fgMuted,
                  }}
                >
                  <X size={16} />
                </button>
              </div>
              <div style={{ padding: "12px 20px", borderBottom: `1px solid ${borderSubtle}` }}>
                <div style={{ position: "relative" }}>
                  <Search
                    size={14}
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: fgMuted,
                    }}
                  />
                  <input
                    type="text"
                    className="tool-input"
                    style={{ width: "100%", paddingLeft: 34, fontSize: 13 }}
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <div style={{ flex: 1, overflowY: "auto" }}>
                {filteredUsers.length === 0 ? (
                  <p className="text-sm p-4" style={{ color: fgMuted }}>
                    {allUsers.length === 0 ? "Loading users..." : "No users found."}
                  </p>
                ) : (
                  filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => startNewChat(u.id)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 20px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        fontFamily: "inherit",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = bgHover)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      {u.avatar_url ? (
                        <img
                          src={u.avatar_url}
                          alt=""
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            backgroundColor: bgSubtle,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <User size={16} strokeWidth={1} style={{ color: fgMuted }} />
                        </div>
                      )}
                      <div>
                        <p className="text-sm" style={{ color: fg }}>
                          {u.display_name || u.username || "User"}
                        </p>
                        {u.username && (
                          <p className="text-xs" style={{ color: fgMuted }}>
                            @{u.username}
                          </p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .message-actions {
          opacity: 0 !important;
        }
        div:hover > div > .message-actions,
        div:hover > .message-actions {
          opacity: 1 !important;
        }
      `}</style>
    </ToolLayout>
  );
}

function actionBtnStyle(color: string): React.CSSProperties {
  return {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
    lineHeight: 0,
    color,
    borderRadius: 4,
  };
}
