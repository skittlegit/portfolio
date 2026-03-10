"use client";

import { useState, useCallback, useEffect } from "react";
import { Copy, Check, RefreshCw, Lock, Unlock } from "lucide-react";
import ToolLayout from "../../components/ToolLayout";
import NumberStepper from "../../components/NumberStepper";
import { useTheme } from "../../context/ThemeContext";

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function randomColor(): string {
  const h = Math.floor(Math.random() * 360);
  const s = 50 + Math.floor(Math.random() * 40);
  const l = 35 + Math.floor(Math.random() * 35);
  return hslToHex(h, s, l);
}

function contrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.5 ? "#000000" : "#ffffff";
}

type PaletteColor = { hex: string; locked: boolean };

function generatePalette(existing: PaletteColor[]): PaletteColor[] {
  return existing.map((c) => (c.locked ? c : { hex: randomColor(), locked: false }));
}

function generateHarmony(
  type: "analogous" | "complementary" | "triadic" | "split-complementary" | "monochromatic",
  count: number
): PaletteColor[] {
  const baseH = Math.floor(Math.random() * 360);
  const baseS = 55 + Math.floor(Math.random() * 30);
  const baseL = 40 + Math.floor(Math.random() * 25);
  const colors: string[] = [];

  switch (type) {
    case "analogous":
      for (let i = 0; i < count; i++) {
        colors.push(hslToHex((baseH + i * 30 - ((count - 1) * 15)) % 360, baseS, baseL + i * 3 - 6));
      }
      break;
    case "complementary":
      for (let i = 0; i < count; i++) {
        const h = i < count / 2 ? baseH : (baseH + 180) % 360;
        const lOff = (i % Math.ceil(count / 2)) * 8 - 8;
        colors.push(hslToHex(h, baseS, Math.max(20, Math.min(80, baseL + lOff))));
      }
      break;
    case "triadic":
      for (let i = 0; i < count; i++) {
        const h = (baseH + Math.floor(i / Math.ceil(count / 3)) * 120) % 360;
        const lOff = (i % Math.ceil(count / 3)) * 8 - 4;
        colors.push(hslToHex(h, baseS, Math.max(20, Math.min(80, baseL + lOff))));
      }
      break;
    case "split-complementary":
      colors.push(hslToHex(baseH, baseS, baseL));
      for (let i = 1; i < count; i++) {
        const h = i % 2 === 0 ? (baseH + 150) % 360 : (baseH + 210) % 360;
        const lOff = Math.floor(i / 2) * 6;
        colors.push(hslToHex(h, baseS, Math.max(20, Math.min(80, baseL + lOff))));
      }
      break;
    case "monochromatic":
      for (let i = 0; i < count; i++) {
        const l = 25 + Math.floor((55 / (count - 1 || 1)) * i);
        colors.push(hslToHex(baseH, baseS, l));
      }
      break;
  }
  return colors.map((hex) => ({ hex, locked: false }));
}

