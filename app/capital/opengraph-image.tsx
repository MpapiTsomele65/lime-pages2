import { buildOgImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Lime Capital — Learn to Invest | Lime Pages";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image() {
  return buildOgImage({
    badge: "Capital Markets Education",
    heading: "Lime",
    headingAccent: "Capital",
    subtitle:
      "Learn how capital markets work. Understand unit trusts, compare fund performance, and protect your legacy — from your first ETF to estate planning.",
    accentColor: "#C1FF72",
    backgroundImage: "capital-hero-hands.jpg",
  });
}
