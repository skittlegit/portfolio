"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTheme } from "../context/ThemeContext";

export default function ToolLayout({
  title,
  description,
  backHref = "/tools",
  backLabel = "Tools",
  children,
}: {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
}) {
  const { isDark, toggle, bg, fg, fgMuted } = useTheme();
  const [cursor, setCursor] = useState({ x: -100, y: -100 });
  const [contentHovered, setContentHovered] = useState(false);

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
      <div
        className="custom-cursor"
        style={{
          position: "fixed",
          left: cursor.x,
          top: cursor.y,
          width: 28,
          height: 28,
          backgroundColor: contentHovered ? "transparent" : fg,
          border: contentHovered ? `1.5px solid ${fg}` : "none",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          zIndex: 9999,
          transition: "background-color 0.15s ease, border 0.15s ease",
        }}
      />

      <div
        className="tools-layout relative flex flex-col"
        style={{
          fontFamily: "var(--font-playfair), Georgia, serif",
          backgroundColor: bg,
          color: fg,
          transition: "background-color 0.3s, color 0.3s",
          minHeight: "100dvh",
          overflowX: "clip",
        }}
      >
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: glowColor,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Header */}
        <header
          className="relative z-10 flex items-center justify-between px-6 sm:px-10 md:px-20 pt-7 pb-4"
          onMouseEnter={() => setContentHovered(true)}
          onMouseLeave={() => setContentHovered(false)}
        >
          <Link
            href={backHref}
            className="flex items-center gap-2 text-sm tracking-wide"
            style={{
              color: fgMuted,
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = fg)}
            onMouseLeave={(e) => (e.currentTarget.style.color = fgMuted)}
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
            {backLabel}
          </Link>
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
        </header>

        {/* Page title */}
        <div className="relative z-10 px-6 sm:px-10 md:px-20 pt-4 pb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight">
            {title}
          </h1>
          {description && (
            <p
              className="mt-3 text-sm sm:text-base tracking-wide"
              style={{ color: fgMuted }}
            >
              {description}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 px-6 sm:px-10 md:px-20 pb-12">
          {children}
        </div>
      </div>
    </>
  );
}
