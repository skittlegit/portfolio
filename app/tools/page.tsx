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
} from "lucide-react";
import ToolLayout from "../components/ToolLayout";

const tools = [
  {
    slug: "qr-code",
    name: "QR Code Generator",
    description: "Generate QR codes with custom size, colors, and format",
    icon: QrCode,
  },
  {
    slug: "palette-generator",
    name: "Color Palette Generator",
    description: "Generate color palettes like Coolors.co",
    icon: Paintbrush,
  },
  {
    slug: "gradient-generator",
    name: "CSS Gradient Generator",
    description: "Create CSS gradients or extract them from photos",
    icon: Layers,
  },
  {
    slug: "ascii-art",
    name: "ASCII Art Generator",
    description: "Convert text or images into ASCII art",
    icon: Terminal,
  },
  {
    slug: "halftone",
    name: "Halftone Dots Effect",
    description: "Transform images into halftone dot patterns",
    icon: CircleDot,
  },
  {
    slug: "image-compressor",
    name: "Image Compressor",
    description: "Compress images right in your browser",
    icon: FileArchive,
  },
  {
    slug: "images-to-pdf",
    name: "Images to PDF",
    description: "Combine multiple images into a single PDF",
    icon: FileImage,
  },
  {
    slug: "pattern-library",
    name: "Pattern Library",
    description: "Generate repeating SVG patterns for backgrounds",
    icon: LayoutGrid,
  },
  {
    slug: "generative-art",
    name: "Generative Bio Art",
    description: "Create organic, biology-inspired generative art",
    icon: Dna,
  },
  {
    slug: "vector-art",
    name: "Vector Art Generator",
    description: "Generate vector illustrations with various styles",
    icon: Shapes,
  },
];

export default function ToolsPage() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <ToolLayout
      title="Tools"
      description="Free browser-based design & dev utilities. No sign-up, no tracking."
      backHref="/"
      backLabel="Home"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map(({ slug, name, description, icon: Icon }) => {
          const isHov = hoveredCard === slug;
          return (
            <Link
              key={slug}
              href={`/tools/${slug}`}
              data-cursor-hover
              style={{
                textDecoration: "none",
                color: "inherit",
                border: `1px solid ${isHov ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 14,
                padding: "28px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
                transition:
                  "border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease",
                backgroundColor: isHov ? "var(--surface)" : "transparent",
                transform: isHov ? "translateY(-2px)" : "translateY(0)",
              }}
              onMouseEnter={() => setHoveredCard(slug)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: isHov
                    ? "var(--accent)"
                    : "var(--surface)",
                  transition: "background 0.2s ease",
                }}
              >
                <Icon
                  size={18}
                  strokeWidth={1.5}
                  style={{
                    color: isHov ? "var(--bg)" : "var(--fg-muted)",
                    transition: "color 0.2s",
                  }}
                />
              </div>
              <div>
                <p className="heading text-base tracking-tight">{name}</p>
                <p
                  className="mono text-xs mt-1.5 leading-relaxed"
                  style={{ color: "var(--fg-muted)" }}
                >
                  {description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </ToolLayout>
  );
}
