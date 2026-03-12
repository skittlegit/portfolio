/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useRef, useCallback, ChangeEvent } from "react";
import {
  Send,
  Smile,
  CornerUpLeft,
  Pencil,
  Trash2,
  X,
  Paperclip,
  Play,
  User,
  Forward,
  Check,
  CheckCheck,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  getReactions,
  markRead,
  uploadChatFile,
  getReadReceipts,
  getConversations,
  forwardMessage,
  type Message,
  type Reaction,
  type ConversationWithParticipant,
} from "@/lib/chat";

const EMOJI_LIST = ["❤️", "😂", "😮", "😢", "😡", "👍", "👎", "🔥", "💯", "🎉"];

export type Participant = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

type Props = {
  convId: string;
  isGroup: boolean;
  participants: Participant[];
  showGroupPanel: boolean;
  onToggleGroupPanel: () => void;
  onOpenProfile: (p: Participant) => void;
  heightOffset?: number;
};

function formatTime(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (diffDays === 0) return time;
  if (diffDays === 1) return `Yesterday ${time}`;
  if (diffDays < 7) return `${d.toLocaleDateString("en-US", { weekday: "short" })} ${time}`;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${time}`;
}

function btnStyle(color: string): React.CSSProperties {
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

export default function ChatArea({
  convId,
  isGroup,
  participants,
  showGroupPanel,
  onToggleGroupPanel,
  onOpenProfile,
  heightOffset = 240,
}: Props) {
  const { fg, fgMuted, isDark } = useTheme();
  const { user, profile } = useAuth();

  const borderSubtle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const bgSubtle = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const bgHover = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const myBubble = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
  const theirBubble = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";

  const [messages, setMessages] = useState<Message[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [showEmojiFor, setShowEmojiFor] = useState<string | null>(null);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [sendError, setSendError] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // New: typing indicator
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  // New: read receipts (userId -> last_read_at ISO)
  const [readReceipts, setReadReceipts] = useState<Record<string, string>>({});
  // New: forward
  const [forwardingMsg, setForwardingMsg] = useState<Message | null>(null);
  const [forwardConvs, setForwardConvs] = useState<ConversationWithParticipant[]>([]);
  const [forwarding, setForwarding] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const supabase = useRef(createClient()).current;

  // Load messages
  useEffect(() => {
    setLoadingMsgs(true);
    setMessages([]);
    setReactions([]);
    setTypingUsers([]);
    (async () => {
      const msgs = await getMessages(convId);
      setMessages(msgs);
      if (msgs.length) setReactions(await getReactions(msgs.map((m) => m.id)));
      await markRead(convId);
      setLoadingMsgs(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    })();
  }, [convId]);

  // Realtime messages + reactions
  useEffect(() => {
    const ch = supabase
      .channel(`chat:${convId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${convId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMessages((prev) => [...prev, payload.new as Message]);
            markRead(convId);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
          } else if (payload.eventType === "UPDATE") {
            setMessages((prev) => prev.map((m) => m.id === (payload.new as Message).id ? (payload.new as Message) : m));
          }
        })
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" },
        async () => {
          if (!messages.length) return;
          const ids = messages.map((m) => m.id);
          if (ids.length) setReactions(await getReactions(ids));
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [convId, supabase, messages.length]);

  // Typing indicator channel (broadcast)
  useEffect(() => {
    const ch = supabase.channel(`typing-${convId}`)
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const uid = payload.user_id as string;
        if (uid === user?.id) return;
        setTypingUsers((prev) => (prev.includes(uid) ? prev : [...prev, uid]));
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u !== uid));
        }, 3000);
      })
      .subscribe();
    typingChannelRef.current = ch;
    return () => { supabase.removeChannel(ch); typingChannelRef.current = null; };
  }, [convId, supabase, user?.id]);

  // Read receipts (DM only)
  useEffect(() => {
    if (isGroup) return;
    getReadReceipts(convId).then(setReadReceipts);
    const ch = supabase.channel(`receipts-${convId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "read_receipts", filter: `conversation_id=eq.${convId}` }, () => {
        getReadReceipts(convId).then(setReadReceipts);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [convId, isGroup, supabase]);

  const broadcastTyping = useCallback(() => {
    if (typingTimeout.current) return;
    typingChannelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: user?.id },
    });
    typingTimeout.current = setTimeout(() => { typingTimeout.current = null; }, 2000);
  }, [user?.id]);

  const getName = (userId: string) => {
    if (userId === user?.id) return profile?.display_name || profile?.username || "You";
    const p = participants.find((x) => x.id === userId);
    return p?.display_name || p?.username || "User";
  };

  const getMessageStatus = (msg: Message): "sent" | "read" | null => {
    if (msg.sender_id !== user?.id || isGroup) return null;
    const otherUserId = participants.find((p) => p.id !== user?.id)?.id;
    if (!otherUserId) return "sent";
    const readAt = readReceipts[otherUserId];
    if (readAt && new Date(readAt) >= new Date(msg.created_at)) return "read";
    return "sent";
  };

  const handleSend = async () => {
    if ((!inputValue.trim() && !pendingMedia) || !convId) return;
    setSendError(null);
    try {
      if (editingMsg) {
        if (!inputValue.trim()) return;
        await editMessage(editingMsg.id, inputValue.trim());
        setEditingMsg(null);
      } else {
        await sendMessage(convId, inputValue.trim() || " ", replyTo?.id, pendingMedia?.url);
        setReplyTo(null);
        setPendingMedia(null);
      }
      setInputValue("");
      inputRef.current?.focus();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Send failed");
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploadingFile(true);
    setSendError(null);
    try {
      const url = await uploadChatFile(file);
      setPendingMedia({ url, type: file.type.startsWith("video/") ? "video" : "image" });
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    const existing = reactions.find((r) => r.message_id === messageId && r.user_id === user?.id && r.emoji === emoji);
    if (existing) {
      await removeReaction(messageId, emoji);
      setReactions((prev) => prev.filter((r) => r.id !== existing.id));
    } else {
      await addReaction(messageId, emoji);
      const updated = await getReactions([messageId]);
      setReactions((prev) => [...prev.filter((r) => r.message_id !== messageId), ...updated]);
    }
    setShowEmojiFor(null);
  };

  const handleTouchStart = (id: string) => {
    longPressTimer.current = setTimeout(() => setShowEmojiFor(id), 500);
  };
  const handleTouchEnd = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };

  const openForward = async (msg: Message) => {
    setForwardingMsg(msg);
    const convs = await getConversations();
    setForwardConvs(convs.filter((c) => c.conversation.id !== convId));
  };

  const handleForward = async (targetConvId: string) => {
    if (!forwardingMsg || forwarding) return;
    setForwarding(true);
    try {
      await forwardMessage(forwardingMsg.id, targetConvId);
      setForwardingMsg(null);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Forward failed");
    } finally {
      setForwarding(false);
    }
  };

  const typingLabel = typingUsers.length > 0
    ? typingUsers.map((uid) => getName(uid)).join(", ") + (typingUsers.length === 1 ? " is typing…" : " are typing…")
    : null;

  return (
    <div style={{ flex: 1, display: "flex", height: `calc(100dvh - ${heightOffset}px)`, minWidth: 0 }}>
      {/* Message column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Message scroll */}
        <div
          className="s165-scroll"
          style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 4 }}
          onClick={() => setShowEmojiFor(null)}
        >
          {loadingMsgs ? (
            <p className="text-sm text-center" style={{ color: fgMuted }}>Loading…</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-center my-auto" style={{ color: fgMuted }}>No messages yet. Say hello!</p>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === user?.id;
              const msgRxns = reactions.filter((r) => r.message_id === msg.id);
              const replyMsg = msg.reply_to ? messages.find((m) => m.id === msg.reply_to) : null;
              const isMedia = !!msg.image_url;
              const isVideo = isMedia && /\.(mp4|webm|mov|ogg)(\?|$)/i.test(msg.image_url!);
              const hasText = msg.content.trim() && msg.content.trim() !== " ";
              const status = getMessageStatus(msg);
              const isForwarded = hasText && msg.content.startsWith("↪ ");

              const emojiGroups: Record<string, { count: number; mine: boolean }> = {};
              for (const r of msgRxns) {
                if (!emojiGroups[r.emoji]) emojiGroups[r.emoji] = { count: 0, mine: false };
                emojiGroups[r.emoji].count++;
                if (r.user_id === user?.id) emojiGroups[r.emoji].mine = true;
              }

              return (
                <div
                  key={msg.id}
                  style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start", marginBottom: Object.keys(emojiGroups).length ? 16 : 2, position: "relative" }}
                  onTouchStart={() => handleTouchStart(msg.id)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchEnd}
                >
                  {replyMsg && (
                    <div className="text-xs mb-1 px-3 py-1 rounded" style={{ backgroundColor: bgSubtle, color: fgMuted, maxWidth: 280, borderLeft: `2px solid ${fgMuted}` }}>
                      <span style={{ fontWeight: 500 }}>{getName(replyMsg.sender_id)}</span>
                      <p className="truncate">{replyMsg.image_url && !replyMsg.content.trim() ? "📎 Media" : replyMsg.content}</p>
                    </div>
                  )}

                  <div style={{ position: "relative", maxWidth: "75%" }}>
                    {isGroup && !isMine && (
                      <button
                        onClick={() => { const s = participants.find((p) => p.id === msg.sender_id); if (s) onOpenProfile(s); }}
                        className="text-xs mb-1 ml-2"
                        style={{ color: fgMuted, fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit", display: "block" }}
                      >
                        {getName(msg.sender_id)}
                      </button>
                    )}

                    <div style={{ backgroundColor: isMine ? myBubble : theirBubble, borderRadius: 16, borderTopRightRadius: isMine ? 4 : 16, borderTopLeftRadius: isMine ? 16 : 4, padding: isMedia && !hasText ? "4px" : "8px 14px", overflow: "hidden" }}>
                      {isForwarded && (
                        <p className="text-xs mb-1" style={{ color: fgMuted, fontStyle: "italic" }}>↪ Forwarded</p>
                      )}
                      {isMedia && (
                        <div style={{ marginBottom: hasText ? 6 : 0 }}>
                          {isVideo ? (
                            <video src={msg.image_url!} controls style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 10, display: "block" }} />
                          ) : (
                            <img src={msg.image_url!} alt="media" style={{ maxWidth: "100%", maxHeight: 280, borderRadius: 10, objectFit: "cover", display: "block", cursor: "zoom-in" }} onClick={(e) => { e.stopPropagation(); setLightboxUrl(msg.image_url!); }} />
                          )}
                        </div>
                      )}
                      {hasText && <p className="text-sm" style={{ wordBreak: "break-word" }}>{isForwarded ? msg.content.slice(2) : msg.content}</p>}
                      <div className="flex items-center gap-1 mt-1" style={{ justifyContent: isMine ? "flex-end" : "flex-start" }}>
                        <span className="text-xs" style={{ color: fgMuted, opacity: 0.7 }}>{formatTime(msg.created_at)}</span>
                        {msg.edited_at && <span className="text-xs" style={{ color: fgMuted, opacity: 0.5 }}>· edited</span>}
                        {/* Read receipt ticks (DM only) */}
                        {status && (
                          <span style={{ marginLeft: 2, display: "inline-flex", alignItems: "center" }}>
                            {status === "read" ? (
                              <CheckCheck size={14} strokeWidth={2} style={{ color: "#3b82f6" }} />
                            ) : (
                              <Check size={14} strokeWidth={2} style={{ color: fgMuted, opacity: 0.5 }} />
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Hover actions */}
                    <div className="s165-msg-actions" style={{ position: "absolute", top: -8, ...(isMine ? { left: -8 } : { right: -8 }), display: "flex", gap: 2, opacity: 0, transition: "opacity 0.15s", backgroundColor: isDark ? "#1a1a1a" : "#fff", borderRadius: 8, border: `1px solid ${borderSubtle}`, padding: 2, zIndex: 5 }}>
                      <button onClick={(e) => { e.stopPropagation(); setShowEmojiFor(showEmojiFor === msg.id ? null : msg.id); }} style={btnStyle(fgMuted)}><Smile size={14} /></button>
                      <button onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }} style={btnStyle(fgMuted)}><CornerUpLeft size={14} /></button>
                      <button onClick={() => openForward(msg)} style={btnStyle(fgMuted)} title="Forward"><Forward size={14} /></button>
                      {isMine && (
                        <>
                          {!isMedia && <button onClick={() => { setEditingMsg(msg); setInputValue(msg.content); inputRef.current?.focus(); }} style={btnStyle(fgMuted)}><Pencil size={14} /></button>}
                          <button onClick={() => { deleteMessage(msg.id); setMessages((p) => p.filter((m) => m.id !== msg.id)); }} style={btnStyle("#ef4444")}><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>

                    {/* Emoji picker */}
                    {showEmojiFor === msg.id && (
                      <div style={{ position: "absolute", bottom: "100%", ...(isMine ? { right: 0 } : { left: 0 }), marginBottom: 4, backgroundColor: isDark ? "#1a1a1a" : "#fff", border: `1px solid ${borderSubtle}`, borderRadius: 12, padding: "6px 8px", display: "flex", flexWrap: "wrap", gap: 2, zIndex: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", maxWidth: 220 }}>
                        {EMOJI_LIST.map((e) => (
                          <button key={e} onClick={(ev) => { ev.stopPropagation(); handleReaction(msg.id, e); }} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", padding: "4px 2px", borderRadius: 6, lineHeight: 1, minWidth: 32, minHeight: 36 }}
                            onMouseEnter={(ev) => (ev.currentTarget.style.backgroundColor = bgHover)}
                            onMouseLeave={(ev) => (ev.currentTarget.style.backgroundColor = "transparent")}
                          >{e}</button>
                        ))}
                      </div>
                    )}

                    {/* Reactions */}
                    {Object.keys(emojiGroups).length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4, justifyContent: isMine ? "flex-end" : "flex-start" }}>
                        {Object.entries(emojiGroups).map(([emoji, d]) => (
                          <button key={emoji} onClick={() => handleReaction(msg.id, emoji)} style={{ display: "flex", alignItems: "center", gap: 3, padding: "2px 6px", borderRadius: 10, border: `1px solid ${d.mine ? fg : borderSubtle}`, backgroundColor: d.mine ? bgHover : "transparent", fontSize: 13, cursor: "pointer", fontFamily: "inherit", lineHeight: 1.3 }}>
                            <span>{emoji}</span>
                            {d.count > 1 && <span className="text-xs" style={{ color: fgMuted }}>{d.count}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          {/* Typing indicator */}
          {typingLabel && (
            <div className="text-xs px-3 py-1" style={{ color: fgMuted, fontStyle: "italic" }}>
              {typingLabel}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error */}
        {sendError && (
          <div className="text-xs px-4 py-2" style={{ color: "#ef4444", backgroundColor: isDark ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.06)", borderTop: `1px solid rgba(239,68,68,0.2)` }}>
            {sendError}
            <button onClick={() => setSendError(null)} style={{ marginLeft: 8, background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>✕</button>
          </div>
        )}

        {/* Reply / Edit bar */}
        {(replyTo || editingMsg) && (
          <div style={{ padding: "8px 14px", borderTop: `1px solid ${borderSubtle}`, backgroundColor: bgSubtle, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span className="text-xs font-medium" style={{ color: fgMuted }}>{editingMsg ? "Editing message" : `Replying to ${getName(replyTo!.sender_id)}`}</span>
              <p className="text-xs truncate" style={{ color: fgMuted, maxWidth: 260 }}>{editingMsg?.content || (replyTo?.image_url ? "📎 Media" : replyTo?.content)}</p>
            </div>
            <button onClick={() => { setReplyTo(null); setEditingMsg(null); setInputValue(""); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, lineHeight: 0, color: fgMuted, flexShrink: 0 }}><X size={14} /></button>
          </div>
        )}

        {/* Pending media */}
        {pendingMedia && (
          <div style={{ padding: "8px 14px", borderTop: `1px solid ${borderSubtle}`, backgroundColor: bgSubtle, display: "flex", alignItems: "center", gap: 10 }}>
            {pendingMedia.type === "image"
              ? <img src={pendingMedia.url} alt="" style={{ height: 52, width: 52, objectFit: "cover", borderRadius: 8 }} />
              : <div style={{ height: 52, width: 52, borderRadius: 8, backgroundColor: bgHover, display: "flex", alignItems: "center", justifyContent: "center" }}><Play size={16} style={{ color: fgMuted }} /></div>
            }
            <span className="text-xs flex-1" style={{ color: fgMuted }}>{pendingMedia.type === "video" ? "Video ready" : "Image ready"}</span>
            <button onClick={() => setPendingMedia(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, lineHeight: 0, color: fgMuted }}><X size={14} /></button>
          </div>
        )}

        {/* Input bar */}
        <div className="s165-input-bar">
          <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handleFileSelect} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFile}
            style={{ background: "none", border: "none", cursor: uploadingFile ? "default" : "pointer", padding: 8, lineHeight: 0, color: fgMuted, opacity: uploadingFile ? 0.3 : 0.6, flexShrink: 0, minWidth: 40, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Paperclip size={18} strokeWidth={1.5} />
          </button>
          <input
            ref={inputRef}
            type="text"
            className="tool-input"
            style={{ flex: 1, fontSize: 14, padding: "10px 14px", borderRadius: 20 }}
            placeholder={pendingMedia ? "Add a caption…" : "Message…"}
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); broadcastTyping(); }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
              if (e.key === "Escape") { setReplyTo(null); setEditingMsg(null); setInputValue(""); setPendingMedia(null); }
            }}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() && !pendingMedia}
            style={{ background: "none", border: "none", cursor: inputValue.trim() || pendingMedia ? "pointer" : "default", padding: 8, lineHeight: 0, color: inputValue.trim() || pendingMedia ? fg : fgMuted, opacity: inputValue.trim() || pendingMedia ? 1 : 0.4, transition: "opacity 0.15s", minWidth: 40, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            <Send size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Group info panel */}
      {showGroupPanel && isGroup && (
        <div style={{ width: 210, borderLeft: `1px solid ${borderSubtle}`, display: "flex", flexDirection: "column", flexShrink: 0, backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.5)" }} className="hidden sm:flex">
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${borderSubtle}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className="text-sm font-medium">Members</span>
            <button onClick={onToggleGroupPanel} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, lineHeight: 0, color: fgMuted }}><X size={14} /></button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
            {participants.map((p) => (
              <button key={p.id} onClick={() => onOpenProfile(p)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = bgHover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                {p.avatar_url
                  ? <img src={p.avatar_url} alt="" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  : <div style={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: bgSubtle, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><User size={13} strokeWidth={1} style={{ color: fgMuted }} /></div>
                }
                <div style={{ minWidth: 0 }}>
                  <p className="text-sm truncate" style={{ color: p.id === user?.id ? fgMuted : fg }}>{p.display_name || p.username || "User"}{p.id === user?.id ? " (you)" : ""}</p>
                  {p.username && <p className="text-xs" style={{ color: fgMuted }}>@{p.username}</p>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70, cursor: "zoom-out" }} onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="" style={{ maxWidth: "95vw", maxHeight: "95vh", objectFit: "contain", borderRadius: 8 }} />
          <button onClick={() => setLightboxUrl(null)} style={{ position: "fixed", top: 16, right: 16, background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", padding: 8, borderRadius: 8, lineHeight: 0, color: "#fff" }}><X size={20} /></button>
        </div>
      )}

      {/* Forward modal */}
      {forwardingMsg && (
        <div className="s165-modal-backdrop" style={{ zIndex: 60 }} onClick={() => setForwardingMsg(null)}>
          <div onClick={(e) => e.stopPropagation()} className="s165-modal" style={{ maxWidth: 360 }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${borderSubtle}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 className="text-sm font-medium" style={{ color: fg }}>Forward to…</h3>
              <button onClick={() => setForwardingMsg(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, lineHeight: 0, color: fgMuted }}><X size={16} /></button>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {forwardConvs.length === 0
                ? <p className="text-sm p-4" style={{ color: fgMuted }}>No conversations found.</p>
                : forwardConvs.map((c) => {
                    const name = c.conversation.is_group ? (c.conversation.group_name || "Group") : (c.otherUser.display_name || c.otherUser.username || "User");
                    return (
                      <button
                        key={c.conversation.id}
                        onClick={() => handleForward(c.conversation.id)}
                        disabled={forwarding}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "10px 18px", background: "transparent", border: "none", cursor: forwarding ? "default" : "pointer", textAlign: "left", fontFamily: "inherit", opacity: forwarding ? 0.5 : 1 }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = bgHover)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        {c.conversation.is_group
                          ? <div style={{ width: 34, height: 34, borderRadius: "50%", backgroundColor: bgSubtle, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>👥</div>
                          : c.otherUser.avatar_url
                            ? <img src={c.otherUser.avatar_url} alt="" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                            : <div style={{ width: 34, height: 34, borderRadius: "50%", backgroundColor: bgSubtle, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><User size={15} strokeWidth={1} style={{ color: fgMuted }} /></div>
                        }
                        <p className="text-sm" style={{ color: fg }}>{name}</p>
                      </button>
                    );
                  })
              }
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
