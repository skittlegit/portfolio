"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Copy, Check, Upload, Type } from "lucide-react";
import ToolLayout from "../../components/ToolLayout";
import { useTheme } from "../../context/ThemeContext";

const ASCII_CHARS_DENSE = "@%#*+=-:. ";
const ASCII_CHARS_SIMPLE = "#@&%$*o!;:. ";
const ASCII_CHARS_BLOCKS = "█▓▒░ ";

type Mode = "text" | "image";
type CharSet = "dense" | "simple" | "blocks";

function textToAscii(text: string): string {
  const charMap: Record<string, string[]> = {
    A: ["  █  ", " █ █ ", "█████", "█   █", "█   █"],
    B: ["████ ", "█   █", "████ ", "█   █", "████ "],
    C: [" ████", "█    ", "█    ", "█    ", " ████"],
    D: ["████ ", "█   █", "█   █", "█   █", "████ "],
    E: ["█████", "█    ", "████ ", "█    ", "█████"],
    F: ["█████", "█    ", "████ ", "█    ", "█    "],
    G: [" ████", "█    ", "█  ██", "█   █", " ████"],
    H: ["█   █", "█   █", "█████", "█   █", "█   █"],
    I: ["█████", "  █  ", "  █  ", "  █  ", "█████"],
    J: ["█████", "   █ ", "   █ ", "█  █ ", " ██  "],
    K: ["█   █", "█  █ ", "███  ", "█  █ ", "█   █"],
    L: ["█    ", "█    ", "█    ", "█    ", "█████"],
    M: ["█   █", "██ ██", "█ █ █", "█   █", "█   █"],
    N: ["█   █", "██  █", "█ █ █", "█  ██", "█   █"],
    O: [" ███ ", "█   █", "█   █", "█   █", " ███ "],
    P: ["████ ", "█   █", "████ ", "█    ", "█    "],
    Q: [" ███ ", "█   █", "█ █ █", "█  █ ", " ██ █"],
    R: ["████ ", "█   █", "████ ", "█  █ ", "█   █"],
    S: [" ████", "█    ", " ███ ", "    █", "████ "],
    T: ["█████", "  █  ", "  █  ", "  █  ", "  █  "],
    U: ["█   █", "█   █", "█   █", "█   █", " ███ "],
    V: ["█   █", "█   █", " █ █ ", " █ █ ", "  █  "],
    W: ["█   █", "█   █", "█ █ █", "██ ██", "█   █"],
    X: ["█   █", " █ █ ", "  █  ", " █ █ ", "█   █"],
    Y: ["█   █", " █ █ ", "  █  ", "  █  ", "  █  "],
    Z: ["█████", "   █ ", "  █  ", " █   ", "█████"],
    "0": [" ███ ", "█  ██", "█ █ █", "██  █", " ███ "],
    "1": ["  █  ", " ██  ", "  █  ", "  █  ", " ███ "],
    "2": [" ███ ", "█   █", "  ██ ", " █   ", "█████"],
    "3": ["████ ", "    █", " ███ ", "    █", "████ "],
    "4": ["█   █", "█   █", "█████", "    █", "    █"],
    "5": ["█████", "█    ", "████ ", "    █", "████ "],
    "6": [" ███ ", "█    ", "████ ", "█   █", " ███ "],
    "7": ["█████", "   █ ", "  █  ", " █   ", "█    "],
    "8": [" ███ ", "█   █", " ███ ", "█   █", " ███ "],
    "9": [" ███ ", "█   █", " ████", "    █", " ███ "],
    " ": ["     ", "     ", "     ", "     ", "     "],
    "!": ["  █  ", "  █  ", "  █  ", "     ", "  █  "],
    ".": ["     ", "     ", "     ", "     ", "  █  "],
    ",": ["     ", "     ", "     ", "  █  ", " █   "],
    "?": [" ███ ", "█   █", "  █  ", "     ", "  █  "],
  };

  const upper = text.toUpperCase();
  const lines: string[] = ["", "", "", "", ""];

  for (const ch of upper) {
    const glyph = charMap[ch] || charMap[" "];
    for (let row = 0; row < 5; row++) {
      lines[row] += (glyph?.[row] || "     ") + " ";
    }
  }

  return lines.join("\n");
}

