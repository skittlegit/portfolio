import type { Metadata } from "next";
import Link from "next/link";
import { Download, ArrowUpRight, ArrowLeft } from "lucide-react";
import Nav from "../components/Nav";

export const metadata: Metadata = {
  title: "Résumé",
  description: "Résumé of Deepak Aeleni — UI/UX-focused full-stack & app developer.",
  alternates: { canonical: "/resume" },
};

const PAD = "px-5 sm:px-8 md:px-12 lg:px-16";

export default function ResumePage() {
  return (
    <main style={{ position: "relative", zIndex: 2, minHeight: "100svh" }}>
      <Nav />

      <section className={PAD} style={{ paddingTop: 120, paddingBottom: 64 }}>
        {/* header */}
        <div
          className="flex flex-col md:flex-row md:items-end md:justify-between"
          style={{ borderBottom: "1px solid var(--line-strong)", paddingBottom: 24, marginBottom: 32, gap: 24 }}
        >
          <div>
            <div className="eyebrow" style={{ marginBottom: 16 }}>Document / résumé.pdf</div>
            <h1 className="display" style={{ fontSize: "clamp(2.6rem,8vw,5rem)", color: "var(--fg)", lineHeight: 0.95 }}>
              Résumé<span style={{ color: "var(--accent)" }}>.</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center" style={{ gap: 12 }}>
            <a
              href="/resume.pdf"
              download
              data-cursor="download"
              className="mono inline-flex items-center gap-2"
              style={{
                background: "var(--fg)",
                color: "var(--bg)",
                padding: "13px 20px",
                fontSize: 12,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              <Download size={15} strokeWidth={2} /> Download PDF
            </a>
            <a
              href="/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="open tab"
              className="link-trace mono inline-flex items-center gap-2"
              style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-muted)" }}
            >
              Open in new tab <ArrowUpRight size={14} strokeWidth={2} />
            </a>
          </div>
        </div>

        {/* inline PDF */}
        <div
          style={{
            position: "relative",
            border: "1px solid var(--line)",
            background: "var(--bg-raised)",
            overflow: "hidden",
          }}
        >
          <span className="tick" style={{ top: 8, left: 8 }} />
          <span className="tick tick-tr" style={{ top: 8, right: 8 }} />
          <span className="tick tick-bl" style={{ bottom: 8, left: 8 }} />
          <span className="tick tick-br" style={{ bottom: 8, right: 8 }} />
          <object
            data="/resume.pdf#view=FitH&toolbar=0"
            type="application/pdf"
            aria-label="Résumé PDF preview"
            style={{ width: "100%", height: "min(82vh, 1100px)", display: "block", border: "none" }}
          >
            {/* fallback for browsers that won't inline-render PDFs (e.g. some mobile) */}
            <div className="flex flex-col items-center justify-center" style={{ padding: "80px 24px", textAlign: "center", gap: 16 }}>
              <p className="mono" style={{ fontSize: 13, color: "var(--fg-muted)" }}>
                Your browser can&apos;t preview PDFs inline.
              </p>
              <a
                href="/resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="mono inline-flex items-center gap-2"
                style={{ border: "1px solid var(--line)", padding: "12px 18px", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg)", textDecoration: "none" }}
              >
                Open résumé.pdf <ArrowUpRight size={14} strokeWidth={2} />
              </a>
            </div>
          </object>
        </div>

        {/* back */}
        <div style={{ marginTop: 32 }}>
          <Link href="/" data-cursor="home" className="link-trace mono inline-flex items-center gap-2" style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-muted)" }}>
            <ArrowLeft size={14} strokeWidth={1.5} /> Back home
          </Link>
        </div>
      </section>
    </main>
  );
}
