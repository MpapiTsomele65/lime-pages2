import { buildOgImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Lehumo Collective Investment Trust | Lime Pages";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image() {
  return buildOgImage({
    badge: "Collective Investment Trust",
    heading: "Lehumo",
    headingAccent: "Build Generational Wealth",
    subtitle:
      "30 Founding Members. R1,000/month. 5-year lock-in. A community-owned vehicle for long-term wealth creation.",
    accentColor: "#B8FF00",
    // Linked-pinkies "Partnership and trust" photo (shared with the Lime
    // Capital hero) — promise + community wealth-building, vs the old
    // card-machine photo that read as merchant/entrepreneur.
    backgroundImage: "capital-hero-hands.jpg",
  });
}
