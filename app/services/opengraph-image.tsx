import { buildOgImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Lime Services — Vetted Services for the Community | Lime Pages";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image() {
  return buildOgImage({
    badge: "Now Live",
    heading: "Lime",
    headingAccent: "Services",
    subtitle:
      "Vetted services for the Lime Pages community — from wills & estate planning to financial & investment strategy advisory, with more trusted partners joining soon.",
    accentColor: "#46CDCF",
    backgroundImage: "ninthgrid-5tteWzfhMaA-unsplash.jpg",
  });
}
