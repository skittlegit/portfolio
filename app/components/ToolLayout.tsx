"use client";

import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Nav from "./Nav";

// Shared chrome for every tool page. Uses the same site Nav as every other page
// (so the mobile hamburger/menu is consistent), then an editorial title block,
// the tool's content, and a footer. Sets a per-tool document title (tool pages
// are client components and can't export metadata themselves).
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
  useEffect(() => {
    document.title = `${title} · Deepak Aeleni`;
  }, [title]);

  const showBack = !hideBack && backHref !== "/";

  return (
    <div
      className="tools-layout relative flex flex-col"
      style={{ color: "var(--fg)", minHeight: "100dvh", position: "relative", zIndex: 2 }}
    >
      <Nav />

      {/* editorial title block — top padding clears the fixed nav */}
      <div style={{ padding: "calc(62px + clamp(26px,5vw,52px)) clamp(20px,5vw,64px) clamp(18px,3vw,28px)" }}>
        {showBack && (
          <Link
            href={backHref}
            data-cursor={backLabel}
            className="link-trace mono inline-flex items-center gap-2"
            style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-muted)", marginBottom: 18 }}
          >
            <ArrowLeft size={14} strokeWidth={1.5} /> Back to {backLabel}
          </Link>
        )}
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
