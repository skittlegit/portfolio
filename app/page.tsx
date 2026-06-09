"use client";

import Link from "next/link";
import Image, { type StaticImageData } from "next/image";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ArrowDown } from "lucide-react";
import Nav from "./components/Nav";
import Reveal from "./components/Reveal";
import Magnetic from "./components/Magnetic";
import Scramble from "./components/Scramble";
// Static imports → content-hashed URLs that bust caches automatically whenever
// the source file changes (drop a new PNG in public/work and rebuild).
import mcseShot from "@/public/work/mcse.png";
import vellumShot from "@/public/work/vellum.png";
import lightsoutShot from "@/public/work/lightsout.png";
import reddysShot from "@/public/work/reddys.png";
import chunksShot from "@/public/work/chunks.png";

/* ── Content (verbatim facts) ───────────────────────────────────────────── */

const STATS = [
  { value: "11+", label: "Public repos" },
  { value: "3+", label: "Years building" },
  { value: "400+", label: "Users served" },
  { value: "∞", label: "Cups of coffee" },
];

const SPEC = [
  { k: "Role", v: "UI/UX · Full-stack · App dev" },
  { k: "Based", v: "Hyderabad, India" },
  { k: "Studying", v: "CS @ Mahindra University" },
  { k: "Roles", v: "Reddys Digital · Math Society · AEON 2026" },
  { k: "Now", v: "Workplace automation + open source" },
  { k: "Off-screen", v: "Exploration · Formula 1 · Football" },
];

type Project = {
  idx: string;
  img?: StaticImageData;
  title: string;
  status: string;
  desc: string;
  stack: string[];
  href: string;
  span: string;
  feature?: boolean;
};

const PROJECTS: Project[] = [
  {
    idx: "01",
    img: mcseShot,
    title: "MCSE — Stock Trading Sim",
    status: "Shipped",
    desc: "Real-time trading simulator — 400+ participants, 250+ concurrent users. Order execution, screener, watchlist, IPO module, packaged as PWA + TWA.",
    stack: ["Next.js", "Convex", "TypeScript"],
    href: "https://mcse.in",
    span: "md:col-span-12",
    feature: true,
  },
  {
    idx: "02",
    img: vellumShot,
    title: "Vellum Health",
    status: "Shipped",
    desc: "Telemedicine platform — WebRTC + Socket.IO video, Stripe booking, AES-256-GCM encryption, multi-role NextAuth, edge role-gating, audit logs.",
    stack: ["Next.js", "MongoDB", "Stripe", "WebRTC"],
    href: "https://vellumhealth.vercel.app/",
    span: "md:col-span-6",
  },
  {
    idx: "03",
    img: lightsoutShot,
    title: "Lightsout — F1 Prediction",
    status: "Shipped",
    desc: "Full-stack F1 dashboard — 3 LightGBM quantile-regression models on 8 seasons, Monte Carlo simulation (~10K orderings) for win/podium/points odds.",
    stack: ["Next.js", "FastAPI", "LightGBM", "FastF1"],
    href: "https://lightsout-web.vercel.app/",
    span: "md:col-span-6",
  },
  {
    idx: "04",
    img: reddysShot,
    title: "Reddys Digital",
    status: "Shipped",
    desc: "Corporate website built from scratch — 6 pages end-to-end for a firm serving 100+ clients across 50+ cities.",
    stack: ["Next.js", "TypeScript", "Tailwind", "Framer Motion"],
    href: "https://rdpl.vercel.app",
    span: "md:col-span-6",
  },
  {
    idx: "05",
    img: chunksShot,
    title: "Chunks — Satellite Scheduler",
    status: "Shipped",
    desc: "Full-stack imaging scheduler for the Lost in Space hackathon — two-pass attitude planner, composite mission score 1.18 across all 3 test cases.",
    stack: ["Next.js", "FastAPI", "Zustand"],
    href: "https://chunkyweb.vercel.app/",
    span: "md:col-span-6",
  },
  {
    idx: "06",
    title: "Crossmint — Workplace Automation",
    status: "Building",
    desc: "Field-ops app — on-site capture with photos & metadata, role-based access across 3 tiers, offline-first storage, admin dashboard with exports.",
    stack: ["Flutter", "Supabase", "Riverpod", "Hive"],
    href: "https://github.com/skittlegit/crossmint",
    span: "md:col-span-12",
    feature: true,
  },
];

