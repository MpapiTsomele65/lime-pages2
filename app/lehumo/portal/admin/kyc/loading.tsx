/** KYC page skeleton — header + queue placeholder. */
export default function AdminKycLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-3 w-28 rounded bg-[#0B1933]/[0.08] mb-3" />
        <div className="h-9 w-72 rounded bg-[#0B1933]/[0.08] mb-2" />
        <div className="h-4 w-80 rounded bg-[#0B1933]/[0.05]" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[20px] border border-[#EDEDED] bg-white h-32"
          />
        ))}
      </div>
    </div>
  );
}
