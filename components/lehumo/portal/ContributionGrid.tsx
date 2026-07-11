"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import {
  CONTRIBUTION_STATUS,
  LEHUMO_FIRST_DUE_PERIOD,
  MONTH_NAMES,
  type LehumoContribution,
} from "@/lib/definitions";

interface ContributionGridProps {
  contributions: Record<string, boolean>;
  /** Phase 4 — full 60-period contribution history. When provided, the
   *  grid renders a year selector (2026 → 2031) and shows each year's
   *  12 cells alongside lifetime totals. Falls back to the 12-key
   *  projection when undefined (flag off, or fetch failed). */
  contributionRows?: LehumoContribution[];
  /** SAST-current period (`YYYY-MM`) to highlight. Used to ring the
   *  current month in the rich-shape view. Defaults to the local
   *  browser month-of-year for the legacy fallback. */
  currentPeriod?: string;
}

const TRUST_DURATION_MONTHS = 60;
const SHORT_MONTH_NAMES = MONTH_NAMES;
const LIFETIME_LABEL = "Lifetime";

/**
 * Member-portal contribution-history grid.
 *
 * Two presentations driven by what data is available:
 *
 *   • Rich shape (`contributionRows` populated): renders a year selector
 *     (2026 → 2031) with a `Lifetime` mode that overlays all paid months
 *     in one 5-year strip. Each cell shows its month code, paid status,
 *     and on hover/focus reveals the period + amount + payment ref. The
 *     bottom strip splits "this year" vs "lifetime" totals so members
 *     can read both at a glance.
 *
 *   • Legacy projection (`contributions` only): renders the original
 *     12-cell grid for the SAST-current calendar year. Identical to the
 *     pre-Phase-4 surface so the flag-off / fetch-failure path stays
 *     visually intact.
 *
 * Both branches share the cell styling so the dashboard doesn't shift
 * around when the rich shape becomes available mid-session.
 */
