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
      {/* Header */}
      <header className="relative z-[100] flex items-center justify-between px-6 sm:px-10 md:px-16 pt-7 pb-4">
        {hideBack ? (
          <div />
        ) : (
          <Link
            href={backHref}
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
      <div className="relative z-10 px-6 sm:px-10 md:px-16 pt-4 pb-8">
        <h1 className="heading text-3xl sm:text-4xl md:text-5xl tracking-tight">
          {title}
        </h1>
        {description && (
          <p
            className="mono mt-3 text-sm sm:text-base tracking-wide"
            style={{ color: "var(--fg-muted)" }}
          >
            {description}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 px-6 sm:px-10 md:px-16 pb-12">
        {children}
      </div>
    </div>
  );
}
