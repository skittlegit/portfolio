"use client";

import { useEffect, useState, useRef, useCallback, useMemo, ChangeEvent } from "react";
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
  Users,
  Search,
  Paperclip,
  Play,
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
  uploadChatFile,
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
  // New feature state
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<ChatUser | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      // Ensure the default group chat exists
      try {
        const users = await getWhitelistedUsers();
        const otherIds = users.filter((u) => u.id !== user?.id).map((u) => u.id);
        await getOrCreateGroupChat("165 Group", otherIds);
      } catch (groupErr) {
        console.error("Group chat creation error:", groupErr);
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
    setShowGroupInfo(false);
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
    if ((!text && !pendingMedia) || !activeConvId) return;

    setChatError(null);
    try {
      if (editingMsg) {
        if (!text) return;
        await editMessage(editingMsg.id, text);
        setEditingMsg(null);
      } else {
        await sendMessage(activeConvId, text || " ", replyTo?.id, pendingMedia?.url || undefined);
        setReplyTo(null);
        setPendingMedia(null);
      }
      setInputValue("");
      inputRef.current?.focus();
    } catch (err) {
      setChatError(err instanceof Error ? err.message : "Failed to send message");
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploadingFile(true);
    setChatError(null);
    try {
      const url = await uploadChatFile(file);
      const type = file.type.startsWith("video/") ? "video" : "image";
      setPendingMedia({ url, type });
    } catch (err) {
      setChatError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingFile(false);
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

  const handleOpenProfile = (u: ChatUser) => {
    setViewingProfile(u);
    setShowGroupInfo(false);
  };

  // Long-press (500ms) triggers emoji picker on touch devices
  const handleTouchStart = (messageId: string) => {
    longPressTimer.current = setTimeout(() => {
      setShowEmojiFor(messageId);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
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
          position: "relative",
        }}
      >
        {/* ── Sidebar ─────────────────────────────────── */}
        <div
          style={{
            width: 300,
            borderRight: `1px solid ${borderSubtle}`,
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
          }}
          className={mobileShowChat ? "hidden md:flex" : "flex"}
        >
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
              onClick={() => { setShowNewChat(true); loadUsers(); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, lineHeight: 0, color: fgMuted }}
              title="New conversation"
            >
              <Plus size={18} strokeWidth={1.5} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {conversations.length === 0 ? (
              <p className="text-sm p-4" style={{ color: fgMuted }}>No conversations yet.</p>
            ) : (
              conversations.map((c) => {
                const isGroup = c.conversation.is_group;
                const convName = isGroup
                  ? c.conversation.group_name || "Group"
                  : c.otherUser.display_name || c.otherUser.username || "User";
                const lastContent =
                  c.lastMessage?.image_url && !c.lastMessage.content.trim()
                    ? "📎 Media"
                    : c.lastMessage?.content || "No messages yet";
                return (
                  <button
                    key={c.conversation.id}
                    onClick={() => { setActiveConvId(c.conversation.id); setMobileShowChat(true); }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 16px",
                      background: activeConvId === c.conversation.id ? bgHover : "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                      borderBottom: `1px solid ${borderSubtle}`,
                    }}
                  >
                    {isGroup ? (
                      <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: bgSubtle, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>
                        👥
                      </div>
                    ) : c.otherUser.avatar_url ? (
                      <img src={c.otherUser.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: bgSubtle, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <User size={18} strokeWidth={1} style={{ color: fgMuted }} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ fontWeight: c.unreadCount > 0 ? 600 : 400, color: fg }}>{convName}</span>
                        {c.lastMessage && (
                          <span className="text-xs" style={{ color: fgMuted }}>{formatTime(c.lastMessage.created_at)}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs truncate" style={{ color: fgMuted, maxWidth: 160, fontWeight: c.unreadCount > 0 ? 500 : 400 }}>
                          {lastContent}
                        </p>
                        {c.unreadCount > 0 && (
                          <span style={{ backgroundColor: fg, color: isDark ? "#000" : "#fff", fontSize: 10, fontWeight: 600, borderRadius: 10, padding: "1px 6px", minWidth: 18, textAlign: "center" }}>
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

        {/* ── Chat area ───────────────────────────────── */}
        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}
          className={!mobileShowChat ? "hidden md:flex" : "flex"}
        >
          {!activeConvId ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p className="text-sm" style={{ color: fgMuted }}>Select a conversation or start a new one</p>
            </div>
          ) : (
            <>
              {/* Chat header — clickable to open profile or group info */}
              <div
                style={{
                  padding: "10px 16px",
                  borderBottom: `1px solid ${borderSubtle}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <button
                  onClick={() => setMobileShowChat(false)}
                  className="md:hidden"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4, lineHeight: 0, color: fgMuted }}
                >
                  <ArrowLeft size={18} />
                </button>
                <button
                  onClick={() => {
                    if (activeConv?.conversation.is_group) {
                      setShowGroupInfo((v) => !v);
                    } else if (activeConv?.otherUser) {
                      handleOpenProfile(activeConv.otherUser);
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flex: 1,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px 8px",
                    borderRadius: 8,
                    fontFamily: "inherit",
                    textAlign: "left",
                    minWidth: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = bgHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  {activeConv?.conversation.is_group ? (
                    <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: bgSubtle, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                      👥
                    </div>
                  ) : activeConv?.otherUser.avatar_url ? (
                    <img src={activeConv.otherUser.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: bgSubtle, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <User size={14} strokeWidth={1} style={{ color: fgMuted }} />
                    </div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <p className="text-sm font-medium truncate" style={{ color: fg, lineHeight: 1.2 }}>
                      {activeConv?.conversation.is_group
                        ? activeConv.conversation.group_name || "Group"
                        : activeConv?.otherUser.display_name || activeConv?.otherUser.username || "User"}
                    </p>
                    {activeConv?.conversation.is_group ? (
                      <p className="text-xs" style={{ color: fgMuted, lineHeight: 1.2 }}>
                        {activeConv.participants.length} members · tap for info
                      </p>
                    ) : activeConv?.otherUser.username ? (
                      <p className="text-xs" style={{ color: fgMuted, lineHeight: 1.2 }}>
                        @{activeConv.otherUser.username}
                      </p>
                    ) : null}
                  </div>
                </button>
                {activeConv?.conversation.is_group && (
                  <button
                    onClick={() => setShowGroupInfo((v) => !v)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 6,
                      lineHeight: 0,
                      color: showGroupInfo ? fg : fgMuted,
                      borderRadius: 8,
                      flexShrink: 0,
                    }}
                    title="Group members"
                  >
                    <Users size={16} strokeWidth={1.5} />
                  </button>
                )}
              </div>

              {/* Messages + optional group info side panel */}
              <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
                {/* Messages scroll area */}
                <div
                  style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 4 }}
                  onClick={() => setShowEmojiFor(null)}
                >
                  {loadingMsgs ? (
                    <p className="text-sm text-center" style={{ color: fgMuted }}>Loading...</p>
                  ) : messages.length === 0 ? (
                    <p className="text-sm text-center my-auto" style={{ color: fgMuted }}>No messages yet. Say hello!</p>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.sender_id === user?.id;
                      const msgReactions = reactions.filter((r) => r.message_id === msg.id);
                      const replyMsg = getReplyMsg(msg.reply_to);
                      const isMedia = !!msg.image_url;
                      const isVideoMsg = isMedia && /\.(mp4|webm|mov|ogg)(\?|$)/i.test(msg.image_url!);

                      const emojiGroups: Record<string, { count: number; myReaction: boolean }> = {};
                      for (const r of msgReactions) {
                        if (!emojiGroups[r.emoji]) emojiGroups[r.emoji] = { count: 0, myReaction: false };
                        emojiGroups[r.emoji].count++;
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
                            position: "relative",
                          }}
                          onTouchStart={() => handleTouchStart(msg.id)}
                          onTouchEnd={handleTouchEnd}
                          onTouchMove={handleTouchEnd}
                        >
                          {/* Reply reference */}
                          {replyMsg && (
                            <div
                              className="text-xs mb-1 px-3 py-1 rounded"
                              style={{ backgroundColor: bgSubtle, color: fgMuted, maxWidth: 280, borderLeft: `2px solid ${fgMuted}` }}
                            >
                              <span style={{ fontWeight: 500 }}>{getUserName(replyMsg.sender_id)}</span>
                              {replyMsg.image_url
                                ? <p className="truncate">📎 Media</p>
                                : <p className="truncate">{replyMsg.content}</p>
                              }
                            </div>
                          )}

                          <div style={{ position: "relative", maxWidth: "75%" }}>
                            {/* Sender name in groups — clickable */}
                            {activeConv?.conversation.is_group && !isMine && (
                              <button
                                onClick={() => {
                                  const sender = activeConv.participants.find((p) => p.id === msg.sender_id);
                                  if (sender) handleOpenProfile(sender);
                                }}
                                className="text-xs mb-1 ml-2"
                                style={{ color: fgMuted, fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
                              >
                                {getUserName(msg.sender_id)}
                              </button>
                            )}

                            <div
                              style={{
                                backgroundColor: isMine ? myBubble : theirBubble,
                                borderRadius: 16,
                                borderTopRightRadius: isMine ? 4 : 16,
                                borderTopLeftRadius: isMine ? 16 : 4,
                                padding: isMedia && !msg.content.trim() ? "4px" : "8px 14px",
                                position: "relative",
                                overflow: "hidden",
                              }}
                            >
                              {/* Media content */}
                              {isMedia && (
                                <div style={{ marginBottom: msg.content.trim() && msg.content.trim() !== " " ? 6 : 0 }}>
                                  {isVideoMsg ? (
                                    <video
                                      src={msg.image_url!}
                                      controls
                                      style={{ maxWidth: 240, maxHeight: 200, borderRadius: 12, display: "block" }}
                                    />
                                  ) : (
                                    <img
                                      src={msg.image_url!}
                                      alt="media"
                                      style={{ maxWidth: 240, maxHeight: 300, borderRadius: 12, objectFit: "cover", display: "block", cursor: "zoom-in" }}
                                      onClick={(e) => { e.stopPropagation(); setLightboxUrl(msg.image_url!); }}
                                    />
                                  )}
                                </div>
                              )}

                              {/* Text content */}
                              {msg.content.trim() && msg.content.trim() !== " " && (
                                <p className="text-sm" style={{ wordBreak: "break-word" }}>{msg.content}</p>
                              )}

                              <div className="flex items-center gap-1 mt-1" style={{ justifyContent: isMine ? "flex-end" : "flex-start" }}>
                                <span className="text-xs" style={{ color: fgMuted, opacity: 0.7 }}>{formatTime(msg.created_at)}</span>
                                {msg.edited_at && (
                                  <span className="text-xs" style={{ color: fgMuted, opacity: 0.5 }}>· edited</span>
                                )}
                              </div>
                            </div>

                            {/* Message actions (hover on desktop, shown after long-press on mobile) */}
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
                                zIndex: 5,
                              }}
                            >
                              <button onClick={(e) => { e.stopPropagation(); setShowEmojiFor(showEmojiFor === msg.id ? null : msg.id); }} title="React" style={actionBtnStyle(fgMuted)}><Smile size={14} /></button>
                              <button onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }} title="Reply" style={actionBtnStyle(fgMuted)}><CornerUpLeft size={14} /></button>
                              {isMine && (
                                <>
                                  {!isMedia && (
                                    <button onClick={() => { setEditingMsg(msg); setInputValue(msg.content); inputRef.current?.focus(); }} title="Edit" style={actionBtnStyle(fgMuted)}><Pencil size={14} /></button>
                                  )}
                                  <button onClick={() => handleDelete(msg.id)} title="Delete" style={actionBtnStyle("#ef4444")}><Trash2 size={14} /></button>
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
                                  flexWrap: "wrap",
                                  gap: 2,
                                  zIndex: 20,
                                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                  maxWidth: 220,
                                }}
                              >
                                {EMOJI_LIST.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, emoji); }}
                                    style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", padding: "4px 2px", borderRadius: 6, lineHeight: 1, minWidth: 32 }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = bgHover)}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Reactions display */}
                            {Object.keys(emojiGroups).length > 0 && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4, justifyContent: isMine ? "flex-end" : "flex-start" }}>
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
                                      border: `1px solid ${data.myReaction ? fg : borderSubtle}`,
                                      backgroundColor: data.myReaction ? bgHover : "transparent",
                                      fontSize: 13,
                                      cursor: "pointer",
                                      fontFamily: "inherit",
                                      lineHeight: 1.3,
                                    }}
                                  >
                                    <span>{emoji}</span>
                                    {data.count > 1 && <span className="text-xs" style={{ color: fgMuted }}>{data.count}</span>}
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

                {/* Group info side panel */}
                {showGroupInfo && activeConv?.conversation.is_group && (
                  <div
                    style={{
                      width: 220,
                      borderLeft: `1px solid ${borderSubtle}`,
                      display: "flex",
                      flexDirection: "column",
                      flexShrink: 0,
                      backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.5)",
                    }}
                  >
                    <div style={{ padding: "14px 16px", borderBottom: `1px solid ${borderSubtle}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span className="text-sm font-medium">Members</span>
                      <button onClick={() => setShowGroupInfo(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, lineHeight: 0, color: fgMuted }}>
                        <X size={14} />
                      </button>
                    </div>
                    <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
                      {activeConv.participants.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleOpenProfile(p)}
                          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = bgHover)}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          {p.avatar_url ? (
                            <img src={p.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: bgSubtle, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <User size={14} strokeWidth={1} style={{ color: fgMuted }} />
                            </div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <p className="text-sm truncate" style={{ color: p.id === user?.id ? fgMuted : fg }}>
                              {p.display_name || p.username || "User"}{p.id === user?.id ? " (you)" : ""}
                            </p>
                            {p.username && <p className="text-xs" style={{ color: fgMuted }}>@{p.username}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Reply / Edit banner */}
              {(replyTo || editingMsg) && (
                <div style={{ padding: "8px 16px", borderTop: `1px solid ${borderSubtle}`, backgroundColor: bgSubtle, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <span className="text-xs font-medium" style={{ color: fgMuted }}>
                      {editingMsg ? "Editing message" : `Replying to ${getUserName(replyTo!.sender_id)}`}
                    </span>
                    <p className="text-xs truncate" style={{ color: fgMuted, maxWidth: 260 }}>
                      {editingMsg?.content || replyTo?.content}
                    </p>
                  </div>
                  <button
                    onClick={() => { setReplyTo(null); setEditingMsg(null); setInputValue(""); }}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 4, lineHeight: 0, color: fgMuted }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Pending media preview */}
              {pendingMedia && (
                <div
                  style={{
                    padding: "8px 16px",
                    borderTop: `1px solid ${borderSubtle}`,
                    backgroundColor: bgSubtle,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  {pendingMedia.type === "image" ? (
                    <img src={pendingMedia.url} alt="pending" style={{ height: 56, width: 56, objectFit: "cover", borderRadius: 8 }} />
                  ) : (
                    <div style={{ height: 56, width: 56, borderRadius: 8, backgroundColor: bgHover, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Play size={18} style={{ color: fgMuted }} />
                    </div>
                  )}
                  <span className="text-xs" style={{ color: fgMuted, flex: 1 }}>
                    {pendingMedia.type === "video" ? "Video ready to send" : "Image ready to send"}
                  </span>
                  <button onClick={() => setPendingMedia(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, lineHeight: 0, color: fgMuted }}>
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Input */}
              <div
                style={{
                  padding: "10px 12px",
                  paddingBottom: "calc(10px + env(safe-area-inset-bottom))",
                  borderTop: `1px solid ${borderSubtle}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  style={{ display: "none" }}
                  onChange={handleFileSelect}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: uploadingFile ? "default" : "pointer",
                    padding: 8,
                    lineHeight: 0,
                    color: fgMuted,
                    opacity: uploadingFile ? 0.3 : 0.6,
                    flexShrink: 0,
                    minWidth: 36,
                    minHeight: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Attach image or video"
                >
                  <Paperclip size={18} strokeWidth={1.5} />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  className="tool-input"
                  style={{ flex: 1, fontSize: 14, padding: "10px 14px", borderRadius: 20 }}
                  placeholder={pendingMedia ? "Add a caption..." : "Message..."}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                    if (e.key === "Escape") { setReplyTo(null); setEditingMsg(null); setInputValue(""); setPendingMedia(null); }
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() && !pendingMedia}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: inputValue.trim() || pendingMedia ? "pointer" : "default",
                    padding: 8,
                    lineHeight: 0,
                    color: inputValue.trim() || pendingMedia ? fg : fgMuted,
                    opacity: inputValue.trim() || pendingMedia ? 1 : 0.4,
                    transition: "opacity 0.15s",
                    minWidth: 36,
                    minHeight: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Send size={18} strokeWidth={1.5} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── New chat modal ───────────────────────────── */}
      {showNewChat && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
          onClick={() => setShowNewChat(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: isDark ? "#111" : "#fff", borderRadius: 16, width: "90%", maxWidth: 400, maxHeight: "70vh", display: "flex", flexDirection: "column", border: `1px solid ${borderSubtle}` }}
          >
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${borderSubtle}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 className="text-sm font-medium">New Message</h3>
              <button onClick={() => setShowNewChat(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, lineHeight: 0, color: fgMuted }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: "12px 20px", borderBottom: `1px solid ${borderSubtle}` }}>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: fgMuted }} />
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
                <p className="text-sm p-4" style={{ color: fgMuted }}>{allUsers.length === 0 ? "Loading users..." : "No users found."}</p>
              ) : (
                filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => startNewChat(u.id)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = bgHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: bgSubtle, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <User size={16} strokeWidth={1} style={{ color: fgMuted }} />
                      </div>
                    )}
                    <div>
                      <p className="text-sm" style={{ color: fg }}>{u.display_name || u.username || "User"}</p>
                      {u.username && <p className="text-xs" style={{ color: fgMuted }}>@{u.username}</p>}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── User profile modal ───────────────────────── */}
      {viewingProfile && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }}
          onClick={() => setViewingProfile(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: isDark ? "#111" : "#fff", borderRadius: 20, width: "90%", maxWidth: 320, border: `1px solid ${borderSubtle}`, overflow: "hidden" }}
          >
            <div style={{ textAlign: "center", padding: "32px 24px 24px", borderBottom: `1px solid ${borderSubtle}`, position: "relative" }}>
              <button
                onClick={() => setViewingProfile(null)}
                style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", cursor: "pointer", padding: 6, lineHeight: 0, color: fgMuted }}
              >
                <X size={16} />
              </button>
              {viewingProfile.avatar_url ? (
                <img
                  src={viewingProfile.avatar_url}
                  alt=""
                  style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", margin: "0 auto 12px", display: "block" }}
                />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: "50%", backgroundColor: bgSubtle, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <User size={32} strokeWidth={1} style={{ color: fgMuted }} />
                </div>
              )}
              <h3 className="text-base font-medium" style={{ color: fg }}>
                {viewingProfile.display_name || viewingProfile.username || "User"}
              </h3>
              {viewingProfile.username && (
                <p className="text-sm" style={{ color: fgMuted, marginTop: 2 }}>@{viewingProfile.username}</p>
              )}
            </div>
            <div style={{ padding: "16px 24px", display: "flex", gap: 10 }}>
              {viewingProfile.id !== user?.id && (
                <button
                  onClick={async () => {
                    setViewingProfile(null);
                    const convId = await getOrCreateConversation(viewingProfile!.id);
                    await loadConversations();
                    setActiveConvId(convId);
                    setMobileShowChat(true);
                  }}
                  className="text-sm"
                  style={{
                    flex: 1,
                    padding: "9px 16px",
                    borderRadius: 10,
                    border: `1px solid ${borderSubtle}`,
                    backgroundColor: bgHover,
                    color: fg,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = bgHover)}
                >
                  Send Message
                </button>
              )}
              <button
                onClick={() => setViewingProfile(null)}
                className="text-sm"
                style={{
                  flex: viewingProfile.id === user?.id ? 1 : undefined,
                  padding: "9px 16px",
                  borderRadius: 10,
                  border: `1px solid ${borderSubtle}`,
                  backgroundColor: "transparent",
                  color: fgMuted,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Image lightbox ────────────────────────────── */}
      {lightboxUrl && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70, cursor: "zoom-out" }}
          onClick={() => setLightboxUrl(null)}
        >
          <img src={lightboxUrl} alt="" style={{ maxWidth: "95vw", maxHeight: "95vh", objectFit: "contain", borderRadius: 8 }} />
          <button
            onClick={() => setLightboxUrl(null)}
            style={{ position: "fixed", top: 16, right: 16, background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", padding: 8, borderRadius: 8, lineHeight: 0, color: "#fff" }}
          >
            <X size={20} />
          </button>
        </div>
      )}

      <style>{`
        .message-actions { opacity: 0 !important; }
        div:hover > div > .message-actions,
        div:hover > .message-actions { opacity: 1 !important; }
        @media (hover: none) {
          .message-actions { display: none !important; }
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
    padding: 6,
    lineHeight: 0,
    color,
    borderRadius: 4,
    minWidth: 30,
    minHeight: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
}
