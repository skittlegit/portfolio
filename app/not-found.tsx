import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Nav from "./components/Nav";

export default function NotFound() {
  return (
    <main
      className="px-5 sm:px-8 md:px-12 lg:px-16"
      style={{ position: "relative", zIndex: 2, minHeight: "100svh", display: "flex", flexDirection: "column", justifyContent: "center" }}
    >
      <Nav />
      <div className="eyebrow" style={{ marginBottom: 20 }}>Error 404 — off the map</div>
      <h1 className="giant" style={{ fontSize: "clamp(6rem,30vw,24rem)", color: "var(--fg)", marginLeft: "-0.04em" }}>
        4<span style={{ color: "var(--accent)" }}>0</span>4
      </h1>
      <p className="mono" style={{ marginTop: 24, fontSize: 13, lineHeight: 1.7, color: "var(--fg-muted)", maxWidth: 420 }}>
        The page you&apos;re looking for moved, shipped, or never existed.
      </p>
      <div className="flex flex-wrap items-center" style={{ gap: 16, marginTop: 36 }}>
        <Link href="/" data-cursor="home" className="btn-ink" style={{ padding: "14px 22px", fontSize: 12 }}>
          Back home <ArrowUpRight size={14} strokeWidth={2} />
        </Link>
        <Link href="/work" data-cursor="work" className="link-trace mono" style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-muted)" }}>
          See the work
        </Link>
      </div>
    </main>
  );
}
