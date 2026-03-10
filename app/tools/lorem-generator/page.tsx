"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import ToolLayout from "../../components/ToolLayout";
import { useTheme } from "../../context/ThemeContext";

const WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
  "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
  "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint",
  "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia",
  "deserunt", "mollit", "anim", "id", "est", "laborum",
];

function genSentence(): string {
  const len = 6 + Math.floor(Math.random() * 10);
  const sentence = Array.from({ length: len }, () => WORDS[Math.floor(Math.random() * WORDS.length)]).join(" ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
}

function genParagraph(): string {
  const count = 3 + Math.floor(Math.random() * 4);
  return Array.from({ length: count }, genSentence).join(" ");
}

export default function LoremGeneratorPage() {
  const { fg, fgMuted, isDark } = useTheme();
  const [count, setCount] = useState(3);
  const [output, setOutput] = useState(() =>
    Array.from({ length: 3 }, genParagraph).join("\n\n")
  );
  const [copied, setCopied] = useState(false);

  const generate = () => {
    setOutput(Array.from({ length: count }, genParagraph).join("\n\n"));
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <ToolLayout title="Lorem Ipsum Generator" description="Generate placeholder text for your designs.">
      <div className="max-w-2xl">
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <label
              className="text-xs tracking-widest uppercase"
              style={{ color: fgMuted }}
            >
              Paragraphs
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              style={{
                width: 60,
                padding: "8px 10px",
                fontSize: 14,
                fontFamily: "var(--font-playfair), Georgia, serif",
                color: fg,
                backgroundColor: "transparent",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
                borderRadius: 8,
                outline: "none",
                textAlign: "center",
              }}
            />
          </div>
          <button
            onClick={generate}
            className="text-sm tracking-wide"
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: `1px solid ${isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}`,
              background: "transparent",
              color: fg,
              fontFamily: "var(--font-playfair), Georgia, serif",
            }}
          >
            Generate
          </button>
          <button
            onClick={copy}
            className="flex items-center gap-1 text-sm"
            style={{
              background: "none",
              border: "none",
              color: fgMuted,
              fontFamily: "var(--font-playfair), Georgia, serif",
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <div
          style={{
            padding: "16px",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
            borderRadius: 10,
            fontSize: 14,
            lineHeight: 1.8,
            whiteSpace: "pre-wrap",
            color: fgMuted,
          }}
        >
          {output}
        </div>
      </div>
    </ToolLayout>
  );
}
