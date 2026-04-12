import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Lime Pages",
  description:
    "Terms and conditions governing your use of Lime Pages services, including Lime Advisory, Lehumo Collective Investment Trust, Lime Capital, and Lime Connect.",
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
