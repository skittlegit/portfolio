// Crossmint cover — the angular phone mock from the pre-redesign site
// (the project is a native app; there is no web screenshot). A dot-grid
// field with a soft accent wash, a wireframe phone, and the label stack.
// Fills its positioned parent (absolute inset 0).
export default function CrossmintCover({ compact = false }: { compact?: boolean }) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: compact ? 18 : "clamp(14px,3vw,40px)",
        padding: compact ? 16 : "clamp(16px,3vw,34px)",
        background: "var(--bg-raised)",
        overflow: "hidden",
      }}
    >
      {/* texture + wash */}
      <span style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(var(--line-strong) 1px, transparent 1px)", backgroundSize: "22px 22px", opacity: 0.4 }} />
      <span style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 120% at 82% 2%, var(--accent-glow) 0%, transparent 55%)" }} />

      {/* angular phone mock */}
      <div style={{ position: "relative", flexShrink: 0, height: "78%", aspectRatio: "10 / 20", background: "var(--bg-raised)", border: "1px solid var(--line-strong)", boxShadow: "0 18px 40px -22px rgba(0,0,0,0.55)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ height: "16%", background: "var(--fg)", display: "flex", alignItems: "center", gap: 5, padding: "0 9px" }}>
          <span style={{ width: 5, height: 5, background: "var(--accent)" }} />
          <span style={{ height: 3, width: "46%", background: "var(--bg)" }} />
        </div>
        <div style={{ flex: 1, padding: 8, display: "flex", flexDirection: "column", gap: 7 }}>
          {[0, 1, 2].map((r) => (
            <div key={r} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 15, height: 15, background: "var(--bg-sunk)", border: "1px solid var(--line)", flexShrink: 0 }} />
              <span style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
                <span style={{ height: 3, width: "82%", background: "var(--line-strong)" }} />
                <span style={{ height: 3, width: "55%", background: "var(--line)" }} />
              </span>
            </div>
          ))}
        </div>
        <div style={{ height: "12%", borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-around" }}>
          <span style={{ width: 5, height: 5, background: "var(--line-strong)" }} />
          <span style={{ width: 7, height: 7, background: "var(--accent)" }} />
          <span style={{ width: 5, height: 5, background: "var(--line-strong)" }} />
        </div>
      </div>

      {/* label */}
      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 9, minWidth: 0 }}>
        <span className="giant" style={{ fontSize: compact ? "1.7rem" : "clamp(1.7rem,3.4vw,3.2rem)", color: "var(--fg)" }}>Crossmint</span>
        <span className="mono" style={{ fontSize: compact ? 10 : 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-muted)" }}>Field-ops · Flutter</span>
        {!compact && (
          <span className="mono" style={{ fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--fg-faint)" }}>Native app — no web preview</span>
        )}
      </div>
    </div>
  );
}
