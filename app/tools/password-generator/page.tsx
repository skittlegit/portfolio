"use client";

import { useState, useCallback } from "react";
import { Copy, Check, RefreshCw } from "lucide-react";
import ToolLayout from "../../components/ToolLayout";
import { useTheme } from "../../context/ThemeContext";

function generatePassword(length: number, opts: { upper: boolean; lower: boolean; numbers: boolean; symbols: boolean }): string {
  let chars = "";
  if (opts.lower) chars += "abcdefghijklmnopqrstuvwxyz";
  if (opts.upper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (opts.numbers) chars += "0123456789";
  if (opts.symbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";
  if (!chars) chars = "abcdefghijklmnopqrstuvwxyz";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (v) => chars[v % chars.length]).join("");
}

export default function PasswordGeneratorPage() {
  const { fg, fgMuted, isDark } = useTheme();
  const [length, setLength] = useState(16);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [password, setPassword] = useState(() =>
    generatePassword(16, { upper: true, lower: true, numbers: true, symbols: true })
  );
  const [copied, setCopied] = useState(false);

  const regen = useCallback(() => {
    setPassword(generatePassword(length, { upper, lower, numbers, symbols }));
  }, [length, upper, lower, numbers, symbols]);

  const copy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const checkStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    color: fg,
    fontFamily: "var(--font-playfair), Georgia, serif",
  };

  return (
    <ToolLayout title="Password Generator" description="Generate secure random passwords.">
      <div className="max-w-md">
        {/* Password display */}
        <div
          className="flex items-center gap-2 mb-8"
          style={{
            padding: "14px 16px",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
            borderRadius: 10,
            fontFamily: "monospace",
            fontSize: 16,
            letterSpacing: "0.05em",
            wordBreak: "break-all",
          }}
        >
          <span className="flex-1">{password}</span>
          <button
            onClick={copy}
            style={{ background: "none", border: "none", color: fgMuted, flexShrink: 0 }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          <button
            onClick={regen}
            style={{ background: "none", border: "none", color: fgMuted, flexShrink: 0 }}
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Length slider */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-xs tracking-widest uppercase" style={{ color: fgMuted }}>
              Length
            </span>
            <span className="text-sm" style={{ color: fgMuted }}>
              {length}
            </span>
          </div>
          <input
            type="range"
            min={6}
            max={64}
            value={length}
            onChange={(e) => {
              setLength(Number(e.target.value));
            }}
            onMouseUp={regen}
            onTouchEnd={regen}
            style={{ width: "100%", accentColor: fg }}
          />
        </div>

        {/* Options */}
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {[
            { label: "Uppercase", val: upper, set: setUpper },
            { label: "Lowercase", val: lower, set: setLower },
            { label: "Numbers", val: numbers, set: setNumbers },
            { label: "Symbols", val: symbols, set: setSymbols },
          ].map(({ label, val, set }) => (
            <label key={label} style={checkStyle}>
              <input
                type="checkbox"
                checked={val}
                onChange={(e) => {
                  set(e.target.checked);
                  setTimeout(regen, 0);
                }}
                style={{ accentColor: fg }}
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </ToolLayout>
  );
}
