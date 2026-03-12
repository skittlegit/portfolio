"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, User, X, ArrowLeft } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import {
  getConversations,
  getOrCreateConversation,
  getWhitelistedUsers,
  type ConversationWithParticipant,
} from "@/lib/chat";
import ChatArea, { type Participant } from "../components/ChatArea";

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
  const [showGroupPanel, setShowGroupPanel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConvs = useCallback(async () => {
    try {
      const all = await getConversations();
      setConversations(all.filter((c) => !c.conversation.is_group));
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

  return (
    <div style={{ display: "flex", height: "calc(100dvh - 230px)", border: `1px solid ${borderSubtle}`, borderRadius: 12, overflow: "hidden", position: "relative" }}>

      {/* Sidebar */}
      <div
        style={{ width: 280, borderRight: `1px solid ${borderSubtle}`, display: "flex", flexDirection: "column", flexShrink: 0 }}
        className={mobileShowChat ? "hidden md:flex" : "flex"}
      >
        <div style={{ padding: "14px 14px 10px", borderBottom: `1px solid ${borderSubtle}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 className="text-sm font-medium">Messages</h2>
          <button onClick={() => { setShowNewChat(true); loadUsers(); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, lineHeight: 0, color: fgMuted }} title="New DM">
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
              const lastContent = c.lastMessage?.image_url && !c.lastMessage.content.trim() ? "📎 Media" : c.lastMessage?.content || "No messages yet";
              return (
                <button
                  key={c.conversation.id}
                  onClick={() => { setActiveConvId(c.conversation.id); setMobileShowChat(true); setShowGroupPanel(false); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: activeConvId === c.conversation.id ? bgHover : "transparent", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit", borderBottom: `1px solid ${borderSubtle}` }}
                >
                  {other.avatar_url
                    ? <img src={other.avatar_url} alt="" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                    : <div style={{ width: 38, height: 38, borderRadius: "50%", backgroundColor: bgSubtle, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><User size={16} strokeWidth={1} style={{ color: fgMuted }} /></div>
                  }
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
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }} className={!mobileShowChat ? "hidden md:flex" : "flex"}>
        {!activeConvId ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p className="text-sm" style={{ color: fgMuted }}>Select a conversation or start a new one</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={{ padding: "10px 14px", borderBottom: `1px solid ${borderSubtle}`, display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setMobileShowChat(false)} className="md:hidden" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, lineHeight: 0, color: fgMuted }}>
                <ArrowLeft size={18} />
              </button>
              <button
                onClick={() => activeConv && setViewingProfile(activeConv.otherUser)}
                style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, background: "none", border: "none", cursor: "pointer", padding: "3px 6px", borderRadius: 8, fontFamily: "inherit", textAlign: "left", minWidth: 0 }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = bgHover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                {activeConv?.otherUser.avatar_url
                  ? <img src={activeConv.otherUser.avatar_url} alt="" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  : <div style={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: bgSubtle, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><User size={13} strokeWidth={1} style={{ color: fgMuted }} /></div>
                }
                <div style={{ minWidth: 0 }}>
                  <p className="text-sm font-medium truncate" style={{ color: fg, lineHeight: 1.2 }}>{activeConv?.otherUser.display_name || activeConv?.otherUser.username || "User"}</p>
                  {activeConv?.otherUser.username && <p className="text-xs" style={{ color: fgMuted, lineHeight: 1.2 }}>@{activeConv.otherUser.username}</p>}
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
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={() => setShowNewChat(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: isDark ? "#111" : "#fff", borderRadius: 16, width: "90%", maxWidth: 380, maxHeight: "65vh", display: "flex", flexDirection: "column", border: `1px solid ${borderSubtle}` }}>
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
      {viewingProfile && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }} onClick={() => setViewingProfile(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: isDark ? "#111" : "#fff", borderRadius: 20, width: "90%", maxWidth: 300, border: `1px solid ${borderSubtle}`, overflow: "hidden" }}>
            <div style={{ textAlign: "center", padding: "28px 24px 20px", borderBottom: `1px solid ${borderSubtle}`, position: "relative" }}>
              <button onClick={() => setViewingProfile(null)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", cursor: "pointer", padding: 6, lineHeight: 0, color: fgMuted }}><X size={16} /></button>
              {viewingProfile.avatar_url
                ? <img src={viewingProfile.avatar_url} alt="" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", margin: "0 auto 12px", display: "block" }} />
                : <div style={{ width: 72, height: 72, borderRadius: "50%", backgroundColor: bgSubtle, margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>👤</div>
              }
              <h3 className="text-base font-medium" style={{ color: fg }}>{viewingProfile.display_name || viewingProfile.username || "User"}</h3>
              {viewingProfile.username && <p className="text-sm" style={{ color: fgMuted, marginTop: 2 }}>@{viewingProfile.username}</p>}
            </div>
            <div style={{ padding: "14px 20px" }}>
              <button onClick={() => setViewingProfile(null)} className="text-sm" style={{ width: "100%", padding: "8px 14px", borderRadius: 10, border: `1px solid ${borderSubtle}`, backgroundColor: "transparent", color: fgMuted, cursor: "pointer", fontFamily: "inherit" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
