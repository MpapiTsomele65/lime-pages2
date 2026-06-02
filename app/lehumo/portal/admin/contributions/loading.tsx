/** Contributions page skeleton — header + summary tiles + log card + filter bar + table. */
export default function AdminContributionsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-3 w-36 rounded bg-[#0B1933]/[0.08] mb-3" />
        <div className="h-9 w-72 rounded bg-[#0B1933]/[0.08] mb-2" />
        <div className="h-4 w-[28rem] rounded bg-[#0B1933]/[0.05]" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[20px] border border-[#EDEDED] bg-white h-24"
          />
        ))}
      </div>
      <div className="rounded-[24px] border border-[#EDEDED] bg-white h-64" />
      <div className="rounded-[20px] border border-[#EDEDED] bg-white h-20" />
      <div className="rounded-[24px] border border-[#EDEDED] bg-white h-[500px]" />
    </div>
  );
}
