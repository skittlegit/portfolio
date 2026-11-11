"use client";

import { useState, useRef, useEffect } from "react";
import { Download, X, FileArchive } from "lucide-react";
import ToolLayout from "../../components/ToolLayout";
import Dropzone from "../../components/Dropzone";
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
  const [failed, setFailed] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Resolves null when the browser can't decode the file (HEIC, corrupt, …)
  // so one bad image never stalls the rest of the batch.
  const compressImage = (file: File): Promise<CompressedFile | null> => {
    return new Promise((resolve) => {
      const srcUrl = URL.createObjectURL(file);
      const img = new window.Image();
      img.onerror = () => {
        URL.revokeObjectURL(srcUrl);
        resolve(null);
      };
      img.onload = () => {
        URL.revokeObjectURL(srcUrl);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx || !img.width || !img.height) return resolve(null);

        let w = img.width;
        let h = img.height;
        const resized = w > maxWidth;
        if (resized) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }

        canvas.width = w;
        canvas.height = h;
        // JPEG has no alpha — flatten onto white so transparent areas don't
        // come out black.
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(null);
            // Re-encoding an already-small file can make it bigger; in that
            // case hand back the original untouched.
            if (!resized && blob.size >= file.size) {
              return resolve({
                name: file.name,
                originalSize: file.size,
                compressedSize: file.size,
                url: URL.createObjectURL(file),
                type: file.type,
              });
            }
            resolve({
              name: file.name.replace(/\.[^.]+$/, "") + "_compressed.jpg",
              originalSize: file.size,
              compressedSize: blob.size,
              url: URL.createObjectURL(blob),
              type: "image/jpeg",
            });
          },
          "image/jpeg",
          quality
        );
      };
      img.src = srcUrl;
    });
  };

  const processFiles = async (selected: File[]) => {
    if (selected.length === 0 || processing) return;
    setProcessing(true);
    setFailed([]);

    const results: CompressedFile[] = [];
    const bad: string[] = [];
    try {
      for (const file of selected) {
        const compressed = file.type.startsWith("image/") ? await compressImage(file) : null;
        if (compressed) results.push(compressed);
        else bad.push(file.name);
      }
    } finally {
      setFiles((prev) => [...prev, ...results]);
      setFailed(bad);
      setProcessing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // Release every result's object URL when leaving the page.
  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);
  useEffect(() => () => filesRef.current.forEach((f) => URL.revokeObjectURL(f.url)), []);

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
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => processFiles(Array.from(e.target.files ?? []))} style={{ display: "none" }} />

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
        <div style={{ marginBottom: 24 }}>
          <Dropzone
            multiple
            busy={processing}
            onPick={() => fileRef.current?.click()}
            onFiles={processFiles}
            label={processing ? "Compressing…" : "Select or drop images"}
            hint="JPEG · PNG · WebP — nothing leaves your browser"
          />
        </div>

        {failed.length > 0 && (
          <p role="alert" className="text-sm" style={{ color: "var(--accent)", marginBottom: 24 }}>
            Couldn&apos;t read {failed.length === 1 ? "this file" : `${failed.length} files`}: {failed.join(", ")}. Try JPEG, PNG or WebP.
          </p>
        )}

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
                      borderRadius: 0,
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="text-sm truncate" style={{ color: fg }}>{f.name}</p>
                      <p className="text-xs" style={{ color: fgMuted }}>
                        {formatSize(f.originalSize)} → {formatSize(f.compressedSize)} ({saved}% saved)
                      </p>
                    </div>
                    <button onClick={() => downloadFile(f)} className="tool-icon-btn" aria-label={`Download ${f.name}`}>
                      <Download size={14} />
                    </button>
                    <button onClick={() => removeFile(i)} className="tool-icon-btn" aria-label={`Remove ${f.name}`}>
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
