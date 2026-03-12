/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, User, X, ArrowLeft } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import {
  getConversations,
  getOrCreateConversation,
  getWhitelistedUsers,
  getUserPresence,
  type ConversationWithParticipant,
} from "@/lib/chat";
import ChatArea, { type Participant } from "../components/ChatArea";
import ProfileModal from "../components/ProfileModal";

type ChatUser = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

export default function DmsPage() {
  const { fg, fgMuted, isDark } = useTheme();
  const { user } = useAuth();

  const borderSubtle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const bgSubtle = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const bgHover = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  const [conversations, setConversations] = useState<ConversationWithParticipant[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [allUsers, setAllUsers] = useState<ChatUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [viewingProfile, setViewingProfile] = useState<Participant | null>(null);
  const [presence, setPresence] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const loadConvs = useCallback(async () => {
    try {
      const all = await getConversations();
      const dmConvs = all.filter((c) => !c.conversation.is_group);
      setConversations(dmConvs);

      const userIds = dmConvs.map((c) => c.otherUser.id).filter(Boolean);
      if (userIds.length) {
        const pres = await getUserPresence(userIds);
        setPresence(pres);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, []);

  useEffect(() => { loadConvs(); }, [loadConvs]);

  const activeConv = conversations.find((c) => c.conversation.id === activeConvId);

  const startNewChat = async (otherId: string) => {
    try {
      const id = await getOrCreateConversation(otherId);
      await loadConvs();
      setActiveConvId(id);
      setMobileShowChat(true);
      setShowNewChat(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start conversation");
    }
  };

  const loadUsers = async () => {
    const users = await getWhitelistedUsers();
    setAllUsers(users.filter((u) => u.id !== user?.id));
  };

  const filteredUsers = allUsers.filter((u) => {
    const q = userSearch.toLowerCase();
    return (u.username?.toLowerCase().includes(q) ?? false) || (u.display_name?.toLowerCase().includes(q) ?? false);
  });

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    if (diff === 1) return "Yesterday";
    if (diff < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const isUserOnline = (uid: string) => {
    const ls = presence[uid];
    return ls ? Date.now() - new Date(ls).getTime() < 2 * 60 * 1000 : false;
  };

  return (
    <div style={{ display: "flex", height: "calc(100dvh - 230px)", border: `1px solid ${borderSubtle}`, borderRadius: 12, overflow: "hidden", position: "relative" }}>

      {/* Sidebar */}
      <div
        style={{ width: 280, maxWidth: "100%", borderRight: `1px solid ${borderSubtle}`, display: "flex", flexDirection: "column", flexShrink: 0 }}
        className={mobileShowChat ? "hidden sm:flex" : "flex"}
      >
        <div style={{ padding: "14px 14px 10px", borderBottom: `1px solid ${borderSubtle}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 className="text-sm font-medium">Messages</h2>
          <button onClick={() => { setShowNewChat(true); loadUsers(); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, lineHeight: 0, color: fgMuted, minWidth: 32, minHeight: 32, display: "flex", alignItems: "center", justifyContent: "center" }} title="New DM">
            <Plus size={17} strokeWidth={1.5} />
          </button>
        </div>
        {error && (
          <div className="text-xs p-3" style={{ color: "#ef4444", borderBottom: `1px solid rgba(239,68,68,0.2)` }}>{error}</div>
        )}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {conversations.length === 0 ? (
            <p className="text-sm p-4" style={{ color: fgMuted }}>No direct messages yet.</p>
          ) : (
            conversations.map((c) => {
              const other = c.otherUser;
              const online = isUserOnline(other.id);
              const lastContent = c.lastMessage?.image_url && !c.lastMessage.content.trim() ? "📎 Media" : c.lastMessage?.content || "No messages yet";
              return (
                <button
                  key={c.conversation.id}
                  onClick={() => { setActiveConvId(c.conversation.id); setMobileShowChat(true); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: activeConvId === c.conversation.id ? bgHover : "transparent", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit", borderBottom: `1px solid ${borderSubtle}` }}
                >
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    {other.avatar_url
                      ? <img src={other.avatar_url} alt="" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover" }} />
                      : <div style={{ width: 38, height: 38, borderRadius: "50%", backgroundColor: bgSubtle, display: "flex", alignItems: "center", justifyContent: "center" }}><User size={16} strokeWidth={1} style={{ color: fgMuted }} /></div>
                    }
                    {online && (
                      <div style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", backgroundColor: "#22c55e", border: `2px solid ${isDark ? "#111" : "#fff"}` }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm truncate" style={{ fontWeight: c.unreadCount > 0 ? 600 : 400, color: fg, maxWidth: 130 }}>{other.display_name || other.username || "User"}</span>
                      {c.lastMessage && <span className="text-xs" style={{ color: fgMuted, flexShrink: 0 }}>{formatTime(c.lastMessage.created_at)}</span>}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs truncate" style={{ color: fgMuted, maxWidth: 150, fontWeight: c.unreadCount > 0 ? 500 : 400 }}>{lastContent}</p>
                      {c.unreadCount > 0 && (
                        <span style={{ backgroundColor: fg, color: isDark ? "#000" : "#fff", fontSize: 10, fontWeight: 600, borderRadius: 10, padding: "1px 5px", minWidth: 16, textAlign: "center", flexShrink: 0 }}>{c.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat pane */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }} className={!mobileShowChat ? "hidden sm:flex" : "flex"}>
        {!activeConvId ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p className="text-sm" style={{ color: fgMuted }}>Select a conversation or start a new one</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={{ padding: "10px 14px", borderBottom: `1px solid ${borderSubtle}`, display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setMobileShowChat(false)} className="sm:hidden" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, lineHeight: 0, color: fgMuted, minWidth: 32, minHeight: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ArrowLeft size={18} />
              </button>
              <button
                onClick={() => activeConv && setViewingProfile(activeConv.otherUser)}
                style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, background: "none", border: "none", cursor: "pointer", padding: "3px 6px", borderRadius: 8, fontFamily: "inherit", textAlign: "left", minWidth: 0 }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = bgHover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <div style={{ position: "relative", flexShrink: 0 }}>
                  {activeConv?.otherUser.avatar_url
                    ? <img src={activeConv.otherUser.avatar_url} alt="" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover" }} />
                    : <div style={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: bgSubtle, display: "flex", alignItems: "center", justifyContent: "center" }}><User size={13} strokeWidth={1} style={{ color: fgMuted }} /></div>
                  }
                  {activeConv && isUserOnline(activeConv.otherUser.id) && (
                    <div style={{ position: "absolute", bottom: -1, right: -1, width: 9, height: 9, borderRadius: "50%", backgroundColor: "#22c55e", border: `2px solid ${isDark ? "#111" : "#fff"}` }} />
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p className="text-sm font-medium truncate" style={{ color: fg, lineHeight: 1.2 }}>{activeConv?.otherUser.display_name || activeConv?.otherUser.username || "User"}</p>
                  <p className="text-xs" style={{ color: fgMuted, lineHeight: 1.2 }}>
                    {activeConv && isUserOnline(activeConv.otherUser.id) ? "Online" : activeConv?.otherUser.username ? `@${activeConv.otherUser.username}` : ""}
                  </p>
                </div>
              </button>
            </div>
            <ChatArea
              convId={activeConvId}
              isGroup={false}
              participants={activeConv?.participants || []}
              showGroupPanel={false}
              onToggleGroupPanel={() => {}}
              onOpenProfile={setViewingProfile}
              heightOffset={290}
            />
          </>
        )}
      </div>

      {/* New DM modal */}
      {showNewChat && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }} onClick={() => setShowNewChat(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: isDark ? "#111" : "#fff", borderRadius: 16, width: "100%", maxWidth: 380, maxHeight: "65vh", display: "flex", flexDirection: "column", border: `1px solid ${borderSubtle}` }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${borderSubtle}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 className="text-sm font-medium">New Message</h3>
              <button onClick={() => setShowNewChat(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, lineHeight: 0, color: fgMuted }}><X size={16} /></button>
            </div>
            <div style={{ padding: "10px 18px", borderBottom: `1px solid ${borderSubtle}` }}>
              <div style={{ position: "relative" }}>
                <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: fgMuted }} />
                <input type="text" className="tool-input" style={{ width: "100%", paddingLeft: 32, fontSize: 13 }} placeholder="Search…" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} autoFocus />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {filteredUsers.length === 0
                ? <p className="text-sm p-4" style={{ color: fgMuted }}>{allUsers.length === 0 ? "Loading…" : "No users found."}</p>
                : filteredUsers.map((u) => (
                  <button key={u.id} onClick={() => startNewChat(u.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "10px 18px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = bgHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {u.avatar_url
                      ? <img src={u.avatar_url} alt="" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }} />
                      : <div style={{ width: 34, height: 34, borderRadius: "50%", backgroundColor: bgSubtle, display: "flex", alignItems: "center", justifyContent: "center" }}><User size={15} strokeWidth={1} style={{ color: fgMuted }} /></div>
                    }
                    <div>
                      <p className="text-sm" style={{ color: fg }}>{u.display_name || u.username || "User"}</p>
                      {u.username && <p className="text-xs" style={{ color: fgMuted }}>@{u.username}</p>}
                    </div>
                  </button>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* Profile modal */}
      <ProfileModal
        user={viewingProfile}
        myId={user?.id}
        onClose={() => setViewingProfile(null)}
        presence={presence}
        fg={fg}
        fgMuted={fgMuted}
        isDark={isDark}
      />
    </div>
  );
}
