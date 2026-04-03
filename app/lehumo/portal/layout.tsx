import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lehumo Portal — Collective Investment Trust",
  description:
    "Manage your Lehumo membership, contributions, and KYC status.",
};

export default function PortalRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout only provides metadata + the dark background.
  // Auth checks happen in /portal/page.tsx (dashboard) and middleware.
  // The login page renders without auth wrapping.
  return <div className="min-h-screen bg-[#0B1933]">{children}</div>;
}
