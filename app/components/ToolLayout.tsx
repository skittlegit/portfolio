"use client";

import { ArrowLeft, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { useTheme } from "../context/ThemeContext";

export default function ToolLayout({
  title,
  description,
  backHref = "/tools",
  backLabel = "Tools",
  hideBack = false,
  children,
}: {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  hideBack?: boolean;
  children: React.ReactNode;
}) {
  const { isDark, toggle } = useTheme();

  return (
    <div
      className="tools-layout relative flex flex-col"
      style={{
        color: "var(--fg)",
        background: "var(--bg)",
        minHeight: "100dvh",
        overflowX: "clip",
        position: "relative",
        zIndex: 2,
      }}
    >
      {/* Ambient background gradient (matching home) */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: isDark
            ? "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(167,139,250,0.06) 0%, transparent 70%)"
            : "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.04) 0%, transparent 70%)",
        }}
      />

      {/* Noise texture overlay (matching home) */}
      <div
        className="pointer-events-none fixed inset-0 z-[60] opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
      />

      {/* Header */}
      <header className="relative z-[100] flex items-center justify-between px-6 sm:px-10 md:px-16 pt-7 pb-4">
        {hideBack ? (
          <div />
        ) : (
          <Link
            href={backHref}
            data-cursor-hover
            className="flex items-center gap-2 mono text-xs tracking-wider uppercase"
            style={{
              color: "var(--fg-muted)",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--accent)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--fg-muted)")
            }
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
            {backLabel}
          </Link>
        )}
        <button
          onClick={toggle}
          data-cursor-hover
          aria-label="Toggle dark mode"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--fg-muted)",
            padding: "12px",
            lineHeight: 0,
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--accent)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--fg-muted)")
          }
        >
          {isDark ? (
            <Sun size={18} strokeWidth={1.5} />
          ) : (
            <Moon size={18} strokeWidth={1.5} />
          )}
        </button>
      </header>

      {/* Page title */}
      <div className="relative z-10 px-6 sm:px-10 md:px-16 pt-4 pb-10">
        <h1 className="heading text-3xl sm:text-4xl md:text-5xl tracking-tight">
          {title}
          <span style={{ color: "var(--accent)" }}>.</span>
        </h1>
        {description && (
          <p
            className="mono mt-3 text-sm sm:text-base leading-relaxed max-w-lg"
            style={{ color: "var(--fg-muted)" }}
          >
            {description}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 px-6 sm:px-10 md:px-16 pb-16">
        {children}
      </div>

      {/* Footer */}
      <footer className="relative z-10 px-6 sm:px-10 md:px-16 py-8" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <span className="mono text-xs" style={{ color: "var(--fg-muted)" }}>
            &copy; {new Date().getFullYear()} Deepak
          </span>
          <Link
            href="/"
            data-cursor-hover
            className="mono text-xs"
            style={{ color: "var(--fg-muted)", textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-muted)")}
          >
            bydeepak.com
          </Link>
        </div>
      </footer>
    </div>
  );
}
