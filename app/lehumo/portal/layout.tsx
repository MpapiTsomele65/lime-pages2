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
  // Apple-flavoured page chrome. The flat `#0B1933` was visually
  // correct but read as wallpaper — every card sat on it identically
  // and the eye had nothing to anchor on. Two stacked subtle
  // gradients create implicit depth without competing with content:
  //
  //   1. A wide radial glow at the top (lime-tinged, very low alpha)
  //      — gives the page a "screen-on" feel and pulls attention up
  //      to the welcome header.
  //   2. A second teal-tinged radial at bottom-left — adds dimension
  //      so the lower half of long pages doesn't feel uniformly flat.
  //
  // Both are baked into the page background so card hover states
  // (which add their own shadow) can reference a non-flat backdrop
  // and feel like they're floating, not stamped.
  //
  // Auth checks happen in /portal/page.tsx (dashboard) and middleware.
  // The login page renders without auth wrapping.
  return (
    <div
      className="min-h-screen bg-[#0B1933] relative overflow-x-hidden"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(184, 255, 0, 0.05) 0%, transparent 60%), " +
          "radial-gradient(ellipse 60% 40% at 0% 100%, rgba(70, 205, 207, 0.04) 0%, transparent 60%)",
      }}
    >
      {children}
    </div>
  );
}
