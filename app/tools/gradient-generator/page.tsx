"use client";

import { useState } from "react";
import { Copy, Check, Plus, X } from "lucide-react";
import ToolLayout from "../../components/ToolLayout";
import { useTheme } from "../../context/ThemeContext";

type GradientStop = { color: string; position: number };
type GradientType = "linear" | "radial";

export default function GradientGeneratorPage() {
  const { fg, fgMuted, isDark } = useTheme();
  const [type, setType] = useState<GradientType>("linear");
  const [angle, setAngle] = useState(135);
  const [stops, setStops] = useState<GradientStop[]>([
    { color: "#6366f1", position: 0 },
    { color: "#ec4899", position: 50 },
    { color: "#f59e0b", position: 100 },
  ]);
  const [copied, setCopied] = useState(false);

  const cssGradient = (() => {
    const stopsStr = stops
      .sort((a, b) => a.position - b.position)
      .map((s) => `${s.color} ${s.position}%`)
      .join(", ");
    if (type === "radial") return `radial-gradient(circle, ${stopsStr})`;
    return `linear-gradient(${angle}deg, ${stopsStr})`;
  })();

  const updateStop = (i: number, updates: Partial<GradientStop>) => {
    setStops((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...updates } : s)));
  };

  const addStop = () => {
    const pos = stops.length > 0 ? Math.min(100, stops[stops.length - 1].position + 20) : 50;
    setStops((prev) => [...prev, { color: "#8b5cf6", position: pos }]);
  };

  const removeStop = (i: number) => {
    if (stops.length <= 2) return;
    setStops((prev) => prev.filter((_, idx) => idx !== i));
  };

  const copy = () => {
    navigator.clipboard.writeText(`background: ${cssGradient};`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const inputStyle: React.CSSProperties = {
    padding: "8px 12px",
    fontSize: 13,
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
    textTransform: "uppercase" as const,
    color: fgMuted,
    marginBottom: 6,
    display: "block",
  };

  return (
    <ToolLayout title="CSS Gradient Generator" description="Create beautiful CSS gradients with live preview.">
      <div className="max-w-3xl">
        {/* Preview */}
        <div
          style={{
            width: "100%",
            height: 200,
            borderRadius: 14,
            background: cssGradient,
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
            marginBottom: 24,
          }}
        />

        {/* CSS output */}
        <div className="flex items-center gap-2 mb-8">
          <div
            style={{
              flex: 1,
              padding: "12px 14px",
              fontFamily: "monospace",
              fontSize: 13,
              borderRadius: 8,
              border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
              overflow: "auto",
              whiteSpace: "nowrap",
              color: fgMuted,
            }}
          >
            background: {cssGradient};
          </div>
          <button
            onClick={copy}
            style={{ background: "none", border: "none", color: fgMuted, flexShrink: 0 }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label style={labelStyle}>Type</label>
            <div className="flex gap-2">
              {(["linear", "radial"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  style={{
                    ...inputStyle,
                    background: type === t ? (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)") : "transparent",
                    color: type === t ? fg : fgMuted,
                    textTransform: "capitalize",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          {type === "linear" && (
            <div>
              <label style={labelStyle}>Angle</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={angle}
                  onChange={(e) => setAngle(Number(e.target.value))}
                  style={{ width: 120, accentColor: fg }}
                />
                <span className="text-sm" style={{ color: fgMuted, width: 36, textAlign: "right" }}>
                  {angle}°
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Color stops */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <label style={{ ...labelStyle, marginBottom: 0 }}>Color Stops</label>
            <button
              onClick={addStop}
              style={{ background: "none", border: "none", color: fgMuted }}
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {stops.map((stop, i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  type="color"
                  value={stop.color}
                  onChange={(e) => updateStop(i, { color: e.target.value })}
                  style={{ width: 36, height: 36, border: "none", background: "none", padding: 0 }}
                />
                <span className="text-xs" style={{ color: fgMuted, fontFamily: "monospace", width: 60 }}>
                  {stop.color}
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={stop.position}
                  onChange={(e) => updateStop(i, { position: Number(e.target.value) })}
                  style={{ flex: 1, accentColor: fg }}
                />
                <span className="text-xs" style={{ color: fgMuted, width: 30, textAlign: "right" }}>
                  {stop.position}%
                </span>
                {stops.length > 2 && (
                  <button
                    onClick={() => removeStop(i)}
                    style={{ background: "none", border: "none", color: fgMuted, opacity: 0.5 }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
