import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lime Services — Vetted Services for the Community | Lime Pages",
  description:
    "Vetted services for the Lime Pages community — wills & estate planning, financial & investment strategy advisory, and more trusted partners joining soon.",
  openGraph: {
    title: "Lime Services — Vetted Services for the Community",
    description:
      "Vetted services for the Lime Pages community — wills & estate planning, financial & investment strategy advisory, and more.",
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
