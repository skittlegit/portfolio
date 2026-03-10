"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import ToolLayout from "../../components/ToolLayout";
import { useTheme } from "../../context/ThemeContext";

export default function Base64Page() {
  const { fg, fgMuted, isDark } = useTheme();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const process = (text: string, m: "encode" | "decode") => {
    setInput(text);
    setError("");
    if (!text.trim()) {
      setOutput("");
      return;
    }
    try {
      if (m === "encode") {
        setOutput(btoa(unescape(encodeURIComponent(text))));
      } else {
        setOutput(decodeURIComponent(escape(atob(text))));
      }
    } catch {
      setError("Invalid input for " + (m === "encode" ? "encoding" : "decoding"));
      setOutput("");
    }
  };

  const switchMode = (m: "encode" | "decode") => {
    setMode(m);
    process(input, m);
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 20px",
    fontSize: 13,
    fontFamily: "var(--font-playfair), Georgia, serif",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
    borderRadius: 8,
    background: active ? (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)") : "transparent",
    color: active ? fg : fgMuted,
    transition: "all 0.2s",
  });

  return (
    <ToolLayout title="Base64 Encoder/Decoder" description="Encode or decode Base64 strings.">
      <div className="max-w-2xl">
        <div className="flex gap-2 mb-6">
          <button onClick={() => switchMode("encode")} style={tabStyle(mode === "encode")}>
            Encode
          </button>
          <button onClick={() => switchMode("decode")} style={tabStyle(mode === "decode")}>
            Decode
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: fgMuted }}>
              Input
            </p>
            <textarea
              value={input}
              onChange={(e) => process(e.target.value, mode)}
              rows={8}
              placeholder={mode === "encode" ? "Enter text to encode..." : "Enter Base64 to decode..."}
              style={{
                width: "100%",
                padding: "14px",
                fontSize: 14,
                fontFamily: "monospace",
                color: fg,
                backgroundColor: "transparent",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
                borderRadius: 10,
                outline: "none",
                resize: "vertical",
              }}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs tracking-widest uppercase" style={{ color: fgMuted }}>
                Output
              </p>
              {output && (
                <button
                  onClick={copy}
                  className="flex items-center gap-1 text-xs"
                  style={{ background: "none", border: "none", color: fgMuted }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                </button>
              )}
            </div>
            <div
              style={{
                width: "100%",
                minHeight: 190,
                padding: "14px",
                fontSize: 14,
                fontFamily: "monospace",
                color: error ? "#ef4444" : fgMuted,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                borderRadius: 10,
                wordBreak: "break-all",
                whiteSpace: "pre-wrap",
              }}
            >
              {error || output || "Result will appear here..."}
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
