/**
 * Loading skeleton for the admin Overview page.
 *
 * Renders while the server compute for the Overview's data fetches
 * (members + Paystack subscription details + admin stats + campaign
 * reports) is in flight. The layout (header + sidebar) stays
 * interactive thanks to Next.js streaming — only this content area
 * shows the skeleton.
 *
 * Skeleton matches the page's grid + card silhouettes so there's
 * no layout shift when the real content paints.
 */
export default function AdminOverviewLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-3 w-24 rounded bg-[#0B1933]/[0.08] mb-3" />
        <div className="h-9 w-72 rounded bg-[#0B1933]/[0.08] mb-2" />
        <div className="h-4 w-96 rounded bg-[#0B1933]/[0.05]" />
      </div>

      {/* Stat tiles row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[20px] border border-[#EDEDED] bg-white h-28"
          />
        ))}
      </div>

      {/* Two-column charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-[24px] border border-[#EDEDED] bg-white h-72" />
        <div className="rounded-[24px] border border-[#EDEDED] bg-white h-72" />
      </div>

      {/* Behind snapshot */}
      <div className="rounded-[24px] border border-[#EDEDED] bg-white h-48" />
    </div>
  );
}
