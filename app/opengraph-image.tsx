import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Truvis.info — Verified Business Network";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Default social card in the TRUVIS brand (petroleum + emerald).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #01203f 0%, #023059 55%, #03427a 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 14,
              height: 64,
              background: "#10b981",
              borderRadius: 4,
            }}
          />
          <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: 4 }}>
            TRUVIS<span style={{ color: "#10b981" }}>.info</span>
          </div>
        </div>
        <div style={{ marginTop: 28, fontSize: 40, fontWeight: 700 }}>
          The network where every business is verified.
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 26,
            color: "rgba(255,255,255,0.72)",
          }}
        >
          Directory · Events · Marketplace — continuously vetted via Truvis Compliance
        </div>
        <div
          style={{
            marginTop: 48,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 22,
            color: "#10b981",
            letterSpacing: 3,
          }}
        >
          VERIFIED BUSINESS NETWORK
        </div>
      </div>
    ),
    size,
  );
}
