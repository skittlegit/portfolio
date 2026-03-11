"use client";

import { useState, useRef } from "react";
import { RefreshCw, Download, Copy, Check, Plus, X, Lock, Unlock, Bookmark } from "lucide-react";
import ToolLayout from "../../components/ToolLayout";
import ColorPicker from "../../components/ColorPicker";
import { useTheme } from "../../context/ThemeContext";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { saveItem } from "@/lib/saved-items";

type Style =
  | "geometric"
  | "abstract"
  | "isometric"
  | "waves"
  | "mosaic"
  | "bauhaus"
  | "concentric"
  | "flowfield"
  | "terrazzo"
  | "memphis";

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

function generateRandomPalette(rng: () => number, count: number): string[] {
  const baseHue = rng() * 360;
  return Array.from({ length: count }, (_, i) => {
    const h = (baseHue + i * (360 / count) + rng() * 30) % 360;
    const s = 50 + rng() * 40;
    const l = 40 + rng() * 35;
    return hslToHex(h, s, l);
  });
}

function generateSvg(
  style: Style,
  w: number,
  h: number,
  seed: number,
  palette: string[],
  bg: string,
  transpBg: boolean
): string {
  const rng = seededRandom(seed);
  let shapes = "";
  const bgEl = transpBg ? "" : `<rect width="${w}" height="${h}" fill="${bg}"/>`;

  if (style === "geometric") {
    const count = 12 + Math.floor(rng() * 15);
    for (let i = 0; i < count; i++) {
      const color = palette[Math.floor(rng() * palette.length)];
      const opacity = (0.4 + rng() * 0.6).toFixed(2);
      const type = Math.floor(rng() * 3);
      if (type === 0) {
        const cx = rng() * w,
          cy = rng() * h,
          r = 20 + rng() * 100;
        shapes += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${color}" opacity="${opacity}"/>`;
      } else if (type === 1) {
        const x = rng() * w,
          y = rng() * h,
          s = 30 + rng() * 120,
          rot = rng() * 360;
        shapes += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" fill="${color}" opacity="${opacity}" transform="rotate(${rot.toFixed(0)} ${(x + s / 2).toFixed(1)} ${(y + s / 2).toFixed(1)})"/>`;
      } else {
        const pts = Array.from(
          { length: 3 },
          () => `${(rng() * w).toFixed(1)},${(rng() * h).toFixed(1)}`
        ).join(" ");
        shapes += `<polygon points="${pts}" fill="${color}" opacity="${opacity}"/>`;
      }
    }
  } else if (style === "abstract") {
    const count = 8 + Math.floor(rng() * 10);
    for (let i = 0; i < count; i++) {
      const color = palette[Math.floor(rng() * palette.length)];
      const opacity = (0.3 + rng() * 0.7).toFixed(2);
      const x1 = rng() * w,
        y1 = rng() * h,
        cx1 = rng() * w,
        cy1 = rng() * h;
      const cx2 = rng() * w,
        cy2 = rng() * h,
        x2 = rng() * w,
        y2 = rng() * h;
      shapes += `<path d="M${x1.toFixed(1)},${y1.toFixed(1)} C${cx1.toFixed(1)},${cy1.toFixed(1)} ${cx2.toFixed(1)},${cy2.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}" fill="none" stroke="${color}" stroke-width="${(2 + rng() * 8).toFixed(1)}" opacity="${opacity}" stroke-linecap="round"/>`;
    }
    for (let i = 0; i < 5; i++) {
      const color = palette[Math.floor(rng() * palette.length)];
      const cx = rng() * w,
        cy = rng() * h,
        rx = 30 + rng() * 80,
        ry = 30 + rng() * 80;
      shapes += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${color}" opacity="${(0.2 + rng() * 0.4).toFixed(2)}"/>`;
    }
  } else if (style === "isometric") {
    const gridSize = 60;
    const cols = Math.ceil(w / gridSize) + 1;
    const rows = Math.ceil(h / gridSize) + 1;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (rng() > 0.6) continue;
        const x = col * gridSize + (row % 2) * (gridSize / 2);
        const y = row * gridSize * 0.866;
        const hgt = 20 + rng() * 60;
        const color = palette[Math.floor(rng() * palette.length)];
        const top = `${x},${y - hgt} ${x + gridSize / 2},${y - hgt - gridSize * 0.3} ${x + gridSize},${y - hgt} ${x + gridSize / 2},${y - hgt + gridSize * 0.3}`;
        shapes += `<polygon points="${top}" fill="${color}" opacity="0.9"/>`;
        const left = `${x},${y - hgt} ${x + gridSize / 2},${y - hgt + gridSize * 0.3} ${x + gridSize / 2},${y + gridSize * 0.3} ${x},${y}`;
        shapes += `<polygon points="${left}" fill="${color}" opacity="0.6"/>`;
        const right = `${x + gridSize / 2},${y - hgt + gridSize * 0.3} ${x + gridSize},${y - hgt} ${x + gridSize},${y} ${x + gridSize / 2},${y + gridSize * 0.3}`;
        shapes += `<polygon points="${right}" fill="${color}" opacity="0.75"/>`;
      }
    }
  } else if (style === "waves") {
    const layerCount = 6 + Math.floor(rng() * 4);
    for (let i = 0; i < layerCount; i++) {
      const color = palette[i % palette.length];
      const baseY = (h / (layerCount + 1)) * (i + 1);
      const amp = 20 + rng() * 40;
      const freq = 0.005 + rng() * 0.015;
      const offset = rng() * 100;
      let d = `M0,${h}`;
      for (let x = 0; x <= w; x += 5) {
        const y =
          baseY +
          Math.sin((x + offset) * freq * Math.PI * 2) * amp +
          Math.sin((x + offset * 2) * freq * 1.5 * Math.PI * 2) * amp * 0.5;
        d += ` L${x},${y.toFixed(1)}`;
      }
      d += ` L${w},${h} Z`;
      shapes += `<path d="${d}" fill="${color}" opacity="${(0.4 + rng() * 0.4).toFixed(2)}"/>`;
    }
  } else if (style === "mosaic") {
    const gridSize = 30 + Math.floor(rng() * 20);
    const cols = Math.ceil(w / gridSize);
    const rows = Math.ceil(h / gridSize);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const color = palette[Math.floor(rng() * palette.length)];
        const x = col * gridSize,
          y = row * gridSize,
          gap = 2,
          s = gridSize - gap;
        if (rng() > 0.15) {
          shapes += `<rect x="${x + gap / 2}" y="${y + gap / 2}" width="${s}" height="${s}" fill="${color}" rx="3" opacity="${(0.5 + rng() * 0.5).toFixed(2)}"/>`;
        }
      }
    }
  } else if (style === "bauhaus") {
    const items = 6 + Math.floor(rng() * 6);
    for (let i = 0; i < items; i++) {
      const color = palette[Math.floor(rng() * palette.length)];
      const type = Math.floor(rng() * 4);
      const size = 60 + rng() * 200;
      const x = rng() * w,
        y = rng() * h;
      if (type === 0)
        shapes += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(size / 2).toFixed(1)}" fill="${color}"/>`;
      else if (type === 1)
        shapes += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${size.toFixed(1)}" height="${(size * (0.5 + rng())).toFixed(1)}" fill="${color}"/>`;
      else if (type === 2)
        shapes += `<path d="M${x.toFixed(1)},${y.toFixed(1)} A${(size / 2).toFixed(1)},${(size / 2).toFixed(1)} 0 0 1 ${(x + size).toFixed(1)},${y.toFixed(1)} Z" fill="${color}"/>`;
      else {
        const pts = `${x.toFixed(1)},${(y + size).toFixed(1)} ${(x + size / 2).toFixed(1)},${y.toFixed(1)} ${(x + size).toFixed(1)},${(y + size).toFixed(1)}`;
        shapes += `<polygon points="${pts}" fill="${color}"/>`;
      }
    }
    for (let i = 0; i < 3; i++) {
      shapes += `<line x1="${(rng() * w).toFixed(1)}" y1="${(rng() * h).toFixed(1)}" x2="${(rng() * w).toFixed(1)}" y2="${(rng() * h).toFixed(1)}" stroke="${palette[0]}" stroke-width="${(3 + rng() * 5).toFixed(1)}"/>`;
    }
  } else if (style === "concentric") {
    const cx = w / 2,
      cy = h / 2;
    const maxR = Math.max(w, h) * 0.6;
    const rings = 8 + Math.floor(rng() * 8);
    for (let i = rings; i >= 0; i--) {
      const r = (maxR / rings) * i;
      const color = palette[i % palette.length];
      shapes += `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="${color}" opacity="${(0.5 + rng() * 0.5).toFixed(2)}"/>`;
    }
    // Add radial lines
    const lineCount = 4 + Math.floor(rng() * 6);
    for (let i = 0; i < lineCount; i++) {
      const angle = (i / lineCount) * Math.PI * 2;
      shapes += `<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(angle) * maxR).toFixed(1)}" y2="${(cy + Math.sin(angle) * maxR).toFixed(1)}" stroke="${palette[0]}" stroke-width="2" opacity="0.3"/>`;
    }
  } else if (style === "flowfield") {
    const cellSize = 20;
    const cols = Math.ceil(w / cellSize);
    const rows = Math.ceil(h / cellSize);
    const freq = 0.005 + rng() * 0.01;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * cellSize + cellSize / 2;
        const y = row * cellSize + cellSize / 2;
        const angle =
          Math.sin(x * freq) * Math.cos(y * freq) * Math.PI * 2 + rng() * 0.3;
        const len = cellSize * 0.8;
        const x2 = x + Math.cos(angle) * len;
        const y2 = y + Math.sin(angle) * len;
        const color = palette[Math.floor(rng() * palette.length)];
        shapes += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="2" opacity="${(0.4 + rng() * 0.6).toFixed(2)}" stroke-linecap="round"/>`;
      }
    }
  } else if (style === "terrazzo") {
    const count = 20 + Math.floor(rng() * 15);
    for (let i = 0; i < count; i++) {
      const color = palette[Math.floor(rng() * palette.length)];
      const cx = rng() * w,
        cy = rng() * h;
      const type = Math.floor(rng() * 4);
      if (type === 0) {
        // Irregular polygon chip
        const pts = Array.from({ length: 4 + Math.floor(rng() * 3) }, () => {
          const angle = rng() * Math.PI * 2;
          const dist = 8 + rng() * 25;
          return `${(cx + Math.cos(angle) * dist).toFixed(1)},${(cy + Math.sin(angle) * dist).toFixed(1)}`;
        }).join(" ");
        shapes += `<polygon points="${pts}" fill="${color}" opacity="${(0.6 + rng() * 0.4).toFixed(2)}"/>`;
      } else if (type === 1) {
        // Small circle
        shapes += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(3 + rng() * 12).toFixed(1)}" fill="${color}" opacity="${(0.6 + rng() * 0.4).toFixed(2)}"/>`;
      } else if (type === 2) {
        // Arc/crescent
        const r = 10 + rng() * 20;
        const sa = rng() * Math.PI * 2;
        const sweep = Math.PI * (0.5 + rng());
        shapes += `<path d="M${(cx + Math.cos(sa) * r).toFixed(1)},${(cy + Math.sin(sa) * r).toFixed(1)} A${r.toFixed(1)},${r.toFixed(1)} 0 0 1 ${(cx + Math.cos(sa + sweep) * r).toFixed(1)},${(cy + Math.sin(sa + sweep) * r).toFixed(1)}" fill="none" stroke="${color}" stroke-width="${(3 + rng() * 5).toFixed(1)}" opacity="0.7" stroke-linecap="round"/>`;
      } else {
        // Triangle chip
        const s = 8 + rng() * 20;
        const rot = rng() * 360;
        shapes += `<polygon points="${cx},${cy - s} ${cx + s * 0.87},${cy + s * 0.5} ${cx - s * 0.87},${cy + s * 0.5}" fill="${color}" opacity="${(0.5 + rng() * 0.5).toFixed(2)}" transform="rotate(${rot.toFixed(0)} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`;
      }
    }
  } else if (style === "memphis") {
    const count = 15 + Math.floor(rng() * 10);
    for (let i = 0; i < count; i++) {
      const color = palette[Math.floor(rng() * palette.length)];
      const cx = rng() * w,
        cy = rng() * h;
      const type = Math.floor(rng() * 5);
      if (type === 0) {
        // Squiggly line
        let d = `M${cx.toFixed(1)},${cy.toFixed(1)}`;
        for (let j = 0; j < 3; j++) {
          const dx = 15 + rng() * 25;
          const dy = (rng() - 0.5) * 40;
          d += ` q${(dx / 2).toFixed(1)},${(dy).toFixed(1)} ${dx.toFixed(1)},0`;
        }
        shapes += `<path d="${d}" fill="none" stroke="${color}" stroke-width="${(2 + rng() * 3).toFixed(1)}" stroke-linecap="round"/>`;
      } else if (type === 1) {
        // Dotted circle
        const r = 10 + rng() * 30;
        shapes += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="${(3 + rng() * 4).toFixed(0)} ${(2 + rng() * 3).toFixed(0)}"/>`;
      } else if (type === 2) {
        // Small triangle
        const s = 15 + rng() * 30;
        const rot = rng() * 360;
        shapes += `<polygon points="${cx},${cy - s} ${cx + s},${cy + s * 0.6} ${cx - s},${cy + s * 0.6}" fill="${color}" opacity="0.7" transform="rotate(${rot.toFixed(0)} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`;
      } else if (type === 3) {
        // Cross
        const s = 8 + rng() * 15;
        shapes += `<rect x="${(cx - s).toFixed(1)}" y="${(cy - 2).toFixed(1)}" width="${(s * 2).toFixed(1)}" height="4" fill="${color}" rx="2"/>`;
        shapes += `<rect x="${(cx - 2).toFixed(1)}" y="${(cy - s).toFixed(1)}" width="4" height="${(s * 2).toFixed(1)}" fill="${color}" rx="2"/>`;
      } else {
        // Dots cluster
        for (let j = 0; j < 3 + Math.floor(rng() * 4); j++) {
          shapes += `<circle cx="${(cx + (rng() - 0.5) * 30).toFixed(1)}" cy="${(cy + (rng() - 0.5) * 30).toFixed(1)}" r="${(2 + rng() * 4).toFixed(1)}" fill="${color}"/>`;
        }
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">${bgEl}${shapes}</svg>`;
}

export default function VectorArtPage() {
  const { fg, isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [style, setStyle] = useState<Style>("geometric");
  const [saved, setSaved] = useState(false);
  const [seed, setSeed] = useState(42);
  const [bg, setBg] = useState(isDark ? "#0a0a0a" : "#fafafa");
  const [transparentBg, setTransparentBg] = useState(false);
  const [palette, setPalette] = useState<string[]>(() => {
    const rng = seededRandom(42);
    return generateRandomPalette(rng, 5);
  });
  const [locked, setLocked] = useState<boolean[]>(() => new Array(5).fill(false));
  const [copied, setCopied] = useState(false);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  const svgString = generateSvg(style, 800, 500, seed, palette, bg, transparentBg);

  // For display: responsive SVG
  const displaySvg = svgString;
  // For download/copy: fixed-dimension SVG
  const exportSvg = svgString.replace('width="100%" height="100%"', 'width="800" height="500"');

  const randomize = () => {
    const newSeed = Math.floor(Math.random() * 99999);
    setSeed(newSeed);
    const rng = seededRandom(newSeed);
    const newPalette = generateRandomPalette(rng, palette.length);
    // Keep locked colors
    setPalette((prev) => prev.map((c, i) => (locked[i] ? c : newPalette[i])));
  };

  const updateColor = (i: number, hex: string) => {
    setPalette((prev) => prev.map((c, idx) => (idx === i ? hex : c)));
  };

  const toggleLock = (i: number) => {
    setLocked((prev) => prev.map((l, idx) => (idx === i ? !l : l)));
  };

  const addColor = () => {
    if (palette.length >= 8) return;
    setPalette((prev) => [...prev, hslToHex(Math.random() * 360, 60, 50)]);
    setLocked((prev) => [...prev, false]);
  };

  const removeColor = (i: number) => {
    if (palette.length <= 2) return;
    setPalette((prev) => prev.filter((_, idx) => idx !== i));
    setLocked((prev) => prev.filter((_, idx) => idx !== i));
  };

  const downloadSvg = () => {
    const blob = new Blob([exportSvg], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.download = `vector-${style}.svg`;
    a.href = URL.createObjectURL(blob);
    a.click();
  };

  const downloadPng = () => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1600;
      canvas.height = 1000;
      const ctx = canvas.getContext("2d")!;
      if (!transparentBg) {
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 1600, 1000);
      }
      ctx.drawImage(img, 0, 0, 1600, 1000);
      const a = document.createElement("a");
      a.download = `vector-${style}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml," + encodeURIComponent(exportSvg);
  };

  const copySvg = () => {
    navigator.clipboard.writeText(exportSvg);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <ToolLayout
      title="Vector Art Generator"
      description="Generate vector illustrations with various styles."
    >
      <div className="max-w-4xl">
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-end mb-6">
          <div>
            <label className="tool-label">Style</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as Style)}
              className="tool-select"
            >
              <option value="geometric">Geometric</option>
              <option value="abstract">Abstract</option>
              <option value="isometric">Isometric</option>
              <option value="waves">Waves</option>
              <option value="mosaic">Mosaic</option>
              <option value="bauhaus">Bauhaus</option>
              <option value="concentric">Concentric</option>
              <option value="flowfield">Flow Field</option>
              <option value="terrazzo">Terrazzo</option>
              <option value="memphis">Memphis</option>
            </select>
          </div>
          <ColorPicker label="Background" value={bg} onChange={setBg} disabled={transparentBg} />
          <div>
            <label className="tool-label">Transparent BG</label>
            <button
              onClick={() => setTransparentBg((v) => !v)}
              className="tool-toggle"
              style={{
                background: transparentBg ? fg : "transparent",
                color: transparentBg ? (isDark ? "#000" : "#fff") : fg,
              }}
            >
              {transparentBg ? "On" : "Off"}
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={randomize} className="tool-btn" style={{ color: fg }}>
              <RefreshCw size={14} /> Randomize
            </button>
            <button onClick={copySvg} className="tool-btn">
              {copied ? <Check size={14} /> : <Copy size={14} />} SVG
            </button>
          </div>
        </div>

        {/* Editable Palette */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-3">
            <label className="tool-label" style={{ marginBottom: 0 }}>
              Palette ({palette.length} colors)
            </label>
            {palette.length < 8 && (
              <button
                onClick={addColor}
                className="tool-icon-btn"
              >
                <Plus size={16} />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {palette.map((c, i) => (
              <div key={i} className="flex items-center gap-1">
                <ColorPicker
                  value={c}
                  onChange={(hex) => updateColor(i, hex)}
                />
                <button
                  onClick={() => toggleLock(i)}
                  title={locked[i] ? "Unlock color" : "Lock color"}
                  className="tool-icon-btn"
                  style={{
                    color: locked[i] ? fg : undefined,
                    opacity: locked[i] ? 1 : 0.4,
                  }}
                >
                  {locked[i] ? <Lock size={12} /> : <Unlock size={12} />}
                </button>
                {palette.length > 2 && (
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

        {/* SVG preview */}
        <div
          ref={svgContainerRef}
          className={`tool-preview ${transparentBg ? (isDark ? "tool-checker-dark" : "tool-checker-light") : ""}`}
          style={{
            width: "100%",
            aspectRatio: "8 / 5",
            marginBottom: 16,
          }}
          dangerouslySetInnerHTML={{ __html: displaySvg }}
        />

        {/* Download */}
        <div className="flex gap-2">
          <button onClick={downloadSvg} className="tool-btn" style={{ color: fg }}>
            <Download size={14} /> SVG
          </button>
          <button onClick={downloadPng} className="tool-btn" style={{ color: fg }}>
            <Download size={14} /> PNG
          </button>
          <button
            onClick={async () => {
              if (!user) { router.push("/login?next=/tools/vector-art"); return; }
              await saveItem(
                "vector-art",
                `${style.charAt(0).toUpperCase() + style.slice(1)} Vector`,
                { style, seed, bg, transparentBg, palette, locked },
                exportSvg
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
