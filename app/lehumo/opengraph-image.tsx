import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getOgFonts } from "@/lib/og-image";

export const alt = "Lehumo — Collective Investment Trust | Lime Pages";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Lehumo share card — reproduces the /lehumo page hero
 * (components/sections/lehumo/LehumoHero.tsx) exactly: the hexagon logo
 * lockup, the three-line question with "Investment Trust" in lime and
 * "Generational Wealth?" in teal, and the hero subtitle. Per the user's
 * request the background stays the linked-pinkies partnership photo
 * (under a navy tint for legibility, no grid lines); the hero foreground
 * sits on top. Bespoke ImageResponse so colours/weights match the hero.
 *
 * Note: Satori renders with the system sans-serif (same as the home OG
 * card), not the site's Plus Jakarta webfont — visually near-identical.
 */
export default async function Image() {
  const imgPath = join(process.cwd(), "public/images/capital-hero-hands.jpg");
  const imgData = await readFile(imgPath);
  const imgBase64 = `data:image/jpeg;base64,${imgData.toString("base64")}`;
  const fonts = await getOgFonts();

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
          position: "relative",
          fontFamily: "Plus Jakarta Sans",
        }}
      >
        {/* Background — linked-pinkies partnership photo (kept as-is) */}
        <img
          src={imgBase64}
          alt=""
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        {/* Navy tint for legibility (no grid lines) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(180deg, rgba(11,25,51,0.84) 0%, rgba(11,25,51,0.74) 50%, rgba(11,25,51,0.88) 100%)",
          }}
        />

        {/* Hero foreground */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            zIndex: 1,
            padding: "40px 70px",
          }}
        >
          {/* Brand lockup — hexagon + LEHUMO / Collective Investment Trust */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 34,
            }}
          >
            <svg width={66} height={66} viewBox="0 0 60 60">
              <polygon
                points="30,4 54,17 54,43 30,56 6,43 6,17"
                fill="#46cdcf"
                fillOpacity={0.16}
                stroke="#46cdcf"
                strokeWidth={2.5}
              />
              <polygon
                points="30,12 47,21.5 47,40.5 30,50 13,40.5 13,21.5"
                fill="none"
                stroke="#46cdcf"
                strokeWidth={1.5}
                opacity={0.55}
              />
            </svg>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <span
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: "#B8FF00",
                  letterSpacing: 1.5,
                  lineHeight: 1,
                }}
              >
                LEHUMO
              </span>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  color: "#46CDCF",
                  letterSpacing: 0.5,
                  marginTop: 5,
                }}
              >
                Collective Investment Trust
              </span>
            </div>
          </div>

          {/* Headline — exact hero copy + colours */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              fontSize: 52,
              fontWeight: 800,
              color: "white",
              lineHeight: 1.12,
              letterSpacing: -1,
            }}
          >
            <span>Do you want to join a community</span>
            <div style={{ display: "flex" }}>
              <span>building an&nbsp;</span>
              <span style={{ color: "#B8FF00" }}>Investment Trust</span>
            </div>
            <div style={{ display: "flex" }}>
              <span>to create&nbsp;</span>
              <span style={{ color: "#46CDCF" }}>Generational Wealth?</span>
            </div>
          </div>

          {/* Subtitle — exact hero copy */}
          <div
            style={{
              fontSize: 22,
              color: "rgba(255,255,255,0.55)",
              marginTop: 28,
              textAlign: "center",
              maxWidth: 760,
              lineHeight: 1.6,
            }}
          >
            30 Founding Members. 5 Years. R2 Million. One shared mission —
            Save, Buy, and Protect assets for the next generation.
          </div>
        </div>

        {/* Logo bottom-left */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            left: 50,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "white",
              letterSpacing: "1px",
            }}
          >
            LIME PAGES
          </span>
        </div>

        {/* URL bottom-right */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            right: 50,
            fontSize: 18,
            color: "rgba(255,255,255,0.4)",
          }}
        >
          www.limepages.co.za
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
