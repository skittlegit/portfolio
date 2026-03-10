"use client";

import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import ToolLayout from "../../components/ToolLayout";
import { useTheme } from "../../context/ThemeContext";

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("")
  );
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export default function ColorConverterPage() {
  const { fg, fgMuted, isDark } = useTheme();
  const [hex, setHex] = useState("#6366f1");
  const [rgb, setRgb] = useState({ r: 99, g: 102, b: 241 });
  const [hsl, setHsl] = useState({ h: 239, s: 84, l: 67 });
  const [copied, setCopied] = useState<string | null>(null);

  const updateFromHex = (val: string) => {
    setHex(val);
    const parsed = hexToRgb(val);
    if (parsed) {
      setRgb(parsed);
      setHsl(rgbToHsl(parsed.r, parsed.g, parsed.b));
    }
  };

  const updateFromRgb = (r: number, g: number, b: number) => {
    setRgb({ r, g, b });
    setHex(rgbToHex(r, g, b));
    setHsl(rgbToHsl(r, g, b));
  };

  useEffect(() => {
    updateFromHex(hex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    fontSize: 14,
    fontFamily: "var(--font-playfair), Georgia, serif",
    color: fg,
    backgroundColor: "transparent",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
    borderRadius: 8,
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: fgMuted,
    marginBottom: 6,
    display: "block",
  };

  const CopyBtn = ({ text, label }: { text: string; label: string }) => (
    <button
      onClick={() => copy(text, label)}
      style={{ background: "none", border: "none", color: fgMuted, padding: 4 }}
    >
      {copied === label ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );

  return (
    <ToolLayout title="Color Converter" description="Convert between HEX, RGB, and HSL color formats.">
      <div className="max-w-md">
        {/* Preview */}
        <div
          style={{
            width: "100%",
            height: 80,
            borderRadius: 10,
            backgroundColor: hex,
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
            marginBottom: 28,
          }}
        />

        {/* HEX */}
        <div className="mb-5">
          <label style={labelStyle}>HEX</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={hex}
              onChange={(e) => updateFromHex(e.target.value)}
              style={inputStyle}
            />
            <CopyBtn text={hex} label="hex" />
          </div>
        </div>

        {/* RGB */}
        <div className="mb-5">
          <label style={labelStyle}>RGB</label>
          <div className="flex gap-2 items-center">
            {(["r", "g", "b"] as const).map((ch) => (
              <input
                key={ch}
                type="number"
                min={0}
                max={255}
                value={rgb[ch]}
                onChange={(e) =>
                  updateFromRgb(
                    ch === "r" ? Number(e.target.value) : rgb.r,
                    ch === "g" ? Number(e.target.value) : rgb.g,
                    ch === "b" ? Number(e.target.value) : rgb.b
                  )
                }
                style={{ ...inputStyle, textAlign: "center" }}
              />
            ))}
            <CopyBtn text={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`} label="rgb" />
          </div>
        </div>

        {/* HSL */}
        <div className="mb-5">
          <label style={labelStyle}>HSL</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`}
              style={{ ...inputStyle, opacity: 0.7 }}
            />
            <CopyBtn text={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`} label="hsl" />
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
