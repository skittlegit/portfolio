"use client";

import { ArrowUpRight } from "lucide-react";
import MaskReveal from "./MaskReveal";
import Reveal from "./Reveal";
import { SOCIALS, EMAIL, PHONE, PHONE_HREF } from "../lib/projects";

const PAD = "px-5 sm:px-8 md:px-12 lg:px-16";

// Shared closing block — giant condensed call, big email, socials, colophon.
// Lives on every main page (home, work, case studies, about) under #contact.
export default function Footer() {
  return (
    <footer id="contact" className={PAD} style={{ paddingTop: "clamp(70px,10vw,140px)", paddingBottom: 56, position: "relative" }}>
      {/* header rule */}
      <div className="flex items-center justify-between mono" style={{ borderTop: "1px solid var(--fg)", paddingTop: 14, marginBottom: "clamp(36px,6vw,72px)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--fg-muted)" }}>
        <span className="inline-flex items-center gap-2">
          <span className="lamp" /> Available for projects
        </span>
        <span style={{ color: "var(--fg-faint)" }}>Contact</span>
      </div>

      {/* the call */}
      <h2 className="giant" style={{ fontSize: "clamp(3.6rem, 14.5vw, 15rem)", color: "var(--fg)" }}>
        <MaskReveal>
          <span style={{ display: "block" }}>Let&apos;s build</span>
        </MaskReveal>
        <MaskReveal delay={0.08}>
          <span style={{ display: "block" }}>
            something<span style={{ color: "var(--accent)" }}>.</span>
          </span>
        </MaskReveal>
      </h2>

      <div className="grid md:grid-cols-12" style={{ gap: 32, rowGap: 44, marginTop: "clamp(36px,5vw,64px)" }}>
        <div className="md:col-span-7">
          <Reveal>
            <a
              href={`mailto:${EMAIL}`}
              data-cursor="email"
              className="link-trace"
              style={{ fontSize: "clamp(1.35rem,3.2vw,2.6rem)", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--fg)", display: "inline-block" }}
            >
              {EMAIL}
            </a>
            <div className="mono" style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: 16 }}>
              <a href={PHONE_HREF} data-cursor="call" className="link-trace" style={{ color: "var(--fg-muted)" }}>{PHONE}</a>
            </div>
          </Reveal>
        </div>
        <div className="md:col-span-4 md:col-start-9">
          <Reveal delay={0.08}>
            <div className="flex flex-col">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor={s.label}
                  className="flex items-center justify-between mono social-row"
                  style={{ padding: "13px 0", borderTop: "1px solid var(--line)", fontSize: 12.5, color: "var(--fg)", textDecoration: "none" }}
                >
                  <span style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}>{s.label}</span>
                  <span className="flex items-center gap-2" style={{ color: "var(--fg-muted)" }}>
                    {s.handle} <ArrowUpRight size={13} strokeWidth={1.75} />
                  </span>
                </a>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      {/* colophon */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mono" style={{ marginTop: "clamp(56px,8vw,96px)", paddingTop: 16, borderTop: "1px solid var(--line)", fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-faint)", gap: 8 }}>
        <span>© {new Date().getFullYear()} Deepak Aeleni</span>
        <span>Built with Next.js — bydeepak.com</span>
      </div>
    </footer>
  );
}