const SOCIALS = [
  { label: "GitHub", handle: "skittlegit", href: "https://github.com/skittlegit" },
  { label: "LinkedIn", handle: "in/deepakaeleni", href: "https://linkedin.com/in/deepakaeleni" },
  { label: "X / Twitter", handle: "itsnotskittle", href: "https://x.com/itsnotskittle" },
  { label: "Instagram", handle: "skittlllle", href: "https://instagram.com/skittlllle" },
];

const TOOLNAMES = [
  "QR Code", "Color Palette", "CSS Gradient", "ASCII Art", "Halftone",
  "Image Compressor", "Images → PDF", "Pattern Library", "Generative Art", "Vector Art",
  "Color Converter", "Shape Maker",
];

const PAD = "px-5 sm:px-8 md:px-12 lg:px-16";

/* live Hyderabad clock — instrument readout in the hero meta row */
const IST_FMT = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function ClockIST() {
  const [time, setTime] = useState("--:--:--");
  useEffect(() => {
    const raf = requestAnimationFrame(() => setTime(IST_FMT.format(new Date())));
    const id = setInterval(() => setTime(IST_FMT.format(new Date())), 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, []);
  return <span suppressHydrationWarning>{time}</span>;
}

/* bold editorial section header */
function SectionHead({ n, title, meta }: { n: string; title: React.ReactNode; meta?: string }) {
  return (
    <div className="flex items-end justify-between" style={{ borderTop: "1px solid var(--fg)", paddingTop: 18, marginBottom: 48, gap: 16 }}>
      <h2 className="display" style={{ fontSize: "clamp(1.9rem,5vw,3.4rem)", lineHeight: 0.9, letterSpacing: "-0.03em", color: "var(--fg)", display: "flex", alignItems: "baseline", gap: 14 }}>
        <span className="mono" style={{ fontSize: "clamp(0.8rem,1.4vw,1rem)", color: "var(--accent)", letterSpacing: 0 }}>({n})</span>
        {title}
      </h2>
      {meta && <span className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-muted)", whiteSpace: "nowrap", paddingBottom: 6 }}>{meta}</span>}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function Home() {
  const reduce = useReducedMotion();

  return (
    <main id="main" style={{ position: "relative", zIndex: 2 }}>
      <Nav />

      {/* ════ HERO ════ */}
      <section className={PAD} style={{ minHeight: "100svh", display: "flex", flexDirection: "column", justifyContent: "space-between", paddingTop: 104, paddingBottom: 30, position: "relative" }}>
        {/* top meta */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between"
          style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}
        >
          <span className="inline-flex items-center gap-2 mono" style={{ border: "1px solid var(--line-strong)", padding: "7px 12px", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--fg-muted)" }}>
            <span className="lamp" /> Available for projects
          </span>
          <span className="hidden sm:block mono" style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--fg-faint)" }}>
            Folio 2026 · Hyderabad — <ClockIST /> IST
          </span>
        </motion.div>

        {/* centrepiece — giant name + right-aligned role column */}
        <div className="flex items-end justify-between" style={{ gap: 24 }}>
          <div>
            <h1 className="display" style={{ color: "var(--fg)", fontSize: "clamp(3.4rem, 18vw, 16rem)", lineHeight: 0.8, letterSpacing: "-0.045em" }}>
              <span style={{ display: "block", overflow: "hidden" }}>
                <Scramble text="DEEPAK" speed={1.3} />
              </span>
              <span className="hero-outline" style={{ display: "block", overflow: "hidden" }}>
                <Scramble text="AELENI" speed={1.3} delay={140} />
                <span style={{ color: "var(--accent)", WebkitTextStrokeWidth: 0 }}>.</span>
              </span>
            </h1>
            {/* compact role line — stands in for the right column below lg */}
            <motion.div
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.7 }}
              className="lg:hidden mono flex flex-wrap items-center"
              style={{ marginTop: 22, gap: 10, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-muted)" }}
            >
              <span style={{ color: "var(--fg)" }}>UI/UX × Full-stack</span>
              <span aria-hidden style={{ color: "var(--fg-faint)" }}>/</span>
              <span>App developer</span>
            </motion.div>
          </div>
          <motion.div
            aria-hidden
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.7 }}
            className="hidden lg:flex flex-col items-end mono"
            style={{ gap: 6, paddingBottom: "clamp(12px,1.6vw,26px)", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-muted)", textAlign: "right" }}
          >
            <span style={{ color: "var(--fg)" }}>UI/UX × Full-stack</span>
            <span>App developer</span>
            <span style={{ color: "var(--fg-faint)" }}>↳ builds tools</span>
          </motion.div>
        </div>

        {/* bottom — tagline + CTAs */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between" style={{ borderTop: "1px solid var(--line-strong)", paddingTop: "clamp(20px,3vh,30px)", gap: 24 }}>
          <Reveal delay={0.35} className="max-w-lg">
            <p className="serif" style={{ fontSize: "clamp(1.3rem,2.3vw,1.9rem)", lineHeight: 1.22, color: "var(--fg)" }}>
              Internet generalist based in Hyderabad — building tools, crafting
              interfaces, and documenting the process.
            </p>
          </Reveal>
          <Reveal delay={0.45}>
            <div className="flex items-center" style={{ gap: 16 }}>
              <Magnetic strength={0.4}>
                <Link href="/resume" data-cursor="open" className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "var(--fg)", color: "var(--bg)", padding: "15px 24px", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none" }}>
                  View Résumé <ArrowUpRight size={15} strokeWidth={2} />
                </Link>
              </Magnetic>
              <Link href="/#work" data-cursor="scroll" className="link-trace mono inline-flex items-center" style={{ gap: 8, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-muted)" }}>
                <span className="bob" aria-hidden><ArrowDown size={13} strokeWidth={1.75} /></span>
                Selected Work
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════ ABOUT — editorial spec sheet ════ */}
      <section id="about" className={PAD} style={{ paddingTop: 64, paddingBottom: 112 }}>
        <SectionHead n="01" title="Profile" meta="Est. 2022 · Hyderabad" />
        <Reveal>
          <p className="display" style={{ fontSize: "clamp(1.9rem,4.6vw,3.6rem)", lineHeight: 1.04, letterSpacing: "-0.03em", color: "var(--fg)", maxWidth: "18ch", marginBottom: 12 }}>
            I build <span style={{ color: "var(--fg-faint)" }}>useful tools</span> and design interfaces that <span className="italic-serif" style={{ color: "var(--accent)" }}>feel good</span> to use.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-12" style={{ gap: 32, marginTop: 48, rowGap: 40 }}>
          <div className="md:col-span-5">
            <Reveal>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: "var(--fg-muted)" }}>
                CS undergrad who interned at <span style={{ color: "var(--fg)" }}>Reddys Digital</span>, building their corporate
                site from scratch. I head tech &amp; design for the <span style={{ color: "var(--fg)" }}>Mathematics Society</span> and
                was design rep for <span style={{ color: "var(--fg)" }}>AEON 2026</span>. UI/UX-focused, but full-stack — comfortable
                across backend and app development.
              </p>
            </Reveal>
          </div>

          {/* spec list */}
          <div className="md:col-span-6 md:col-start-7">
            <Reveal delay={0.1}>
              <dl style={{ borderTop: "1px solid var(--line-strong)" }}>
                {SPEC.map((s) => (
                  <div key={s.k} className="spec-row flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-5" style={{ padding: "13px 0", borderBottom: "1px solid var(--line)" }}>
                    <dt className="mono" style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--fg-faint)", flexShrink: 0 }}>{s.k}</dt>
                    <dd className="mono sm:text-right" style={{ fontSize: 13, color: "var(--fg)" }}>{s.v}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ════ STATS ════ */}
      <section className={PAD} style={{ paddingBottom: 112 }}>
        <div className="grid grid-cols-2 md:grid-cols-4" style={{ borderTop: "1px solid var(--fg)" }}>
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06}>
              <div className="stat-cell" style={{ padding: "34px 0 30px", borderBottom: "1px solid var(--line)", borderRight: i < 3 ? "1px solid var(--line-strong)" : "none" }}>
                <span className="mono" style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-faint)" }}>0{i + 1}</span>
                <div className="numeral" style={{ fontSize: "clamp(3.2rem,8vw,6rem)", color: "var(--fg)", marginTop: 10 }}>{s.value}</div>
                <div className="eyebrow" style={{ marginTop: 16 }}>{s.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ════ WORK — image-forward gallery ════ */}
      <section id="work" className={PAD} style={{ paddingTop: 64, paddingBottom: 112 }}>
        <SectionHead n="02" title={<>Selected <span className="italic-serif" style={{ fontSize: "1.06em" }}>Work</span></>} meta="06 projects" />
        <div className="grid grid-cols-1 md:grid-cols-12" style={{ gap: 18 }}>
          {PROJECTS.map((p, i) => (
            <Reveal key={p.idx} className={p.span} delay={(i % 2) * 0.08}>
              <ProjectCard {...p} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ════ TOOLS TEASER ════ */}
      <section id="tools-teaser" className={PAD} style={{ paddingBottom: 112 }}>
        <Reveal clip>
          <Link href="/tools" data-cursor="open" className="tools-teaser" style={{ display: "block", border: "1px solid var(--fg)", background: "var(--bg-raised)", padding: "clamp(28px,5vw,64px)", textDecoration: "none", position: "relative" }}>
            <div className="eyebrow" style={{ marginBottom: 24 }}>Free &amp; Open — Design &amp; Dev Tools</div>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between" style={{ gap: 24 }}>
              <h2 className="display" style={{ fontSize: "clamp(2.4rem,7vw,6rem)", lineHeight: 0.9, letterSpacing: "-0.03em", color: "var(--fg)", maxWidth: "12ch" }}>
                Twelve <span className="italic-serif" style={{ fontSize: "1.06em" }}>tools</span><span style={{ color: "var(--accent)" }}>.</span> Zero sign-ups.
              </h2>
              <div style={{ maxWidth: 320 }}>
                <p className="mono" style={{ fontSize: 13, lineHeight: 1.7, color: "var(--fg-muted)" }}>
                  Free browser-based design &amp; dev utilities. No sign-up, no tracking.
                </p>
                <span className="link-trace mono" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 16, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg)" }}>
                  Open the toolkit <ArrowUpRight size={14} strokeWidth={2} />
                </span>
              </div>
            </div>
            <div style={{ marginTop: "clamp(28px,4vw,48px)", paddingTop: 20, borderTop: "1px solid var(--line)", display: "flex", flexWrap: "wrap", alignItems: "center" }}>
              {TOOLNAMES.map((t, i) => (
                <span key={t} className="mono" style={{ fontSize: 12, color: "var(--fg-muted)", display: "inline-flex", alignItems: "center" }}>
                  {i > 0 && <span aria-hidden style={{ color: "var(--fg-faint)", padding: "0 13px" }}>/</span>}
                  {t}
                </span>
              ))}
            </div>
          </Link>
        </Reveal>
      </section>

      {/* ════ CONTACT / FOOTER ════ */}
      <footer id="contact" className={PAD} style={{ paddingTop: 64, paddingBottom: 40 }}>
        <SectionHead n="03" title="Contact" meta="Open to projects" />
        <div className="grid md:grid-cols-12" style={{ gap: 32, rowGap: 48 }}>
          <div className="md:col-span-7">
            <Reveal>
              <h3 className="display" style={{ fontSize: "clamp(2.8rem,9vw,7.5rem)", lineHeight: 0.85, letterSpacing: "-0.03em", color: "var(--fg)", marginBottom: 36 }}>
                Let&apos;s <span className="italic-serif" style={{ fontSize: "1.06em" }}>build</span><br />something<span style={{ color: "var(--accent)" }}>.</span>
              </h3>
              <a href="mailto:deepakrdy7@gmail.com" data-cursor="email" className="link-trace serif" style={{ fontSize: "clamp(1.8rem,4.4vw,3.4rem)", color: "var(--fg)", display: "inline-block", letterSpacing: "-0.01em" }}>
                deepakrdy7@gmail.com
              </a>
              <div className="mono" style={{ fontSize: 14, color: "var(--fg-muted)", marginTop: 14 }}>
                <a href="tel:+918885015899" data-cursor="call" className="link-trace" style={{ color: "var(--fg-muted)" }}>+91 88850 15899</a>
              </div>
            </Reveal>
          </div>
          <div className="md:col-span-4 md:col-start-9">
            <Reveal delay={0.1}>
              <div className="eyebrow" style={{ marginBottom: 16 }}>Currently</div>
              <p className="mono" style={{ fontSize: 13, lineHeight: 1.7, color: "var(--fg-muted)", marginBottom: 28 }}>
                Building workplace-automation tools. Open to new projects and collaborations.
              </p>
              <div className="flex flex-col">
                {SOCIALS.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" data-cursor={s.label} className="flex items-center justify-between mono social-row" style={{ padding: "14px 0", borderTop: "1px solid var(--line)", fontSize: 13, color: "var(--fg)", textDecoration: "none" }}>
                    <span>{s.label}</span>
                    <span className="flex items-center gap-2" style={{ color: "var(--fg-muted)" }}>{s.handle} <ArrowUpRight size={13} strokeWidth={1.75} /></span>
                  </a>
                ))}
              </div>
            </Reveal>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mono" style={{ marginTop: 80, paddingTop: 18, borderTop: "1px solid var(--fg)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-faint)", gap: 8 }}>
          <span>© {new Date().getFullYear()} Deepak Aeleni</span>
          <span>17.3850° N, 78.4867° E</span>
          <span>Built with Next.js — bydeepak.com</span>
        </div>
      </footer>
    </main>
  );
}

