"use client";

import { useEffect, useState, useCallback } from "react";
import { Users } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import {
  getOrCreateGroupChat,
  getConversationParticipants,
  getOrCreateConversation,
  getWhitelistedUsers,
  syncGroupMembers,
  getUserPresence,
} from "@/lib/chat";
import ChatArea, { type Participant } from "../components/ChatArea";
import ProfileModal from "../components/ProfileModal";

const GROUP_NAME = "165 Group";

export default function GroupChatPage() {
  const { fg, fgMuted, isDark } = useTheme();
  const { user } = useAuth();
  const borderSubtle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";


  const [convId, setConvId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGroupPanel, setShowGroupPanel] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<Participant | null>(null);
  const [presence, setPresence] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const loadGroup = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const users = await getWhitelistedUsers();
      const otherIds = users.filter((u) => u.id !== user?.id).map((u) => u.id);
      const id = await getOrCreateGroupChat(GROUP_NAME, otherIds);
      setConvId(id);

      // Sync: add any new whitelisted users to the group
      await syncGroupMembers(id);

      const members = await getConversationParticipants(id);
      setParticipants(members);

      // Load presence
      const pIds = members.map((p) => p.id);
      if (pIds.length) {
        const pres = await getUserPresence(pIds);
        setPresence(pres);
      } else {
        setPresence({});
      }
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
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${borderSubtle}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }} className="s165-chat-header">
        <div className="s165-avatar-placeholder" style={{ width: 32, height: 32, fontSize: 16, flexShrink: 0 }}>
          👥
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="text-sm font-medium" style={{ color: fg }}>{GROUP_NAME}</p>
          <p className="text-xs" style={{ color: fgMuted }}>{participants.length} members</p>
        </div>
        <button
          onClick={() => setShowGroupPanel((v) => !v)}
          className="s165-btn-ghost"
          style={{ padding: 6, lineHeight: 0, color: showGroupPanel ? fg : fgMuted, minWidth: 36, minHeight: 36, display: "flex", alignItems: "center", justifyContent: "center" }}
          title="Group members"
        >
          <Users size={16} strokeWidth={1.5} />
        </button>
      </div>

      {/* Chat */}
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <ChatArea
          convId={convId}
          isGroup={true}
          participants={participants}
          showGroupPanel={showGroupPanel}
          onToggleGroupPanel={() => setShowGroupPanel((v) => !v)}
          onOpenProfile={setViewingProfile}
          heightOffset={0}
        />
      </div>

      {/* Profile modal */}
      <ProfileModal
        user={viewingProfile}
        myId={user?.id}
        onClose={() => setViewingProfile(null)}
        onMessage={viewingProfile && viewingProfile.id !== user?.id ? async () => {
          setViewingProfile(null);
          await getOrCreateConversation(viewingProfile.id);
          window.location.href = "/165/dms";
        } : undefined}
        presence={presence}
        fg={fg}
        fgMuted={fgMuted}
        isDark={isDark}
      />
    </div>
  );
}
