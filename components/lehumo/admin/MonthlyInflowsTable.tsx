"use client";

/**
 * MonthlyInflowsTable — the per-month received + running-cumulative
 * ledger on the admin Contributions page. Each month with contributions
 * expands to reveal WHO paid that month (member number + name + amount),
 * so admins can eyeball the roster behind a month's total without
 * scrolling the big cross-member rollup below.
 *
 * Client component (the expand/collapse is stateful); the page computes
 * the rows + contributor lists server-side and passes them down.
 */

import { useState } from "react";
import { ChevronRight } from "lucide-react";

export interface MonthlyInflowContributor {
  memberNumber: string;
  name: string;
  amount: number;
}

export interface MonthlyInflowRow {
  period: string;
  count: number;
  received: number;
  cumulative: number;
  contributors: MonthlyInflowContributor[];
}

export function MonthlyInflowsTable({
  rows,
  total,
  totalCount,
}: {
  rows: MonthlyInflowRow[];
  total: number;
  totalCount: number;
}) {
  const [openPeriod, setOpenPeriod] = useState<string | null>(null);

  return (
    <div
      className="rounded-[20px] border border-[#EDEDED] bg-white p-4 md:p-5"
      style={{
        boxShadow:
          "inset 0 1px 0 0 rgba(255, 255, 255, 0.6), " +
          "0 1px 2px 0 rgba(0, 0, 0, 0.04), " +
          "0 4px 16px -4px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
          Monthly inflows
        </h2>
        <span className="text-[11px] text-[#9CA3AF]">
          Cumulative reconciles to Total Pool ·{" "}
          <span className="font-semibold text-[#5E7A00]">
            R{total.toLocaleString("en-ZA")}
          </span>
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[440px] text-[13px]">
          <thead>
            <tr className="border-b border-[#EDEDED] text-[10px] uppercase tracking-[0.1em] text-[#9CA3AF]">
              <th className="py-2 text-left font-semibold">Month</th>
              <th className="py-2 text-right font-semibold">Contributions</th>
              <th className="py-2 text-right font-semibold">Received</th>
              <th className="py-2 text-right font-semibold">Cumulative pool</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isOpen = openPeriod === r.period;
              const canExpand = r.count > 0;
              return (
                <FragmentRow
                  key={r.period}
                  row={r}
                  isOpen={isOpen}
                  canExpand={canExpand}
                  onToggle={() =>
                    setOpenPeriod(isOpen ? null : canExpand ? r.period : null)
                  }
                />
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[#E5E7EB]">
              <td className="pt-2.5 font-semibold text-[#0B1933]">All-time</td>
              <td className="pt-2.5 text-right font-semibold tabular-nums text-[#0B1933]">
                {totalCount}
              </td>
              <td className="pt-2.5 text-right font-semibold tabular-nums text-[#0B1933]">
                R{total.toLocaleString("en-ZA")}
              </td>
              <td className="pt-2.5 text-right font-semibold tabular-nums text-[#5E7A00]">
                R{total.toLocaleString("en-ZA")}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function FragmentRow({
  row: r,
  isOpen,
  canExpand,
  onToggle,
}: {
  row: MonthlyInflowRow;
  isOpen: boolean;
  canExpand: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className="border-b border-[#F3F4F6]">
        <td className="py-2.5 font-medium text-[#0B1933]">
          {canExpand ? (
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={isOpen}
              className="inline-flex items-center gap-1.5 hover:text-[#46CDCF] transition-colors"
              title={isOpen ? "Hide contributors" : "Show who contributed"}
            >
              <ChevronRight
                className={`h-3.5 w-3.5 text-[#9CA3AF] transition-transform ${
                  isOpen ? "rotate-90" : ""
                }`}
              />
              {formatPeriodLong(r.period)}
            </button>
          ) : (
            <span className="pl-[22px]">{formatPeriodLong(r.period)}</span>
          )}
        </td>
        <td className="py-2.5 text-right tabular-nums text-[#4B5563]">
          {r.count}
        </td>
        <td className="py-2.5 text-right tabular-nums text-[#0B1933]">
          R{r.received.toLocaleString("en-ZA")}
        </td>
        <td className="py-2.5 text-right font-semibold tabular-nums text-[#0B1933]">
          R{r.cumulative.toLocaleString("en-ZA")}
        </td>
      </tr>
      {isOpen && (
        <tr className="border-b border-[#F3F4F6] bg-[#FAFBFC]">
          <td colSpan={4} className="px-2 pb-3 pt-1">
            <p className="mb-2 pl-[22px] text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9CA3AF]">
              {r.count} {r.count === 1 ? "contributor" : "contributors"} ·{" "}
              {formatPeriodLong(r.period)}
            </p>
            <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 pl-[22px] sm:grid-cols-2 xl:grid-cols-3">
              {r.contributors.map((c, i) => (
                <div
                  key={`${c.memberNumber}-${i}`}
                  className="flex items-center justify-between gap-3 border-b border-[#F0F1F4] py-1 text-[12.5px]"
                >
                  <span className="min-w-0 truncate">
                    <span className="font-mono font-semibold text-[#0B1933]">
                      {c.memberNumber}
                    </span>
                    <span className="text-[#6B7280]"> · {c.name}</span>
                  </span>
                  <span className="shrink-0 tabular-nums font-medium text-[#0B1933]">
                    R{c.amount.toLocaleString("en-ZA")}
                  </span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function formatPeriodLong(period: string): string {
  const [year, m] = period.split("-");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[Number(m) - 1] ?? m} ${year}`;
}
