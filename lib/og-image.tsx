import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

interface OgImageConfig {
  badge: string;
  heading: string;
  headingAccent: string;
  subtitle: string;
  accentColor?: string;
  backgroundImage: string;
}

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

export async function buildOgImage({
  badge,
  heading,
  headingAccent,
  subtitle,
  accentColor = "#46CDCF",
  backgroundImage,
}: OgImageConfig) {
  const imgPath = join(process.cwd(), `public/images/${backgroundImage}`);
  const imgData = await readFile(imgPath);
  const imgBase64 = `data:image/jpeg;base64,${imgData.toString("base64")}`;

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
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(180deg, rgba(11,25,51,0.8) 0%, rgba(11,25,51,0.65) 50%, rgba(11,25,51,0.85) 100%)",
          }}
        />

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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: `1.5px solid ${accentColor}60`,
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
                backgroundColor: accentColor,
                marginRight: 10,
              }}
            />
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: accentColor,
                letterSpacing: "2px",
                textTransform: "uppercase" as const,
              }}
            >
              {badge}
            </span>
          </div>

          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: "white",
              textAlign: "center",
              lineHeight: 1.1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span>{heading}</span>
            <span style={{ color: accentColor }}>{headingAccent}</span>
          </div>

          <div
            style={{
              fontSize: 20,
              color: "rgba(255,255,255,0.55)",
              marginTop: 24,
              textAlign: "center",
              maxWidth: 650,
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 36,
            left: 50,
            display: "flex",
            alignItems: "center",
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
    { ...ogSize }
  );
}
