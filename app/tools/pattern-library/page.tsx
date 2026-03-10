"use client";

import { useState } from "react";
import { Copy, Check, Download, RefreshCw, Shuffle } from "lucide-react";
import ToolLayout from "../../components/ToolLayout";
import ColorPicker from "../../components/ColorPicker";
import { useTheme } from "../../context/ThemeContext";

type PatternDef = {
  name: string;
  generate: (fg: string, bg: string, size: number, seed: number, transpBg: boolean) => string;
};

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
    return Math.round(255 * c).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function bgRect(bg: string, size: number, transpBg: boolean, h?: number): string {
  if (transpBg) return "";
  return `<rect width="${size}" height="${h ?? size}" fill="${bg}"/>`;
}

const PATTERNS: PatternDef[] = [
  {
    name: "Dots",
    generate: (fg, bg, size, _s, t) =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${bgRect(bg, size, t)}<circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.15}" fill="${fg}"/></svg>`,
  },
  {
    name: "Diagonal Lines",
    generate: (fg, bg, size, _s, t) =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${bgRect(bg, size, t)}<line x1="0" y1="${size}" x2="${size}" y2="0" stroke="${fg}" stroke-width="${size * 0.06}"/></svg>`,
  },
  {
    name: "Crosshatch",
    generate: (fg, bg, size, _s, t) =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${bgRect(bg, size, t)}<line x1="0" y1="0" x2="${size}" y2="${size}" stroke="${fg}" stroke-width="${size * 0.04}"/><line x1="${size}" y1="0" x2="0" y2="${size}" stroke="${fg}" stroke-width="${size * 0.04}"/></svg>`,
  },
  {
    name: "Grid",
    generate: (fg, bg, size, _s, t) =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${bgRect(bg, size, t)}<line x1="${size / 2}" y1="0" x2="${size / 2}" y2="${size}" stroke="${fg}" stroke-width="${size * 0.04}"/><line x1="0" y1="${size / 2}" x2="${size}" y2="${size / 2}" stroke="${fg}" stroke-width="${size * 0.04}"/></svg>`,
  },
  {
    name: "Triangles",
    generate: (fg, bg, size, _s, t) => {
      const h = size * 0.866;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${Math.round(h)}">${bgRect(bg, size, t, Math.round(h))}<polygon points="0,${Math.round(h)} ${size / 2},0 ${size},${Math.round(h)}" fill="none" stroke="${fg}" stroke-width="${size * 0.04}"/></svg>`;
    },
  },
  {
    name: "Waves",
    generate: (fg, bg, size, _s, t) =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${bgRect(bg, size, t)}<path d="M0 ${size / 2} Q${size / 4} ${size * 0.2} ${size / 2} ${size / 2} Q${size * 0.75} ${size * 0.8} ${size} ${size / 2}" fill="none" stroke="${fg}" stroke-width="${size * 0.06}"/></svg>`,
  },
  {
    name: "Hexagons",
    generate: (fg, bg, size, _s, t) => {
      const r = size * 0.4;
      const pts = Array.from({ length: 6 }, (_, i) => {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        return `${(size / 2 + r * Math.cos(angle)).toFixed(1)},${(size / 2 + r * Math.sin(angle)).toFixed(1)}`;
      }).join(" ");
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${bgRect(bg, size, t)}<polygon points="${pts}" fill="none" stroke="${fg}" stroke-width="${size * 0.04}"/></svg>`;
    },
  },
  {
    name: "Circles",
    generate: (fg, bg, size, _s, t) =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${bgRect(bg, size, t)}<circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.35}" fill="none" stroke="${fg}" stroke-width="${size * 0.04}"/></svg>`,
  },
  {
    name: "Zigzag",
    generate: (fg, bg, size, _s, t) =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${bgRect(bg, size, t)}<polyline points="0,${size * 0.75} ${size * 0.25},${size * 0.25} ${size * 0.5},${size * 0.75} ${size * 0.75},${size * 0.25} ${size},${size * 0.75}" fill="none" stroke="${fg}" stroke-width="${size * 0.06}"/></svg>`,
  },
  {
    name: "Stars",
    generate: (fg, bg, size, _s, t) => {
      const cx = size / 2,
        cy = size / 2;
      const outer = size * 0.4,
        inner = size * 0.18;
      const pts = Array.from({ length: 10 }, (_, i) => {
        const r = i % 2 === 0 ? outer : inner;
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
      }).join(" ");
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${bgRect(bg, size, t)}<polygon points="${pts}" fill="${fg}"/></svg>`;
    },
  },
  {
    name: "Diamonds",
    generate: (fg, bg, size, _s, t) => {
      const c = size / 2;
      const r = size * 0.35;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${bgRect(bg, size, t)}<polygon points="${c},${c - r} ${c + r},${c} ${c},${c + r} ${c - r},${c}" fill="none" stroke="${fg}" stroke-width="${size * 0.04}"/></svg>`;
    },
  },
  {
    name: "Confetti",
    generate: (fg, bg, size, seed, t) => {
      const rng = seededRandom(seed);
      const rects = Array.from({ length: 6 }, () => {
        const x = rng() * size;
        const y = rng() * size;
        const w = 2 + rng() * 4;
        const h = 2 + rng() * 4;
        const rot = rng() * 360;
        return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${fg}" transform="rotate(${rot.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
      }).join("");
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${bgRect(bg, size, t)}${rects}</svg>`;
    },
  },
  {
    name: "Plus",
    generate: (fg, bg, size, _s, t) => {
      const w = size * 0.15;
      const l = size * 0.4;
      const c = size / 2;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${bgRect(bg, size, t)}<rect x="${c - w / 2}" y="${c - l / 2}" width="${w}" height="${l}" fill="${fg}"/><rect x="${c - l / 2}" y="${c - w / 2}" width="${l}" height="${w}" fill="${fg}"/></svg>`;
    },
  },
  {
    name: "Chevrons",
    generate: (fg, bg, size, _s, t) =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${bgRect(bg, size, t)}<polyline points="${size * 0.15},${size * 0.35} ${size / 2},${size * 0.15} ${size * 0.85},${size * 0.35}" fill="none" stroke="${fg}" stroke-width="${size * 0.06}" stroke-linecap="round"/><polyline points="${size * 0.15},${size * 0.65} ${size / 2},${size * 0.45} ${size * 0.85},${size * 0.65}" fill="none" stroke="${fg}" stroke-width="${size * 0.06}" stroke-linecap="round"/></svg>`,
  },
  {
    name: "Scales",
    generate: (fg, bg, size, _s, t) =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${bgRect(bg, size, t)}<path d="M0 ${size} A${size / 2} ${size / 2} 0 0 1 ${size} ${size}" fill="none" stroke="${fg}" stroke-width="${size * 0.04}"/><path d="M${-size / 2} ${size / 2} A${size / 2} ${size / 2} 0 0 1 ${size / 2} ${size / 2}" fill="none" stroke="${fg}" stroke-width="${size * 0.04}"/><path d="M${size / 2} ${size / 2} A${size / 2} ${size / 2} 0 0 1 ${size * 1.5} ${size / 2}" fill="none" stroke="${fg}" stroke-width="${size * 0.04}"/></svg>`,
  },
  {
    name: "Herringbone",
    generate: (fg, bg, size, _s, t) => {
      const s = size;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}">${bgRect(bg, s, t)}<line x1="0" y1="${s * 0.25}" x2="${s / 2}" y2="0" stroke="${fg}" stroke-width="${s * 0.05}"/><line x1="${s / 2}" y1="0" x2="${s}" y2="${s * 0.25}" stroke="${fg}" stroke-width="${s * 0.05}"/><line x1="0" y1="${s * 0.75}" x2="${s / 2}" y2="${s * 0.5}" stroke="${fg}" stroke-width="${s * 0.05}"/><line x1="${s / 2}" y1="${s * 0.5}" x2="${s}" y2="${s * 0.75}" stroke="${fg}" stroke-width="${s * 0.05}"/></svg>`;
    },
  },
  {
    name: "Spirals",
    generate: (fg, bg, size, _s, t) => {
      const c = size / 2;
      const steps = 60;
      let d = `M${c},${c}`;
      for (let i = 1; i <= steps; i++) {
        const angle = (i / steps) * Math.PI * 4;
        const r = (i / steps) * size * 0.4;
        const x = c + Math.cos(angle) * r;
        const y = c + Math.sin(angle) * r;
        d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
      }
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${bgRect(bg, size, t)}<path d="${d}" fill="none" stroke="${fg}" stroke-width="${size * 0.03}"/></svg>`;
    },
  },
  {
    name: "Brick",
    generate: (fg, bg, size, _s, t) => {
      const s = size;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}">${bgRect(bg, s, t)}<line x1="0" y1="${s / 2}" x2="${s}" y2="${s / 2}" stroke="${fg}" stroke-width="${s * 0.04}"/><line x1="${s / 2}" y1="0" x2="${s / 2}" y2="${s / 2}" stroke="${fg}" stroke-width="${s * 0.04}"/><line x1="0" y1="0" x2="0" y2="${s / 2}" stroke="${fg}" stroke-width="${s * 0.04}"/><line x1="${s}" y1="0" x2="${s}" y2="${s / 2}" stroke="${fg}" stroke-width="${s * 0.04}"/><line x1="${s * 0.25}" y1="${s / 2}" x2="${s * 0.25}" y2="${s}" stroke="${fg}" stroke-width="${s * 0.04}"/><line x1="${s * 0.75}" y1="${s / 2}" x2="${s * 0.75}" y2="${s}" stroke="${fg}" stroke-width="${s * 0.04}"/><line x1="0" y1="${s}" x2="${s}" y2="${s}" stroke="${fg}" stroke-width="${s * 0.04}"/></svg>`;
    },
  },
  {
    name: "Drops",
    generate: (fg, bg, size, _s, t) => {
      const c = size / 2;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${bgRect(bg, size, t)}<path d="M${c},${size * 0.15} Q${c + size * 0.22},${c} ${c},${size * 0.7} Q${c - size * 0.22},${c} ${c},${size * 0.15}Z" fill="${fg}"/></svg>`;
    },
  },
  {
    name: "Arrows",
    generate: (fg, bg, size, _s, t) =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${bgRect(bg, size, t)}<polyline points="${size * 0.3},${size * 0.7} ${size / 2},${size * 0.3} ${size * 0.7},${size * 0.7}" fill="none" stroke="${fg}" stroke-width="${size * 0.06}" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
];

export default function PatternLibraryPage() {
  const { fg, fgMuted, isDark } = useTheme();
  const [selected, setSelected] = useState(0);
  const [patternFg, setPatternFg] = useState(isDark ? "#ffffff" : "#000000");
  const [patternBg, setPatternBg] = useState(isDark ? "#000000" : "#ffffff");
  const [transparentBg, setTransparentBg] = useState(false);
  const [tileSize, setTileSize] = useState(30);
  const [seed, setSeed] = useState(42);
  const [copied, setCopied] = useState(false);

  const pattern = PATTERNS[selected];
  const svgContent = pattern.generate(patternFg, patternBg, tileSize, seed, transparentBg);
  const encodedSvg = `url("data:image/svg+xml,${encodeURIComponent(svgContent)}")`;

  const cssCode = `background-image: ${encodedSvg};\nbackground-repeat: repeat;\nbackground-size: ${tileSize}px ${tileSize}px;`;

  const copy = () => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const downloadSvg = () => {
    const repeat = 10;
    const totalW = tileSize * repeat;
    const totalH = tileSize * repeat;
    let tiles = "";
    for (let y = 0; y < repeat; y++) {
      for (let x = 0; x < repeat; x++) {
        tiles += `<image href="data:image/svg+xml,${encodeURIComponent(svgContent)}" x="${x * tileSize}" y="${y * tileSize}" width="${tileSize}" height="${tileSize}"/>`;
      }
    }
    const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalW}" height="${totalH}">${tiles}</svg>`;
    const blob = new Blob([fullSvg], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.download = `pattern-${pattern.name.toLowerCase().replace(/\s+/g, "-")}.svg`;
    a.href = URL.createObjectURL(blob);
    a.click();
  };

  const checkerStyle = {
    backgroundImage: `repeating-conic-gradient(${isDark ? "#333" : "#ccc"} 0% 25%, ${isDark ? "#222" : "#fff"} 0% 50%)`,
    backgroundSize: "16px 16px",
  };

  return (
    <ToolLayout
      title="Pattern Library"
      description="Generate repeating SVG patterns for backgrounds."
    >
      <div className="max-w-4xl">
        {/* Pattern grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-8">
          {PATTERNS.map((p, i) => {
            const thumbSvg = `url("data:image/svg+xml,${encodeURIComponent(p.generate(patternFg, patternBg, tileSize, seed, transparentBg))}")`;
            const checkerBg = `repeating-conic-gradient(${isDark ? "#333" : "#ccc"} 0% 25%, ${isDark ? "#222" : "#fff"} 0% 50%)`;
            return (
              <button
                key={p.name}
                onClick={() => setSelected(i)}
                style={{
                  aspectRatio: "1",
                  borderRadius: 10,
                  border: `2px solid ${selected === i ? fg : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                  backgroundImage: transparentBg ? `${thumbSvg}, ${checkerBg}` : thumbSvg,
                  backgroundRepeat: "repeat",
                  backgroundSize: transparentBg ? `${tileSize}px ${tileSize}px, 16px 16px` : `${tileSize}px ${tileSize}px`,
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                }}
                title={p.name}
              />
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-end mb-6">
          <div>
            <label className="tool-label">Tile Size</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={10}
                max={80}
                value={tileSize}
                onChange={(e) => setTileSize(Number(e.target.value))}
                style={{ width: 100, accentColor: fg }}
              />
              <span className="text-xs" style={{ color: fgMuted }}>
                {tileSize}px
              </span>
            </div>
          </div>
          <ColorPicker label="Foreground" value={patternFg} onChange={setPatternFg} />
          <ColorPicker label="Background" value={patternBg} onChange={setPatternBg} disabled={transparentBg} />
          <div>
            <label className="tool-label">Transparent BG</label>
            <button
              onClick={() => setTransparentBg((v) => !v)}
              className="tool-btn"
              style={{
                background: transparentBg ? fg : "transparent",
                color: transparentBg ? (isDark ? "#000" : "#fff") : fg,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
              }}
            >
              {transparentBg ? "On" : "Off"}
            </button>
          </div>
          <div>
            <label className="tool-label">Random</label>
            <button
              onClick={() => {
                setSelected(Math.floor(Math.random() * PATTERNS.length));
                setPatternFg(hslToHex(Math.random() * 360, 40 + Math.random() * 40, 30 + Math.random() * 40));
                if (!transparentBg) setPatternBg(hslToHex(Math.random() * 360, 10 + Math.random() * 20, isDark ? 10 + Math.random() * 15 : 85 + Math.random() * 15));
                setTileSize(15 + Math.floor(Math.random() * 50));
                setSeed(Math.floor(Math.random() * 99999));
              }}
              className="tool-btn"
            >
              <Shuffle size={14} /> Randomize
            </button>
          </div>
          {pattern.name === "Confetti" && (
            <div>
              <label className="tool-label">Randomize</label>
              <button
                onClick={() => setSeed(Math.floor(Math.random() * 99999))}
                className="tool-btn"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Large preview */}
        <div className="mb-6">
          <label className="tool-label">Preview — {pattern.name}</label>
          <div
            style={{
              width: "100%",
              height: 250,
              borderRadius: 14,
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
              backgroundImage: transparentBg ? `${encodedSvg}, ${checkerStyle.backgroundImage}` : encodedSvg,
              backgroundRepeat: "repeat",
              backgroundSize: transparentBg ? `${tileSize}px ${tileSize}px, 16px 16px` : `${tileSize}px ${tileSize}px`,
            }}
          />
        </div>

        {/* CSS output */}
        <div className="flex items-start gap-2 mb-4">
          <pre
            style={{
              flex: 1,
              padding: "12px 14px",
              fontFamily: "monospace",
              fontSize: 12,
              borderRadius: 8,
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
              overflow: "auto",
              whiteSpace: "pre-wrap",
              color: fgMuted,
            }}
          >
            {cssCode}
          </pre>
          <button
            onClick={copy}
            style={{
              background: "none",
              border: "none",
              color: fgMuted,
              marginTop: 12,
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        <button onClick={downloadSvg} className="tool-btn" style={{ color: fg }}>
          <Download size={14} /> Download SVG
        </button>
      </div>
    </ToolLayout>
  );
}
