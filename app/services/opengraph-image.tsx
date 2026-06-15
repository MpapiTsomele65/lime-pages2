import { buildOgImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Lime Services — Vetted Services for the Community | Lime Pages";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image() {
  return buildOgImage({
    badge: "Vetted Services",
    heading: "Lime",
    headingAccent: "Services",
    subtitle:
      "Vetted services for the Lime Pages community — wills & estate planning, alternative-investment advisory, and more.",
    accentColor: "#46CDCF",
    backgroundImage: "iwaria-inc-M7ALc3UuX_g-unsplash.jpg",
  });
}
