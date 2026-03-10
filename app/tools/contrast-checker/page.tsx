"use client";

import { useState, useMemo } from "react";
import { Copy, Check } from "lucide-react";
import ToolLayout from "../../components/ToolLayout";
import ColorPicker from "../../components/ColorPicker";
import { useTheme } from "../../context/ThemeContext";

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1: string, hex2: string): number {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  const l1 = luminance(c1.r, c1.g, c1.b);
  const l2 = luminance(c2.r, c2.g, c2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function wcagGrade(ratio: number): { aa: boolean; aaLarge: boolean; aaa: boolean; aaaLarge: boolean } {
  return {
    aa: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaa: ratio >= 7,
    aaaLarge: ratio >= 4.5,
  };
}

export default function ContrastCheckerPage() {
  const { fgMuted, isDark } = useTheme();
  const [fgColor, setFgColor] = useState(isDark ? "#ffffff" : "#000000");
  const [bgColor, setBgColor] = useState(isDark ? "#1a1a1a" : "#ffffff");
  const [copied, setCopied] = useState<string | null>(null);

  const ratio = useMemo(() => contrastRatio(fgColor, bgColor), [fgColor, bgColor]);
  const grade = useMemo(() => wcagGrade(ratio), [ratio]);

  const swap = () => {
    setFgColor(bgColor);
    setBgColor(fgColor);
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  const passStyle: React.CSSProperties = {
    padding: "4px 10px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
    fontFamily: "monospace",
  };

  return (
    <ToolLayout title="Contrast Checker" description="Check WCAG color contrast ratios for accessibility.">
      <div className="max-w-xl">
        {/* Preview */}
        <div
          style={{
            padding: "40px 24px",
            borderRadius: 14,
            backgroundColor: bgColor,
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          <p
            style={{
              color: fgColor,
              fontSize: 28,
              fontFamily: "var(--font-playfair), Georgia, serif",
              marginBottom: 8,
            }}
          >
            The quick brown fox
          </p>
          <p style={{ color: fgColor, fontSize: 14, opacity: 0.8 }}>
            jumps over the lazy dog
          </p>
        </div>

        {/* Ratio display */}
        <div className="text-center mb-6">
          <p className="text-4xl font-normal tracking-tight mb-1">
            {ratio.toFixed(2)}:1
          </p>
          <p className="text-xs tracking-widest uppercase" style={{ color: fgMuted }}>
            Contrast Ratio
          </p>
        </div>

        {/* WCAG grades */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {[
            { label: "AA", pass: grade.aa },
            { label: "AA Large", pass: grade.aaLarge },
            { label: "AAA", pass: grade.aaa },
            { label: "AAA Large", pass: grade.aaaLarge },
          ].map(({ label, pass }) => (
            <span
              key={label}
              style={{
                ...passStyle,
                backgroundColor: pass
                  ? isDark ? "rgba(34,197,94,0.15)" : "rgba(34,197,94,0.1)"
                  : isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.1)",
                color: pass ? "#22c55e" : "#ef4444",
              }}
            >
              {pass ? "✓" : "✗"} {label}
            </span>
          ))}
        </div>

        {/* Color pickers */}
        <div className="flex gap-5 items-start flex-wrap mb-4">
          <ColorPicker
            value={fgColor}
            onChange={setFgColor}
            label="Foreground"
          />

          <div style={{ paddingTop: 22 }}>
            <button
              onClick={swap}
              style={{
                background: "none",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
                borderRadius: 10,
                padding: "8px 14px",
                color: fgMuted,
                fontSize: 13,
                fontFamily: "var(--font-playfair), Georgia, serif",
                transition: "color 0.2s",
              }}
            >
              ↔ Swap
            </button>
          </div>

          <ColorPicker
            value={bgColor}
            onChange={setBgColor}
            label="Background"
          />

          <div className="flex gap-3" style={{ paddingTop: 22 }}>
            <button
              onClick={() => copy(fgColor, "fg")}
              style={{
                background: "none",
                border: "none",
                color: fgMuted,
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontFamily: "monospace",
              }}
            >
              {copied === "fg" ? <Check size={12} /> : <Copy size={12} />}
              FG
            </button>
            <button
              onClick={() => copy(bgColor, "bg")}
              style={{
                background: "none",
                border: "none",
                color: fgMuted,
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontFamily: "monospace",
              }}
            >
              {copied === "bg" ? <Check size={12} /> : <Copy size={12} />}
              BG
            </button>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
