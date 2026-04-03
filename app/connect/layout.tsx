import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lime Connect — Professional Network & Directory | Lime Pages",
  description:
    "A professional network and business directory for the Lime Pages community. Your hustle deserves visibility.",
  openGraph: {
    title: "Lime Connect — Professional Network & Directory",
    description:
      "A professional network and business directory for the Lime Pages community.",
  },
};

export default function ConnectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
