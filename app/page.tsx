"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "./context/ThemeContext";

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
      {children}
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
      <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>
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
  const { isDark, toggle, bg, fg, fgMuted } = useTheme();
  const [cursor, setCursor] = useState({ x: -100, y: -100 });
  const [hovered, setHovered] = useState<HoverKey>(null);
  const [hoveredSocial, setHoveredSocial] = useState<string | null>(null);
  const [buttonHovered, setButtonHovered] = useState(false);
  const [contentHovered, setContentHovered] = useState(false);

  const showRing = hovered !== null || hoveredSocial !== null || buttonHovered || contentHovered;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursor({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const glowColor = isDark
    ? `radial-gradient(500px circle at ${cursor.x}px ${cursor.y}px, rgba(255,255,255,0.06), transparent 70%)`
    : `radial-gradient(500px circle at ${cursor.x}px ${cursor.y}px, rgba(0,0,0,0.05), transparent 70%)`;

  return (
    <>
      {/* Custom cursor — solid dot normally, ring on interactive content */}
      <div
        className="custom-cursor"
        style={{
          position: "fixed",
          left: cursor.x,
          top: cursor.y,
          width: 28,
          height: 28,
          backgroundColor: showRing ? "transparent" : fg,
          border: showRing ? `1.5px solid ${fg}` : "none",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          zIndex: 9999,
          transition: "background-color 0.15s ease, border-color 0.3s ease",
        }}
      />

      <div
        className="relative flex flex-col"
        style={{
          fontFamily: "var(--font-playfair), Georgia, serif",
          backgroundColor: bg,
          color: fg,
          transition: "background-color 0.3s, color 0.3s",
          minHeight: "100dvh",
          overflowX: "clip",
        }}
      >
        {/* Interactive background glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: glowColor,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Top nav */}
        <div style={{ position: "absolute", top: 28, left: 36, right: 36, zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link
            href="/tools"
            className="text-sm tracking-widest uppercase"
            style={{
              color: fgMuted,
              textDecoration: "none",
              transition: "color 0.2s",
              fontFamily: "var(--font-playfair), Georgia, serif",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = fg; setContentHovered(true); }}
            onMouseLeave={(e) => { e.currentTarget.style.color = fgMuted; setContentHovered(false); }}
          >
            Tools
          </Link>
          <button
            onClick={() => toggle()}
            onMouseEnter={() => setButtonHovered(true)}
            onMouseLeave={() => setButtonHovered(false)}
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

        {/* Main content — vertically centered */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 sm:px-10 md:px-20 py-10 sm:py-16 md:py-0">
          <div className="flex flex-col gap-4" style={{ alignItems: "flex-start" }}>
            <p
              className="text-2xl sm:text-3xl md:text-5xl font-normal leading-snug tracking-tight"
              style={{ display: "inline-block" }}
              onMouseEnter={() => setContentHovered(true)}
              onMouseLeave={() => setContentHovered(false)}
            >
              Hey, I am Deepak.
            </p>
            <p
              className="text-2xl sm:text-3xl md:text-5xl font-normal leading-snug tracking-tight"
              style={{ display: "inline-block" }}
              onMouseEnter={() => setContentHovered(true)}
              onMouseLeave={() => setContentHovered(false)}
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
              onMouseEnter={() => setContentHovered(true)}
              onMouseLeave={() => setContentHovered(false)}
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
            onMouseEnter={() => setContentHovered(true)}
            onMouseLeave={() => setContentHovered(false)}
          >
            email&nbsp;&nbsp;|&nbsp;&nbsp;contact
          </p>
          <div
            className="text-base tracking-wide mb-6 flex flex-wrap items-center gap-x-2 gap-y-1"
            onMouseEnter={() => setContentHovered(true)}
            onMouseLeave={() => setContentHovered(false)}
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
            onMouseEnter={() => setContentHovered(true)}
            onMouseLeave={() => setContentHovered(false)}
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
