/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home, MessageSquare, MessageCircle, TreePine, Gamepad2,
  Coins, Sun, Moon, ArrowLeft,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { isWhitelisted } from "@/lib/whitelist";
import { updatePresence } from "@/lib/chat";

const NAV = [
  { href: "/165", label: "Home", icon: Home, exact: true },
  { href: "/165/chat", label: "Group Chat", icon: MessageSquare },
  { href: "/165/dms", label: "Messages", icon: MessageCircle },
  { href: "/165/family-tree", label: "Family Tree", icon: TreePine },
  { href: "/165/game", label: "Games", icon: Gamepad2 },
  { href: "/165/currency", label: "Wallet", icon: Coins },
];

export default function Layout165({ children }: { children: React.ReactNode }) {
  const { fg, fgMuted, isDark, toggle } = useTheme();
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const authorized = useMemo(() => {
    if (loading || !user) return false;
    return isWhitelisted(user.email, profile?.username);
  }, [loading, user, profile]);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login?next=/165"); return; }
    if (!isWhitelisted(user.email, profile?.username)) {
      router.replace("/");
    }
  }, [loading, user, profile, router]);

  useEffect(() => {
    if (!authorized) return;
    updatePresence();
    const interval = setInterval(() => updatePresence(), 30000);
    return () => clearInterval(interval);
  }, [authorized]);

  if (loading || !authorized) {
    return (
      <div className="s165-shell" style={{ alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: fgMuted, fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="s165-shell">
      {/* Desktop sidebar */}
      <aside className="s165-sidebar">
        <div className="s165-sidebar-brand">
          <Link href="/165" style={{ textDecoration: "none", color: fg }}>
            <span style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em" }}>165</span>
          </Link>
        </div>

        <nav className="s165-sidebar-nav">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`s165-sidebar-link${active ? " active" : ""}`}
              >
                <Icon size={18} strokeWidth={1.5} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="s165-sidebar-footer">
          <div className="s165-sidebar-user">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="s165-avatar" style={{ width: 32, height: 32 }} />
            ) : (
              <div className="s165-avatar-placeholder" style={{ width: 32, height: 32, fontSize: 14 }}>
                {(profile?.display_name || profile?.username || "U")[0].toUpperCase()}
              </div>
            )}
            <span className="s165-sidebar-username">{profile?.display_name || profile?.username || "User"}</span>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button onClick={toggle} className="s165-theme-btn" title={isDark ? "Light mode" : "Dark mode"}>
              {isDark ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
            </button>
            <Link href="/" className="s165-theme-btn" title="Back to site">
              <ArrowLeft size={15} strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="s165-main-col">
        {/* Mobile top bar */}
        <header className="s165-topbar">
          <Link href="/165" style={{ textDecoration: "none", color: fg }}>
            <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em" }}>165</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={toggle} className="s165-theme-btn" title={isDark ? "Light mode" : "Dark mode"}>
              {isDark ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
            </button>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="s165-avatar" style={{ width: 28, height: 28 }} />
            ) : (
              <div className="s165-avatar-placeholder" style={{ width: 28, height: 28, fontSize: 11 }}>
                {(profile?.display_name || profile?.username || "U")[0].toUpperCase()}
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="s165-content s165-scroll">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="s165-bottom-nav">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`s165-bottom-link${active ? " active" : ""}`}
              >
                <Icon size={20} strokeWidth={active ? 2 : 1.5} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
