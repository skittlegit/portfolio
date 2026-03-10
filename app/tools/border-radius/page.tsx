"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import ToolLayout from "../../components/ToolLayout";
import { useTheme } from "../../context/ThemeContext";

export default function BorderRadiusPage() {
  const { fg, fgMuted, isDark } = useTheme();
  const [tl, setTl] = useState(16);
  const [tr, setTr] = useState(16);
  const [bl, setBl] = useState(16);
  const [br, setBr] = useState(16);
  const [linked, setLinked] = useState(true);
  const [size, setSize] = useState(200);
  const [copied, setCopied] = useState(false);

  const setAll = (v: number) => {
    setTl(v); setTr(v); setBl(v); setBr(v);
  };

  const handleChange = (corner: string, v: number) => {
    if (linked) {
      setAll(v);
    } else {
      if (corner === "tl") setTl(v);
      if (corner === "tr") setTr(v);
      if (corner === "bl") setBl(v);
      if (corner === "br") setBr(v);
    }
  };

  const allSame = tl === tr && tr === bl && bl === br;
  const cssValue = allSame ? `${tl}px` : `${tl}px ${tr}px ${br}px ${bl}px`;
  const cssText = `border-radius: ${cssValue};`;

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

  return (
    <ToolLayout title="Border Radius Generator" description="Visually design CSS border-radius values.">
      <div className="flex flex-col lg:flex-row gap-10 max-w-4xl">
        {/* Preview */}
        <div className="flex-1 flex items-center justify-center" style={{ minHeight: 300 }}>
          <div
            style={{
              width: size,
              height: size,
              borderRadius: `${tl}px ${tr}px ${br}px ${bl}px`,
              background: isDark
                ? "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))"
                : "linear-gradient(135deg, rgba(0,0,0,0.04), rgba(0,0,0,0.01))",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
              transition: "border-radius 0.15s ease",
            }}
          />
        </div>

        {/* Controls */}
        <div className="w-full lg:w-72">
          <div className="mb-5">
            <label className="flex items-center gap-2 mb-4" style={{ fontSize: 13, color: fg, fontFamily: "var(--font-playfair), Georgia, serif" }}>
              <input
                type="checkbox"
                checked={linked}
                onChange={(e) => setLinked(e.target.checked)}
                style={{ accentColor: fg }}
              />
              Link corners
            </label>
          </div>

          {[
            { label: "Top Left", val: tl, key: "tl" },
            { label: "Top Right", val: tr, key: "tr" },
            { label: "Bottom Left", val: bl, key: "bl" },
            { label: "Bottom Right", val: br, key: "br" },
          ].map(({ label, val, key }) => (
            <div key={key} className="mb-4">
              <div className="flex justify-between mb-1">
                <label style={labelStyle}>{label}</label>
                <span className="text-xs" style={{ color: fgMuted }}>{val}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.floor(size / 2)}
                value={val}
                onChange={(e) => handleChange(key, Number(e.target.value))}
                style={{ width: "100%", accentColor: fg }}
              />
            </div>
          ))}

          <div className="mb-5">
            <div className="flex justify-between mb-1">
              <label style={labelStyle}>Box Size</label>
              <span className="text-xs" style={{ color: fgMuted }}>{size}px</span>
            </div>
            <input
              type="range"
              min={80}
              max={300}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              style={{ width: "100%", accentColor: fg }}
            />
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
