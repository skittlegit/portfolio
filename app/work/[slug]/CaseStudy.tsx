"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, ArrowLeft } from "lucide-react";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import MaskReveal from "../../components/MaskReveal";
import Reveal from "../../components/Reveal";
import Magnetic from "../../components/Magnetic";
import CrossmintCover from "../../components/CrossmintCover";
import type { Project } from "../../lib/projects";

const PAD = "px-5 sm:px-8 md:px-12 lg:px-16";

// One project, opened up — giant name, spec sheet, the shot at full width
// with a slow parallax, the facts as numbered rows, and the next project.
export default function CaseStudy({ project: p, next }: { project: Project; next: Project }) {
  const reduce = useReducedMotion();

  return (
    <main id="main" style={{ position: "relative", zIndex: 2 }}>
      <Nav />

      {/* ════ header ════ */}
      <header className={PAD} style={{ paddingTop: "clamp(100px,14vh,160px)" }}>
        <div className="flex items-baseline justify-between mono" style={{ borderTop: "1px solid var(--fg)", paddingTop: 14, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--fg-muted)" }}>
          <Link href="/work" data-cursor="index" className="link-trace inline-flex items-center" style={{ gap: 8, color: "var(--fg-muted)" }}>
            <ArrowLeft size={12} strokeWidth={1.75} /> Index
          </Link>
          <span style={{ color: "var(--fg-faint)" }}>{p.idx} / 06</span>
        </div>

        <h1 className="giant" style={{ fontSize: "clamp(3.4rem,16.5vw,17rem)", color: "var(--fg)", marginLeft: "-0.04em", marginTop: 12 }}>
          <MaskReveal mount delay={0.1}>
            <span style={{ display: "block" }}>
              {p.name}
              <span style={{ color: "var(--accent)" }}>.</span>
            </span>
          </MaskReveal>
        </h1>

        {/* spec sheet */}
        <motion.dl
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-2 md:grid-cols-4"
          style={{ marginTop: "clamp(26px,4vw,48px)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}
        >
          {[
            ["Type", p.kind],
            ["Status", p.status],
            ["Stack", p.stack.join(" · ")],
            ["Link", p.linkLabel],
          ].map(([k, v], i) => (
            <div key={k} style={{ padding: "16px 0", paddingRight: 16, borderLeft: i > 0 ? "1px solid var(--line)" : "none", paddingLeft: i > 0 ? 16 : 0 }}>
              <dt className="mono" style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-faint)", marginBottom: 8 }}>{k}</dt>
              <dd className="mono" style={{ fontSize: 12, lineHeight: 1.5, color: k === "Status" && p.status === "Building" ? "var(--accent)" : "var(--fg)" }}>
                {k === "Link" ? (
                  <a href={p.href} target="_blank" rel="noopener noreferrer" data-cursor="visit" className="link-trace" style={{ color: "var(--fg)" }}>{v}</a>
                ) : (
                  v
                )}
              </dd>
            </div>
          ))}
        </motion.dl>
      </header>

      {/* ════ media ════ */}
      <section className={PAD} style={{ paddingTop: "clamp(36px,5vw,64px)" }}>
        <ParallaxMedia p={p} />
      </section>

      {/* ════ brief ════ */}
      <section className={PAD} style={{ paddingTop: "clamp(60px,9vw,120px)" }}>
        <div className="grid md:grid-cols-12" style={{ gap: 32 }}>
          <div className="md:col-span-3">
            <span className="mono" style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-muted)" }}>
              <span style={{ color: "var(--accent)", marginRight: 10 }}>01</span>Brief
            </span>
          </div>
          <div className="md:col-span-8 md:col-start-5">
            <MaskReveal>
              <p className="display" style={{ fontSize: "clamp(1.5rem,3.2vw,2.7rem)", lineHeight: 1.04, color: "var(--fg)", textTransform: "none", fontStretch: "85%", letterSpacing: "-0.02em" }}>
                {p.summary}
              </p>
            </MaskReveal>
          </div>
        </div>
      </section>

      {/* ════ key points ════ */}
      <section className={PAD} style={{ paddingTop: "clamp(60px,9vw,120px)" }}>
        <div className="grid md:grid-cols-12" style={{ gap: 32 }}>
          <div className="md:col-span-3">
            <span className="mono" style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-muted)" }}>
              <span style={{ color: "var(--accent)", marginRight: 10 }}>02</span>In the build
            </span>
          </div>
          <div className="md:col-span-8 md:col-start-5">
            <div style={{ borderBottom: "1px solid var(--line)" }}>
              {p.points.map((pt, i) => (
                <Reveal key={pt} delay={Math.min(i * 0.05, 0.2)}>
                  <div className="fact-row">
                    <span className="mono" style={{ fontSize: 11, color: "var(--fg-faint)", letterSpacing: "0.1em", flexShrink: 0 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span style={{ fontSize: "clamp(1rem,1.6vw,1.3rem)", fontWeight: 600, letterSpacing: "-0.015em", color: "var(--fg)" }}>
                      {pt}
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* stack + visit */}
            <Reveal>
              <div className="flex flex-wrap items-center justify-between" style={{ gap: 20, marginTop: "clamp(28px,4vw,44px)" }}>
                <div className="flex flex-wrap" style={{ gap: 8 }}>
                  {p.stack.map((s) => (
                    <span key={s} className="chip">{s}</span>
                  ))}
                </div>
                <Magnetic strength={0.4}>
                  <a href={p.href} target="_blank" rel="noopener noreferrer" data-cursor="visit" className="btn-ink" style={{ padding: "13px 22px", fontSize: 11.5 }}>
                    {p.status === "Building" ? "View repo" : "Visit live"} <ArrowUpRight size={14} strokeWidth={2} />
                  </a>
                </Magnetic>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ════ next project ════ */}
      <section className={PAD} style={{ paddingTop: "clamp(70px,10vw,140px)" }}>
        <div className="mono" style={{ borderTop: "1px solid var(--fg)", paddingTop: 14, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-muted)", marginBottom: 4 }}>
          Next project
        </div>
        <Link href={`/work/${next.slug}`} data-cursor="open" className="index-row" style={{ borderTop: "none", borderBottom: "1px solid var(--line)" }}>
          <span className="row-inner" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <span className="giant row-title" style={{ fontSize: "clamp(2.8rem,9vw,8rem)" }}>
              {next.name}
            </span>
            <span className="mono row-meta flex items-center" style={{ gap: 12, fontSize: 12, letterSpacing: "0.12em" }}>
              ({next.idx}) <ArrowUpRight size={18} strokeWidth={1.75} />
            </span>
          </span>
        </Link>
      </section>

      <Footer />
    </main>
  );
}

/* full-width shot with a slow scroll parallax; typographic panel when the
   project has no web preview */
function ParallaxMedia({ p }: { p: Project }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-7%", "7%"]);

  return (
    <div ref={ref} className="case-media" style={{ aspectRatio: "21 / 10", minHeight: 260 }}>
      <motion.div style={{ position: "absolute", inset: "-8% 0", y: reduce ? 0 : y }}>
        {p.img ? (
          <Image
            src={p.img}
            alt={`${p.title} — screenshot`}
            fill
            priority
            placeholder="blur"
            sizes="92vw"
            style={{ objectFit: "cover", objectPosition: "top center" }}
          />
        ) : (
          /* native app — wireframe phone cover */
          <CrossmintCover />
        )}
      </motion.div>
    </div>
  );
}
