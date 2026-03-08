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
  const [cursor, setCursor] = useState({ x: -100, y: -100 });
  const [hovered, setHovered] = useState<HoverKey>(null);
  const [isDark, setIsDark] = useState(false);
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

  const bg = isDark ? "#000000" : "#ffffff";
  const fg = isDark ? "#ffffff" : "#000000";
  const fgMuted = isDark ? "#71717a" : "#a1a1aa";
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
        className="relative min-h-screen flex flex-col overflow-x-hidden"
        style={{
          fontFamily: "var(--font-playfair), Georgia, serif",
          backgroundColor: bg,
          color: fg,
          transition: "background-color 0.3s, color 0.3s",
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

        {/* Dark mode toggle */}
        <div style={{ position: "absolute", top: 28, right: 36, zIndex: 100 }}>
          <button
            onClick={() => setIsDark((d) => !d)}
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
        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 sm:px-10 md:px-20 py-24 md:py-0">
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
        <div className="relative z-10 px-6 sm:px-10 md:px-20 pb-8 md:pb-14">
          <p
            className="text-xs tracking-widest uppercase mb-2"
            style={{ color: fgMuted, display: "inline-block" }}
            onMouseEnter={() => setContentHovered(true)}
            onMouseLeave={() => setContentHovered(false)}
          >
            email&nbsp;&nbsp;|&nbsp;&nbsp;contact
          </p>
          <p
            className="text-base tracking-wide mb-6"
            style={{ display: "inline-block" }}
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
            &nbsp;&nbsp;|&nbsp;&nbsp;+918885015899
          </p>
          <div
            style={{ display: "flex", gap: 16, width: "fit-content" }}
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
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    width: 50,
                  }}
                >
                  <Icon size={18} strokeWidth={1.5} />
                  <span
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      opacity: isHov ? 1 : 0,
                      transform: isHov ? "translateY(0px)" : "translateY(3px)",
                      transition: "opacity 0.2s ease, transform 0.2s ease",
                      whiteSpace: "nowrap",
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
