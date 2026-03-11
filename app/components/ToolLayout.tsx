"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTheme } from "../context/ThemeContext";
import NavMenu from "./NavMenu";

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
  const { fg, fgMuted } = useTheme();

  return (
    <>
      <div
        className="tools-layout relative flex flex-col"
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
        {/* Header */}
        <header className="relative z-[100] flex items-center justify-between px-6 sm:px-10 md:px-20 pt-7 pb-4">
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
          <NavMenu />
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
