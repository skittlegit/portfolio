import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import MaskReveal from "./components/MaskReveal";
import Reveal from "./components/Reveal";
import Magnetic from "./components/Magnetic";
import { PROJECTS, type Project } from "./lib/projects";

const PAD = "px-5 sm:px-8 md:px-12 lg:px-16";

const FEATURED = PROJECTS.filter((p) => p.featured);

const TOOLNAMES = [
  "QR Code", "Color Palette", "CSS Gradient", "ASCII Art", "Halftone",
  "Image Compressor", "Images → PDF", "Pattern Library", "Generative Art", "Vector Art",
  "Color Converter", "Shape Maker",
];

/* numbered hairline section header */
function SectionHead({ n, title, meta }: { n: string; title: string; meta?: string }) {
  return (
    <div className="flex items-baseline justify-between mono" style={{ borderTop: "1px solid var(--fg)", paddingTop: 14, marginBottom: "clamp(30px,4vw,52px)", gap: 16 }}>
      <span style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg)" }}>
        <span style={{ color: "var(--accent)", marginRight: 10 }}>{n}</span>
        {title}
      </span>
      {meta && <span style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-faint)", whiteSpace: "nowrap" }}>{meta}</span>}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function Home() {
  return (
    <main id="main" style={{ position: "relative", zIndex: 2 }}>
      <Nav />

      {/* ════ HERO — the name hits first, everything else gathers below ════ */}
      {/* bottom padding clears the fixed HUD readouts */}
      <section className={PAD} style={{ minHeight: "100svh", display: "flex", flexDirection: "column", paddingTop: 78, paddingBottom: "clamp(44px,7vh,84px)", position: "relative" }}>
        {/* meta band */}
        <div
          className="mono flex items-center justify-between fade-in"
          style={{ animationDelay: "0.55s", borderTop: "1px solid var(--line)", paddingTop: 12, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-muted)", gap: 16 }}
        >
          <span className="inline-flex items-center gap-2" style={{ color: "var(--fg)" }}>
            <span className="lamp" /> Available for projects
          </span>
          <span className="hidden sm:block" style={{ color: "var(--fg-faint)" }}>Folio 2026 — Hyderabad, IN</span>
        </div>

        {/* the name — LCP element. Revealed with CSS (.hero-line), NOT Framer,
            so it paints on first load instead of waiting for JS to hydrate. */}
        <h1 className="giant hero-name" style={{ color: "var(--fg)", marginLeft: "-0.04em", marginTop: "clamp(16px,3vh,40px)" }}>
          <span className="hero-line">
            <span className="hero-line-in" style={{ animationDelay: "0.12s" }}>Deepak</span>
          </span>
          <span className="hero-line">
            <span className="hero-line-in" style={{ animationDelay: "0.22s" }}>
              Aeleni<span style={{ color: "var(--accent)" }}>.</span>
            </span>
          </span>
        </h1>

        <div style={{ flex: 1 }} />

        {/* lower band — statement left, roles + CTAs right */}
        <div
          className="flex flex-col md:flex-row md:items-end md:justify-between fade-up"
          style={{ animationDelay: "0.6s", borderTop: "1px solid var(--line)", paddingTop: "clamp(18px,3vh,28px)", marginTop: 24, gap: 28 }}
        >
          <p style={{ fontSize: "clamp(1rem,1.3vw,1.2rem)", lineHeight: 1.6, color: "var(--fg-muted)", maxWidth: 460 }}>
            Internet generalist based in <span style={{ color: "var(--fg)" }}>Hyderabad</span> —
            building tools, crafting interfaces, and documenting the process.
          </p>
          <div className="flex flex-col md:items-end" style={{ gap: 18 }}>
            <span className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-muted)" }}>
              UI/UX × Full-stack × App dev
            </span>
            <div className="flex items-center" style={{ gap: 18 }}>
              <Link href="/work" data-cursor="all work" className="link-trace mono" style={{ fontSize: 11.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-muted)" }}>
                Selected work
              </Link>
              <Magnetic strength={0.4}>
                <Link href="/resume" data-cursor="open" className="btn-ink" style={{ padding: "13px 22px", fontSize: 11.5 }}>
                  Résumé <ArrowUpRight size={14} strokeWidth={2} />
                </Link>
              </Magnetic>
            </div>
          </div>
        </div>
      </section>

      {/* ════ SELECTED WORK ════ */}
      <section id="work" className={PAD} style={{ paddingTop: "clamp(60px,9vw,120px)", paddingBottom: 0 }}>
        <SectionHead n="01" title="Selected work" meta={`${FEATURED.length} of ${PROJECTS.length} projects`} />

        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "clamp(16px,2vw,28px)" }}>
          {FEATURED.map((p, i) => (
            <Reveal key={p.slug} delay={(i % 2) * 0.08} className={i === 0 ? "md:col-span-2" : ""}>
              <WorkTile p={p} large={i === 0} />
            </Reveal>
          ))}
        </div>

        {/* index link — the archive row */}
        <Reveal>
          <Link href="/work" data-cursor="open index" className="index-row" style={{ marginTop: "clamp(16px,2vw,28px)", borderBottom: "1px solid var(--line)" }}>
            <span className="row-inner" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <span className="giant row-title" style={{ fontSize: "clamp(2.6rem,8vw,7rem)" }}>
                All work
              </span>
              <span className="mono row-meta flex items-center" style={{ gap: 12, fontSize: 12, letterSpacing: "0.12em" }}>
                ({String(PROJECTS.length).padStart(2, "0")}) <ArrowUpRight size={18} strokeWidth={1.75} />
              </span>
            </span>
          </Link>
        </Reveal>
      </section>

      {/* ════ ABOUT teaser ════ */}
      <section className={PAD} style={{ paddingTop: "clamp(70px,10vw,140px)" }}>
        <SectionHead n="02" title="About" meta="Est. 2022 · Hyderabad" />
        <h2 className="display" style={{ fontSize: "clamp(2.1rem,6vw,5rem)", color: "var(--fg)" }}>
          <MaskReveal>
            <span style={{ display: "block" }}>I build useful tools</span>
          </MaskReveal>
          <MaskReveal delay={0.07}>
            <span style={{ display: "block" }}>and design interfaces</span>
          </MaskReveal>
          <MaskReveal delay={0.14}>
            <span style={{ display: "block" }}>
              that <span style={{ color: "var(--accent)" }}>feel good</span> to use.
            </span>
          </MaskReveal>
        </h2>

        <div className="grid md:grid-cols-12" style={{ gap: 32, rowGap: 44, marginTop: "clamp(36px,5vw,64px)" }}>
          {/* bio + link */}
          <div className="md:col-span-5">
            <Reveal>
              <p style={{ fontSize: 14.5, lineHeight: 1.75, color: "var(--fg-muted)", maxWidth: 460 }}>
                CS undergrad at <span style={{ color: "var(--fg)" }}>Mahindra University</span>. Interned
                at <span style={{ color: "var(--fg)" }}>Reddys Digital</span>, head tech &amp; design for the
                Mathematics Society, design rep for AEON 2026. UI/UX-focused, but comfortable
                across backend and app development.
              </p>
            </Reveal>
            <Reveal delay={0.06}>
              <Link href="/about" data-cursor="about" className="link-trace mono inline-flex items-center" style={{ gap: 8, marginTop: 26, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg)" }}>
                More about me <ArrowUpRight size={14} strokeWidth={1.75} />
              </Link>
            </Reveal>
          </div>

          {/* numbers — proof in the margin */}
          <div className="md:col-span-6 md:col-start-7">
            <Reveal delay={0.1}>
              <div className="grid grid-cols-3" style={{ gap: 20 }}>
                {[
                  { v: "3+", k: "Years building" },
                  { v: "11+", k: "Public repos" },
                  { v: "400+", k: "Users served" },
                ].map((s) => (
                  <div key={s.k} style={{ borderTop: "1px solid var(--line-strong)", paddingTop: 16 }}>
                    <div className="numeral" style={{ fontSize: "clamp(2.1rem,4.4vw,4rem)", color: "var(--fg)" }}>{s.v}</div>
                    <div className="eyebrow" style={{ marginTop: 12, letterSpacing: "0.14em" }}>{s.k}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ════ TOOLS strip ════ */}
      <section id="tools-teaser" className={PAD} style={{ paddingTop: "clamp(70px,10vw,140px)" }}>
        <SectionHead n="03" title="Free tools" meta="No sign-up · runs in-browser" />
        <Link href="/tools" data-cursor="open toolkit" className="index-row" style={{ borderBottom: "1px solid var(--line)" }}>
          <span className="row-inner" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <span className="giant row-title" style={{ fontSize: "clamp(2.6rem,8vw,7rem)" }}>
              Toolbox
            </span>
            <span className="mono row-meta flex items-center" style={{ gap: 12, fontSize: 12, letterSpacing: "0.12em" }}>
              (12) <ArrowUpRight size={18} strokeWidth={1.75} />
            </span>
          </span>
        </Link>
        <Reveal>
          <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", alignItems: "center" }}>
            {TOOLNAMES.map((t, i) => (
              <span key={t} className="mono" style={{ fontSize: 11.5, color: "var(--fg-faint)", display: "inline-flex", alignItems: "center" }}>
                {i > 0 && <span aria-hidden style={{ padding: "0 11px", color: "var(--line-strong)" }}>/</span>}
                {t}
              </span>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ════ CONTACT ════ */}
      <Footer />
    </main>
  );
}

/* ── Work tile (image-forward, links to the case study) ─────────────────── */

function WorkTile({ p, large }: { p: Project; large?: boolean }) {
  return (
    <Link href={`/work/${p.slug}`} data-cursor="case study" className="work-tile">
      <div className="tile-img" style={{ aspectRatio: large ? "21 / 9" : "16 / 10" }}>
        {p.img && (
          <Image
            src={p.img}
            alt={`${p.title} — screenshot`}
            fill
            placeholder="blur"
            sizes={large ? "(max-width: 768px) 100vw, 92vw" : "(max-width: 768px) 100vw, 46vw"}
            style={{ objectFit: "cover", objectPosition: "top center" }}
          />
        )}
        <span className="chip" style={{ position: "absolute", top: 14, left: 14, background: "var(--bg)", color: p.status === "Building" ? "var(--accent)" : "var(--fg)", borderColor: "var(--line-strong)" }}>
          {p.status}
        </span>
      </div>
      <div className="flex items-center justify-between" style={{ padding: "clamp(14px,1.6vw,22px) clamp(16px,1.8vw,24px)" }}>
        <div className="flex items-baseline" style={{ gap: 16, minWidth: 0 }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--fg-faint)", letterSpacing: "0.1em" }}>{p.idx}</span>
          <span className="giant" style={{ fontSize: large ? "clamp(1.8rem,3.6vw,3.2rem)" : "clamp(1.5rem,2.4vw,2.2rem)", color: "var(--fg)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {p.name}
          </span>
          <span className="mono hidden sm:inline" style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-muted)", whiteSpace: "nowrap" }}>
            {p.kind}
          </span>
        </div>
        <span className="tile-arrow" aria-hidden style={{ color: "var(--accent)", flexShrink: 0 }}>
          <ArrowUpRight size={20} strokeWidth={1.75} />
        </span>
      </div>
    </Link>
  );
}
