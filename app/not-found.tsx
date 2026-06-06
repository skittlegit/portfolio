import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Nav from "./components/Nav";

export default function NotFound() {
  return (
    <main
      className="px-5 sm:px-8 md:px-16"
      style={{ position: "relative", zIndex: 2, minHeight: "100svh", display: "flex", flexDirection: "column", justifyContent: "center" }}
    >
      <Nav />
      <div className="eyebrow" style={{ marginBottom: 24 }}>Error 404 — off the map</div>
      <h1 className="display display-xl" style={{ color: "var(--fg)" }}>
        4<span style={{ color: "var(--accent)" }}>0</span>4
      </h1>
      <p className="serif" style={{ marginTop: 28, fontSize: "clamp(1.3rem,2.6vw,2rem)", lineHeight: 1.25, color: "var(--fg)", maxWidth: "16ch" }}>
        This coordinate isn&apos;t on the map.
      </p>
      <p className="mono" style={{ marginTop: 14, fontSize: 13.5, lineHeight: 1.7, color: "var(--fg-muted)", maxWidth: 420 }}>
        The page you&apos;re looking for moved, shipped, or never existed.
      </p>
      <div className="flex flex-wrap items-center" style={{ gap: 16, marginTop: 40 }}>
        <Link
          href="/"
          data-cursor="home"
          className="mono inline-flex items-center gap-2"
          style={{ background: "var(--fg)", color: "var(--bg)", padding: "14px 22px", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none" }}
        >
          Back home <ArrowUpRight size={14} strokeWidth={2} />
        </Link>
        <Link href="/tools" data-cursor="tools" className="link-trace mono" style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-muted)" }}>
          Browse tools
        </Link>
      </div>
    </main>
  );
}
