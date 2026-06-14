"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import MaskReveal from "../components/MaskReveal";
import Reveal from "../components/Reveal";
import CrossmintCover from "../components/CrossmintCover";
import { PROJECTS } from "../lib/projects";

const PAD = "px-5 sm:px-8 md:px-12 lg:px-16";

// The work index — a typographic archive. Rows invert on hover while a live
// preview card chases the cursor (desktop); on touch, each row carries its
// own thumbnail. Every row opens a case study.
export default function WorkIndex() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<number | null>(null);
  const fine = useRef(false);

  // preview chase — springs trail the pointer for the fluid lag
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 180, damping: 22, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 180, damping: 22, mass: 0.6 });

  function onMove(e: React.MouseEvent) {
    fine.current = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine.current) return;
    mx.set(e.clientX);
    my.set(e.clientY);
  }

  const show = active !== null && !reduce;

  return (
    <main id="main" style={{ position: "relative", zIndex: 2 }}>
      <Nav />

      {/* ════ header — the giant word ════ */}
      <header className={PAD} style={{ paddingTop: "clamp(110px,16vh,180px)" }}>
        <div className="flex items-baseline justify-between mono" style={{ borderTop: "1px solid var(--fg)", paddingTop: 14, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-muted)" }}>
          <span>Index — all projects</span>
          <span style={{ color: "var(--fg-faint)" }}>({String(PROJECTS.length).padStart(2, "0")})</span>
        </div>
        <h1 className="giant" style={{ fontSize: "clamp(5.4rem,30vw,30rem)", color: "var(--fg)", marginLeft: "-0.04em", marginTop: 10 }}>
          <MaskReveal mount delay={0.1}>
            <span style={{ display: "block" }}>
              Work<span style={{ color: "var(--accent)" }}>.</span>
            </span>
          </MaskReveal>
        </h1>
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mono"
          style={{ fontSize: 12, lineHeight: 1.7, color: "var(--fg-muted)", maxWidth: 420, marginTop: "clamp(18px,3vw,32px)" }}
        >
          Some shipped, some still building. Each one opens — hover a row for a
          look, click through for the full sheet.
        </motion.p>
      </header>

      {/* ════ the index ════ */}
      <section
        className={PAD}
        style={{ paddingTop: "clamp(40px,6vw,72px)", paddingBottom: 0, position: "relative" }}
        onMouseMove={onMove}
        onMouseLeave={() => setActive(null)}
      >
        <div style={{ borderBottom: "1px solid var(--line)" }}>
          {PROJECTS.map((p, i) => (
            <Reveal key={p.slug} delay={Math.min(i * 0.05, 0.25)}>
              <Link
                href={`/work/${p.slug}`}
                data-cursor="open"
                className="index-row"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
              >
                {/* touch thumbnail — desktop uses the chasing preview instead */}
                <span className="row-thumb" aria-hidden>
                  {p.img ? (
                    <Image src={p.img} alt="" fill placeholder="blur" sizes="100vw" style={{ objectFit: "cover", objectPosition: "top center" }} />
                  ) : (
                    <CrossmintCover compact />
                  )}
                </span>
                <span className="row-inner">
                  <span className="mono row-meta row-idx" style={{ fontSize: 11, letterSpacing: "0.1em", flexShrink: 0 }}>
                    {p.idx}
                  </span>
                  <span className="giant row-title" style={{ fontSize: "clamp(2.4rem,7.5vw,6.6rem)" }}>
                    {p.name}
                  </span>
                  <span className="row-meta mono hidden md:inline" style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    {p.kind}
                  </span>
                  <span className={`row-meta mono row-status${p.status === "Building" ? " is-building" : ""}`} style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {p.status}
                    <ArrowUpRight size={16} strokeWidth={1.75} aria-hidden />
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>

        {/* chasing preview — desktop only */}
        <motion.div
          aria-hidden
          className="row-preview hidden md:block"
          animate={{ opacity: show ? 1 : 0, scale: show ? 1 : 0.92 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ x: sx, y: sy, translateX: "3%", translateY: "-50%", pointerEvents: "none" }}
        >
          {PROJECTS.map((p, i) => (
            <div key={p.slug} style={{ position: "absolute", inset: 0, opacity: active === i ? 1 : 0, transition: "opacity 0.25s ease" }}>
              {p.img ? (
                <Image src={p.img} alt="" fill placeholder="blur" sizes="420px" style={{ objectFit: "cover", objectPosition: "top center" }} />
              ) : (
                /* native app — wireframe phone cover */
                <CrossmintCover compact />
              )}
            </div>
          ))}
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}
