import { buildOgImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Lemonade Station — Resources for Founders | Lime Pages";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image() {
  return buildOgImage({
    badge: "For Founders & SMMEs",
    heading: "Lemonade",
    headingAccent: "Station",
    subtitle:
      "Everything entrepreneurs need to raise capital, structure deals, and scale. Guides, templates, VC insights, and sector data.",
    accentColor: "#C1FF72",
    backgroundImage: "small-business-owner.jpg",
  });
}
