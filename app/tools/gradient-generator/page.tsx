"use client";

import { useState, useRef, useCallback } from "react";
import { Copy, Check, Plus, X, Upload, Download, Bookmark } from "lucide-react";
import ToolLayout from "../../components/ToolLayout";
import ColorPicker from "../../components/ColorPicker";
import { useTheme } from "../../context/ThemeContext";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { saveItem } from "@/lib/saved-items";

type GradientStop = { color: string; position: number };
type GradientType = "linear" | "radial";
type Tab = "create" | "extract";
type Direction = "horizontal" | "vertical" | "diagonal" | "radial";

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

export default function GradientGeneratorPage() {
  const { fg, fgMuted, isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("create");
  const [gradSaved, setGradSaved] = useState(false);

  // Create mode state
  const [type, setType] = useState<GradientType>("linear");
  const [angle, setAngle] = useState(135);
  const [stops, setStops] = useState<GradientStop[]>([
    { color: "#6366f1", position: 0 },
    { color: "#ec4899", position: 50 },
    { color: "#f59e0b", position: 100 },
  ]);
  const [copied, setCopied] = useState(false);

  // Extract mode state
  const [extractColors, setExtractColors] = useState<string[]>([]);
  const [direction, setDirection] = useState<Direction>("horizontal");
  const [steps, setSteps] = useState(5);
  const [hasImage, setHasImage] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Create mode gradient
  const cssGradient = (() => {
    const stopsStr = stops
      .sort((a, b) => a.position - b.position)
      .map((s) => `${s.color} ${s.position}%`)
      .join(", ");
    if (type === "radial") return `radial-gradient(circle, ${stopsStr})`;
    return `linear-gradient(${angle}deg, ${stopsStr})`;
  })();

  // Extract mode gradient
  const extractGradient = (() => {
    if (extractColors.length < 2) return "";
    const stopsStr = extractColors
      .map((c, i) => `${c} ${Math.round((i / (extractColors.length - 1)) * 100)}%`)
      .join(", ");
    if (direction === "radial") return `radial-gradient(circle, ${stopsStr})`;
    const angles: Record<string, string> = { horizontal: "90deg", vertical: "180deg", diagonal: "135deg" };
    return `linear-gradient(${angles[direction] || "90deg"}, ${stopsStr})`;
  })();

  const activeGradient = tab === "create" ? cssGradient : extractGradient;

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
    const text = `background: ${activeGradient};`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Extract colors from photo
  const doExtract = useCallback(
    (img: HTMLImageElement, numSteps: number, dir: Direction) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const maxW = 400;
      const scale = img.width > maxW ? maxW / img.width : 1;
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);

      const data = ctx.getImageData(0, 0, w, h).data;
      const extracted: string[] = [];

      for (let i = 0; i < numSteps; i++) {
        const t = i / (numSteps - 1);
        let sampleX: number, sampleY: number, sampleW: number, sampleH: number;

        if (dir === "horizontal") {
          sampleX = Math.floor(t * (w - w / numSteps));
          sampleY = 0;
          sampleW = Math.ceil(w / numSteps);
          sampleH = h;
        } else if (dir === "vertical") {
          sampleX = 0;
          sampleY = Math.floor(t * (h - h / numSteps));
          sampleW = w;
          sampleH = Math.ceil(h / numSteps);
        } else if (dir === "diagonal") {
          sampleX = Math.floor(t * w * 0.7);
          sampleY = Math.floor(t * h * 0.7);
          sampleW = Math.ceil(w * 0.3);
          sampleH = Math.ceil(h * 0.3);
        } else {
          const cx = w / 2;
          const cy = h / 2;
          const maxR = Math.min(w, h) / 2;
          const r = t * maxR;
          const ringW = maxR / numSteps;
          sampleX = Math.max(0, Math.floor(cx - r - ringW / 2));
          sampleY = Math.max(0, Math.floor(cy - r - ringW / 2));
          sampleW = Math.min(w - sampleX, Math.ceil(ringW * 2 + r * 2));
          sampleH = Math.min(h - sampleY, Math.ceil(ringW * 2 + r * 2));
        }

        sampleX = Math.max(0, Math.min(sampleX, w - 1));
        sampleY = Math.max(0, Math.min(sampleY, h - 1));
        sampleW = Math.min(sampleW, w - sampleX);
        sampleH = Math.min(sampleH, h - sampleY);

        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        for (let y = sampleY; y < sampleY + sampleH; y++) {
          for (let x = sampleX; x < sampleX + sampleW; x++) {
            const idx = (y * w + x) * 4;
            rSum += data[idx];
            gSum += data[idx + 1];
            bSum += data[idx + 2];
            count++;
          }
        }

        if (count > 0) {
          extracted.push(
            rgbToHex(Math.round(rSum / count), Math.round(gSum / count), Math.round(bSum / count))
          );
        }
      }

      setExtractColors(extracted);
    },
    []
  );

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new window.Image();
    img.onload = () => {
      imgRef.current = img;
      setHasImage(true);
      doExtract(img, steps, direction);
    };
    img.src = URL.createObjectURL(file);
  };

  const updateDirection = (d: Direction) => {
    setDirection(d);
    if (imgRef.current) doExtract(imgRef.current, steps, d);
  };

  const updateSteps = (n: number) => {
    setSteps(n);
    if (imgRef.current) doExtract(imgRef.current, n, direction);
  };

  const downloadGradient = () => {
    const c = document.createElement("canvas");
    c.width = 1200;
    c.height = 400;
    const ctx = c.getContext("2d")!;
    const colors = tab === "extract" ? extractColors : stops.sort((a, b) => a.position - b.position).map((s) => s.color);
    if (colors.length < 2) return;

    const grad =
      (tab === "extract" && direction === "radial") || (tab === "create" && type === "radial")
        ? ctx.createRadialGradient(600, 200, 0, 600, 200, 600)
        : ctx.createLinearGradient(0, 0, 1200, 0);

    colors.forEach((clr, i) => grad.addColorStop(i / (colors.length - 1), clr));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 400);

    const a = document.createElement("a");
    a.download = "gradient.png";
    a.href = c.toDataURL();
    a.click();
  };

  return (
    <ToolLayout title="CSS Gradient Generator" description="Create CSS gradients or extract them from photos.">
      <div className="max-w-3xl">
        <canvas ref={canvasRef} style={{ display: "none" }} />
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />

        {/* Tab toggle */}
        <div className="flex gap-2 mb-6">
          {(["create", "extract"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="tool-btn"
              style={{
                background: tab === t ? (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)") : "transparent",
                color: tab === t ? fg : undefined,
                textTransform: "capitalize",
              }}
            >
              {t === "create" ? "Create" : "Extract from Photo"}
            </button>
          ))}
        </div>

        {/* Preview */}
        {(tab === "create" || (tab === "extract" && hasImage && extractColors.length > 1)) && (
          <div
            style={{
              width: "100%",
              height: 200,
              borderRadius: 14,
              background: activeGradient || (isDark ? "#111" : "#eee"),
              border: "1px solid var(--border-subtle)",
              marginBottom: 24,
            }}
          />
        )}

        {tab === "create" ? (
          <>
            {/* CSS output */}
            <div className="flex items-center gap-2 mb-8">
              <div
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  fontFamily: "monospace",
                  fontSize: 13,
                  borderRadius: 8,
                  border: "1px solid var(--border-subtle)",
                  overflow: "auto",
                  whiteSpace: "nowrap",
                  color: fgMuted,
                }}
              >
                background: {cssGradient};
              </div>
              <button
                onClick={copy}
                className="tool-icon-btn"
                style={{ flexShrink: 0 }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div>
                <label className="tool-label">Type</label>
                <div className="flex gap-2">
                  {(["linear", "radial"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className="tool-btn"
                      style={{
                        background: type === t ? (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)") : "transparent",
                        color: type === t ? fg : undefined,
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
                  <label className="tool-label">Angle</label>
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
                <label className="tool-label" style={{ marginBottom: 0 }}>Color Stops</label>
                <button
                  onClick={addStop}
                  className="tool-icon-btn"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="flex flex-col gap-4">
                {stops.map((stop, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <ColorPicker
                      value={stop.color}
                      onChange={(hex) => updateStop(i, { color: hex })}
                    />
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
                        className="tool-icon-btn"
                        style={{ opacity: 0.5 }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Save button — create mode */}
            <div className="mt-6">
              <button
                onClick={async () => {
                  if (!user) { router.push("/login?next=/tools/gradient-generator"); return; }
                  const name = stops.map((s) => s.color.slice(1, 4)).join("-");
                  await saveItem(
                    "gradient",
                    name,
                    { type, angle, stops },
                    cssGradient
                  );
                  setGradSaved(true);
                  setTimeout(() => setGradSaved(false), 2000);
                }}
                className="tool-btn"
                style={gradSaved ? { color: fg } : undefined}
              >
                {gradSaved ? <Check size={14} strokeWidth={1.5} /> : <Bookmark size={14} strokeWidth={1.5} />}
                {gradSaved ? "Saved!" : "Save"}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Extract controls */}
            <div className="flex flex-wrap gap-4 items-end mb-6">
              <div>
                <label className="tool-label">Image</label>
                <button onClick={() => fileRef.current?.click()} className="tool-btn">
                  <Upload size={14} /> Upload Photo
                </button>
              </div>
              <div>
                <label className="tool-label">Direction</label>
                <select
                  value={direction}
                  onChange={(e) => updateDirection(e.target.value as Direction)}
                  className="tool-select"
                >
                  <option value="horizontal">Horizontal</option>
                  <option value="vertical">Vertical</option>
                  <option value="diagonal">Diagonal</option>
                  <option value="radial">Radial</option>
                </select>
              </div>
              <div>
                <label className="tool-label">Color Stops</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={2}
                    max={10}
                    value={steps}
                    onChange={(e) => updateSteps(Number(e.target.value))}
                    style={{ width: 100, accentColor: fg }}
                  />
                  <span className="text-xs" style={{ color: fgMuted }}>{steps}</span>
                </div>
              </div>
            </div>

            {hasImage && extractColors.length > 1 ? (
              <>
                {/* Color swatches */}
                <div className="flex gap-2 mb-4 flex-wrap">
                  {extractColors.map((c, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          backgroundColor: c,
                          border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                        }}
                      />
                      <span className="text-xs" style={{ color: fgMuted, fontFamily: "monospace" }}>{c}</span>
                    </div>
                  ))}
                </div>

                {/* CSS output */}
                <div className="flex items-center gap-2 mb-4">
                  <div
                    style={{
                      flex: 1,
                      padding: "12px 14px",
                      fontFamily: "monospace",
                      fontSize: 12,
                      borderRadius: 8,
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                      overflow: "auto",
                      whiteSpace: "nowrap",
                      color: fgMuted,
                    }}
                  >
                    background: {extractGradient};
                  </div>
                  <button onClick={copy} className="tool-icon-btn">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>

                <div className="flex gap-2">
                  <button onClick={downloadGradient} className="tool-btn" style={{ color: fg }}>
                    <Download size={14} /> Download PNG
                  </button>
                  <button
                    onClick={async () => {
                      if (!user) { router.push("/login?next=/tools/gradient-generator"); return; }
                      const name = extractColors.map((c) => c.slice(1, 4)).join("-");
                      await saveItem(
                        "gradient",
                        name,
                        { extractColors, direction, steps },
                        extractGradient
                      );
                      setGradSaved(true);
                      setTimeout(() => setGradSaved(false), 2000);
                    }}
                    className="tool-btn"
                    style={gradSaved ? { color: fg } : undefined}
                  >
                    {gradSaved ? <Check size={14} strokeWidth={1.5} /> : <Bookmark size={14} strokeWidth={1.5} />}
                    {gradSaved ? "Saved!" : "Save"}
                  </button>
                </div>
              </>
            ) : !hasImage ? (
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`,
                  borderRadius: 14,
                  padding: "60px 20px",
                  textAlign: "center",
                  color: fgMuted,
                  cursor: "pointer",
                }}
              >
                <Upload size={32} strokeWidth={1} style={{ margin: "0 auto 12px" }} />
                <p className="text-sm">Upload a photo to extract a gradient</p>
              </div>
            ) : null}
          </>
        )}
      </div>
    </ToolLayout>
  );
}
