"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import ToolLayout from "../../components/ToolLayout";
import { useTheme } from "../../context/ThemeContext";

export default function JsonFormatterPage() {
  const { fg, fgMuted, isDark } = useTheme();
  const [input, setInput] = useState('{"name":"Deepak","skills":["design","code","create"],"portfolio":{"tools":true,"minimal":true}}');
  const [indent, setIndent] = useState(2);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  let formatted = "";
  try {
    const parsed = JSON.parse(input);
    formatted = JSON.stringify(parsed, null, indent);
    if (error) setError("");
  } catch (e) {
    if (input.trim()) {
      formatted = "";
      const msg = (e as Error).message;
      if (error !== msg) setError(msg);
    }
  }

  const minify = () => {
    try {
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed));
      setError("");
    } catch {
      // keep current
    }
  };

  const prettify = () => {
    try {
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed, null, indent));
      setError("");
    } catch {
      // keep current
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(formatted || input);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const inputStyle: React.CSSProperties = {
    padding: "8px 14px",
    fontSize: 13,
    fontFamily: "var(--font-playfair), Georgia, serif",
    color: fg,
    backgroundColor: "transparent",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
    borderRadius: 8,
    outline: "none",
  };

  return (
    <ToolLayout title="JSON Formatter" description="Format, validate, and minify JSON data.">
      <div className="max-w-4xl">
        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-5 items-center">
          <button onClick={prettify} style={inputStyle}>
            Prettify
          </button>
          <button onClick={minify} style={inputStyle}>
            Minify
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs tracking-widest uppercase" style={{ color: fgMuted }}>
              Indent
            </span>
            <select
              value={indent}
              onChange={(e) => setIndent(Number(e.target.value))}
              style={{
                ...inputStyle,
                WebkitAppearance: "none",
                appearance: "none" as const,
                paddingRight: 24,
              }}
            >
              <option value={2}>2</option>
              <option value={4}>4</option>
              <option value={8}>8</option>
            </select>
          </div>
          <button
            onClick={copy}
            className="flex items-center gap-1 text-sm"
            style={{ background: "none", border: "none", color: fgMuted }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        {error && (
          <p className="text-xs mb-3" style={{ color: "#ef4444" }}>
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: fgMuted }}>
              Input
            </p>
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError("");
              }}
              rows={18}
              style={{
                width: "100%",
                padding: "14px",
                fontSize: 13,
                fontFamily: "monospace",
                color: fg,
                backgroundColor: "transparent",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
                borderRadius: 10,
                outline: "none",
                resize: "vertical",
                lineHeight: 1.5,
                tabSize: indent,
              }}
            />
          </div>
          <div>
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: fgMuted }}>
              Formatted
            </p>
            <pre
              style={{
                width: "100%",
                minHeight: 380,
                padding: "14px",
                fontSize: 13,
                fontFamily: "monospace",
                color: formatted ? fg : fgMuted,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                borderRadius: 10,
                overflow: "auto",
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                margin: 0,
              }}
            >
              {formatted || "Formatted output will appear here..."}
            </pre>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
