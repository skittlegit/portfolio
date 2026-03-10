"use client";

import { useTheme } from "../context/ThemeContext";

export default function NumberStepper({
  value,
  onChange,
  min = 0,
  max = Infinity,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label?: string;
}) {
  const { fg, fgMuted, isDark } = useTheme();
  const border = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)";
  const dimmed = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)";

  return (
    <div className="flex items-center gap-2">
      {label && (
        <span
          className="text-xs tracking-widest uppercase"
          style={{ color: fgMuted }}
        >
          {label}
        </span>
      )}
      <div
        className="flex items-center"
        style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: "hidden" }}
      >
        <button
          onClick={() => value > min && onChange(value - 1)}
          style={{
            background: "transparent",
            border: "none",
            color: value <= min ? dimmed : fg,
            padding: "8px 10px",
            fontSize: 15,
            fontFamily: "var(--font-playfair), Georgia, serif",
            lineHeight: 1,
          }}
        >
          −
        </button>
        <span
          style={{
            minWidth: 24,
            textAlign: "center",
            fontSize: 13,
            fontFamily: "var(--font-playfair), Georgia, serif",
            color: fg,
          }}
        >
          {value}
        </span>
        <button
          onClick={() => value < max && onChange(value + 1)}
          style={{
            background: "transparent",
            border: "none",
            color: value >= max ? dimmed : fg,
            padding: "8px 10px",
            fontSize: 15,
            fontFamily: "var(--font-playfair), Georgia, serif",
            lineHeight: 1,
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}
