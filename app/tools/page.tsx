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
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import ToolLayout from "../components/ToolLayout";

const tools: { slug: string; name: string; description: string; icon: LucideIcon }[] = [
  { slug: "qr-code", name: "QR Code Generator", description: "Generate QR codes with custom size, colors, and format.", icon: QrCode },
  { slug: "palette-generator", name: "Color Palette Generator", description: "Generate color palettes — press space or generate.", icon: Paintbrush },
  { slug: "gradient-generator", name: "CSS Gradient Generator", description: "Create CSS gradients or extract them from photos.", icon: Layers },
  { slug: "ascii-art", name: "ASCII Art Generator", description: "Convert text or images into ASCII art.", icon: Terminal },
  { slug: "halftone", name: "Halftone Dots Effect", description: "Transform images into halftone dot patterns.", icon: CircleDot },
  { slug: "image-compressor", name: "Image Compressor", description: "Compress images right in your browser — no uploads.", icon: FileArchive },
  { slug: "images-to-pdf", name: "Images to PDF", description: "Combine multiple images into a single PDF.", icon: FileImage },
  { slug: "pattern-library", name: "Pattern Library", description: "Generate repeating SVG patterns for backgrounds.", icon: LayoutGrid },
  { slug: "generative-art", name: "Generative Bio Art", description: "Create organic, biology-inspired generative art.", icon: Dna },
  { slug: "vector-art", name: "Vector Art Generator", description: "Generate vector illustrations in various styles.", icon: Shapes },
];

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
