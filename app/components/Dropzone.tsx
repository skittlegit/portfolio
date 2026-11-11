"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";

// Shared upload target for the tools: click, keyboard (it's a real button)
// or drag-and-drop. The page keeps its own hidden <input type="file"> and
// passes `onPick` to open it; dropped files arrive through `onFiles`, already
// filtered to images.
export default function Dropzone({
  onPick,
  onFiles,
  label,
  hint,
  multiple = false,
  busy = false,
  compact = false,
}: {
  onPick: () => void;
  onFiles: (files: File[]) => void;
  label: string;
  hint?: string;
  multiple?: boolean;
  busy?: boolean;
  compact?: boolean;
}) {
  const [over, setOver] = useState(false);
  // dragenter/dragleave also fire for child elements — count them so the
  // highlight doesn't flicker as the pointer crosses the icon and text
  const depth = useRef(0);

  const hasFiles = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes("Files");

  return (
    <button
      type="button"
      className="tool-drop"
      data-drag={over}
      data-compact={compact}
      aria-busy={busy}
      onClick={onPick}
      onDragEnter={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        depth.current += 1;
        setOver(true);
      }}
      onDragOver={(e) => {
        if (!hasFiles(e)) return;
        // without this the browser navigates to the dropped file
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={() => {
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        depth.current = 0;
        setOver(false);
        const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
        if (files.length > 0) onFiles(multiple ? files : files.slice(0, 1));
      }}
    >
      <span className="tool-drop-icon" aria-hidden>
        <Upload size={18} strokeWidth={1.5} />
      </span>
      <span className="tool-drop-label">{over ? "Drop to add" : label}</span>
      {hint && <span className="tool-drop-hint">{hint}</span>}
    </button>
  );
}
