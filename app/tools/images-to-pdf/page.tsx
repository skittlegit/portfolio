"use client";

import { useState, useRef } from "react";
import { Upload, Download, X, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import ToolLayout from "../../components/ToolLayout";
import { useTheme } from "../../context/ThemeContext";

type ImageItem = {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
};

type PageSize = "a4" | "letter" | "fit";

const PAGE_SIZES = {
  a4: { w: 595.28, h: 841.89 },
  letter: { w: 612, h: 792 },
  fit: { w: 0, h: 0 },
};

export default function ImagesToPdfPage() {
  const { fg, fgMuted, isDark } = useTheme();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("fit");
  const [margin, setMargin] = useState(0);
  const [quality, setQuality] = useState<"high" | "medium">("high");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  // Read one file into a data URL + dimensions; null if it can't be decoded.
  const readImage = (file: File): Promise<ImageItem | null> =>
    new Promise((resolve) => {
      if (!file.type.startsWith("image/")) return resolve(null);
      const reader = new FileReader();
      reader.onerror = () => resolve(null);
      reader.onload = () => {
        const url = reader.result as string;
        const img = new window.Image();
        img.onerror = () => resolve(null);
        img.onload = () =>
          resolve({
            id: Math.random().toString(36).slice(2),
            name: file.name,
            url,
            width: img.width,
            height: img.height,
          });
        img.src = url;
      };
      reader.readAsDataURL(file);
    });

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (fileRef.current) fileRef.current.value = "";
    if (selected.length === 0) return;

    // Promise.all keeps the selection order regardless of which file
    // finishes decoding first.
    const read = await Promise.all(selected.map(readImage));
    const ok = read.filter((r): r is ImageItem => r !== null);
    const badCount = read.length - ok.length;
    setError(badCount > 0 ? `Couldn't read ${badCount} file${badCount === 1 ? "" : "s"} — try JPEG, PNG or WebP.` : null);
    setImages((prev) => [...prev, ...ok]);
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((i) => i.id !== id));
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const copy = [...images];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    setImages(copy);
  };

  const handleDragStart = (i: number) => {
    dragItem.current = i;
  };
  const handleDragEnter = (i: number) => {
    dragOver.current = i;
  };
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOver.current === null) return;
    moveImage(dragItem.current, dragOver.current);
    dragItem.current = null;
    dragOver.current = null;
  };

  const generatePdf = async () => {
    if (images.length === 0) return;
    setGenerating(true);
    setError(null);

    try {
    const { jsPDF } = await import("jspdf");

    let pdf: InstanceType<typeof jsPDF> | null = null;

    for (let i = 0; i < images.length; i++) {
      const item = images[i];
      const img = new window.Image();
      img.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        img.onerror = () => reject(new Error(`Could not load ${item.name}`));
        img.onload = () => {
          try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0);

          const format = quality === "high" ? "PNG" : "JPEG";
          const dataUrl =
            quality === "high"
              ? canvas.toDataURL("image/png")
              : canvas.toDataURL("image/jpeg", 0.95);

          if (pageSize === "fit") {
            const pxToPt = 72 / 96;
            const imgWpt = img.width * pxToPt;
            const imgHpt = img.height * pxToPt;
            const pW = imgWpt + margin * 2;
            const pH = imgHpt + margin * 2;
            if (!pdf) {
              pdf = new jsPDF({ unit: "pt", format: [pW, pH] });
            } else {
              pdf.addPage([pW, pH]);
            }
            pdf.addImage(dataUrl, format, margin, margin, imgWpt, imgHpt);
          } else {
            const page = PAGE_SIZES[pageSize];
            if (!pdf) {
              pdf = new jsPDF({ unit: "pt", format: [page.w, page.h] });
            } else {
              pdf.addPage([page.w, page.h]);
            }
            const availW = page.w - margin * 2;
            const availH = page.h - margin * 2;
            const scale = Math.min(availW / img.width, availH / img.height, 1);
            const iW = img.width * scale;
            const iH = img.height * scale;
            const x = margin + (availW - iW) / 2;
            const y = margin + (availH - iH) / 2;
            pdf.addImage(dataUrl, format, x, y, iW, iH);
          }
          resolve();
          } catch (err) {
            reject(err);
          }
        };
        img.src = item.url;
      });
    }

    if (pdf) {
      (pdf as InstanceType<typeof jsPDF>).save("images.pdf");
    }
    } catch {
      setError("Couldn't build the PDF — one of the images may be too large or unreadable.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <ToolLayout
      title="Images to PDF"
      description="Combine multiple images into a single PDF."
    >
      <div className="max-w-3xl">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFiles}
          style={{ display: "none" }}
        />

        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-end mb-6">
          <div>
            <label className="tool-label">Page Size</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value as PageSize)}
              className="tool-select"
            >
              <option value="fit">Fit to Image</option>
              <option value="a4">A4</option>
              <option value="letter">Letter</option>
            </select>
          </div>
          <div>
            <label className="tool-label">Margin</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={80}
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                style={{ width: 100, accentColor: fg }}
              />
              <span className="text-xs" style={{ color: fgMuted }}>
                {margin}pt
              </span>
            </div>
          </div>
          <div>
            <label className="tool-label">Quality</label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value as "high" | "medium")}
              className="tool-select"
            >
              <option value="high">High (PNG)</option>
              <option value="medium">Medium (JPEG)</option>
            </select>
          </div>
        </div>

        {/* Upload area */}
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`,
            borderRadius: 0,
            padding: "40px 20px",
            textAlign: "center",
            color: fgMuted,
            cursor: "pointer",
            marginBottom: 24,
          }}
        >
          <Upload
            size={28}
            strokeWidth={1}
            style={{ margin: "0 auto 10px" }}
          />
          <p className="text-sm">Click to add images</p>
        </div>

        {error && (
          <p role="alert" className="text-sm" style={{ color: "var(--accent)", marginBottom: 24 }}>
            {error}
          </p>
        )}

        {/* Image list */}
        {images.length > 0 && (
          <>
            <div className="flex flex-col gap-2 mb-6">
              {images.map((item, i) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragEnter={() => handleDragEnter(i)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 0,
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                    cursor: "grab",
                  }}
                >
                  <GripVertical
                    size={14}
                    style={{ color: fgMuted, flexShrink: 0 }}
                  />
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 0,
                      overflow: "hidden",
                      flexShrink: 0,
                      backgroundImage: `url(${item.url})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <span className="flex-1 text-sm truncate">{item.name}</span>
                  <span className="text-xs" style={{ color: fgMuted }}>
                    {item.width}&times;{item.height}
                  </span>
                  <button
                    onClick={() => moveImage(i, i - 1)}
                    aria-label={`Move ${item.name} up`}
                    disabled={i === 0}
                    style={{
                      background: "none",
                      border: "none",
                      color: i === 0 ? `${fgMuted}50` : fgMuted,
                      cursor: i === 0 ? "default" : "pointer",
                      padding: 2,
                    }}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => moveImage(i, i + 1)}
                    aria-label={`Move ${item.name} down`}
                    disabled={i === images.length - 1}
                    style={{
                      background: "none",
                      border: "none",
                      color:
                        i === images.length - 1 ? `${fgMuted}50` : fgMuted,
                      cursor: i === images.length - 1 ? "default" : "pointer",
                      padding: 2,
                    }}
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    onClick={() => removeImage(item.id)}
                    aria-label={`Remove ${item.name}`}
                    style={{
                      background: "none",
                      border: "none",
                      color: fgMuted,
                      padding: 2,
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={generatePdf}
              disabled={generating}
              className="tool-btn"
              style={{ color: fg }}
            >
              <Download size={14} />
              {generating
                ? "Generating..."
                : `Generate PDF (${images.length} images)`}
            </button>
          </>
        )}
      </div>
    </ToolLayout>
  );
}
