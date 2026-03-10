"use client";

import { useState, useMemo } from "react";
import ToolLayout from "../../components/ToolLayout";
import { useTheme } from "../../context/ThemeContext";

export default function WordCounterPage() {
  const { fg, fgMuted, isDark } = useTheme();
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, "").length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const sentences = text.trim()
      ? text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length
      : 0;
    const paragraphs = text.trim()
      ? text.split(/\n\s*\n/).filter((s) => s.trim().length > 0).length
      : 0;
    const readingTime = Math.max(1, Math.ceil(words / 200));
    return { chars, charsNoSpace, words, sentences, paragraphs, readingTime };
  }, [text]);

  const statItems = [
    { label: "Words", value: stats.words },
    { label: "Characters", value: stats.chars },
    { label: "No spaces", value: stats.charsNoSpace },
    { label: "Sentences", value: stats.sentences },
    { label: "Paragraphs", value: stats.paragraphs },
    { label: "Reading time", value: `${stats.readingTime} min` },
  ];

  return (
    <ToolLayout title="Word Counter" description="Count words, characters, sentences, and more.">
      <div className="max-w-2xl">
        <div className="flex flex-wrap gap-6 mb-6">
          {statItems.map(({ label, value }) => (
            <div key={label}>
              <p className="text-2xl font-normal tracking-tight">{value}</p>
              <p
                className="text-xs tracking-widest uppercase mt-1"
                style={{ color: fgMuted }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start typing or paste your text..."
          rows={12}
          style={{
            width: "100%",
            padding: "16px",
            fontSize: 15,
            fontFamily: "var(--font-playfair), Georgia, serif",
            color: fg,
            backgroundColor: "transparent",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
            borderRadius: 10,
            outline: "none",
            resize: "vertical",
            lineHeight: 1.7,
          }}
        />
      </div>
    </ToolLayout>
  );
}