export default function PaletteGeneratorPage() {
  const { fg, fgMuted, isDark } = useTheme();
  const [count, setCount] = useState(5);
  const [colors, setColors] = useState<PaletteColor[]>(() =>
    Array.from({ length: 5 }, () => ({ hex: randomColor(), locked: false }))
  );
  const [copied, setCopied] = useState<number | null>(null);
  const [harmony, setHarmony] = useState<string>("random");

  const regenerate = useCallback(() => {
    if (harmony === "random") {
      setColors((prev) => {
        const padded = [...prev];
        while (padded.length < count)
          padded.push({ hex: randomColor(), locked: false });
        return generatePalette(padded.slice(0, count));
      });
    } else {
      setColors(
        generateHarmony(
          harmony as "analogous" | "complementary" | "triadic" | "split-complementary" | "monochromatic",
          count
        )
      );
    }
  }, [count, harmony]);

  const toggleLock = (i: number) => {
    setColors((prev) => prev.map((c, idx) => (idx === i ? { ...c, locked: !c.locked } : c)));
  };

  const updateColor = (i: number, hex: string) => {
    setColors((prev) => prev.map((c, idx) => (idx === i ? { ...c, hex } : c)));
  };

  const copy = (hex: string, i: number) => {
    navigator.clipboard.writeText(hex);
    setCopied(i);
    setTimeout(() => setCopied(null), 1500);
  };

  const exportCSS = () => {
    const vars = colors.map((c, i) => `  --color-${i + 1}: ${c.hex};`).join("\n");
    const css = `:root {\n${vars}\n}`;
    navigator.clipboard.writeText(css);
    setCopied(-1);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleCountChange = (newCount: number) => {
    setCount(newCount);
    setColors((prev) => {
      if (newCount > prev.length) {
        return [...prev, ...Array.from({ length: newCount - prev.length }, () => ({ hex: randomColor(), locked: false }))];
      }
      return prev.slice(0, newCount);
    });
  };

  return (
    <ToolLayout title="Color Palette Generator" description="Generate beautiful color palettes. Press spacebar or click generate.">
      <div className="max-w-4xl">
        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-8 items-center">
          <button
            onClick={regenerate}
            className="tool-btn"
          >
            <RefreshCw size={14} strokeWidth={1.5} />
            Generate
          </button>
          <select
            value={harmony}
            onChange={(e) => setHarmony(e.target.value)}
            className="tool-select"
          >
            <option value="random">Random</option>
            <option value="analogous">Analogous</option>
            <option value="complementary">Complementary</option>
            <option value="triadic">Triadic</option>
            <option value="split-complementary">Split Complementary</option>
            <option value="monochromatic">Monochromatic</option>
          </select>
          <NumberStepper value={count} onChange={handleCountChange} min={2} max={10} label="Colors" />
          <button
            onClick={exportCSS}
            className="tool-btn"
            style={copied === -1 ? { color: fg } : undefined}
          >
            {copied === -1 ? "Copied CSS!" : "Export CSS"}
          </button>
        </div>

        {/* Palette display */}
        <div
          className="flex flex-col sm:flex-row"
          style={{
            borderRadius: 14,
            overflow: "hidden",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
            minHeight: 340,
          }}
        >
          {colors.map((color, i) => {
            const textColor = contrastColor(color.hex);
            const hsl = hexToHsl(color.hex);
            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center justify-end gap-3 pb-6 pt-8 px-2 relative"
                style={{
                  backgroundColor: color.hex,
                  transition: "background-color 0.3s",
                  minHeight: 100,
                }}
              >
                {/* Lock button */}
                <button
                  onClick={() => toggleLock(i)}
                  style={{
                    position: "absolute",
                    top: 14,
                    right: 14,
                    background: "none",
                    border: "none",
                    color: textColor,
                    opacity: color.locked ? 1 : 0.4,
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.opacity = color.locked ? "1" : "0.4")
                  }
                >
                  {color.locked ? (
                    <Lock size={16} strokeWidth={1.5} />
                  ) : (
                    <Unlock size={16} strokeWidth={1.5} />
                  )}
                </button>

                {/* Edit hex input */}
                <input
                  type="text"
                  value={color.hex}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#[0-9a-fA-F]{0,6}$/.test(val)) {
                      if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                        updateColor(i, val.toLowerCase());
                      }
                    }
                  }}
                  maxLength={7}
                  style={{
                    position: "absolute",
                    top: 14,
                    left: 14,
                    width: 52,
                    background: "none",
                    border: "none",
                    borderBottom: `1px solid ${textColor}`,
                    color: textColor,
                    opacity: 0.5,
                    fontSize: 10,
                    fontFamily: "monospace",
                    padding: "2px 0",
                    outline: "none",
                    textAlign: "center",
                  }}
                  title="Edit color"
                />

                {/* HSL info */}
                <span
                  style={{
                    fontSize: 10,
                    color: textColor,
                    opacity: 0.5,
                    letterSpacing: "0.05em",
                  }}
                >
                  {hsl.h}° {hsl.s}% {hsl.l}%
                </span>

                {/* Hex value + copy */}
                <button
                  onClick={() => copy(color.hex, i)}
                  style={{
                    background: "none",
                    border: "none",
                    color: textColor,
                    fontFamily: "monospace",
                    fontSize: 14,
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {color.hex.toUpperCase()}
                  {copied === i ? <Check size={12} /> : <Copy size={12} style={{ opacity: 0.5 }} />}
                </button>
              </div>
            );
          })}
        </div>

        {/* Keyboard hint */}
        <p className="text-xs mt-4 tracking-wide" style={{ color: fgMuted }}>
          Press <kbd style={{ padding: "2px 6px", borderRadius: 4, border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`, fontSize: 11 }}>Space</kbd> to generate new colors. Lock colors to keep them.
        </p>
      </div>

      {/* Spacebar handler */}
      <SpacebarHandler onSpace={regenerate} />
    </ToolLayout>
  );
}

function SpacebarHandler({ onSpace }: { onSpace: () => void }) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target instanceof HTMLSelectElement)
      ) {
        e.preventDefault();
        onSpace();
      }
    },
    [onSpace]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return null;
}
