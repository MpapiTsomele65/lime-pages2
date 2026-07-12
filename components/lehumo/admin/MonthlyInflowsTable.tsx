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
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2, Lock, LockOpen } from "lucide-react";

import { adminSetMonthClosed } from "@/app/lehumo/portal/admin/actions";

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
  closedPeriods,
  canEdit,
}: {
  rows: MonthlyInflowRow[];
  total: number;
  totalCount: number;
  /** Months locked by the monthly close — edits rejected until reopened. */
  closedPeriods: string[];
  /** Super-admin write tier — read-only admins see lock state but can't
   *  toggle it. */
  canEdit: boolean;
}) {
  const router = useRouter();
  const [openPeriod, setOpenPeriod] = useState<string | null>(null);
  const [lockBusy, setLockBusy] = useState<string | null>(null);
  const [lockError, setLockError] = useState<string | null>(null);
  const closedSet = new Set(closedPeriods);

  async function toggleLock(period: string, close: boolean) {
    setLockBusy(period);
    setLockError(null);
    try {
      const res = await adminSetMonthClosed(period, close);
      if (!res.ok) {
        setLockError(res.error);
        return;
      }
      router.refresh();
    } catch (err) {
      setLockError(err instanceof Error ? err.message : "Lock update failed");
    } finally {
      setLockBusy(null);
    }
  }

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
              <th className="w-10 py-2" aria-label="Month lock" />
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
                  isClosed={closedSet.has(r.period)}
                  isLockBusy={lockBusy === r.period}
                  canEdit={canEdit}
                  onToggle={() =>
                    setOpenPeriod(isOpen ? null : canExpand ? r.period : null)
                  }
                  onToggleLock={() =>
                    toggleLock(r.period, !closedSet.has(r.period))
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
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      {lockError && (
        <p className="mt-2 text-[12px] text-red-700">{lockError}</p>
      )}
      <p className="mt-2 text-[10.5px] text-[#9CA3AF]">
        Lock a month once it's reconciled — locked months reject payment
        edits until reopened, and every lock/reopen is recorded in the Admin
        Activity Log.
      </p>
    </div>
  );
}

function FragmentRow({
  row: r,
  isOpen,
  canExpand,
  isClosed,
  isLockBusy,
  canEdit,
  onToggle,
  onToggleLock,
}: {
  row: MonthlyInflowRow;
  isOpen: boolean;
  canExpand: boolean;
  isClosed: boolean;
  isLockBusy: boolean;
  canEdit: boolean;
  onToggle: () => void;
  onToggleLock: () => void;
}) {
  return (
    <>
      <tr className="border-b border-[#F3F4F6]">
        <td className="py-2.5 font-medium text-[#0B1933]">
          <span className="inline-flex items-center gap-2">
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
            {isClosed && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#0B1933]/15 bg-[#0B1933]/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#0B1933]">
                <Lock className="h-2.5 w-2.5" />
                Closed
              </span>
            )}
          </span>
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
        <td className="py-2.5 text-right">
          {canEdit && (
          <button
            type="button"
            onClick={onToggleLock}
            disabled={isLockBusy}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#0B1933]/30 hover:text-[#0B1933] hover:bg-[#F8F9FA] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={
              isClosed
                ? "Reopen this month for edits"
                : "Lock this month (reconciled)"
            }
            aria-label={
              isClosed
                ? `Reopen ${formatPeriodLong(r.period)} for edits`
                : `Lock ${formatPeriodLong(r.period)}`
            }
          >
            {isLockBusy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isClosed ? (
              <Lock className="h-3.5 w-3.5" />
            ) : (
              <LockOpen className="h-3.5 w-3.5" />
            )}
          </button>
          )}
        </td>
      </tr>
      {isOpen && (
        <tr className="border-b border-[#F3F4F6] bg-[#FAFBFC]">
          <td colSpan={5} className="px-2 pb-3 pt-1">
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
