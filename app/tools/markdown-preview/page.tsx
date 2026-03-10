"use client";

import { useState } from "react";
import ToolLayout from "../../components/ToolLayout";
import { useTheme } from "../../context/ThemeContext";

const SAMPLE = `# Hello World

This is **bold** and _italic_ text.

- Item one
- Item two
- Item three

> A blockquote for emphasis.

\`inline code\` and a [link](https://example.com).

---

1. First
2. Second
3. Third
`;

function parseMarkdown(md: string): string {
  let html = md
    // headings
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // hr
    .replace(/^---$/gm, "<hr/>")
    // bold & italic
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    // inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // blockquote
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    // unordered list
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    // ordered list
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>");

  // wrap consecutive <li> in <ul>
  html = html.replace(/((<li>.+<\/li>\n?)+)/g, "<ul>$1</ul>");
  // paragraphs for remaining lines
  html = html
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim();
      if (
        !trimmed ||
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<blockquote") ||
        trimmed.startsWith("<hr")
      )
        return trimmed;
      return `<p>${trimmed}</p>`;
    })
    .join("\n");

  return html;
}

export default function MarkdownPreviewPage() {
  const { fg, fgMuted, isDark } = useTheme();
  const [md, setMd] = useState(SAMPLE);

  return (
    <ToolLayout title="Markdown Preview" description="Write Markdown and see a live preview.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
        <div>
          <p
            className="text-xs tracking-widest uppercase mb-3"
            style={{ color: fgMuted }}
          >
            Markdown
          </p>
          <textarea
            value={md}
            onChange={(e) => setMd(e.target.value)}
            rows={20}
            style={{
              width: "100%",
              padding: "16px",
              fontSize: 14,
              fontFamily: "monospace",
              color: fg,
              backgroundColor: "transparent",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
              borderRadius: 10,
              outline: "none",
              resize: "vertical",
              lineHeight: 1.6,
            }}
          />
        </div>
        <div>
          <p
            className="text-xs tracking-widest uppercase mb-3"
            style={{ color: fgMuted }}
          >
            Preview
          </p>
          <div
            className="markdown-preview"
            style={{
              padding: "16px",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
              borderRadius: 10,
              minHeight: 200,
              fontSize: 15,
              lineHeight: 1.7,
              fontFamily: "var(--font-playfair), Georgia, serif",
            }}
            dangerouslySetInnerHTML={{ __html: parseMarkdown(md) }}
          />
        </div>
      </div>
    </ToolLayout>
  );
}
