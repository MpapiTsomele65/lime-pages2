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
      "Compare SA's top unit trusts, understand ETFs, and learn how startup deals are structured. Real data, real context.",
    accentColor: "#C1FF72",
    backgroundImage: "capital-hero-hands.jpg",
  });
}
