import { buildOgImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Lime Advisory — Sessions & Services | Lime Pages";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image() {
  return buildOgImage({
    badge: "Advisory Services",
    heading: "Lime",
    headingAccent: "Advisory",
    subtitle:
      "Practical, plain-language financial advisory for individuals, entrepreneurs, and young professionals. From R500/session.",
    accentColor: "#46CDCF",
    backgroundImage: "sincerely-media-aVbHFu-Doo4-unsplash.jpg",
  });
}
