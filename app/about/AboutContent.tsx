"use client";

import { motion, useReducedMotion } from "framer-motion";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import MaskReveal from "../components/MaskReveal";
import Reveal from "../components/Reveal";
import ClockIST from "../components/ClockIST";

const PAD = "px-5 sm:px-8 md:px-12 lg:px-16";

const SPEC = [
  { k: "Role", v: "UI/UX · Full-stack · App dev" },
  { k: "Based", v: "Hyderabad, India" },
  { k: "Studying", v: "CS @ Mahindra University" },
  { k: "Roles", v: "Reddys Digital · Math Society · AEON 2026" },
  { k: "Now", v: "Workplace automation + open source" },
  { k: "Off-screen", v: "Exploration · Formula 1 · Football" },
];

const STATS = [
  { value: "11+", label: "Public repos" },
  { value: "3+", label: "Years building" },
  { value: "400+", label: "Users served" },
  { value: "∞", label: "Cups of coffee" },
];

export default function AboutContent() {
  const reduce = useReducedMotion();

  return (
    <main id="main" style={{ position: "relative", zIndex: 2 }}>
      <Nav />

      {/* ════ header — the giant word ════ */}
      <header className={PAD} style={{ paddingTop: "clamp(110px,16vh,180px)" }}>
        <div className="flex items-baseline justify-between mono" style={{ borderTop: "1px solid var(--fg)", paddingTop: 14, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-muted)" }}>
          <span>Profile — est. 2022</span>
          <span style={{ color: "var(--fg-faint)" }}>
            Hyderabad — <ClockIST /> IST
          </span>
        </div>
        <h1 className="giant" style={{ fontSize: "clamp(5rem,27.5vw,27rem)", color: "var(--fg)", marginLeft: "-0.04em", marginTop: 10 }}>
          <MaskReveal mount delay={0.1}>
            <span style={{ display: "block" }}>
              About<span style={{ color: "var(--accent)" }}>.</span>
            </span>
          </MaskReveal>
        </h1>
      </header>

      {/* ════ statement ════ */}
      <section className={PAD} style={{ paddingTop: "clamp(50px,8vw,100px)" }}>
        <h2 className="display" style={{ fontSize: "clamp(1.9rem,5.2vw,4.4rem)", color: "var(--fg)", maxWidth: "24ch" }}>
          <MaskReveal delay={0.05}>
            <span style={{ display: "block" }}>Internet generalist —</span>
          </MaskReveal>
          <MaskReveal delay={0.13}>
            <span style={{ display: "block" }}>building tools, crafting interfaces,</span>
          </MaskReveal>
          <MaskReveal delay={0.21}>
            <span style={{ display: "block" }}>
              documenting the <span style={{ color: "var(--accent)" }}>process</span>.
            </span>
          </MaskReveal>
        </h2>
      </section>

      {/* ════ bio + spec sheet ════ */}
      <section className={PAD} style={{ paddingTop: "clamp(50px,8vw,100px)" }}>
        <div className="grid md:grid-cols-12" style={{ gap: 32, rowGap: 44 }}>
          <div className="md:col-span-5">
            <Reveal>
              <span className="mono" style={{ display: "block", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-muted)", marginBottom: 20 }}>
                <span style={{ color: "var(--accent)", marginRight: 10 }}>01</span>Bio
              </span>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: "var(--fg-muted)" }}>
                CS undergrad who interned at <span style={{ color: "var(--fg)" }}>Reddys Digital</span>,
                building their corporate site from scratch. I head tech &amp; design for
                the <span style={{ color: "var(--fg)" }}>Mathematics Society</span> and was design rep
                for <span style={{ color: "var(--fg)" }}>AEON 2026</span>. UI/UX-focused, but
                full-stack — comfortable across backend and app development.
              </p>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: "var(--fg-muted)", marginTop: 18 }}>
                Currently building <span style={{ color: "var(--fg)" }}>workplace-automation tools</span>.
                Open to new projects and collaborations.
              </p>
            </Reveal>
          </div>

          <div className="md:col-span-6 md:col-start-7">
            <Reveal delay={0.1}>
              <span className="mono" style={{ display: "block", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-muted)", marginBottom: 20 }}>
                <span style={{ color: "var(--accent)", marginRight: 10 }}>02</span>Spec
              </span>
              <dl style={{ borderTop: "1px solid var(--line-strong)" }}>
                {SPEC.map((s) => (
                  <div key={s.k} className="fact-row flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-5" style={{ padding: "13px 0" }}>
                    <dt className="mono" style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--fg-faint)", flexShrink: 0 }}>{s.k}</dt>
                    <dd className="mono sm:text-right" style={{ fontSize: 12.5, color: "var(--fg)" }}>{s.v}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ════ numbers ════ */}
      <section className={PAD} style={{ paddingTop: "clamp(60px,9vw,120px)" }}>
        <div className="mono" style={{ borderTop: "1px solid var(--fg)", paddingTop: 14, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-muted)", marginBottom: "clamp(24px,3vw,40px)" }}>
          <span style={{ color: "var(--accent)", marginRight: 10 }}>03</span>In numbers
        </div>
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4"
          initial={reduce ? false : "hidden"}
          whileInView="show"
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          transition={{ staggerChildren: 0.06 }}
        >
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              variants={{ hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } } }}
              style={{ padding: "10px 0 26px", borderRight: i < 3 ? "1px solid var(--line)" : "none", paddingLeft: i > 0 ? 22 : 0 }}
            >
              <div className="numeral" style={{ fontSize: "clamp(3.4rem,9vw,7.5rem)", color: "var(--fg)" }}>{s.value}</div>
              <div className="eyebrow" style={{ marginTop: 16 }}>{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}
