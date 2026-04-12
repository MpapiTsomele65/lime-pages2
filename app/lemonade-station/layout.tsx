import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lemonade Station — Resources for Founders & SMMEs | Lime Pages",
  description:
    "Everything entrepreneurs, founders, and SMMEs need to raise capital, structure deals, and scale. Fundraising guides, legal templates, VC insights, and sector data — all in one place.",
};

export default function LemonadeStationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
