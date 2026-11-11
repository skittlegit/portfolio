"use client";

import { useState } from "react";
import Link from "next/link";
import {
  QrCode,
  Paintbrush,
  Layers,
  Terminal,
  CircleDot,
  FileArchive,
  FileImage,
  LayoutGrid,
  Dna,
  Shapes,
  Pipette,
  Hexagon,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import ToolLayout from "../components/ToolLayout";
import { TOOLS } from "../lib/tools";

// Icons are the only per-tool data that lives here; names, slugs and
// descriptions come from the shared list in lib/tools.
const ICONS: Record<string, LucideIcon> = {
  "qr-code": QrCode,
  "palette-generator": Paintbrush,
  "gradient-generator": Layers,
  "ascii-art": Terminal,
  halftone: CircleDot,
  "image-compressor": FileArchive,
  "images-to-pdf": FileImage,
  "pattern-library": LayoutGrid,
  "generative-art": Dna,
  "vector-art": Shapes,
  "color-converter": Pipette,
  "logo-maker": Hexagon,
};

const tools = TOOLS.map((t) => ({ ...t, icon: ICONS[t.slug] ?? Shapes }));

export default function ToolsPage() {
  const [hov, setHov] = useState<string | null>(null);

  return (
    <ToolLayout
      title="Tools"
      description="Free browser-based design & dev utilities. No sign-up, no tracking. Everything runs locally in your browser."
      backHref="/"
      backLabel="Home"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 14 }}>
        {tools.map(({ slug, name, description, icon: Icon }, i) => {
          const on = hov === slug;
          return (
            <Link
              key={slug}
              href={`/tools/${slug}`}
              data-cursor="open ↗"
              onMouseEnter={() => setHov(slug)}
              onMouseLeave={() => setHov(null)}
              style={{
                position: "relative",
                textDecoration: "none",
                color: "inherit",
                border: "1px solid var(--line)",
                background: "var(--bg-raised)",
                padding: "22px 22px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 0,
                minHeight: 200,
                boxShadow: on ? "inset 0 0 0 1px var(--accent)" : "none",
                transform: on ? "translateY(-3px)" : "none",
                transition: "box-shadow 0.3s var(--ease-out), transform 0.3s var(--ease-out)",
              }}
            >
              {/* top row */}
              <div className="flex items-start justify-between">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 44,
                    height: 44,
                    border: "1px solid var(--line)",
                    background: on ? "var(--accent)" : "transparent",
                    transition: "background 0.25s ease",
                  }}
                >
                  <Icon size={19} strokeWidth={1.5} style={{ color: on ? "var(--accent-ink)" : "var(--fg-muted)", transition: "color 0.25s" }} />
                </div>
                <span className="numeral" style={{ fontSize: 30, lineHeight: 1, color: "var(--fg-faint)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>

              {/* text */}
              <div style={{ marginTop: 18 }}>
                <p className="heading" style={{ fontSize: 17, letterSpacing: "-0.01em", color: "var(--fg)", marginBottom: 7 }}>{name}</p>
                <p className="mono" style={{ fontSize: 12, lineHeight: 1.6, color: "var(--fg-muted)" }}>{description}</p>
              </div>

              {/* open footer */}
              <div className="flex items-center justify-between" style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                <span className="mono" style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: on ? "var(--accent)" : "var(--fg-faint)", transition: "color 0.25s" }}>Open tool</span>
                <ArrowUpRight size={15} strokeWidth={1.75} style={{ color: "var(--accent)", transform: on ? "translate(2px,-2px)" : "none", transition: "transform 0.25s var(--ease-out)" }} />
              </div>
            </Link>
          );
        })}
      </div>
    </ToolLayout>
  );
}