function getChars(cs: CharSet): string {
  if (cs === "simple") return ASCII_CHARS_SIMPLE;
  if (cs === "blocks") return ASCII_CHARS_BLOCKS;
  return ASCII_CHARS_DENSE;
}

export default function AsciiArtPage() {
  const { fg, fgMuted, isDark } = useTheme();
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("HELLO");
  const [width, setWidth] = useState(80);
  const [charSet, setCharSet] = useState<CharSet>("dense");
  const [imageAscii, setImageAscii] = useState("");
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const currentFileRef = useRef<File | null>(null);

  const processImage = useCallback(
    (file: File, w: number, cs: CharSet) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const aspect = img.height / img.width;
        const h = Math.round(w * aspect * 0.5);
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);

        const data = ctx.getImageData(0, 0, w, h).data;
        const chars = getChars(cs);
        let result = "";

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            const brightness = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
            const charIdx = Math.floor((1 - brightness) * (chars.length - 1));
            result += chars[charIdx];
          }
          result += "\n";
        }
        setImageAscii(result);
      };
      img.src = URL.createObjectURL(file);
    },
    []
  );

  // Re-process image when width or charSet changes
  useEffect(() => {
    if (mode === "image" && currentFileRef.current) {
      processImage(currentFileRef.current, width, charSet);
    }
  }, [width, charSet, mode, processImage]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      currentFileRef.current = file;
      processImage(file, width, charSet);
    }
  };

  const asciiOutput = mode === "text" ? textToAscii(text) : imageAscii;

  const copy = () => {
    navigator.clipboard.writeText(asciiOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <ToolLayout title="ASCII Art Generator" description="Convert text or images into ASCII art.">
      <div className="max-w-4xl">
        <canvas ref={canvasRef} style={{ display: "none" }} />
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />

        {/* Mode toggle */}
        <div className="flex gap-2 mb-6">
          {(["text", "image"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="tool-btn"
              style={{
                background: mode === m ? (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)") : "transparent",
                color: mode === m ? fg : undefined,
                textTransform: "capitalize",
              }}
            >
              {m === "text" ? <Type size={14} /> : <Upload size={14} />}
              {m}
            </button>
          ))}
        </div>

        {mode === "text" ? (
          <div className="mb-6">
            <label className="tool-label">Text</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="tool-input w-full"
              placeholder="Enter text..."
              maxLength={20}
            />
          </div>
        ) : (
          <div className="mb-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="tool-label">Image</label>
                <button onClick={() => fileRef.current?.click()} className="tool-btn">
                  <Upload size={14} /> Upload Image
                </button>
              </div>
              <div>
                <label className="tool-label">Width (chars)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={40}
                    max={200}
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    style={{ width: 120, accentColor: fg }}
                  />
                  <span className="text-sm" style={{ color: fgMuted }}>{width}</span>
                </div>
              </div>
              <div>
                <label className="tool-label">Char Set</label>
                <select
                  value={charSet}
                  onChange={(e) => setCharSet(e.target.value as CharSet)}
                  className="tool-select"
                >
                  <option value="dense">Dense</option>
                  <option value="simple">Simple</option>
                  <option value="blocks">Blocks</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Output */}
        {asciiOutput && (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <label className="tool-label" style={{ marginBottom: 0 }}>Output</label>
              <button onClick={copy} className="tool-icon-btn">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <pre
              style={{
                fontFamily: "monospace",
                fontSize: mode === "image" ? 5 : 10,
                lineHeight: mode === "image" ? 1 : 1.2,
                padding: 16,
                borderRadius: 10,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                overflow: "auto",
                maxHeight: 500,
                whiteSpace: "pre",
                color: fg,
                letterSpacing: mode === "image" ? "1px" : undefined,
              }}
            >
              {asciiOutput}
            </pre>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
