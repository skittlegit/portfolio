"use client";

import { useState, useMemo } from "react";
import { Copy, Check } from "lucide-react";
import ToolLayout from "../../components/ToolLayout";
import { useTheme } from "../../context/ThemeContext";

const FONT_STACKS: Record<string, string> = {
  "System UI": "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  "Transitional": "Charter, 'Bitstream Charter', 'Sitka Text', Cambria, serif",
  "Old Style": "'Iowan Old Style', 'Palatino Linotype', 'URW Palladio L', P052, serif",
  "Humanist": "Seravek, 'Gill Sans Nova', Ubuntu, Calibri, 'DejaVu Sans', source-sans-pro, sans-serif",
  "Geometric Humanist": "Avenir, Montserrat, Corbel, 'URW Gothic', source-sans-pro, sans-serif",
  "Classical Humanist": "Optima, Candara, 'Noto Sans', source-sans-pro, sans-serif",
  "Neo-Grotesque": "Inter, Roboto, 'Helvetica Neue', 'Arial Nova', 'Nimbus Sans', Arial, sans-serif",
  "Monospace Slab": "'Nimbus Mono PS', 'Courier New', monospace",
  "Monospace Code": "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace",
  "Industrial": "Bahnschrift, 'DIN Alternate', 'Franklin Gothic Medium', 'Nimbus Sans Narrow', sans-serif-condensed, sans-serif",
  "Rounded Sans": "ui-rounded, 'Hiragino Maru Gothic ProN', Quicksand, Comfortaa, Manjari, 'Arial Rounded MT', 'Arial Rounded MT Bold', Calibri, source-sans-pro, sans-serif",
  "Slab Serif": "Rockwell, 'Rockwell Nova', 'Roboto Slab', 'DejaVu Serif', 'Sitka Small', serif",
  "Antique": "Superclarendon, 'Bookman Old Style', 'URW Bookman', 'URW Bookman L', 'Georgia Pro', Georgia, serif",
  "Didone": "Didot, 'Bodoni MT', 'Noto Serif Display', 'URW Palladio L', P052, Sylfaen, serif",
  "Handwritten": "'Segoe Print', 'Bradley Hand', Chilanka, TSCu_Comic, casual, cursive",
};

export default function FontStackPage() {
  const { fg, fgMuted, isDark } = useTheme();
  const [selected, setSelected] = useState("System UI");
  const [sampleText, setSampleText] = useState("The quick brown fox jumps over the lazy dog");
  const [fontSize, setFontSize] = useState(24);
  const [copied, setCopied] = useState<string | null>(null);

  const stack = FONT_STACKS[selected];

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  const stackNames = useMemo(() => Object.keys(FONT_STACKS), []);

  return (
    <ToolLayout title="Font Stack Preview" description="Preview and copy modern CSS font stacks.">
      <div className="max-w-4xl">
        {/* Preview area */}
        <div
          style={{
            padding: "40px 24px",
            borderRadius: 14,
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: stack,
              fontSize,
              lineHeight: 1.4,
            }}
          >
            {sampleText}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-end mb-8">
          <div className="flex-1 min-w-[200px]">
            <label
              className="text-xs tracking-widest uppercase mb-2"
              style={{ color: fgMuted, display: "block" }}
            >
              Sample Text
            </label>
            <input
              type="text"
              value={sampleText}
              onChange={(e) => setSampleText(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: 14,
                fontFamily: "var(--font-playfair), Georgia, serif",
                color: fg,
                backgroundColor: "transparent",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
                borderRadius: 8,
                outline: "none",
              }}
            />
          </div>
          <div>
            <label
              className="text-xs tracking-widest uppercase mb-2"
              style={{ color: fgMuted, display: "block" }}
            >
              Size
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={12}
                max={72}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                style={{ width: 100, accentColor: fg }}
              />
              <span className="text-xs" style={{ color: fgMuted }}>{fontSize}px</span>
            </div>
          </div>
        </div>

        {/* Font stack grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {stackNames.map((name) => {
            const isActive = selected === name;
            return (
              <button
                key={name}
                onClick={() => setSelected(name)}
                style={{
                  textAlign: "left",
                  padding: "16px",
                  borderRadius: 10,
                  border: `1px solid ${
                    isActive
                      ? isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"
                      : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"
                  }`,
                  background: isActive
                    ? isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)"
                    : "transparent",
                  color: fg,
                  fontFamily: "var(--font-playfair), Georgia, serif",
                  transition: "border-color 0.2s, background-color 0.2s",
                }}
              >
                <p className="text-sm font-normal mb-2">{name}</p>
                <p
                  style={{
                    fontFamily: FONT_STACKS[name],
                    fontSize: 15,
                    lineHeight: 1.3,
                    color: fgMuted,
                  }}
                >
                  Aa Bb Cc 123
                </p>
              </button>
            );
          })}
        </div>

        {/* Current stack CSS */}
        <div className="mt-6 flex items-center gap-2">
          <div
            style={{
              flex: 1,
              padding: "12px 14px",
              fontFamily: "monospace",
              fontSize: 12,
              borderRadius: 8,
              border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
              color: fgMuted,
              whiteSpace: "nowrap",
              overflow: "auto",
            }}
          >
            font-family: {stack};
          </div>
          <button
            onClick={() => copy(`font-family: ${stack};`, "stack")}
            style={{ background: "none", border: "none", color: fgMuted, flexShrink: 0 }}
          >
            {copied === "stack" ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      </div>
    </ToolLayout>
  );
}
