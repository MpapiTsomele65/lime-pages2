"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Wallet,
  HandCoins,
  AlertTriangle,
} from "lucide-react";

import type { AdminStats } from "@/lib/admin-stats";

interface AdminPoolTrackerProps {
  stats: AdminStats;
}

/**
 * Format ZAR with thin thousand separators. We intentionally don't use
 * `Intl.NumberFormat("en-ZA", { style: "currency" })` because the default
 * "ZAR" prefix is wider than "R" and pushes the headline number around
 * on smaller screens.
 */
function formatZAR(amount: number): string {
  return `R ${amount.toLocaleString("en-ZA")}`;
}

/**
 * Pool tracking card for the admin dashboard.
 *
 * Headline: cumulative ZAR contributed across all members + a fill bar
 * against the founding-member annual cap (30 × R1000 × 12 = R360,000).
 *
 * Footer: this-month contribution rate vs. previous-month rate with a
 * delta indicator. Gives admins a 2-second read on whether collection is
 * trending up, flat, or down month-over-month — the metric that matters
 * most for community-trust health.
 */
export function AdminPoolTracker({ stats }: AdminPoolTrackerProps) {
  const {
    currentMonth,
    prevMonth,
    totalContributed,
    annualPoolCapZAR,
    poolFillPct,
    totalMonthsTicked,
    activePaidThisMonth,
    activeCount,
    thisMonthRate,
    prevMonthRate,
    activePaidPrevMonth,
    totalLent,
    activeLoanCount,
    overdueLoanCount,
  } = stats;

  // Trend: positive when this month >= last month (members can still pay
  // late, so equality is a "holding steady" signal, not a regression).
  const delta =
    prevMonthRate == null ? null : thisMonthRate - prevMonthRate;
  const trendIcon =
    delta == null ? Minus : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const TrendIcon = trendIcon;
  const trendColor =
    delta == null
      ? "text-[#9CA3AF]"
      : delta > 0
        ? "text-[#0B1933]"
        : delta < 0
          ? "text-red-500"
          : "text-[#9CA3AF]";

  return (
    <section className="rounded-[20px] border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B1933] text-[#B8FF00]">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#9CA3AF]">
              Pool — Cumulative Contributions
            </p>
            <p className="mt-1 text-3xl font-bold text-[#0B1933] leading-none">
              {formatZAR(totalContributed)}
            </p>
            <p className="mt-1 text-xs text-[#6B7280]">
              {totalMonthsTicked} member-months captured · target {formatZAR(annualPoolCapZAR)} (30 × 12)
            </p>
          </div>
        </div>
      </div>

      {/* Fill bar against annual founding cap */}
      <div className="mb-5">
        <div
          className="h-2 w-full rounded-full bg-[#F8F9FA] overflow-hidden border border-[#E5E7EB]"
          role="progressbar"
          aria-valuenow={poolFillPct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${poolFillPct}%` }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-[#B8FF00] to-[#46CDCF]"
          />
        </div>
        <p className="mt-1.5 text-[11px] text-[#9CA3AF]">
          {poolFillPct}% of phase-1 founding capacity
        </p>
      </div>

      {/* Month-over-month strip */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#E5E7EB]">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-[#9CA3AF]">
            {currentMonth} (current)
          </p>
          <p className="mt-1 text-lg font-semibold text-[#0B1933]">
            {activePaidThisMonth} / {activeCount}
            <span className="ml-1.5 text-xs font-normal text-[#6B7280]">
              ({thisMonthRate}%)
            </span>
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-[#9CA3AF] flex items-center gap-1">
            vs {prevMonth ?? "previous"}
            {delta != null && (
              <span className={`inline-flex items-center gap-0.5 ${trendColor}`}>
                <TrendIcon className="h-3 w-3" />
                {delta > 0 ? `+${delta}` : delta}pp
              </span>
            )}
          </p>
          <p className="mt-1 text-lg font-semibold text-[#0B1933]">
            {prevMonth ? (
              <>
                {activePaidPrevMonth} / {activeCount}
                <span className="ml-1.5 text-xs font-normal text-[#6B7280]">
                  ({prevMonthRate}%)
                </span>
              </>
            ) : (
              <span className="text-sm font-normal text-[#9CA3AF]">
                first month of year
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Lending strip — outstanding self/P2P loans across the roster.
          Hidden when no loans are active so the card stays compact in
          early months when emergency-access is still locked for most. */}
      {activeLoanCount > 0 && (
        <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#46CDCF]/10 text-[#0B1933]">
                <HandCoins className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-[#9CA3AF]">
                  Outstanding loans · {activeLoanCount} active
                </p>
                <p className="mt-0.5 text-lg font-semibold text-[#0B1933]">
                  {formatZAR(totalLent)}
                </p>
              </div>
            </div>
            {overdueLoanCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                <AlertTriangle className="h-3 w-3" />
                {overdueLoanCount} overdue
              </span>
            ) : (
              <span className="text-[11px] text-[#9CA3AF]">
                All within 90-day window
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
