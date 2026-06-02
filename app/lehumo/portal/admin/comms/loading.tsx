/** Comms page skeleton — header + email card + tracker. */
export default function AdminCommsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-3 w-28 rounded bg-[#0B1933]/[0.08] mb-3" />
        <div className="h-9 w-72 rounded bg-[#0B1933]/[0.08] mb-2" />
        <div className="h-4 w-96 rounded bg-[#0B1933]/[0.05]" />
      </div>
      <div className="rounded-[24px] border border-[#EDEDED] bg-white h-64" />
      <div className="rounded-[24px] border border-[#EDEDED] bg-white h-48" />
    </div>
  );
}
