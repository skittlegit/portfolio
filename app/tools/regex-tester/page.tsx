"use client";

import { useState, useMemo } from "react";
import ToolLayout from "../../components/ToolLayout";
import { useTheme } from "../../context/ThemeContext";

export default function RegexTesterPage() {
  const { fg, fgMuted, isDark } = useTheme();
  const [pattern, setPattern] = useState("\\b\\w+@\\w+\\.\\w+\\b");
  const [flags, setFlags] = useState("gi");
  const [testStr, setTestStr] = useState(
    "Contact us at hello@example.com or support@test.org for help."
  );
  const [error, setError] = useState("");

  const matches = useMemo(() => {
    setError("");
    if (!pattern) return [];
    try {
      const re = new RegExp(pattern, flags);
      const results: { match: string; index: number }[] = [];
      let m;
      if (flags.includes("g")) {
        while ((m = re.exec(testStr)) !== null) {
          results.push({ match: m[0], index: m.index });
          if (!m[0]) break;
        }
      } else {
        m = re.exec(testStr);
        if (m) results.push({ match: m[0], index: m.index });
      }
      return results;
    } catch (e) {
      setError((e as Error).message);
      return [];
    }
  }, [pattern, flags, testStr]);

  const highlighted = useMemo(() => {
    if (!pattern || error || matches.length === 0) return null;
    try {
      const re = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
      const parts: { text: string; isMatch: boolean }[] = [];
      let lastIndex = 0;
      let m;
      while ((m = re.exec(testStr)) !== null) {
        if (m.index > lastIndex) {
          parts.push({ text: testStr.slice(lastIndex, m.index), isMatch: false });
        }
        parts.push({ text: m[0], isMatch: true });
        lastIndex = m.index + m[0].length;
        if (!m[0]) break;
      }
      if (lastIndex < testStr.length) {
        parts.push({ text: testStr.slice(lastIndex), isMatch: false });
      }
      return parts;
    } catch {
      return null;
    }
  }, [pattern, flags, testStr, error, matches]);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    fontSize: 14,
    fontFamily: "monospace",
    color: fg,
    backgroundColor: "transparent",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
    borderRadius: 8,
    outline: "none",
  };

  return (
    <ToolLayout title="Regex Tester" description="Test regular expressions with live matching.">
      <div className="max-w-2xl">
        <div className="flex gap-3 mb-5">
          <div className="flex-1">
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: fgMuted }}>
              Pattern
            </p>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ width: 80 }}>
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: fgMuted }}>
              Flags
            </p>
            <input
              type="text"
              value={flags}
              onChange={(e) => setFlags(e.target.value)}
              style={{ ...inputStyle, textAlign: "center" }}
            />
          </div>
        </div>

        {error && (
          <p className="text-xs mb-4" style={{ color: "#ef4444" }}>
            {error}
          </p>
        )}

        <div className="mb-5">
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: fgMuted }}>
            Test String
          </p>
          <textarea
            value={testStr}
            onChange={(e) => setTestStr(e.target.value)}
            rows={4}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
          />
        </div>

        {/* Highlighted output */}
        {highlighted && (
          <div className="mb-5">
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: fgMuted }}>
              Highlighted
            </p>
            <div
              style={{
                padding: "14px",
                borderRadius: 10,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                fontFamily: "monospace",
                fontSize: 14,
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {highlighted.map((part, i) =>
                part.isMatch ? (
                  <span
                    key={i}
                    style={{
                      backgroundColor: isDark ? "rgba(99,102,241,0.3)" : "rgba(99,102,241,0.2)",
                      borderRadius: 3,
                      padding: "1px 2px",
                    }}
                  >
                    {part.text}
                  </span>
                ) : (
                  <span key={i}>{part.text}</span>
                )
              )}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: fgMuted }}>
            Matches ({matches.length})
          </p>
          {matches.length === 0 ? (
            <p className="text-sm" style={{ color: fgMuted }}>
              No matches found.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {matches.map((m, i) => (
                <span
                  key={i}
                  style={{
                    padding: "4px 10px",
                    fontSize: 13,
                    fontFamily: "monospace",
                    borderRadius: 6,
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`,
                    color: fgMuted,
                  }}
                >
                  {m.match}
                  <span style={{ opacity: 0.5, marginLeft: 6, fontSize: 11 }}>@{m.index}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
