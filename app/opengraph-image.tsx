import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Lime Pages — Building Wealth Together";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  // Read the hero background image from public/images
  const heroImagePath = join(
    process.cwd(),
    "public/images/tobias-reich-1GgWbP74phY-unsplash.jpg"
  );
  const heroImageData = await readFile(heroImagePath);
  const heroBase64 = `data:image/jpeg;base64,${heroImageData.toString("base64")}`;

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
          fontFamily: "sans-serif",
        }}
      >
        {/* Hero background image */}
        <img
          src={heroBase64}
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

        {/* Dark overlay for text readability */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(180deg, rgba(11,25,51,0.75) 0%, rgba(11,25,51,0.6) 50%, rgba(11,25,51,0.8) 100%)",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            zIndex: 1,
            padding: "40px 60px",
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: "1.5px solid rgba(70,205,207,0.4)",
              borderRadius: 999,
              padding: "8px 24px",
              marginBottom: 32,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#46CDCF",
                marginRight: 10,
              }}
            />
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#46CDCF",
                letterSpacing: "2px",
                textTransform: "uppercase" as const,
              }}
            >
              Wealth & Business Growth Solutions for Africa
            </span>
          </div>

          {/* Main heading */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: "white",
              textAlign: "center",
              lineHeight: 1.1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span>Building Wealth</span>
            <span style={{ color: "#46CDCF" }}>Together</span>
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 22,
              color: "rgba(255,255,255,0.6)",
              marginTop: 24,
              textAlign: "center",
              maxWidth: 700,
              lineHeight: 1.5,
            }}
          >
            Equipping entrepreneurs and young professionals with the strategies
            and solutions to build thriving businesses and generational wealth.
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
          limepages.co.za
        </div>
      </div>
    ),
    { ...size }
  );
}
