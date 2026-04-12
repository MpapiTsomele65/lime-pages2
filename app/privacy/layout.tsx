import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Lime Pages",
  description:
    "How Lime Pages collects, uses, and protects your personal information. POPIA-compliant privacy policy for all services including Lehumo Trust, Advisory, and Lime Capital.",
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
