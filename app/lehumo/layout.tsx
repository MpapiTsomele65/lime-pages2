import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lehumo — Collective Investment Trust | Lime Pages",
  description:
    "Join 30 Founding Members building an Investment Trust to create Generational Wealth. R1,000/month. 5-Year Lock-in. R2 Million target.",
  // Lehumo-specific share card — without these, the root layout's generic
  // site-wide openGraph is inherited (wrong context when /lehumo is
  // shared). The colocated opengraph-image.tsx is auto-attached as the
  // image, so no images here.
  openGraph: {
    title: "Lehumo — Collective Investment Trust",
    description:
      "Join 30 Founding Members building an Investment Trust to create Generational Wealth. R1,000/month. 5-Year Lock-in. R2 Million target.",
    siteName: "Lime Pages",
    url: "https://www.limepages.co.za/lehumo",
    type: "website",
    locale: "en_ZA",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lehumo — Collective Investment Trust",
    description:
      "Join 30 Founding Members building an Investment Trust to create Generational Wealth. R1,000/month. 5-Year Lock-in. R2 Million target.",
  },
};

export default function LehumoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="dark-theme">{children}</div>;
}
