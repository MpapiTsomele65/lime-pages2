import { buildOgImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Behind the Pages — Our Story | Lime Pages";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image() {
  return buildOgImage({
    badge: "Our Story",
    heading: "Behind the",
    headingAccent: "Pages",
    subtitle:
      "Lime Pages exists to close the gap between South Africa's two economies. Democratising information, capital, and networks.",
    accentColor: "#46CDCF",
    backgroundImage: "fotografia-editorial-prl9DeDCKrM-unsplash.jpg",
  });
}