export function ContributionGrid({
  contributions,
  contributionRows,
  currentPeriod,
}: ContributionGridProps) {
  const richShape = (contributionRows?.length ?? 0) > 0;

  // ── Pre-compute everything we'll need across both branches up front
  //    so the conditional rendering below stays declarative. ──

  const { years, paidByPeriod, periodMeta, lifetimePaidPeriods, lifetimeTotal } =
    useMemo(() => {
      if (!richShape || !contributionRows) {
        return {
          years: [] as number[],
          paidByPeriod: new Map<string, boolean>(),
          periodMeta: new Map<
            string,
            {
              amountReceived: number | null;
              paymentReference: string;
              status: string;
            }
          >(),
          lifetimePaidPeriods: 0,
          lifetimeTotal: 0,
        };
      }
      const yrs = new Set<number>();
      const paidMap = new Map<string, boolean>();
      const metaMap = new Map<
        string,
        {
          amountReceived: number | null;
          paymentReference: string;
          status: string;
        }
      >();
      let paidCount = 0;
      let total = 0;
      for (const row of contributionRows) {
        const m = /^(\d{4})-(\d{2})$/.exec(row.period);
        if (!m) continue;
        // Skip pre-launch seed rows (period < 2026-06). They live in
        // the table for historical reasons but aren't part of the
        // collection schedule — rendering them as dim tiles in the
        // 2026 strip confuses members ("why does May show as missed?").
        if (row.period < LEHUMO_FIRST_DUE_PERIOD) continue;
        const yr = Number(m[1]);
        yrs.add(yr);
        const paid = row.status === CONTRIBUTION_STATUS.paid;
        paidMap.set(row.period, paid);
        metaMap.set(row.period, {
          amountReceived: row.amountReceived,
          paymentReference: row.paymentReference,
          status: row.status,
        });
        if (paid) {
          paidCount += 1;
          total += row.amountReceived ?? 0;
        }
      }
      return {
        years: [...yrs].sort(),
        paidByPeriod: paidMap,
        periodMeta: metaMap,
        lifetimePaidPeriods: paidCount,
        lifetimeTotal: total,
      };
    }, [contributionRows, richShape]);

  // Default the year selector to the current SAST year when known,
  // otherwise the first year in the shape. `Lifetime` is a special
  // sentinel that grids all years stacked.
  const initialYear = useMemo(() => {
    if (!richShape) return null;
    if (currentPeriod) {
      const yr = Number(currentPeriod.slice(0, 4));
      if (years.includes(yr)) return String(yr);
    }
    return years[0] ? String(years[0]) : null;
  }, [richShape, currentPeriod, years]);

  const [yearMode, setYearMode] = useState<string | typeof LIFETIME_LABEL>(
    initialYear ?? LIFETIME_LABEL,
  );

  // Highlight the current month with a teal ring — in the rich-shape
  // path that's `currentPeriod`'s month-of-year; in legacy fallback we
  // derive it from the browser clock.
  const currentMonthAbbr = useMemo(() => {
    if (currentPeriod) {
      const m = /^(\d{4})-(\d{2})$/.exec(currentPeriod);
      if (m) return MONTH_NAMES[Number(m[2]) - 1] ?? null;
    }
    return MONTH_NAMES[new Date().getMonth()] ?? null;
  }, [currentPeriod]);

  // ── Legacy fallback (no rich shape) ─────────────────────────────────
  if (!richShape) {
    const paidCount = Object.values(contributions).filter(Boolean).length;
    const totalContributed = paidCount * 1000;
    return (
      <div className="rounded-[24px] border border-white/[0.05] bg-gradient-to-b from-[#10224a] to-[#0F2040] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_8px_32px_-8px_rgba(0,0,0,0.35)] p-6 h-full">
        <h2 className="text-lg font-semibold text-white mb-6">
          Contribution History
        </h2>

        <div className="grid grid-cols-6 sm:grid-cols-4 gap-2">
          {SHORT_MONTH_NAMES.map((month) => {
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
                {paid && <Check className="mt-1 h-3.5 w-3.5 text-[#B8FF00]" />}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3">
          <span className="text-sm text-white/60">Total Contributed</span>
          <span className="text-sm font-semibold text-[#B8FF00]">
            R{totalContributed.toLocaleString()}
          </span>
        </div>
      </div>
    );
  }

  // ── Rich-shape view (Phase 4) ──────────────────────────────────────
  // Header strip with year tabs (2026, 2027, ..., 2031, Lifetime). Body
  // either shows one year's 12 cells (when a year is selected) or the
  // full 5-year grid (when Lifetime is selected) — same cell shape so
  // the visual rhythm is consistent across modes.
  const isLifetime = yearMode === LIFETIME_LABEL;
  const visibleYears = isLifetime ? years : [Number(yearMode)];

  // Counts for the bottom strip — show "this year" alongside lifetime
  // when a single year is selected so members get year-over-year context.
  const selectedYearPaidCount = !isLifetime
    ? SHORT_MONTH_NAMES.reduce((n, _, i) => {
        const period = `${yearMode}-${String(i + 1).padStart(2, "0")}`;
        return paidByPeriod.get(period) === true ? n + 1 : n;
      }, 0)
    : null;
  const selectedYearTotal = !isLifetime
    ? SHORT_MONTH_NAMES.reduce((sum, _, i) => {
        const period = `${yearMode}-${String(i + 1).padStart(2, "0")}`;
        const meta = periodMeta.get(period);
        if (paidByPeriod.get(period) === true) {
          return sum + (meta?.amountReceived ?? 0);
        }
        return sum;
      }, 0)
    : null;

  return (
    <div className="rounded-[24px] border border-white/[0.05] bg-gradient-to-b from-[#10224a] to-[#0F2040] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_8px_32px_-8px_rgba(0,0,0,0.35)] p-6 h-full">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="text-lg font-semibold text-white">
          Contribution History
        </h2>
        <div
          className="flex flex-wrap items-center gap-1 rounded-full bg-white/[0.04] border border-white/[0.06] p-1"
          role="tablist"
          aria-label="Year selector"
        >
          {years.map((yr) => {
            const active = String(yr) === yearMode;
            return (
              <button
                key={yr}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setYearMode(String(yr))}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                  active
                    ? "bg-[#B8FF00] text-[#0B1933]"
                    : "text-white/55 hover:text-white"
                }`}
              >
                {yr}
              </button>
            );
          })}
          <button
            type="button"
            role="tab"
            aria-selected={isLifetime}
            onClick={() => setYearMode(LIFETIME_LABEL)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
              isLifetime
                ? "bg-[#46CDCF] text-[#0B1933]"
                : "text-white/55 hover:text-white"
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Body — one section per visible year. Single-year mode renders
          a single section; lifetime mode stacks all five with year
          dividers. */}
      <div className={isLifetime ? "space-y-4" : ""}>
        {visibleYears.map((yr) => (
          <div key={yr}>
            {isLifetime && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30 mb-2">
                {yr}
              </p>
            )}
            <div className="grid grid-cols-6 sm:grid-cols-4 gap-2">
              {SHORT_MONTH_NAMES.map((month, idx) => {
                const period = `${yr}-${String(idx + 1).padStart(2, "0")}`;
                const paid = paidByPeriod.get(period) === true;
                const meta = periodMeta.get(period);
                const isCurrent = currentPeriod === period;
                // Hover/focus title: surface the rich metadata that the
                // legacy 12-cell grid couldn't carry.
                const titleParts: string[] = [`${month} ${yr}`];
                if (meta) {
                  titleParts.push(`Status: ${meta.status}`);
                  if (meta.amountReceived) {
                    titleParts.push(
                      `R${meta.amountReceived.toLocaleString("en-ZA")}`,
                    );
                  }
                  if (meta.paymentReference) {
                    titleParts.push(`Ref: ${meta.paymentReference}`);
                  }
                }
                return (
                  <div
                    key={period}
                    title={titleParts.join(" · ")}
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
                      className={`text-xs font-medium ${
                        paid ? "text-[#B8FF00]" : "text-white/30"
                      }`}
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
          </div>
        ))}
      </div>

      {/* Totals strip — splits "this year" vs lifetime so the member
          can read both at a glance without flipping the year tab. */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {!isLifetime && selectedYearPaidCount !== null && (
          <div className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3">
            <span className="text-xs text-white/60">
              {yearMode} ({selectedYearPaidCount}/12)
            </span>
            <span className="text-sm font-semibold text-white">
              R{(selectedYearTotal ?? 0).toLocaleString("en-ZA")}
            </span>
          </div>
        )}
        <div
          className={`flex items-center justify-between rounded-xl bg-[#B8FF00]/[0.06] border border-[#B8FF00]/20 px-4 py-3 ${
            isLifetime ? "sm:col-span-2" : ""
          }`}
        >
          <span className="text-xs text-white/55">
            Lifetime ({lifetimePaidPeriods}/{TRUST_DURATION_MONTHS})
          </span>
          <span className="text-sm font-semibold text-[#B8FF00]">
            R{lifetimeTotal.toLocaleString("en-ZA")}
          </span>
        </div>
      </div>
    </div>
  );
}
