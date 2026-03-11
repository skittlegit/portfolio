"use client";

import { useState } from "react";
import {
  Palette,
  Code2,
  Wrench,
  FileText,
  Sun,
  Moon,
  Linkedin,
  Twitter,
  Instagram,
  Github,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "./context/ThemeContext";
import { useAuth } from "./context/AuthContext";

type HoverKey = "design" | "build" | "create" | "resume" | null;

const icons: Record<NonNullable<HoverKey>, React.ReactNode> = {
  design: <Palette size={30} strokeWidth={1.5} />,
  build: <Code2 size={30} strokeWidth={1.5} />,
  create: <Wrench size={30} strokeWidth={1.5} />,
  resume: <FileText size={30} strokeWidth={1.5} />,
};

function Word({
  id,
  hovered,
  onEnter,
  onLeave,
  href,
  children,
}: {
  id: NonNullable<HoverKey>;
  hovered: HoverKey;
  onEnter: (id: NonNullable<HoverKey>) => void;
  onLeave: () => void;
  href?: string;
  children: React.ReactNode;
}) {
  const isActive = hovered === id;

  const inner = (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => onEnter(id)}
      onMouseLeave={onLeave}
    >
      {href ? (
        <span className="underline decoration-1 underline-offset-4">{children}</span>
      ) : (
        children
      )}
      <span
        style={{
          position: "absolute",
          left: "50%",
          top: "calc(100% + 1px)",
          transform: `translateX(-50%) translateY(${isActive ? "0px" : "-4px"})`,
          opacity: isActive ? 1 : 0,
          transition: "opacity 0.2s ease, transform 0.2s ease",
          pointerEvents: "none",
        }}
      >
        {icons[id]}
      </span>
    </span>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={{
        color: "inherit",
        textDecoration: "none",
      }}>
        {inner}
      </a>
    );
  }

  return inner;
}

const socials = [
  { href: "https://linkedin.com/in/deepakaeleni", Icon: Linkedin, label: "LinkedIn" },
  { href: "https://twitter.com/itsnotskittle", Icon: Twitter, label: "Twitter" },
  { href: "https://instagram.com/skittlllle", Icon: Instagram, label: "Instagram" },
  { href: "https://github.com/skittlegit", Icon: Github, label: "GitHub" },
];

export default function Home() {
  const { isDark, toggle, fg, fgMuted } = useTheme();
  const { user, loading, signOut } = useAuth();
  const [hovered, setHovered] = useState<HoverKey>(null);
  const [hoveredSocial, setHoveredSocial] = useState<string | null>(null);

  return (
    <>
      <div
        className="relative flex flex-col"
        style={{
          fontFamily: "var(--font-playfair), Georgia, serif",
          color: fg,
          transition: "color 0.3s",
          minHeight: "100dvh",
          overflowX: "clip",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Top nav */}
        <div className="absolute top-7 left-0 right-0 z-[100] flex justify-between items-center px-6 sm:px-10 md:px-20">
          <Link
            href="/tools"
            className="text-sm tracking-widest uppercase"
            style={{
              color: fgMuted,
              textDecoration: "none",
              transition: "color 0.2s",
              fontFamily: "var(--font-playfair), Georgia, serif",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = fg; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = fgMuted; }}
          >
            Tools
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {!loading && (
              user ? (
                <button
                  onClick={() => signOut()}
                  aria-label="Sign out"
                  className="text-sm tracking-widest uppercase"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: fgMuted,
                    padding: "12px",
                    transition: "color 0.2s",
                    fontFamily: "var(--font-playfair), Georgia, serif",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = fg; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = fgMuted; }}
                >
                  Logout
                </button>
              ) : (
                <Link
                  href="/login"
                  className="text-sm tracking-widest uppercase"
                  style={{
                    color: fgMuted,
                    textDecoration: "none",
                    transition: "color 0.2s",
                    fontFamily: "var(--font-playfair), Georgia, serif",
                    padding: "12px",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = fg; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = fgMuted; }}
                >
                  Login
                </Link>
              )
            )}
            <button
              onClick={() => toggle()}
              aria-label="Toggle dark mode"
              style={{
                background: "transparent",
                border: "none",
                color: fg,
                padding: "12px",
                lineHeight: 0,
                transition: "color 0.3s",
              }}
            >
              {isDark ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        {/* Main content — vertically centered */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 sm:px-10 md:px-20 py-10 sm:py-16 md:py-0">
          <div className="flex flex-col gap-4" style={{ alignItems: "flex-start" }}>
            <p
              className="text-2xl sm:text-3xl md:text-5xl font-normal leading-snug tracking-tight"
              style={{ display: "inline-block" }}
            >
              Hey, I am Deepak.
            </p>
            <p
              className="text-2xl sm:text-3xl md:text-5xl font-normal leading-snug tracking-tight"
              style={{ display: "inline-block" }}
            >
              I like to{" "}
              <Word
                id="design"
                hovered={hovered}
                onEnter={setHovered}
                onLeave={() => setHovered(null)}
              >
                design
              </Word>
              ,{" "}
              <Word
                id="build"
                hovered={hovered}
                onEnter={setHovered}
                onLeave={() => setHovered(null)}
              >
                build
              </Word>
              , and{" "}
              <Word
                id="create"
                hovered={hovered}
                onEnter={setHovered}
                onLeave={() => setHovered(null)}
              >
                create
              </Word>{" "}
              things that work.
            </p>
            <p
              className="text-2xl sm:text-3xl md:text-5xl font-normal leading-snug tracking-tight"
              style={{ display: "inline-block" }}
            >
              Here is my{" "}
              <Word
                id="resume"
                hovered={hovered}
                onEnter={setHovered}
                onLeave={() => setHovered(null)}
                href="/resume.pdf"
              >
                Resume
              </Word>
              .
            </p>
          </div>
        </div>

        {/* Bottom contact + socials */}
        <div
          className="relative z-10 px-6 sm:px-10 md:px-20"
          style={{ paddingBottom: "max(2rem, calc(1.75rem + env(safe-area-inset-bottom, 0px)))" }}
        >
          <p
            className="text-xs tracking-widest uppercase mb-2"
            style={{ color: fgMuted }}
          >
            email&nbsp;&nbsp;|&nbsp;&nbsp;contact
          </p>
          <div
            className="text-base tracking-wide mb-6 flex flex-wrap items-center gap-x-2 gap-y-1"
          >
            <a
              href="mailto:deepakrdy7@gmail.com"
              style={{
                color: fg,
                textDecoration: "underline",
                textUnderlineOffset: 4,
                textDecorationColor: fgMuted,
              }}
            >
              deepakrdy7@gmail.com
            </a>
            <span style={{ color: fgMuted }}>|</span>
            <span>+918885015899</span>
          </div>
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 16 }}
          >
            {socials.map(({ href, Icon, label }) => {
              const isHov = hoveredSocial === label;
              return (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={() => setHoveredSocial(label)}
                  onMouseLeave={() => setHoveredSocial(null)}
                  style={{
                    color: isHov ? fg : fgMuted,
                    textDecoration: "none",
                    transition: "color 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    width: 50,
                  }}
                >
                  <Icon size={18} strokeWidth={1.5} />
                  <span
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      left: "50%",
                      transform: isHov ? "translateX(-50%) translateY(0px)" : "translateX(-50%) translateY(3px)",
                      fontSize: 9,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      opacity: isHov ? 1 : 0,
                      transition: "opacity 0.2s ease, transform 0.2s ease",
                      whiteSpace: "nowrap",
                      pointerEvents: "none",
                    }}
                  >
                    {label}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
