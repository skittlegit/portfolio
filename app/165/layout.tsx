"use client";

import { useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { MessageSquare, MessageCircle, TreePine, Gamepad2, Coins } from "lucide-react";
import ToolLayout from "../components/ToolLayout";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { isWhitelisted } from "@/lib/whitelist";
import { updatePresence } from "@/lib/chat";

const NAV = [
  { href: "/165", label: "Home", exact: true },
  { href: "/165/chat", label: "Group Chat", icon: MessageSquare },
  { href: "/165/dms", label: "Messages", icon: MessageCircle },
  { href: "/165/family-tree", label: "Family Tree", icon: TreePine },
  { href: "/165/game", label: "Game", icon: Gamepad2 },
  { href: "/165/currency", label: "Currency", icon: Coins },
];

export default function Layout165({ children }: { children: React.ReactNode }) {
  const { fg, fgMuted, isDark } = useTheme();
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const authorized = useMemo(() => {
    if (loading || !user) return false;
    return isWhitelisted(user.email, profile?.username);
  }, [loading, user, profile]);

  // Redirect if not authorized
  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login?next=/165"); return; }
    if (!isWhitelisted(user.email, profile?.username)) {
      router.replace("/");
    }
  }, [loading, user, profile, router]);

  // Update presence every 30s
  useEffect(() => {
    if (!authorized) return;
    updatePresence();
    const interval = setInterval(() => updatePresence(), 30000);
    return () => clearInterval(interval);
  }, [authorized]);

  const borderSubtle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  if (loading || !authorized) {
    return (
      <ToolLayout title="165" description="" hideBack>
        <p className="text-sm" style={{ color: fgMuted }}>Loading…</p>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout title="165" description="" hideBack>
      <nav
        style={{
          display: "flex",
          gap: 2,
          marginBottom: 16,
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          borderBottom: `1px solid ${borderSubtle}`,
          paddingBottom: 10,
        }}
      >
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: "5px 12px",
                borderRadius: 8,
                fontSize: 13,
                textDecoration: "none",
                color: active ? fg : fgMuted,
                backgroundColor: active
                  ? isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"
                  : "transparent",
                fontWeight: active ? 500 : 400,
                transition: "all 0.15s",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </ToolLayout>
  );
}
