"use client";

import { useEffect } from "react";
import { ArrowLeft, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { useTheme } from "../context/ThemeContext";

// Shared chrome for every tool page — header, editorial title block, footer.
// Tool logic lives in each page and is untouched. Background is transparent so
// the global colour mesh + grain show through. Sets a per-tool document title
// (the tool pages are client components and can't export metadata themselves).
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

  useEffect(() => {
    document.title = `${title} · Deepak Aeleni`;
  }, [title]);

  return (
    <div
      className="tools-layout relative flex flex-col"
      style={{ color: "var(--fg)", minHeight: "100dvh", position: "relative", zIndex: 2 }}
    >
      {/* sticky frosted header */}
      <header
        className="flex items-center justify-between"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          padding: "13px clamp(20px,5vw,64px)",
          borderBottom: "1px solid var(--line)",
          background: isDark ? "rgba(10,10,11,0.66)" : "rgba(244,242,234,0.72)",
          backdropFilter: "blur(16px) saturate(150%)",
          WebkitBackdropFilter: "blur(16px) saturate(150%)",
        }}
      >
        {hideBack ? (
          <span className="mono" style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-muted)" }}>
            bydeepak / tools
          </span>
        ) : (
          <Link
            href={backHref}
            data-cursor={backLabel}
            className="link-trace mono inline-flex items-center gap-2"
            style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-muted)" }}
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            {backLabel}
          </Link>
        )}
        <button
          onClick={toggle}
          data-cursor={isDark ? "light" : "dark"}
          aria-label="Toggle theme"
          style={{ background: "transparent", border: "none", color: "var(--fg-muted)", padding: 8, lineHeight: 0 }}
        >
          {isDark ? <Sun size={17} strokeWidth={1.5} /> : <Moon size={17} strokeWidth={1.5} />}
        </button>
      </header>

      {/* editorial title block — mirrors the home section headers */}
      <div style={{ padding: "clamp(28px,5vw,52px) clamp(20px,5vw,64px) clamp(18px,3vw,28px)" }}>
        <div className="flex items-end justify-between" style={{ borderTop: "1px solid var(--fg)", paddingTop: 16, marginBottom: description ? 18 : 0, gap: 16 }}>
          <h1 className="display" style={{ fontSize: "clamp(2.2rem,6vw,4.2rem)", color: "var(--fg)", lineHeight: 0.92, letterSpacing: "-0.03em" }}>
            {title}
            <span style={{ color: "var(--accent)" }}>.</span>
          </h1>
          <span className="eyebrow" style={{ whiteSpace: "nowrap", paddingBottom: 8 }}>Free · client-side</span>
        </div>
        {description && (
          <p className="mono" style={{ fontSize: 13.5, lineHeight: 1.7, color: "var(--fg-muted)", maxWidth: 580 }}>
            {description}
          </p>
        )}
      </div>

      {/* content */}
      <div className="flex-1" style={{ padding: "0 clamp(20px,5vw,64px) 80px" }}>
        {children}
      </div>

      {/* footer */}
      <footer
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between mono"
        style={{
          padding: "20px clamp(20px,5vw,64px)",
          borderTop: "1px solid var(--line)",
          fontSize: 11,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--fg-faint)",
          gap: 8,
        }}
      >
        <span>© {new Date().getFullYear()} Deepak Aeleni</span>
        <Link href="/" data-cursor="home" className="link-trace" style={{ color: "var(--fg-faint)" }}>
          bydeepak.com
        </Link>
      </footer>
    </div>
  );
}
