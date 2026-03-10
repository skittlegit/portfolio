"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import ToolLayout from "../../components/ToolLayout";
import { useTheme } from "../../context/ThemeContext";

export default function BoxShadowPage() {
  const { fg, fgMuted, isDark } = useTheme();
  const [x, setX] = useState(0);
  const [y, setY] = useState(8);
  const [blur, setBlur] = useState(24);
  const [spread, setSpread] = useState(0);
  const [color, setColor] = useState(isDark ? "#ffffff" : "#000000");
  const [opacity, setOpacity] = useState(isDark ? 15 : 12);
  const [inset, setInset] = useState(false);
  const [copied, setCopied] = useState(false);

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${(alpha / 100).toFixed(2)})`;
  };

  const shadowValue = `${inset ? "inset " : ""}${x}px ${y}px ${blur}px ${spread}px ${hexToRgba(color, opacity)}`;
  const cssText = `box-shadow: ${shadowValue};`;

  const copy = () => {
    navigator.clipboard.writeText(cssText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: fgMuted,
    marginBottom: 4,
    display: "block",
  };

  const sliderRow = (
    label: string,
    value: number,
    set: (v: number) => void,
    min: number,
    max: number
  ) => (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <label style={labelStyle}>{label}</label>
        <span className="text-xs" style={{ color: fgMuted }}>
          {value}{label === "Opacity" ? "%" : "px"}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
        style={{ width: "100%", accentColor: fg }}
      />
    </div>
  );

  return (
    <ToolLayout title="Box Shadow Generator" description="Design CSS box shadows visually.">
      <div className="flex flex-col lg:flex-row gap-10 max-w-4xl">
        {/* Preview */}
        <div className="flex-1 flex items-center justify-center" style={{ minHeight: 300 }}>
          <div
            style={{
              width: 200,
              height: 200,
              borderRadius: 16,
              backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
              boxShadow: shadowValue,
              transition: "box-shadow 0.15s ease",
            }}
          />
        </div>

        {/* Controls */}
        <div className="w-full lg:w-80">
          {sliderRow("Offset X", x, setX, -50, 50)}
          {sliderRow("Offset Y", y, setY, -50, 50)}
          {sliderRow("Blur", blur, setBlur, 0, 100)}
          {sliderRow("Spread", spread, setSpread, -50, 50)}
          {sliderRow("Opacity", opacity, setOpacity, 0, 100)}

          <div className="flex gap-4 items-end mb-5">
            <div>
              <label style={labelStyle}>Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  style={{ width: 36, height: 36, border: "none", background: "none", padding: 0 }}
                />
                <span className="text-xs" style={{ color: fgMuted, fontFamily: "monospace" }}>
                  {color}
                </span>
              </div>
            </div>
            <label
              className="flex items-center gap-2 pb-1"
              style={{ fontSize: 13, color: fg, fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              <input
                type="checkbox"
                checked={inset}
                onChange={(e) => setInset(e.target.checked)}
                style={{ accentColor: fg }}
              />
              Inset
            </label>
          </div>

          {/* CSS output */}
          <div className="flex items-center gap-2">
            <div
              style={{
                flex: 1,
                padding: "10px 12px",
                fontFamily: "monospace",
                fontSize: 12,
                borderRadius: 8,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                color: fgMuted,
                wordBreak: "break-all",
              }}
            >
              {cssText}
            </div>
            <button
              onClick={copy}
              style={{ background: "none", border: "none", color: fgMuted, flexShrink: 0 }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
