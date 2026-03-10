"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import Image from "next/image";
import ToolLayout from "../../components/ToolLayout";
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

  // Generate QR code whenever inputs change
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

  const inputStyle: React.CSSProperties = {
    padding: "10px 12px",
    fontSize: 14,
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

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    WebkitAppearance: "none",
    appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${isDark ? "%23ffffff" : "%23000000"}' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 10px center",
    paddingRight: 32,
  };

  return (
    <ToolLayout title="QR Code Generator" description="Generate QR codes from any text or URL.">
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Controls */}
        <div className="flex-1 max-w-lg flex flex-col gap-5">
          <div>
            <label style={labelStyle}>Content</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text or URL..."
              style={{ ...inputStyle, width: "100%" }}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label style={labelStyle}>Size (px)</label>
              <input
                type="number"
                value={size}
                min={100}
                max={1000}
                step={50}
                onChange={(e) => setSize(Number(e.target.value))}
                style={{ ...inputStyle, width: "100%", textAlign: "center" }}
              />
            </div>
            <div className="flex-1">
              <label style={labelStyle}>Margin</label>
              <input
                type="number"
                value={margin}
                min={0}
                max={10}
                onChange={(e) => setMargin(Number(e.target.value))}
                style={{ ...inputStyle, width: "100%", textAlign: "center" }}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label style={labelStyle}>Error Correction</label>
              <select
                value={errorLevel}
                onChange={(e) => setErrorLevel(e.target.value as ErrorLevel)}
                style={{ ...selectStyle, width: "100%" }}
              >
                <option value="L">Low (7%)</option>
                <option value="M">Medium (15%)</option>
                <option value="Q">Quartile (25%)</option>
                <option value="H">High (30%)</option>
              </select>
            </div>
            <div className="flex-1">
              <label style={labelStyle}>Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as ImageFormat)}
                style={{ ...selectStyle, width: "100%" }}
              >
                <option value="png">PNG</option>
                <option value="svg">SVG</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 items-end flex-wrap">
            <div>
              <label style={labelStyle}>Foreground</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  style={{ width: 36, height: 36, border: "none", background: "none", padding: 0 }}
                />
                <span className="text-xs" style={{ color: fgMuted, fontFamily: "monospace" }}>
                  {fgColor}
                </span>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Background</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  disabled={transparent}
                  style={{
                    width: 36,
                    height: 36,
                    border: "none",
                    background: "none",
                    padding: 0,
                    opacity: transparent ? 0.3 : 1,
                  }}
                />
                <span className="text-xs" style={{ color: fgMuted, fontFamily: "monospace" }}>
                  {transparent ? "none" : bgColor}
                </span>
              </div>
            </div>
            <label
              className="flex items-center gap-2 pb-1"
              style={{ fontSize: 13, color: fg, fontFamily: "var(--font-playfair), Georgia, serif" }}
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

        {/* Preview */}
        <div className="flex flex-col items-start gap-4">
          <div
            style={{
              padding: 24,
              borderRadius: 12,
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
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
            className="flex items-center gap-2 text-sm tracking-wide"
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
            Download {format.toUpperCase()}
          </button>
        </div>
      </div>
    </ToolLayout>
  );
}
