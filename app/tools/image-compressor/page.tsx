"use client";

import { useState, useRef } from "react";
import { Upload, Download, X, FileArchive } from "lucide-react";
import ToolLayout from "../../components/ToolLayout";
import { useTheme } from "../../context/ThemeContext";

type CompressedFile = {
  name: string;
  originalSize: number;
  compressedSize: number;
  url: string;
  type: string;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

export default function CompressorPage() {
  const { fg, fgMuted, isDark } = useTheme();
  const [quality, setQuality] = useState(0.7);
  const [maxWidth, setMaxWidth] = useState(1920);
  const [files, setFiles] = useState<CompressedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const compressImage = (file: File): Promise<CompressedFile> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);

        canvas.toBlob(
          (blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            resolve({
              name: file.name.replace(/\.[^.]+$/, "") + "_compressed.jpg",
              originalSize: file.size,
              compressedSize: blob.size,
              url,
              type: "image/jpeg",
            });
          },
          "image/jpeg",
          quality
        );
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    setProcessing(true);

    const results: CompressedFile[] = [];
    for (const file of Array.from(selected)) {
      if (file.type.startsWith("image/")) {
        const compressed = await compressImage(file);
        results.push(compressed);
      }
    }

    setFiles((prev) => [...prev, ...results]);
    setProcessing(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const downloadFile = (f: CompressedFile) => {
    const a = document.createElement("a");
    a.href = f.url;
    a.download = f.name;
    a.click();
  };

  const downloadAll = () => files.forEach(downloadFile);

  const removeFile = (i: number) => {
    URL.revokeObjectURL(files[i].url);
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  };

  const totalOriginal = files.reduce((s, f) => s + f.originalSize, 0);
  const totalCompressed = files.reduce((s, f) => s + f.compressedSize, 0);
  const savedPercent = totalOriginal > 0 ? Math.round((1 - totalCompressed / totalOriginal) * 100) : 0;

  return (
    <ToolLayout title="Image Compressor" description="Compress images right in your browser. No uploads.">
      <div className="max-w-3xl">
        <canvas ref={canvasRef} style={{ display: "none" }} />
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: "none" }} />

        {/* Controls */}
        <div className="flex flex-wrap gap-6 items-end mb-6">
          <div>
            <label className="tool-label">Quality</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                style={{ width: 120, accentColor: fg }}
              />
              <span className="text-sm" style={{ color: fgMuted }}>{Math.round(quality * 100)}%</span>
            </div>
          </div>
          <div>
            <label className="tool-label">Max Width</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={320}
                max={3840}
                step={160}
                value={maxWidth}
                onChange={(e) => setMaxWidth(Number(e.target.value))}
                style={{ width: 120, accentColor: fg }}
              />
              <span className="text-sm" style={{ color: fgMuted }}>{maxWidth}px</span>
            </div>
          </div>
        </div>

        {/* Upload area */}
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`,
            borderRadius: 14,
            padding: "40px 20px",
            textAlign: "center",
            color: fgMuted,
            cursor: "pointer",
            marginBottom: 24,
          }}
        >
          <Upload size={28} strokeWidth={1} style={{ margin: "0 auto 10px" }} />
          <p className="text-sm">{processing ? "Compressing..." : "Click to select images"}</p>
        </div>

        {/* Results */}
        {files.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm" style={{ color: fgMuted }}>
                <FileArchive size={14} style={{ display: "inline", marginRight: 6 }} />
                Saved {savedPercent}% — {formatSize(totalOriginal)} → {formatSize(totalCompressed)}
              </div>
              <button onClick={downloadAll} className="tool-btn" style={{ fontSize: 12, padding: "6px 12px" }}>
                <Download size={14} /> Download All
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {files.map((f, i) => {
                const saved = Math.round((1 - f.compressedSize / f.originalSize) * 100);
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="text-sm truncate" style={{ color: fg }}>{f.name}</p>
                      <p className="text-xs" style={{ color: fgMuted }}>
                        {formatSize(f.originalSize)} → {formatSize(f.compressedSize)} ({saved}% saved)
                      </p>
                    </div>
                    <button onClick={() => downloadFile(f)} className="tool-icon-btn">
                      <Download size={14} />
                    </button>
                    <button onClick={() => removeFile(i)} className="tool-icon-btn">
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </ToolLayout>
  );
}
