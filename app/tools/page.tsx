"use client";

import { useState } from "react";
import Link from "next/link";
import {
  QrCode,
  Palette,
  Hash,
  TextCursorInput,
  Lock,
  Binary,
  Paintbrush,
  Layers,
  ArrowRightLeft,
  Type,
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
    description: "Create linear and radial CSS gradients",
    icon: Layers,
  },
  {
    slug: "color-converter",
    name: "Color Converter",
    description: "Convert between HEX, RGB, and HSL",
    icon: Palette,
  },
  {
    slug: "font-stack",
    name: "Font Stack Preview",
    description: "Preview and copy modern CSS font stacks",
    icon: Type,
  },
  {
    slug: "unit-converter",
    name: "CSS Unit Converter",
    description: "Convert between px, rem, em, vw, and more",
    icon: ArrowRightLeft,
  },
  {
    slug: "word-counter",
    name: "Word Counter",
    description: "Count words, characters, and sentences",
    icon: Hash,
  },
  {
    slug: "lorem-generator",
    name: "Lorem Ipsum Generator",
    description: "Generate placeholder text",
    icon: TextCursorInput,
  },
  {
    slug: "password-generator",
    name: "Password Generator",
    description: "Generate secure random passwords",
    icon: Lock,
  },
  {
    slug: "base64",
    name: "Base64 Encoder/Decoder",
    description: "Encode or decode Base64 strings",
    icon: Binary,
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
