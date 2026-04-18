"use client";

const ITEMS = [
  "Lehumo Investment Trust",
  "AI-Powered Advisory",
  "Lime Connect Directory",
  "Financial Rights Guidance",
  "Member Portal Access",
  "SMME Advisory",
  "Investor Readiness",
  "Lime Capital",
  "Emergency Loan Access",
  "Community Wealth Building",
];

export function Marquee() {
  const doubled = [...ITEMS, ...ITEMS];
  return (
    <div className="bg-navy overflow-hidden py-[13px] border-t-2 border-lime">
      <div
        className="flex gap-9 w-max"
        style={{ animation: "marquee 30s linear infinite" }}
      >
        {doubled.map((item, i) => (
          <span key={i}>
            <span className="font-bold text-[13px] text-lime whitespace-nowrap tracking-wide">
              {item}
            </span>
            {i < doubled.length - 1 && (
              <span className="text-teal text-[8px] ml-9">✦</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
