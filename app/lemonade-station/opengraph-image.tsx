import { buildOgImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Lemonade Station — Resources for Founders | Lime Pages";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image() {
  return buildOgImage({
    badge: "For Founders, Entrepreneurs & SMMEs",
    heading: "Lemonade",
    headingAccent: "Station",
    subtitle:
      "When life gives you lemons, make lemonade. Everything you need to raise capital, structure deals, and build a fundable business.",
    accentColor: "#FFE600",
    backgroundImage: "ali-mkumbwa-VhYvF2XaRuI-unsplash.jpg",
  });
}
