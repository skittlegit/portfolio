"use client";

import { useState, useCallback } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import ToolLayout from "../../components/ToolLayout";
import { useTheme } from "../../context/ThemeContext";

export default function QrCodePage() {
  const { fg, fgMuted, isDark } = useTheme();
  const [text, setText] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const generate = useCallback(async (value: string) => {
    if (!value.trim()) {
      setQrDataUrl(null);
      return;
    }
    try {
      const url = await QRCode.toDataURL(value, {
        width: 300,
        margin: 2,
        color: {
          dark: isDark ? "#ffffff" : "#000000",
          light: "#00000000",
        },
      });
      setQrDataUrl(url);
    } catch {
      setQrDataUrl(null);
    }
  }, [isDark]);

  const handleChange = (value: string) => {
    setText(value);
    generate(value);
  };

  const download = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = "qrcode.png";
    a.click();
  };

  return (
    <ToolLayout title="QR Code Generator" description="Generate QR codes from any text or URL.">
      <div className="max-w-lg">
        <input
          type="text"
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Enter text or URL..."
          style={{
            width: "100%",
            padding: "14px 16px",
            fontSize: 15,
            fontFamily: "var(--font-playfair), Georgia, serif",
            color: fg,
            backgroundColor: "transparent",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
            borderRadius: 10,
            outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = isDark
              ? "rgba(255,255,255,0.4)"
              : "rgba(0,0,0,0.4)")
          }
          onBlur={(e) =>
            (e.currentTarget.style.borderColor = isDark
              ? "rgba(255,255,255,0.15)"
              : "rgba(0,0,0,0.15)")
          }
        />

        {qrDataUrl && (
          <div className="mt-8 flex flex-col items-start gap-4">
            <div
              style={{
                padding: 20,
                borderRadius: 12,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
              }}
            >
              <img src={qrDataUrl} alt="QR Code" width={200} height={200} />
            </div>
            <button
              onClick={download}
              className="flex items-center gap-2 text-sm tracking-wide"
              style={{
                color: fgMuted,
                background: "transparent",
                border: "none",
                fontFamily: "var(--font-playfair), Georgia, serif",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = fg)}
              onMouseLeave={(e) => (e.currentTarget.style.color = fgMuted)}
            >
              <Download size={14} strokeWidth={1.5} />
              Download PNG
            </button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
