import { ImageResponse } from "next/og";

export const alt = "Lime Pages — Building Wealth Together";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0B1933",
          fontFamily: "sans-serif",
        }}
      >
        {/* Decorative gradient orb */}
        <div
          style={{
            position: "absolute",
            bottom: "-20%",
            right: "-10%",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(70,205,207,0.2), transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "-15%",
            left: "-5%",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(184,255,0,0.15), transparent 70%)",
          }}
        />
        {/* Logo text */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: "white",
              letterSpacing: "-1px",
            }}
          >
            LIME PAGES
          </div>
        </div>
        {/* Tagline */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "white",
            textAlign: "center",
            lineHeight: 1.1,
            maxWidth: 800,
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          Building Wealth{" "}
          <span style={{ color: "#B8FF00" }}>Together</span>
        </div>
        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            color: "rgba(255,255,255,0.5)",
            marginTop: 24,
            textAlign: "center",
            maxWidth: 600,
          }}
        >
          Advisory & Fintech Solutions for Africa
        </div>
        {/* Website */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            right: 50,
            fontSize: 18,
            color: "rgba(255,255,255,0.35)",
          }}
        >
          limepages.co.za
        </div>
      </div>
    ),
    { ...size }
  );
}
