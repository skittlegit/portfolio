"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, X, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { isWhitelisted } from "@/lib/whitelist";

export default function NavMenu() {
  const { isDark, toggle, fg, fgMuted } = useTheme();
  const { user, profile, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const whitelisted = !loading && user && isWhitelisted(user.email, profile?.username);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";

  const itemStyle: React.CSSProperties = {
    display: "block",
    padding: "11px 0",
    fontSize: 12,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: fgMuted,
    textDecoration: "none",
    fontFamily: "var(--font-playfair), Georgia, serif",
    transition: "color 0.15s",
    borderBottom: `1px solid ${border}`,
    cursor: "pointer",
    background: "none",
    width: "100%",
    textAlign: "left",
    border: "none",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: border,
  };

  const lastItemStyle: React.CSSProperties = {
    ...itemStyle,
    borderBottom: "none",
    paddingBottom: 4,
  };

  return (
    <div
      ref={menuRef}
      style={{ position: "relative", display: "flex", alignItems: "center", gap: 0 }}
    >
      {/* Dark mode toggle */}
      <button
        onClick={toggle}
        aria-label="Toggle dark mode"
        style={{
          background: "transparent",
          border: "none",
          color: fg,
          padding: "12px",
          lineHeight: 0,
          transition: "color 0.3s",
          cursor: "pointer",
        }}
      >
        {isDark ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
      </button>

      {/* Hamburger / close */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        style={{
          background: "transparent",
          border: "none",
          color: fg,
          padding: "12px",
          lineHeight: 0,
          transition: "color 0.3s",
          cursor: "pointer",
        }}
      >
        {open ? (
          <X size={18} strokeWidth={1.5} />
        ) : (
          <Menu size={18} strokeWidth={1.5} />
        )}
      </button>

      {/* Dropdown panel */}
      <div
        style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          right: 0,
          minWidth: 170,
          backgroundColor: isDark ? "#0a0a0a" : "#ffffff",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
          borderRadius: 12,
          padding: "8px 20px 12px",
          boxShadow: isDark
            ? "0 12px 40px rgba(0,0,0,0.7)"
            : "0 12px 40px rgba(0,0,0,0.12)",
          zIndex: 300,
          transformOrigin: "top right",
          transform: open ? "scale(1)" : "scale(0.95)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.15s ease, transform 0.15s ease",
        }}
      >
        <Link
          href="/"
          style={itemStyle}
          onClick={() => setOpen(false)}
          onMouseEnter={(e) => (e.currentTarget.style.color = fg)}
          onMouseLeave={(e) => (e.currentTarget.style.color = fgMuted)}
        >
          Home
        </Link>
        <Link
          href="/tools"
          style={itemStyle}
          onClick={() => setOpen(false)}
          onMouseEnter={(e) => (e.currentTarget.style.color = fg)}
          onMouseLeave={(e) => (e.currentTarget.style.color = fgMuted)}
        >
          Tools
        </Link>

        {!loading && user && (
          <>
            <Link
              href="/saved"
              style={itemStyle}
              onClick={() => setOpen(false)}
              onMouseEnter={(e) => (e.currentTarget.style.color = fg)}
              onMouseLeave={(e) => (e.currentTarget.style.color = fgMuted)}
            >
              Saved
            </Link>
            <Link
              href="/profile"
              style={itemStyle}
              onClick={() => setOpen(false)}
              onMouseEnter={(e) => (e.currentTarget.style.color = fg)}
              onMouseLeave={(e) => (e.currentTarget.style.color = fgMuted)}
            >
              Profile
            </Link>
            {whitelisted && (
              <Link
                href="/165"
                style={itemStyle}
                onClick={() => setOpen(false)}
                onMouseEnter={(e) => (e.currentTarget.style.color = fg)}
                onMouseLeave={(e) => (e.currentTarget.style.color = fgMuted)}
              >
                165
              </Link>
            )}
          </>
        )}

        {!loading && (
          user ? (
            <button
              onClick={() => { signOut(); setOpen(false); }}
              style={lastItemStyle}
              onMouseEnter={(e) => (e.currentTarget.style.color = fg)}
              onMouseLeave={(e) => (e.currentTarget.style.color = fgMuted)}
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              style={lastItemStyle}
              onClick={() => setOpen(false)}
              onMouseEnter={(e) => (e.currentTarget.style.color = fg)}
              onMouseLeave={(e) => (e.currentTarget.style.color = fgMuted)}
            >
              Login
            </Link>
          )
        )}
      </div>
    </div>
  );
}
