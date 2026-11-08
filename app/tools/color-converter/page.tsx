"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import ToolLayout from "../../components/ToolLayout";

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

const INITIAL_HEX = "#5f3df0";
const INITIAL_RGB = { r: 95, g: 61, b: 240 };

function CopyBtn({
  text,
  isCopied,
  onCopy,
}: {
  text: string;
  isCopied: boolean;
  onCopy: (text: string) => void;
}) {
  return (
    <button onClick={() => onCopy(text)} className="tool-icon-btn" style={{ padding: 4 }}>
      {isCopied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

export default function ColorConverterPage() {
  const [hex, setHex] = useState(INITIAL_HEX);
  const [rgb, setRgb] = useState(INITIAL_RGB);
  const [hsl, setHsl] = useState(() => rgbToHsl(INITIAL_RGB.r, INITIAL_RGB.g, INITIAL_RGB.b));
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

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <ToolLayout title="Color Converter" description="Convert between HEX, RGB, and HSL color formats.">
      <div className="max-w-md">
        {/* Preview */}
        <div
          style={{
            width: "100%",
            height: 80,
            borderRadius: 0,
            backgroundColor: hex,
            border: `1px solid var(--border-subtle)`,
            marginBottom: 28,
          }}
        />

        {/* HEX */}
        <div className="mb-5">
          <label className="tool-label">HEX</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={hex}
              onChange={(e) => updateFromHex(e.target.value)}
              className="tool-input w-full"
            />
            <CopyBtn text={hex} isCopied={copied === "hex"} onCopy={(t) => copy(t, "hex")} />
          </div>
        </div>

        {/* RGB */}
        <div className="mb-5">
          <label className="tool-label">RGB</label>
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
                className="tool-input w-full text-center"
              />
            ))}
            <CopyBtn
              text={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`}
              isCopied={copied === "rgb"}
              onCopy={(t) => copy(t, "rgb")}
            />
          </div>
        </div>

        {/* HSL */}
        <div className="mb-5">
          <label className="tool-label">HSL</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`}
              className="tool-input w-full"
              style={{ opacity: 0.7 }}
            />
            <CopyBtn
              text={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`}
              isCopied={copied === "hsl"}
              onCopy={(t) => copy(t, "hsl")}
            />
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
