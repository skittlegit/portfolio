import { ImageResponse } from "next/og";

export const alt = "Deepak Aeleni — Internet Generalist";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Angular monochrome OG card matching the TELEMETRY system.
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
          background: "#f4f2ea",
          color: "#14130f",
          padding: 72,
          fontFamily: "sans-serif",
          backgroundImage:
            "linear-gradient(rgba(20,19,15,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(20,19,15,0.06) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      >
        {/* top channel readout */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 22,
            letterSpacing: 3,
            color: "#5f5c54",
          }}
        >
          <div style={{ display: "flex" }}>BYDEEPAK.COM</div>
          <div style={{ display: "flex" }}>CH_01 · PROFILE</div>
        </div>

        {/* name */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 168, fontWeight: 700, lineHeight: 1, letterSpacing: -6 }}>
            Deepak
          </div>
          <div style={{ display: "flex", fontSize: 168, fontWeight: 700, lineHeight: 1, letterSpacing: -6 }}>
            <div style={{ display: "flex" }}>Aeleni</div>
            <div style={{ display: "flex", color: "#5a3cf0" }}>.</div>
          </div>
        </div>

        {/* footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 26, color: "#5f5c54" }}>
          <div style={{ display: "flex", maxWidth: 760 }}>
            Internet generalist — building tools, crafting interfaces.
          </div>
          <div style={{ display: "flex", width: 120, height: 5, background: "#5a3cf0" }} />
        </div>
      </div>
    ),
    size,
  );
}
