"use client";

import { useState } from "react";
import Link from "next/link";
import {
  QrCode,
  Palette,
  Paintbrush,
  Layers,
  Terminal,
  CircleDot,
  FileArchive,
  FileImage,
  LayoutGrid,
  Dna,
  Shapes,
  Stamp,
} from "lucide-react";
import ToolLayout from "../components/ToolLayout";
import { useTheme } from "../context/ThemeContext";

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
    slug: "color-converter",
    name: "Color Converter",
    description: "Convert between HEX, RGB, and HSL",
    icon: Palette,
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
  {
    slug: "logo-maker",
    name: "Logo Maker",
    description: "Create simple, clean logos with shapes and typography",
    icon: Stamp,
  },
];

export default function ToolsPage() {
  const { fg, fgMuted, isDark } = useTheme();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <ToolLayout
      title="Tools"
      description="A collection of small, useful utilities."
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
              style={{
                textDecoration: "none",
                color: "inherit",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                borderRadius: 12,
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                transition: "border-color 0.2s, background-color 0.2s",
                backgroundColor: isHov
                  ? isDark
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(0,0,0,0.02)"
                  : "transparent",
                borderColor: isHov
                  ? isDark
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(0,0,0,0.2)"
                  : isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.08)",
              }}
              onMouseEnter={() => setHoveredCard(slug)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <Icon
                size={22}
                strokeWidth={1.5}
                style={{ color: isHov ? fg : fgMuted, transition: "color 0.2s" }}
              />
              <div>
                <p className="text-base font-normal tracking-tight">{name}</p>
                <p
                  className="text-xs mt-1 tracking-wide"
                  style={{ color: fgMuted }}
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
