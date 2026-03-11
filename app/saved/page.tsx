"use client";

import { useState, useEffect } from "react";
import { Trash2, QrCode, Paintbrush, Layers, ExternalLink, Grid3X3, Hexagon, Shapes } from "lucide-react";
import Link from "next/link";
import ToolLayout from "../components/ToolLayout";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { getSavedItems, deleteSavedItem, type SavedItem } from "@/lib/saved-items";

const typeIcons: Record<string, typeof QrCode> = {
  "qr-code": QrCode,
  palette: Paintbrush,
  gradient: Layers,
  pattern: Grid3X3,
  "vector-art": Hexagon,
  shape: Shapes,
};

const typeLabels: Record<string, string> = {
  "qr-code": "QR Code",
  palette: "Palette",
  gradient: "Gradient",
  pattern: "Pattern",
  "vector-art": "Vector Art",
  shape: "Shape",
};

const typeLinks: Record<string, string> = {
  "qr-code": "/tools/qr-code",
  palette: "/tools/palette-generator",
  gradient: "/tools/gradient-generator",
  pattern: "/tools/pattern-library",
  "vector-art": "/tools/vector-art",
  shape: "/tools/logo-maker",
};

function PalettePreview({ colors }: { colors: string[] }) {
  return (
    <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 48 }}>
      {colors.map((c, i) => (
        <div key={i} style={{ flex: 1, backgroundColor: c }} />
      ))}
    </div>
  );
}

function GradientPreview({ css }: { css: string }) {
  return (
    <div
      style={{
        height: 48,
        borderRadius: 8,
        background: css,
      }}
    />
  );
}

export default function SavedPage() {
  const { fg, fgMuted, isDark } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    getSavedItems()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteSavedItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {}
    setDeletingId(null);
  };

  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);

  const borderSubtle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  return (
    <ToolLayout title="Saved" description="Your saved creations." backHref="/" backLabel="Home">
      {!authLoading && !user ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <p className="text-lg mb-4" style={{ color: fgMuted }}>
            Sign in to view your saved items
          </p>
          <Link
            href="/login"
            className="tool-btn"
            style={{
              padding: "12px 24px",
              fontSize: 14,
              textDecoration: "none",
              color: isDark ? "#000" : "#fff",
              backgroundColor: fg,
              borderColor: fg,
            }}
          >
            Sign in
          </Link>
        </div>
      ) : loading ? (
        <p style={{ color: fgMuted }}>Loading...</p>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-8">
            {["all", "qr-code", "palette", "gradient", "pattern", "vector-art", "shape"].map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className="tool-btn"
                style={{
                  background:
                    filter === t
                      ? isDark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.06)"
                      : "transparent",
                  color: filter === t ? fg : undefined,
                  textTransform: "capitalize",
                }}
              >
                {t === "all" ? "All" : typeLabels[t]}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <p className="text-sm" style={{ color: fgMuted }}>
                {items.length === 0
                  ? "No saved items yet. Create something and save it!"
                  : "No items match this filter."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((item) => {
                const Icon = typeIcons[item.type] || QrCode;
                const data = item.data as Record<string, unknown>;

                return (
                  <div
                    key={item.id}
                    style={{
                      border: `1px solid ${borderSubtle}`,
                      borderRadius: 12,
                      padding: 20,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {/* Preview */}
                    {item.type === "palette" && Array.isArray(data.colors) && (
                      <PalettePreview
                        colors={(data.colors as { hex: string }[]).map((c) => c.hex)}
                      />
                    )}
                    {item.type === "gradient" && item.preview && (
                      <GradientPreview css={item.preview} />
                    )}
                    {item.type === "qr-code" && item.preview && (
                      <div
                        style={{
                          height: 48,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 8,
                          backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                        }}
                      >
                        <QrCode size={28} strokeWidth={1} style={{ color: fgMuted }} />
                      </div>
                    )}
                    {item.type === "pattern" && item.preview && (
                      <div
                        style={{
                          height: 48,
                          borderRadius: 8,
                          backgroundImage: item.preview.match(/background-image:\s*(.+);/)?.[1],
                          backgroundRepeat: "repeat",
                          backgroundSize: `${(data.tileSize as number) || 30}px`,
                        }}
                      />
                    )}
                    {(item.type === "vector-art" || item.type === "shape") && item.preview && (
                      <div
                        style={{
                          height: 48,
                          borderRadius: 8,
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                        }}
                        dangerouslySetInnerHTML={{
                          __html: item.preview.replace(/width="\d+"/, 'width="100%"').replace(/height="\d+"/, 'height="48"'),
                        }}
                      />
                    )}

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={14} strokeWidth={1.5} style={{ color: fgMuted }} />
                        <span
                          className="text-xs uppercase tracking-wider"
                          style={{ color: fgMuted }}
                        >
                          {typeLabels[item.type]}
                        </span>
                      </div>
                      <p className="text-sm font-normal tracking-tight">{item.name}</p>
                      <p className="text-xs mt-1" style={{ color: fgMuted }}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={typeLinks[item.type]}
                        className="tool-btn"
                        style={{
                          flex: 1,
                          textDecoration: "none",
                          justifyContent: "center",
                          fontSize: 12,
                          padding: "6px 12px",
                        }}
                      >
                        <ExternalLink size={12} strokeWidth={1.5} />
                        Open tool
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="tool-btn"
                        style={{
                          padding: "6px 10px",
                          opacity: deletingId === item.id ? 0.4 : 1,
                          color: "#ef4444",
                          borderColor: "rgba(239,68,68,0.3)",
                        }}
                      >
                        <Trash2 size={13} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </ToolLayout>
  );
}
