"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import {
  getOrCreateGroupChat,
  getConversations,
  getOrCreateConversation,
  getWhitelistedUsers,
  type ConversationWithParticipant,
} from "@/lib/chat";
import ChatArea, { type Participant } from "../components/ChatArea";

const GROUP_NAME = "165 Group";

export default function GroupChatPage() {
  const { fg, fgMuted, isDark } = useTheme();
  const { user } = useAuth();
  const borderSubtle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const bgSubtle = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const bgHover = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  const [convId, setConvId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGroupPanel, setShowGroupPanel] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<Participant | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadGroup = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const users = await getWhitelistedUsers();
      const otherIds = users.filter((u) => u.id !== user?.id).map((u) => u.id);
      const id = await getOrCreateGroupChat(GROUP_NAME, otherIds);
      setConvId(id);
      // Get participants from conversations
      const convs = await getConversations();
      const conv = convs.find((c) => c.conversation.id === id);
      if (conv) setParticipants(conv.participants);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load group chat");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadGroup(); }, [loadGroup]);

  if (loading) {
    return <p className="text-sm" style={{ color: fgMuted }}>Loading group chat…</p>;
  }
  if (error) {
    return (
      <div className="text-sm" style={{ color: "#ef4444" }}>
        {error}{" "}
        <button onClick={loadGroup} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", textDecoration: "underline", fontFamily: "inherit", fontSize: "inherit" }}>
          Retry
        </button>
      </div>
    );
  }
  if (!convId) return null;

  return (
    <div style={{ border: `1px solid ${borderSubtle}`, borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "10px 16px", borderBottom: `1px solid ${borderSubtle}`, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: bgSubtle, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
          👥
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="text-sm font-medium" style={{ color: fg }}>{GROUP_NAME}</p>
          <p className="text-xs" style={{ color: fgMuted }}>{participants.length} members</p>
        </div>
        <button
          onClick={() => setShowGroupPanel((v) => !v)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 6, lineHeight: 0, color: showGroupPanel ? fg : fgMuted, borderRadius: 8 }}
          title="Group members"
        >
          <Users size={16} strokeWidth={1.5} />
        </button>
      </div>

      {/* Chat */}
      <ChatArea
        convId={convId}
        isGroup={true}
        participants={participants}
        showGroupPanel={showGroupPanel}
        onToggleGroupPanel={() => setShowGroupPanel((v) => !v)}
        onOpenProfile={setViewingProfile}
        heightOffset={258}
      />

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
            <div style={{ padding: "14px 20px", display: "flex", gap: 8 }}>
              {viewingProfile.id !== user?.id && (
                <button
                  onClick={async () => {
                    setViewingProfile(null);
                    const id = await getOrCreateConversation(viewingProfile!.id);
                    window.location.href = "/165/dms";
                  }}
                  className="text-sm"
                  style={{ flex: 1, padding: "8px 14px", borderRadius: 10, border: `1px solid ${borderSubtle}`, backgroundColor: bgHover, color: fg, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
                >
                  Message
                </button>
              )}
              <button onClick={() => setViewingProfile(null)} className="text-sm" style={{ flex: 1, padding: "8px 14px", borderRadius: 10, border: `1px solid ${borderSubtle}`, backgroundColor: "transparent", color: fgMuted, cursor: "pointer", fontFamily: "inherit" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
