"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import Image from "next/image";
import ToolLayout from "../../components/ToolLayout";
import ColorPicker from "../../components/ColorPicker";
import { useTheme } from "../../context/ThemeContext";

type ErrorLevel = "L" | "M" | "Q" | "H";
type ImageFormat = "png" | "svg";

export default function QrCodePage() {
  const { fg, fgMuted, isDark } = useTheme();
  const [text, setText] = useState("https://example.com");
  const [size, setSize] = useState(300);
  const [errorLevel, setErrorLevel] = useState<ErrorLevel>("M");
  const [fgColor, setFgColor] = useState(isDark ? "#ffffff" : "#000000");
  const [bgColor, setBgColor] = useState(isDark ? "#000000" : "#ffffff");
  const [transparent, setTransparent] = useState(true);
  const [margin, setMargin] = useState(2);
  const [format, setFormat] = useState<ImageFormat>("png");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [svgString, setSvgString] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const value = text.trim() || "https://example.com";
    const bgFinal = transparent ? "#00000000" : bgColor;
    (async () => {
      try {
        if (format === "svg") {
          const svg = await QRCode.toString(value, {
            type: "svg",
            width: size,
            margin,
            errorCorrectionLevel: errorLevel,
            color: { dark: fgColor, light: bgFinal },
          });
          if (!cancelled) {
            setSvgString(svg);
            setQrDataUrl(
              "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)
            );
          }
        } else {
          const url = await QRCode.toDataURL(value, {
            width: size,
            margin,
            errorCorrectionLevel: errorLevel,
            color: { dark: fgColor, light: bgFinal },
          });
          if (!cancelled) {
            setQrDataUrl(url);
            setSvgString(null);
          }
        }
      } catch {
        if (!cancelled) {
          setQrDataUrl(null);
          setSvgString(null);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [text, size, errorLevel, fgColor, bgColor, transparent, margin, format]);

  const download = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    if (format === "svg" && svgString) {
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      a.href = URL.createObjectURL(blob);
      a.download = "qrcode.svg";
    } else {
      a.href = qrDataUrl;
      a.download = "qrcode.png";
    }
    a.click();
  };

  const borderSubtle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  return (
    <ToolLayout title="QR Code Generator" description="Generate QR codes from any text or URL.">
      <div className="flex flex-col lg:flex-row gap-10 max-w-4xl">
        {/* Controls */}
        <div className="flex-1 max-w-lg flex flex-col gap-6">
          {/* Content input */}
          <div>
            <label className="tool-label">Content</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text or URL..."
              className="tool-input w-full"
            />
          </div>

          {/* Size & Margin */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between mb-1">
                <label className="tool-label">Size</label>
                <span className="text-xs" style={{ color: fgMuted }}>{size}px</span>
              </div>
              <input
                type="range"
                min={100}
                max={1000}
                step={50}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                style={{ width: "100%", accentColor: fg }}
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <label className="tool-label">Margin</label>
                <span className="text-xs" style={{ color: fgMuted }}>{margin}</span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                style={{ width: "100%", accentColor: fg }}
              />
            </div>
          </div>

          {/* Error Correction & Format */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="tool-label">Error Correction</label>
              <select
                value={errorLevel}
                onChange={(e) => setErrorLevel(e.target.value as ErrorLevel)}
                className="tool-select w-full"
              >
                <option value="L">Low (7%)</option>
                <option value="M">Medium (15%)</option>
                <option value="Q">Quartile (25%)</option>
                <option value="H">High (30%)</option>
              </select>
            </div>
            <div>
              <label className="tool-label">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as ImageFormat)}
                className="tool-select w-full"
              >
                <option value="png">PNG</option>
                <option value="svg">SVG</option>
              </select>
            </div>
          </div>

          {/* Colors */}
          <div className="flex gap-5 items-start flex-wrap">
            <ColorPicker
              value={fgColor}
              onChange={setFgColor}
              label="Foreground"
            />
            <ColorPicker
              value={bgColor}
              onChange={setBgColor}
              disabled={transparent}
              label="Background"
            />
            <div style={{ paddingTop: 22 }}>
              <label
                className="flex items-center gap-2"
                style={{
                  fontSize: 13,
                  color: fg,
                  fontFamily: "var(--font-playfair), Georgia, serif",
                }}
              >
                <input
                  type="checkbox"
                  checked={transparent}
                  onChange={(e) => setTransparent(e.target.checked)}
                  style={{ accentColor: fg }}
                />
                Transparent
              </label>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="flex flex-col items-start gap-5">
          <div
            style={{
              padding: 24,
              borderRadius: 14,
              border: `1px solid ${borderSubtle}`,
              background: transparent
                ? `repeating-conic-gradient(${isDark ? "#222" : "#e5e5e5"} 0% 25%, transparent 0% 50%) 0 0 / 16px 16px`
                : bgColor,
            }}
          >
            {qrDataUrl ? (
              <Image src={qrDataUrl} alt="QR Code" width={220} height={220} style={{ display: "block" }} unoptimized />
            ) : (
              <div
                style={{
                  width: 220,
                  height: 220,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: fgMuted,
                  fontSize: 13,
                }}
              >
                Preview
              </div>
            )}
          </div>
          <button
            onClick={download}
            className="tool-btn"
          >
            <Download size={14} strokeWidth={1.5} />
            Download {format.toUpperCase()}
          </button>
        </div>
      </div>
    </ToolLayout>
  );
}
