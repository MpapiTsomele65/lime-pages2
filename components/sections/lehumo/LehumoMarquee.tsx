"use client";

const ITEMS = [
  "Save · Buy · Protect", "Lehumo Collective Investment Trust",
  "30 Founding Members", "R1,000 Per Month", "5-Year Lock-in",
  "R2 Million Target", "Generational Wealth",
  "Interest-Free Emergency Loans", "Community-Owned Assets",
];

export function LehumoMarquee() {
  const doubled = [...ITEMS, ...ITEMS];
  return (
    <div className="bg-navy-mid overflow-hidden py-3 border-t-2 border-lime/25 border-b border-b-white/[0.08]">
      <div className="flex gap-10 w-max" style={{ animation: "marquee 25s linear infinite" }}>
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-10">
            <span className="font-bold text-xs text-lime whitespace-nowrap tracking-[1px] uppercase">{item}</span>
            {i < doubled.length - 1 && <span className="text-teal text-[8px]">●</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
