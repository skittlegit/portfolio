"use client";

import { useState } from "react";
import { Download, RefreshCw, Copy, Check, Plus, X, Bookmark } from "lucide-react";
import ToolLayout from "../../components/ToolLayout";
import ColorPicker from "../../components/ColorPicker";
import { useTheme } from "../../context/ThemeContext";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { saveItem } from "@/lib/saved-items";

type LogoShape = "abstract" | "geometric" | "organic" | "layered" | "split";
type ColorMode = "gradient" | "solid";

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function generateGradientDefs(colors: string[], id: string, colorMode: ColorMode): string {
  if (colorMode === "solid" || colors.length < 2) return "";
  const stops = colors
    .map(
      (c, i) =>
        `<stop offset="${((i / (colors.length - 1)) * 100).toFixed(0)}%" stop-color="${c}"/>`
    )
    .join("");
  return `<defs><linearGradient id="lg_${id}" x1="0%" y1="0%" x2="100%" y2="100%">${stops}</linearGradient><radialGradient id="rg_${id}" cx="50%" cy="50%" r="50%">${stops}</radialGradient></defs>`;
}

function generateIcon(
  shape: LogoShape,
  cx: number,
  cy: number,
  r: number,
  colors: string[],
  colorMode: ColorMode,
  seed: number,
  shapeCount: number
): string {
  const rng = seededRandom(seed);
  const uid = `${seed}`;
  let content = "";
  const gradDefs = generateGradientDefs(colors, uid, colorMode);
  const mainFill =
    colorMode === "gradient" && colors.length >= 2
      ? `url(#lg_${uid})`
      : colors[0] || "#333";

  if (shape === "abstract") {
    // Overlapping organic shapes with different colors
    for (let i = 0; i < shapeCount; i++) {
      const angle = (i / shapeCount) * Math.PI * 2 + rng() * 0.5;
      const dist = r * 0.25;
      const sx = cx + Math.cos(angle) * dist;
      const sy = cy + Math.sin(angle) * dist;
      const sr = r * (0.5 + rng() * 0.3);
      const color =
        colorMode === "gradient" ? mainFill : colors[i % colors.length];
      // Generate blob
      const pts = 5 + Math.floor(rng() * 3);
      let d = "";
      const points = Array.from({ length: pts }, (_, j) => {
        const a = (j / pts) * Math.PI * 2;
        const pr = sr * (0.7 + rng() * 0.6);
        return { x: sx + Math.cos(a) * pr, y: sy + Math.sin(a) * pr };
      });
      d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
      for (let j = 0; j < points.length; j++) {
        const curr = points[j];
        const next = points[(j + 1) % points.length];
        const prev = points[(j - 1 + points.length) % points.length];
        const next2 = points[(j + 2) % points.length];
        const cp1x = curr.x + (next.x - prev.x) * 0.25;
        const cp1y = curr.y + (next.y - prev.y) * 0.25;
        const cp2x = next.x - (next2.x - curr.x) * 0.25;
        const cp2y = next.y - (next2.y - curr.y) * 0.25;
        d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${next.x.toFixed(1)},${next.y.toFixed(1)}`;
      }
      d += "Z";
      content += `<path d="${d}" fill="${color}" opacity="${(0.7 + rng() * 0.3).toFixed(2)}"/>`;
    }
  } else if (shape === "geometric") {
    // Clean geometric composition
    const variation = seed % 4;
    if (variation === 0) {
      // Interlocking circles
      for (let i = 0; i < Math.min(shapeCount, 3); i++) {
        const angle = (i / Math.min(shapeCount, 3)) * Math.PI * 2 - Math.PI / 2;
        const dist = r * 0.3;
        const color =
          colorMode === "gradient" ? mainFill : colors[i % colors.length];
        content += `<circle cx="${(cx + Math.cos(angle) * dist).toFixed(1)}" cy="${(cy + Math.sin(angle) * dist).toFixed(1)}" r="${(r * 0.45).toFixed(1)}" fill="${color}" opacity="0.75"/>`;
      }
    } else if (variation === 1) {
      // Nested squares rotated
      for (let i = 0; i < Math.min(shapeCount, 4); i++) {
        const s = r * (1.2 - i * 0.25);
        const rot = i * 15;
        const color =
          colorMode === "gradient" ? mainFill : colors[i % colors.length];
        content += `<rect x="${(cx - s / 2).toFixed(1)}" y="${(cy - s / 2).toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" fill="${color}" opacity="0.7" rx="${(s * 0.1).toFixed(1)}" transform="rotate(${rot} ${cx} ${cy})"/>`;
      }
    } else if (variation === 2) {
      // Triangle segments
      for (let i = 0; i < Math.min(shapeCount, 4); i++) {
        const a1 = (i / Math.min(shapeCount, 4)) * Math.PI * 2;
        const a2 = ((i + 1) / Math.min(shapeCount, 4)) * Math.PI * 2;
        const color =
          colorMode === "gradient" ? mainFill : colors[i % colors.length];
        content += `<path d="M${cx},${cy} L${(cx + Math.cos(a1) * r).toFixed(1)},${(cy + Math.sin(a1) * r).toFixed(1)} L${(cx + Math.cos(a2) * r).toFixed(1)},${(cy + Math.sin(a2) * r).toFixed(1)} Z" fill="${color}" opacity="0.8"/>`;
      }
    } else {
      // Hexagonal segments
      for (let i = 0; i < 6; i++) {
        const a1 = (i / 6) * Math.PI * 2 - Math.PI / 6;
        const a2 = ((i + 1) / 6) * Math.PI * 2 - Math.PI / 6;
        const color =
          colorMode === "gradient"
            ? mainFill
            : colors[i % colors.length];
        content += `<path d="M${cx},${cy} L${(cx + Math.cos(a1) * r).toFixed(1)},${(cy + Math.sin(a1) * r).toFixed(1)} L${(cx + Math.cos(a2) * r).toFixed(1)},${(cy + Math.sin(a2) * r).toFixed(1)} Z" fill="${color}" opacity="0.85"/>`;
      }
    }
  } else if (shape === "organic") {
    // Leaf/petal arrangement
    const petalCount = shapeCount;
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2 + rng() * 0.2;
      const color =
        colorMode === "gradient" ? mainFill : colors[i % colors.length];
      const pr = r * (0.5 + rng() * 0.3);
      const tipX = cx + Math.cos(angle) * pr;
      const tipY = cy + Math.sin(angle) * pr;
      const spread = r * 0.3;
      const cp1x = cx + Math.cos(angle + 0.5) * spread;
      const cp1y = cy + Math.sin(angle + 0.5) * spread;
      const cp2x = cx + Math.cos(angle - 0.5) * spread;
      const cp2y = cy + Math.sin(angle - 0.5) * spread;
      content += `<path d="M${cx},${cy} Q${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)} Q${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${cx},${cy}Z" fill="${color}" opacity="${(0.6 + rng() * 0.4).toFixed(2)}"/>`;
    }
    // Center dot
    content += `<circle cx="${cx}" cy="${cy}" r="${(r * 0.08).toFixed(1)}" fill="${colors[0]}" opacity="0.9"/>`;
  } else if (shape === "layered") {
    // Stacked horizontal layers with curved boundaries
    const layers = Math.min(shapeCount, 5);
    const sliceH = (r * 2) / layers;
    for (let i = 0; i < layers; i++) {
      const topY = cy - r + i * sliceH;
      const botY = topY + sliceH;
      const color =
        colorMode === "gradient" ? mainFill : colors[i % colors.length];
      const curveAmt = rng() * 15 - 7.5;
      const curveAmt2 = rng() * 15 - 7.5;
      content += `<path d="M${(cx - r).toFixed(1)},${topY.toFixed(1)} Q${cx.toFixed(1)},${(topY + curveAmt).toFixed(1)} ${(cx + r).toFixed(1)},${topY.toFixed(1)} L${(cx + r).toFixed(1)},${botY.toFixed(1)} Q${cx.toFixed(1)},${(botY + curveAmt2).toFixed(1)} ${(cx - r).toFixed(1)},${botY.toFixed(1)} Z" fill="${color}" opacity="0.85"/>`;
    }
    // Clip to circle
    content = `<clipPath id="clip_${uid}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath><g clip-path="url(#clip_${uid})">${content}</g>`;
  } else if (shape === "split") {
    // Split circle/shape into segments
    const segments = Math.max(shapeCount, 2);
    for (let i = 0; i < segments; i++) {
      const a1 = (i / segments) * Math.PI * 2 - Math.PI / 2;
      const a2 = ((i + 1) / segments) * Math.PI * 2 - Math.PI / 2;
      const large = a2 - a1 > Math.PI ? 1 : 0;
      const x1 = cx + Math.cos(a1) * r;
      const y1 = cy + Math.sin(a1) * r;
      const x2 = cx + Math.cos(a2) * r;
      const y2 = cy + Math.sin(a2) * r;
      const gap = 2;
      const gx = Math.cos((a1 + a2) / 2) * gap;
      const gy = Math.sin((a1 + a2) / 2) * gap;
      const color =
        colorMode === "gradient" ? mainFill : colors[i % colors.length];
      content += `<path d="M${(cx + gx).toFixed(1)},${(cy + gy).toFixed(1)} L${(x1 + gx).toFixed(1)},${(y1 + gy).toFixed(1)} A${r},${r} 0 ${large} 1 ${(x2 + gx).toFixed(1)},${(y2 + gy).toFixed(1)} Z" fill="${color}"/>`;
    }
  }

  return `${gradDefs}${content}`;
}

function generateShape(
  shape: LogoShape,
  colors: string[],
  colorMode: ColorMode,
  iconSize: number,
  seed: number,
  shapeCount: number
): string {
  const r = iconSize;
  const padding = 20;
  const w = r * 2 + padding * 2;
  const h = r * 2 + padding * 2;
  const cx = w / 2;
  const cy = padding + r;

  const icon = generateIcon(shape, cx, cy, r, colors, colorMode, seed, shapeCount);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${icon}</svg>`;
}

export default function ShapeMakerPage() {
  const { fg, fgMuted, isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [shape, setShape] = useState<LogoShape>("abstract");
  const [saved, setSaved] = useState(false);
  const [colorMode, setColorMode] = useState<ColorMode>("gradient");
  const [colors, setColors] = useState<string[]>([
    "#6366f1",
    "#8b5cf6",
    "#a855f7",
  ]);
  const [iconSize, setIconSize] = useState(80);
  const [seed, setSeed] = useState(42);
  const [shapeCount, setShapeCount] = useState(4);
  const [copied, setCopied] = useState(false);

  const svgString = generateShape(
    shape,
    colors,
    colorMode,
    iconSize,
    seed,
    shapeCount
  );

  const randomize = () => setSeed(Math.floor(Math.random() * 99999));

  const updateColor = (i: number, hex: string) => {
    setColors((prev) => prev.map((c, idx) => (idx === i ? hex : c)));
  };

  const addColor = () => {
    if (colors.length >= 6) return;
    setColors((prev) => [...prev, hslToHex(Math.random() * 360, 65, 55)]);
  };

  const removeColor = (i: number) => {
    if (colors.length <= 1) return;
    setColors((prev) => prev.filter((_, idx) => idx !== i));
  };

  const randomizeColors = () => {
    setColors((prev) => prev.map(() => hslToHex(Math.random() * 360, 40 + Math.random() * 40, 35 + Math.random() * 40)));
  };

  const downloadSvg = () => {
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.download = `shape-${shape}.svg`;
    a.href = URL.createObjectURL(blob);
    a.click();
  };

  const downloadPng = () => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 800;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, 800, 800);
      const a = document.createElement("a");
      a.download = `shape-${shape}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml," + encodeURIComponent(svgString);
  };

  const copySvg = () => {
    navigator.clipboard.writeText(svgString);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <ToolLayout
      title="Shape Maker"
      description="Create unique shape compositions with blended colors."
    >
      <div className="max-w-3xl">
        {/* Controls Row 1 */}
        <div className="flex flex-wrap gap-4 items-end mb-6">
          <div>
            <label className="tool-label">Style</label>
            <select
              value={shape}
              onChange={(e) => setShape(e.target.value as LogoShape)}
              className="tool-select"
            >
              <option value="abstract">Abstract</option>
              <option value="geometric">Geometric</option>
              <option value="organic">Organic</option>
              <option value="layered">Layered</option>
              <option value="split">Split</option>
            </select>
          </div>
          <div>
            <label className="tool-label">Color Blend</label>
            <select
              value={colorMode}
              onChange={(e) => setColorMode(e.target.value as ColorMode)}
              className="tool-select"
            >
              <option value="gradient">Gradient</option>
              <option value="solid">Hard Cutoff</option>
            </select>
          </div>
        </div>

        {/* Controls Row 2 */}
        <div className="flex flex-wrap gap-4 items-end mb-6">
          <div>
            <label className="tool-label">Size</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={40}
                max={120}
                value={iconSize}
                onChange={(e) => setIconSize(Number(e.target.value))}
                style={{ width: 80, accentColor: fg }}
              />
              <span className="text-xs" style={{ color: fgMuted }}>
                {iconSize}
              </span>
            </div>
          </div>
          <div>
            <label className="tool-label">Shapes</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={2}
                max={8}
                value={shapeCount}
                onChange={(e) => setShapeCount(Number(e.target.value))}
                style={{ width: 80, accentColor: fg }}
              />
              <span className="text-xs" style={{ color: fgMuted }}>
                {shapeCount}
              </span>
            </div>
          </div>
          <button onClick={randomize} className="tool-btn">
            <RefreshCw size={14} /> Randomize
          </button>
        </div>

        {/* Color Palette */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <label className="tool-label" style={{ marginBottom: 0 }}>
              Colors ({colors.length})
            </label>
            {colors.length < 6 && (
              <button
                onClick={addColor}
                className="tool-icon-btn"
              >
                <Plus size={16} />
              </button>
            )}
            <button
              onClick={randomizeColors}
              className="tool-icon-btn"
              title="Randomize colors"
            >
              <RefreshCw size={14} />
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {colors.map((c, i) => (
              <div key={i} className="flex items-center gap-1">
                <ColorPicker
                  value={c}
                  onChange={(hex) => updateColor(i, hex)}
                />
                {colors.length > 1 && (
                  <button
                    onClick={() => removeColor(i)}
                    className="tool-icon-btn"
                    style={{ opacity: 0.5 }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div
          style={{
            padding: 40,
            borderRadius: 14,
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 16,
            background: isDark
              ? "rgba(255,255,255,0.02)"
              : "rgba(0,0,0,0.01)",
          }}
          dangerouslySetInnerHTML={{ __html: svgString }}
        />

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={downloadSvg}
            className="tool-btn"
            style={{ color: fg }}
          >
            <Download size={14} /> SVG
          </button>
          <button
            onClick={downloadPng}
            className="tool-btn"
            style={{ color: fg }}
          >
            <Download size={14} /> PNG
          </button>
          <button onClick={copySvg} className="tool-btn">
            {copied ? <Check size={14} /> : <Copy size={14} />} Copy SVG
          </button>
          <button
            onClick={async () => {
              if (!user) { router.push("/login?next=/tools/logo-maker"); return; }
              await saveItem(
                "shape",
                `${shape.charAt(0).toUpperCase() + shape.slice(1)} Shape`,
                { shape, colorMode, colors, iconSize, seed, shapeCount },
                svgString
              );
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }}
            className="tool-btn"
            style={saved ? { color: fg } : undefined}
          >
            {saved ? <Check size={14} strokeWidth={1.5} /> : <Bookmark size={14} strokeWidth={1.5} />}
            {saved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>
    </ToolLayout>
  );
}
