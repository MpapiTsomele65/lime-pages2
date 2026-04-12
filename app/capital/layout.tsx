import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lime Capital — Learn to Invest & Structure Deals | Lime Pages",
  description:
    "Capital markets education for South African investors. Compare top unit trusts, understand ETFs, and learn how startup deals are structured.",
  openGraph: {
    title: "Lime Capital — Learn to Invest & Structure Deals",
    description:
      "Capital markets education for South African investors. Compare top unit trusts, understand ETFs, and learn how startup deals are structured.",
  },
};

export default function CapitalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
