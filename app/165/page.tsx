"use client";

import Link from "next/link";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";


const FEATURES = [
  { href: "/165/chat",        label: "Group Chat",  desc: "The 165 family group chat",      emoji: "💬" },
  { href: "/165/dms",         label: "Messages",    desc: "Private conversations",          emoji: "✉️"  },
  { href: "/165/family-tree", label: "Family Tree", desc: "See who belongs to who",         emoji: "🌳" },
  { href: "/165/game",        label: "Coin Flip",   desc: "Bet your coins, flip your fate", emoji: "🪙" },
  { href: "/165/currency",    label: "Currency",    desc: "Leaderboard and transfers",      emoji: "💰" },
];

export default function Hub165() {
  const { fg, fgMuted, isDark } = useTheme();
  const { profile } = useAuth();
  const borderSubtle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const bgHover = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)";

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 28 }}>
        <p className="text-sm" style={{ color: fgMuted }}>
          Welcome back{profile?.display_name ? `, ${profile.display_name}` : ""}. Your private space.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
        {FEATURES.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              padding: "18px 20px",
              border: `1px solid ${borderSubtle}`,
              borderRadius: 12,
              textDecoration: "none",
              backgroundColor: "transparent",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = bgHover; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent"; }}
          >
            <span style={{ fontSize: 28, lineHeight: 1 }}>{f.emoji}</span>
            <div>
              <p className="text-sm font-medium" style={{ color: fg }}>{f.label}</p>
              <p className="text-xs mt-0.5" style={{ color: fgMuted }}>{f.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
