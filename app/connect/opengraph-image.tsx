import { buildOgImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Lime Connect — Professional Network | Lime Pages";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image() {
  return buildOgImage({
    badge: "Professional Network",
    heading: "Lime",
    headingAccent: "Connect",
    subtitle:
      "A professional network and business directory for the Lime Pages community. Your hustle deserves visibility.",
    accentColor: "#46CDCF",
    backgroundImage: "iwaria-inc-M7ALc3UuX_g-unsplash.jpg",
  });
}
