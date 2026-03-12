"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, MessageCircle, TreePine, Gamepad2, Coins } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { getMyBalance } from "@/lib/currency";
import { getConversations, getWhitelistedUsers } from "@/lib/chat";

const FEATURES = [
  { href: "/165/chat",        label: "Group Chat",  desc: "The 165 family group chat", icon: MessageSquare, color: "#3b82f6" },
  { href: "/165/dms",         label: "Messages",    desc: "Private conversations",     icon: MessageCircle, color: "#8b5cf6" },
  { href: "/165/family-tree", label: "Family Tree", desc: "See who belongs to who",    icon: TreePine,      color: "#22c55e" },
  { href: "/165/game",        label: "Games",       desc: "Coin flip, dice & bets",    icon: Gamepad2,      color: "#f59e0b" },
  { href: "/165/currency",    label: "Wallet",      desc: "Leaderboard & transfers",   icon: Coins,         color: "#ef4444" },
];

export default function Hub165() {
  const { fg, fgMuted, isDark } = useTheme();
  const { profile } = useAuth();

  const [balance, setBalance] = useState<number | null>(null);
  const [unread, setUnread] = useState<number | null>(null);
  const [memberCount, setMemberCount] = useState<number | null>(null);

  useEffect(() => {
    getMyBalance().then(setBalance).catch(() => {});
    getConversations().then((convs) => {
      setUnread(convs.reduce((sum, c) => sum + c.unreadCount, 0));
    }).catch(() => {});
    getWhitelistedUsers().then((users) => setMemberCount(users.length)).catch(() => {});
  }, []);

  const borderSubtle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)";
  const cardBgHover = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)";
  const statBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)";

  return (
    <div style={{ padding: "28px 24px", maxWidth: 760, margin: "0 auto", width: "100%" }}>
      {/* Welcome */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: fg }}>
          Welcome back{profile?.display_name ? `, ${profile.display_name}` : ""} ✨
        </h2>
        <p className="text-sm mt-1" style={{ color: fgMuted }}>Your private space</p>
      </div>

      {/* Quick stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 28 }}>
        {[
          { label: "Balance", value: balance !== null ? balance.toLocaleString() : "…", icon: "💰" },
          { label: "Unread", value: unread !== null ? String(unread) : "…", icon: "✉️" },
          { label: "Members", value: memberCount !== null ? String(memberCount) : "…", icon: "👥" },
        ].map((s) => (
          <div key={s.label} style={{ padding: "16px 14px", borderRadius: 12, backgroundColor: statBg, border: `1px solid ${borderSubtle}`, textAlign: "center" }}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>{s.icon}</span>
            <p style={{ fontSize: 18, fontWeight: 600, color: fg, marginTop: 4 }}>{s.value}</p>
            <p className="text-xs" style={{ color: fgMuted }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Feature grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <Link
              key={f.href}
              href={f.href}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: "20px",
                border: `1px solid ${borderSubtle}`,
                borderRadius: 14,
                textDecoration: "none",
                backgroundColor: cardBg,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = cardBgHover;
                e.currentTarget.style.borderColor = f.color + "40";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = cardBg;
                e.currentTarget.style.borderColor = borderSubtle;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: f.color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={20} strokeWidth={1.5} style={{ color: f.color }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: fg }}>{f.label}</p>
                <p className="text-xs mt-0.5" style={{ color: fgMuted }}>{f.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
