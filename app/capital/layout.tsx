import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lime Capital — Growth Funding for Entrepreneurs | Lime Pages",
  description:
    "Capital access for Africa's entrepreneurs. Growth funding backed by community, managed by regulated partners.",
  openGraph: {
    title: "Lime Capital — Growth Funding for Entrepreneurs",
    description:
      "Capital access for Africa's entrepreneurs. Growth funding backed by community, managed by regulated partners.",
  },
};

export default function CapitalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
