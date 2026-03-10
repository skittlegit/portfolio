"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

export default function ColorPicker({
  value,
  onChange,
  disabled = false,
  label,
}: {
  value: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
  label?: string;
}) {
  const { fg, fgMuted, isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [hexEditing, setHexEditing] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef<"canvas" | "hue" | null>(null);

  // Derive HSL from value prop (single source of truth)
  const hsl = useMemo(() => hexToHsl(value), [value]);
  const displayHex = hexEditing ?? value;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setHexEditing(null);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  // Draw the saturation/lightness canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        const s = (x / w) * 100;
        const l = 100 - (y / h) * 100;
        ctx.fillStyle = `hsl(${hsl.h}, ${s}%, ${l}%)`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, [hsl.h]);

  useEffect(() => {
    if (open) drawCanvas();
  }, [open, drawCanvas]);

  const updateFromCanvas = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clamp(clientX - rect.left, 0, rect.width);
    const y = clamp(clientY - rect.top, 0, rect.height);
    const s = Math.round((x / rect.width) * 100);
    const l = Math.round(100 - (y / rect.height) * 100);
    const hex = hslToHex(hsl.h, s, l);
    setHexEditing(null);
    onChange(hex);
  };

  const updateFromHue = (clientX: number, track: HTMLDivElement) => {
    const rect = track.getBoundingClientRect();
    const x = clamp(clientX - rect.left, 0, rect.width);
    const h = Math.round((x / rect.width) * 360);
    const hex = hslToHex(h, hsl.s, hsl.l);
    setHexEditing(null);
    onChange(hex);
  };

  const handleHexChange = (val: string) => {
    setHexEditing(val);
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      onChange(val.toLowerCase());
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging.current === "canvas") {
        e.preventDefault();
        updateFromCanvas(e.clientX, e.clientY);
      } else if (dragging.current === "hue") {
        e.preventDefault();
        const track = document.getElementById("hue-track");
        if (track) updateFromHue(e.clientX, track as HTMLDivElement);
      }
    };
    const handleMouseUp = () => {
      dragging.current = null;
    };
    if (open) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  });

  const border = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)";
  const borderSubtle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      {label && (
        <span
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: fgMuted,
            marginBottom: 6,
            display: "block",
          }}
        >
          {label}
        </span>
      )}
      {/* Swatch + hex trigger */}
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        data-interactive
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          borderRadius: 8,
          border: `1px solid ${border}`,
          background: "transparent",
          color: fg,
          fontFamily: "monospace",
          fontSize: 13,
          opacity: disabled ? 0.35 : 1,
          transition: "border-color 0.2s",
        }}
      >
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            backgroundColor: value,
            border: `1px solid ${borderSubtle}`,
            flexShrink: 0,
          }}
        />
        <span style={{ color: fgMuted }}>{value}</span>
      </button>

      {/* Dropdown panel */}
      {open && !disabled && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 50,
            width: 220,
            padding: 12,
            borderRadius: 12,
            border: `1px solid ${border}`,
            backgroundColor: isDark ? "#111" : "#fff",
            boxShadow: isDark
              ? "0 8px 32px rgba(0,0,0,0.5)"
              : "0 8px 32px rgba(0,0,0,0.12)",
          }}
        >
          {/* Saturation/Lightness canvas */}
          <div style={{ position: "relative", marginBottom: 10 }}>
            <canvas
              ref={canvasRef}
              width={196}
              height={120}
              style={{
                width: 196,
                height: 120,
                borderRadius: 8,
                cursor: "crosshair",
                display: "block",
              }}
              onMouseDown={(e) => {
                dragging.current = "canvas";
                updateFromCanvas(e.clientX, e.clientY);
              }}
            />
            {/* Picker dot */}
            <div
              style={{
                position: "absolute",
                left: `${hsl.s}%`,
                top: `${100 - hsl.l}%`,
                width: 12,
                height: 12,
                borderRadius: "50%",
                border: "2px solid #fff",
                boxShadow: "0 0 2px rgba(0,0,0,0.5)",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
              }}
            />
          </div>

          {/* Hue slider */}
          <div
            id="hue-track"
            style={{
              position: "relative",
              height: 14,
              borderRadius: 7,
              background:
                "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
              cursor: "pointer",
              marginBottom: 12,
            }}
            onMouseDown={(e) => {
              dragging.current = "hue";
              updateFromHue(e.clientX, e.currentTarget);
            }}
          >
            <div
              style={{
                position: "absolute",
                left: `${(hsl.h / 360) * 100}%`,
                top: "50%",
                width: 14,
                height: 14,
                borderRadius: "50%",
                border: "2px solid #fff",
                boxShadow: "0 0 2px rgba(0,0,0,0.4)",
                transform: "translate(-50%, -50%)",
                backgroundColor: `hsl(${hsl.h}, 100%, 50%)`,
                pointerEvents: "none",
              }}
            />
          </div>

          {/* Hex input */}
          <input
            type="text"
            value={displayHex}
            onChange={(e) => handleHexChange(e.target.value)}
            onBlur={() => setHexEditing(null)}
            maxLength={7}
            style={{
              width: "100%",
              padding: "6px 10px",
              fontSize: 13,
              fontFamily: "monospace",
              color: fg,
              backgroundColor: "transparent",
              border: `1px solid ${border}`,
              borderRadius: 6,
              outline: "none",
              textAlign: "center",
            }}
          />
        </div>
      )}
    </div>
  );
}