/* ── Project card (image-forward) ───────────────────────────────────────── */

function ProjectCard({ idx, img, title, status, desc, stack, href, feature }: Project) {
  const building = status === "Building";
  const shortName = title.split("—")[0].trim();
  const host = (() => {
    try {
      const u = new URL(href);
      return u.host.replace(/^www\./, "") + (u.host === "github.com" ? u.pathname : "");
    } catch {
      return "";
    }
  })();
  const badge = (
    <span className="mono inline-flex items-center gap-2" style={{ position: "absolute", top: 12, left: 12, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: building ? "var(--accent-ink)" : "var(--fg)", background: building ? "var(--accent)" : "var(--bg)", border: building ? "none" : "1px solid var(--line-strong)", padding: "5px 9px" }}>
      {building && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent-ink)" }} />}
      {status}
    </span>
  );
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" data-cursor="visit" className={`work-card${feature ? " work-feature" : ""}`}>
      {/* cover — angular browser frame + screenshot (or designed fallback) */}
      <div className="work-shot">
        {/* chrome bar — unifies dark & light screenshots into one gallery */}
        <div style={{ height: 32, flexShrink: 0, display: "flex", alignItems: "center", gap: 12, padding: "0 12px", borderBottom: "1px solid var(--line)", background: "var(--bg-raised)" }}>
          <span aria-hidden style={{ display: "flex", gap: 5 }}>
            {[0, 1, 2].map((d) => (
              <span key={d} style={{ width: 7, height: 7, background: d === 0 ? "var(--accent)" : "var(--line-strong)" }} />
            ))}
          </span>
          <span className="mono" style={{ fontSize: 10.5, letterSpacing: "0.03em", color: "var(--fg-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{host}</span>
        </div>
        <div className="work-img">
        {img ? (
          <Image src={img} alt={`${title} — screenshot`} fill placeholder="blur" sizes={feature ? "(max-width: 768px) 100vw, 62vw" : "(max-width: 768px) 100vw, 50vw"} style={{ objectFit: "cover", objectPosition: "top center" }} />
        ) : (
          <div className="work-cover" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(14px,3vw,40px)", padding: "clamp(16px,3vw,34px)" }}>
            {/* texture + wash */}
            <span aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(var(--line-strong) 1px, transparent 1px)", backgroundSize: "22px 22px", opacity: 0.4 }} />
            <span aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 120% at 82% 2%, var(--accent-glow) 0%, transparent 55%)" }} />

            {/* angular phone mock */}
            <div aria-hidden className="work-phone" style={{ position: "relative", flexShrink: 0, height: "78%", aspectRatio: "10 / 20", background: "var(--bg-raised)", border: "1px solid var(--line-strong)", boxShadow: "0 18px 40px -22px rgba(20,19,15,0.55)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ height: "16%", background: "var(--fg)", display: "flex", alignItems: "center", gap: 5, padding: "0 9px" }}>
                <span style={{ width: 5, height: 5, background: "var(--accent)" }} />
                <span style={{ height: 3, width: "46%", background: "var(--bg)" }} />
              </div>
              <div style={{ flex: 1, padding: 8, display: "flex", flexDirection: "column", gap: 7 }}>
                {[0, 1, 2].map((r) => (
                  <div key={r} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 15, height: 15, background: "var(--bg-sunk)", border: "1px solid var(--line)", flexShrink: 0 }} />
                    <span style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
                      <span style={{ height: 3, width: "82%", background: "var(--line-strong)" }} />
                      <span style={{ height: 3, width: "55%", background: "var(--line)" }} />
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ height: "12%", borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-around" }}>
                <span style={{ width: 5, height: 5, background: "var(--line-strong)" }} />
                <span style={{ width: 7, height: 7, background: "var(--accent)" }} />
                <span style={{ width: 5, height: 5, background: "var(--line-strong)" }} />
              </div>
            </div>

            {/* label */}
            <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 9, minWidth: 0 }}>
              <span className="serif" style={{ fontSize: "clamp(1.7rem,3.4vw,2.9rem)", lineHeight: 0.95, color: "var(--fg)" }}>{shortName}</span>
              <span className="mono" style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-muted)" }}>Field-ops · Flutter</span>
              <span className="mono" style={{ fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--fg-faint)" }}>Native app — no web preview</span>
            </div>
          </div>
        )}
          {badge}
        </div>
      </div>

      {/* meta */}
      <div className="work-meta">
        <div className="flex items-start justify-between" style={{ gap: 12, marginBottom: 10 }}>
          <div className="flex items-baseline" style={{ gap: 12 }}>
            <span className="numeral" style={{ fontSize: "clamp(1.6rem,2.4vw,2.4rem)", color: "var(--fg-faint)" }}>{idx}</span>
            <h3 className="heading work-title" style={{ color: "var(--fg)", lineHeight: 1.04 }}>{title}</h3>
          </div>
          <span className="work-arrow" aria-hidden style={{ color: "var(--accent)", flexShrink: 0 }}>
            <ArrowUpRight size={20} strokeWidth={1.75} />
          </span>
        </div>
        <p className="work-desc" style={{ lineHeight: 1.6, color: "var(--fg-muted)", marginBottom: 18 }}>{desc}</p>
        <div className="flex flex-wrap work-stack" style={{ gap: 6 }}>
          {stack.map((s) => (
            <span key={s} className="mono" style={{ fontSize: 10.5, letterSpacing: "0.04em", color: "var(--fg-muted)", border: "1px solid var(--line)", padding: "3px 8px" }}>{s}</span>
          ))}
        </div>
      </div>
    </a>
  );
}
