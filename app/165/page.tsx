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

  return (
    <div style={{ padding: "28px 24px", maxWidth: 760, margin: "0 auto", width: "100%" }}>
      {/* Welcome */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, color: fg, letterSpacing: "-0.01em" }}>
          Welcome back{profile?.display_name ? `, ${profile.display_name}` : ""} ✨
        </h2>
        <p className="text-sm mt-1" style={{ color: fgMuted }}>Your private space</p>
      </div>

      {/* Quick stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
        {[
          { label: "Balance", value: balance !== null ? balance.toLocaleString() : "…", icon: "💰" },
          { label: "Unread", value: unread !== null ? String(unread) : "…", icon: "✉️" },
          { label: "Members", value: memberCount !== null ? String(memberCount) : "…", icon: "👥" },
        ].map((s) => (
          <div key={s.label} className="s165-stat-card" style={{ border: `1px solid ${borderSubtle}`, textAlign: "center" }}>
            <span style={{ fontSize: 24, lineHeight: 1 }}>{s.icon}</span>
            <p style={{ fontSize: 20, fontWeight: 600, color: fg, marginTop: 6 }}>{s.value}</p>
            <p className="text-xs" style={{ color: fgMuted, marginTop: 2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Feature grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <Link
              key={f.href}
              href={f.href}
              className="s165-feature-card"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                padding: "22px",
                border: `1px solid ${borderSubtle}`,
                textDecoration: "none",
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: f.color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={22} strokeWidth={1.5} style={{ color: f.color }} />
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
