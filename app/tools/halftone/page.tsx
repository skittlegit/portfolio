"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, Download } from "lucide-react";
import ToolLayout from "../../components/ToolLayout";
import ColorPicker from "../../components/ColorPicker";
import { useTheme } from "../../context/ThemeContext";

type DotShape = "circle" | "square" | "diamond";

export default function HalftonePage() {
  const { fg, fgMuted, isDark } = useTheme();
  const [dotSize, setDotSize] = useState(8);
  const [contrast, setContrast] = useState(1.2);
  const [dotShape, setDotShape] = useState<DotShape>("circle");
  const [dotColor, setDotColor] = useState(isDark ? "#ffffff" : "#000000");
  const [bgColor, setBgColor] = useState(isDark ? "#000000" : "#ffffff");
  const [transparentBg, setTransparentBg] = useState(false);
  const [hasImage, setHasImage] = useState(false);
  const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const renderHalftone = useCallback(
    (
      img: HTMLImageElement,
      size: number,
      cont: number,
      shape: DotShape,
      dc: string,
      bc: string,
      transpBg: boolean
    ) => {
      const source = sourceCanvasRef.current;
      const output = outputCanvasRef.current;
      if (!source || !output) return;

      const sCtx = source.getContext("2d");
      const oCtx = output.getContext("2d");
      if (!sCtx || !oCtx) return;

      const maxW = 600;
      const scale = img.width > maxW ? maxW / img.width : 1;
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      source.width = w;
      source.height = h;
      output.width = w;
      output.height = h;

      sCtx.drawImage(img, 0, 0, w, h);
      const data = sCtx.getImageData(0, 0, w, h).data;

      if (transpBg) {
        oCtx.clearRect(0, 0, w, h);
      } else {
        oCtx.fillStyle = bc;
        oCtx.fillRect(0, 0, w, h);
      }

      const spacing = size;
      for (let y = spacing / 2; y < h; y += spacing) {
        for (let x = spacing / 2; x < w; x += spacing) {
          const px = Math.min(Math.floor(x), w - 1);
          const py = Math.min(Math.floor(y), h - 1);
          const i = (py * w + px) * 4;
          const brightness =
            (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
          const adjusted = Math.pow(1 - brightness, cont);
          const radius = (adjusted * spacing) / 2;

          if (radius < 0.5) continue;

          oCtx.fillStyle = dc;
          oCtx.beginPath();

          if (shape === "circle") {
            oCtx.arc(x, y, radius, 0, Math.PI * 2);
          } else if (shape === "square") {
            oCtx.rect(x - radius, y - radius, radius * 2, radius * 2);
          } else {
            oCtx.moveTo(x, y - radius);
            oCtx.lineTo(x + radius, y);
            oCtx.lineTo(x, y + radius);
            oCtx.lineTo(x - radius, y);
          }
          oCtx.fill();
        }
      }
    },
    []
  );

  useEffect(() => {
    if (imgRef.current) {
      renderHalftone(
        imgRef.current,
        dotSize,
        contrast,
        dotShape,
        dotColor,
        bgColor,
        transparentBg
      );
    }
  }, [dotSize, contrast, dotShape, dotColor, bgColor, transparentBg, hasImage, renderHalftone]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new window.Image();
    img.onload = () => {
      imgRef.current = img;
      setHasImage(true);
    };
    img.src = URL.createObjectURL(file);
  };

  const download = () => {
    const canvas = outputCanvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = "halftone.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  };

  return (
    <ToolLayout
      title="Halftone Dots Effect"
      description="Transform images into halftone dot patterns."
    >
      <div className="max-w-4xl">
        <canvas ref={sourceCanvasRef} style={{ display: "none" }} />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          style={{ display: "none" }}
        />

        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-end mb-6">
          <div>
            <label className="tool-label">Image</label>
            <button
              onClick={() => fileRef.current?.click()}
              className="tool-btn"
            >
              <Upload size={14} /> Upload Image
            </button>
          </div>

          <div>
            <label className="tool-label">Dot Size</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={3}
                max={20}
                value={dotSize}
                onChange={(e) => setDotSize(Number(e.target.value))}
                style={{ width: 100, accentColor: fg }}
              />
              <span className="text-xs" style={{ color: fgMuted }}>
                {dotSize}px
              </span>
            </div>
          </div>

          <div>
            <label className="tool-label">Contrast</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0.5}
                max={3}
                step={0.1}
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                style={{ width: 100, accentColor: fg }}
              />
              <span className="text-xs" style={{ color: fgMuted }}>
                {contrast.toFixed(1)}
              </span>
            </div>
          </div>

          <div>
            <label className="tool-label">Shape</label>
            <select
              value={dotShape}
              onChange={(e) => setDotShape(e.target.value as DotShape)}
              className="tool-select"
            >
              <option value="circle">Circle</option>
              <option value="square">Square</option>
              <option value="diamond">Diamond</option>
            </select>
          </div>

          <ColorPicker label="Dot Color" value={dotColor} onChange={setDotColor} />
          <ColorPicker label="Background" value={bgColor} onChange={setBgColor} disabled={transparentBg} />

          <div style={{ paddingTop: 22 }}>
            <label className="tool-transparent-label">
              <input
                type="checkbox"
                checked={transparentBg}
                onChange={(e) => setTransparentBg(e.target.checked)}
              />
              Transparent
            </label>
          </div>
        </div>

        {/* Canvas always in DOM so ref is available on first render */}
        <canvas
          ref={outputCanvasRef}
          style={{
            maxWidth: "100%",
            borderRadius: 10,
            border: hasImage
              ? `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`
              : "none",
            display: hasImage ? "block" : "none",
            ...(transparentBg
              ? {
                  backgroundImage: `repeating-conic-gradient(${isDark ? "#333" : "#ccc"} 0% 25%, ${isDark ? "#222" : "#fff"} 0% 50%)`,
                  backgroundSize: "16px 16px",
                }
              : {}),
          }}
        />

        {hasImage ? (
          <div className="mt-3">
            <button
              onClick={download}
              className="tool-btn"
              style={{ fontSize: 12, padding: "6px 12px" }}
            >
              <Download size={14} /> Download PNG
            </button>
          </div>
        ) : (
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
            <p className="text-sm">Click or drop an image to start</p>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
