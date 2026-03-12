/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { X, UserPlus, UserMinus, MessageCircle } from "lucide-react";
import { followUser, unfollowUser, getFollowData } from "@/lib/chat";

export type Participant = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

type Props = {
  user: Participant | null;
  myId?: string;
  onClose: () => void;
  onMessage?: () => void;
  presence?: Record<string, string>;
  fg: string;
  fgMuted: string;
  isDark: boolean;
};

export default function ProfileModal({ user: viewing, myId, onClose, onMessage, presence, fg, fgMuted, isDark }: Props) {
  const borderSubtle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  const [followData, setFollowData] = useState<{ followers: number; following: number; isFollowing: boolean } | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (viewing) {
      getFollowData(viewing.id).then(setFollowData);
    }
  }, [viewing]);

  if (!viewing) return null;

  const isOnline = presence?.[viewing.id]
    ? Date.now() - new Date(presence[viewing.id]).getTime() < 2 * 60 * 1000
    : false;

  const lastSeen = presence?.[viewing.id]
    ? new Date(presence[viewing.id]).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : null;

  const handleFollowToggle = async () => {
    if (!followData || toggling) return;
    setToggling(true);
    try {
      if (followData.isFollowing) {
        await unfollowUser(viewing.id);
      } else {
        await followUser(viewing.id);
      }
      setFollowData(await getFollowData(viewing.id));
    } catch {
      // ignore
    } finally {
      setToggling(false);
    }
  };

  const isMe = viewing.id === myId;

  return (
    <div className="s165-modal-backdrop" onClick={onClose}>
      <div className="s165-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 320, width: "92vw", borderRadius: 20, overflow: "hidden" }}>
        <div style={{ textAlign: "center", padding: "28px 24px 16px", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", cursor: "pointer", padding: 6, lineHeight: 0, color: fgMuted }}><X size={16} /></button>

          <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 10px" }}>
            {viewing.avatar_url
              ? <img src={viewing.avatar_url} alt="" className="s165-avatar" style={{ width: 80, height: 80 }} />
              : <div className="s165-avatar-placeholder" style={{ width: 80, height: 80, fontSize: 28 }}>👤</div>
            }
            {!isMe && (
              <div className="s165-online-dot" style={{ width: 14, height: 14, backgroundColor: isOnline ? "#22c55e" : "#71717a" }} />
            )}
          </div>

          <h3 className="text-base font-medium" style={{ color: fg }}>{viewing.display_name || viewing.username || "User"}</h3>
          {viewing.username && <p className="text-sm" style={{ color: fgMuted, marginTop: 2 }}>@{viewing.username}</p>}
          <p className="text-xs mt-1" style={{ color: fgMuted }}>
            {isMe ? "You" : isOnline ? "Online" : lastSeen ? `Last seen ${lastSeen}` : "Offline"}
          </p>

          {followData && (
            <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 12 }}>
              <div style={{ textAlign: "center" }}>
                <p className="text-sm font-medium" style={{ color: fg }}>{followData.followers}</p>
                <p className="text-xs" style={{ color: fgMuted }}>Followers</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p className="text-sm font-medium" style={{ color: fg }}>{followData.following}</p>
                <p className="text-xs" style={{ color: fgMuted }}>Following</p>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "12px 20px 18px", display: "flex", gap: 8 }}>
          {!isMe && (
            <>
              <button
                onClick={handleFollowToggle}
                disabled={toggling || !followData}
                style={{
                  flex: 1, padding: "9px 12px", borderRadius: 10,
                  border: followData?.isFollowing ? `1px solid ${borderSubtle}` : "none",
                  backgroundColor: followData?.isFollowing ? "transparent" : fg,
                  color: followData?.isFollowing ? fgMuted : isDark ? "#000" : "#fff",
                  cursor: toggling ? "default" : "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 500,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  opacity: toggling ? 0.6 : 1,
                }}
              >
                {followData?.isFollowing ? <><UserMinus size={14} /> Unfollow</> : <><UserPlus size={14} /> Follow</>}
              </button>
              {onMessage && (
                <button
                  onClick={onMessage}
                  style={{
                    flex: 1, padding: "9px 12px", borderRadius: 10,
                    border: `1px solid ${borderSubtle}`, backgroundColor: "transparent",
                    color: fg, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 500,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  <MessageCircle size={14} /> Message
                </button>
              )}
            </>
          )}
          {isMe && (
            <button onClick={onClose} className="text-sm" style={{ flex: 1, padding: "9px 14px", borderRadius: 10, border: `1px solid ${borderSubtle}`, backgroundColor: "transparent", color: fgMuted, cursor: "pointer", fontFamily: "inherit" }}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
