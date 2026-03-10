"use client";

import { useState, useRef, useEffect } from "react";
import { Download } from "lucide-react";
import ToolLayout from "../../components/ToolLayout";
import { useTheme } from "../../context/ThemeContext";

export default function PlaceholderImagePage() {
  const { fg, fgMuted, isDark } = useTheme();
  const [width, setWidth] = useState(600);
  const [height, setHeight] = useState(400);
  const [bgColor, setBgColor] = useState(isDark ? "#1a1a1a" : "#f0f0f0");
  const [textColor, setTextColor] = useState(isDark ? "#71717a" : "#a1a1aa");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    const text = `${width} × ${height}`;
    const fontSize = Math.max(14, Math.min(width, height) / 8);
    ctx.font = `${fontSize}px Georgia, serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, width / 2, height / 2);
  }, [width, height, bgColor, textColor]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `placeholder-${width}x${height}.png`;
    a.click();
  };

  const inputStyle: React.CSSProperties = {
    padding: "10px 12px",
    fontSize: 14,
    fontFamily: "var(--font-playfair), Georgia, serif",
    color: fg,
    backgroundColor: "transparent",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
    borderRadius: 8,
    outline: "none",
    textAlign: "center",
  };

  return (
    <ToolLayout title="Placeholder Image" description="Generate placeholder images with custom sizes.">
      <div className="max-w-xl">
        <div className="flex flex-wrap gap-4 mb-6 items-end">
          <div>
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: fgMuted }}>Width</p>
            <input
              type="number"
              value={width}
              min={50}
              max={2000}
              onChange={(e) => setWidth(Number(e.target.value))}
              style={{ ...inputStyle, width: 80 }}
            />
          </div>
          <span style={{ color: fgMuted, paddingBottom: 10 }}>×</span>
          <div>
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: fgMuted }}>Height</p>
            <input
              type="number"
              value={height}
              min={50}
              max={2000}
              onChange={(e) => setHeight(Number(e.target.value))}
              style={{ ...inputStyle, width: 80 }}
            />
          </div>
          <div>
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: fgMuted }}>Background</p>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              style={{ width: 40, height: 40, border: "none", background: "none", padding: 0 }}
            />
          </div>
          <div>
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: fgMuted }}>Text</p>
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              style={{ width: 40, height: 40, border: "none", background: "none", padding: 0 }}
            />
          </div>
        </div>

        <div
          style={{
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
            borderRadius: 10,
            overflow: "hidden",
            display: "inline-block",
            maxWidth: "100%",
          }}
        >
          <canvas
            ref={canvasRef}
            style={{ maxWidth: "100%", height: "auto", display: "block" }}
          />
        </div>

        <button
          onClick={download}
          className="flex items-center gap-2 text-sm tracking-wide mt-4"
          style={{
            color: fgMuted,
            background: "transparent",
            border: "none",
            fontFamily: "var(--font-playfair), Georgia, serif",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = fg)}
          onMouseLeave={(e) => (e.currentTarget.style.color = fgMuted)}
        >
          <Download size={14} strokeWidth={1.5} />
          Download PNG
        </button>
      </div>
    </ToolLayout>
  );
}
