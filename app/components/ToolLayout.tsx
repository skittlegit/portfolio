"use client";

import { Sun, Moon, ArrowLeft, LogOut } from "lucide-react";
import Link from "next/link";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function ToolLayout({
  title,
  description,
  backHref = "/tools",
  backLabel = "Tools",
  children,
}: {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
}) {
  const { isDark, toggle, fg, fgMuted } = useTheme();
  const { user, loading, signOut } = useAuth();

  return (
    <>
      <div
        className="tools-layout relative flex flex-col"
        style={{
          fontFamily: "var(--font-playfair), Georgia, serif",
          color: fg,
          transition: "color 0.3s",
          minHeight: "100dvh",
          overflowX: "clip",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Header */}
        <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 md:px-20 pt-7 pb-4">
          <Link
            href={backHref}
            className="flex items-center gap-2 text-sm tracking-wide"
            style={{
              color: fgMuted,
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = fg)}
            onMouseLeave={(e) => (e.currentTarget.style.color = fgMuted)}
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
            {backLabel}
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {!loading && user && (
              <Link
                href="/saved"
                className="text-sm tracking-widest uppercase"
                style={{
                  color: fgMuted,
                  textDecoration: "none",
                  transition: "color 0.2s",
                  fontFamily: "var(--font-playfair), Georgia, serif",
                  padding: "12px",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = fg; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = fgMuted; }}
              >
                Saved
              </Link>
            )}
            {!loading && (
              user ? (
                <button
                  onClick={() => signOut()}
                  aria-label="Sign out"
                  className="text-sm tracking-widest uppercase"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: fgMuted,
                    padding: "12px",
                    transition: "color 0.2s",
                    fontFamily: "var(--font-playfair), Georgia, serif",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = fg; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = fgMuted; }}
                >
                  Logout
                </button>
              ) : (
                <Link
                  href="/login"
                  className="text-sm tracking-widest uppercase"
                  style={{
                    color: fgMuted,
                    textDecoration: "none",
                    transition: "color 0.2s",
                    fontFamily: "var(--font-playfair), Georgia, serif",
                    padding: "12px",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = fg; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = fgMuted; }}
                >
                  Login
                </Link>
              )
            )}
            <button
              onClick={() => toggle()}
              aria-label="Toggle dark mode"
              style={{
                background: "transparent",
                border: "none",
                color: fg,
                padding: "12px",
                lineHeight: 0,
                transition: "color 0.3s",
              }}
            >
              {isDark ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
            </button>
          </div>
        </header>

        {/* Page title */}
        <div className="relative z-10 px-6 sm:px-10 md:px-20 pt-4 pb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight">
            {title}
          </h1>
          {description && (
            <p
              className="mt-3 text-sm sm:text-base tracking-wide"
              style={{ color: fgMuted }}
            >
              {description}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 px-6 sm:px-10 md:px-20 pb-12">
          {children}
        </div>
      </div>
    </>
  );
}
