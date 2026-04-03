"use client";

import { Check } from "lucide-react";
import { MONTH_NAMES } from "@/lib/definitions";

interface ContributionGridProps {
  contributions: Record<string, boolean>;
}

export function ContributionGrid({ contributions }: ContributionGridProps) {
  const now = new Date();
  const currentMonthIndex = now.getMonth(); // 0-based
  const currentMonthAbbr = MONTH_NAMES[currentMonthIndex];

  const paidCount = Object.values(contributions).filter(Boolean).length;
  const totalContributed = paidCount * 1000;

  return (
    <div className="bg-[#0F2040] rounded-[20px] border border-white/[0.06] p-6 h-full">
      <h2 className="text-lg font-semibold text-white mb-6">
        Contribution History
      </h2>

      {/* Month grid: 4x3 on desktop, 6x2 on mobile */}
      <div className="grid grid-cols-6 sm:grid-cols-4 gap-2">
        {MONTH_NAMES.map((month) => {
          const paid = contributions[month] === true;
          const isCurrent = month === currentMonthAbbr;

          return (
            <div
              key={month}
              className={`
                relative flex flex-col items-center justify-center rounded-xl py-3 px-1 text-center transition-colors
                ${
                  paid
                    ? "bg-[#B8FF00]/[0.12] border border-[#B8FF00]/30"
                    : "bg-white/[0.03] border border-white/[0.06]"
                }
                ${isCurrent ? "ring-2 ring-[#46CDCF]/40" : ""}
              `}
            >
              <span
                className={`text-xs font-medium ${paid ? "text-[#B8FF00]" : "text-white/30"}`}
              >
                {month}
              </span>
              {paid && (
                <Check className="mt-1 h-3.5 w-3.5 text-[#B8FF00]" />
              )}
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="mt-6 flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3">
        <span className="text-sm text-white/50">Total Contributed</span>
        <span className="text-sm font-semibold text-[#B8FF00]">
          R{totalContributed.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
