import { ImageResponse } from "next/og";

export const alt = "Deepak Aeleni — Internet Generalist";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// OG card in the INDEX system — warm black field, cream condensed type,
// one signal-orange accent.
export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#100f0c",
          color: "#e8e2d4",
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        {/* top readout */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 22,
            letterSpacing: 4,
            color: "#928b7a",
            borderTop: "2px solid #e8e2d4",
            paddingTop: 18,
          }}
        >
          <div style={{ display: "flex" }}>BYDEEPAK.COM</div>
          <div style={{ display: "flex" }}>FOLIO — 2026</div>
        </div>

        {/* name */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 175, fontWeight: 800, lineHeight: 0.95, letterSpacing: -8, textTransform: "uppercase" }}>
            Deepak
          </div>
          <div style={{ display: "flex", fontSize: 175, fontWeight: 800, lineHeight: 0.95, letterSpacing: -8, textTransform: "uppercase" }}>
            <div style={{ display: "flex" }}>Aeleni</div>
            <div style={{ display: "flex", color: "#5f3df0" }}>.</div>
          </div>
        </div>

        {/* footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 25, color: "#928b7a" }}>
          <div style={{ display: "flex", maxWidth: 720 }}>
            Internet generalist — building tools, crafting interfaces.
          </div>
          <div style={{ display: "flex", width: 120, height: 6, background: "#5f3df0" }} />
        </div>
      </div>
    ),
    size,
  );
}
