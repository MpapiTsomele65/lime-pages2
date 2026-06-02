/**
 * Shared header for every admin sub-route. Reused on Overview,
 * Members, KYC Review, Communications, and Settings so the chrome
 * stays consistent.
 *
 * Visual treatment matches the original monolithic admin page's
 * header: eyebrow + h1 + subtitle stacked left, signed-in chip
 * sitting top-right on a self-aligned pill. Wraps cleanly on
 * narrow viewports thanks to `flex-wrap`.
 *
 * Server-component-safe — no client-only hooks or stateful
 * behaviour — so it can be rendered directly inside the server
 * page components without a "use client" boundary.
 */
export function AdminPageHeader({
  eyebrow,
  title,
  subtitle,
  rightChip,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  rightChip?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0B1933] mb-1.5">
          {eyebrow}
        </p>
        <h1 className="text-[28px] md:text-[34px] font-semibold tracking-tight text-[#0B0B0B] leading-[1.1]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-[14px] text-[#6B7280]">{subtitle}</p>
        )}
      </div>
      {rightChip && (
        <div className="inline-flex items-center gap-2 self-start rounded-full border border-[#E5E7EB] bg-white/60 px-3 py-1.5 text-[11px] text-[#6B7280] backdrop-blur-sm">
          Signed in as{" "}
          <span className="text-[#0B1933] font-semibold">{rightChip}</span>
        </div>
      )}
    </div>
  );
}
