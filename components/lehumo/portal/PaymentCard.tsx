"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, CreditCard, CheckCircle2 } from "lucide-react";
import {
  CONTRIBUTION_MONTH_ORDER,
  CONTRIBUTION_STATUS,
  type LehumoContribution,
} from "@/lib/definitions";

const TRUST_DURATION_MONTHS = 60;

interface PaymentCardProps {
  contributions: Record<string, boolean>;
  email: string;
  memberId: string;
  /** Pre-launch flag — when true, the card shows a "Contributions begin
   *  1 June 2026" placeholder instead of a payment CTA. Lehumo collections
   *  start 1 Jun 2026; before then there's no real "next due" to surface. */
  beforeLaunch?: boolean;
  /**
   * Phase 4 — full 60-period contribution history. When provided, the
   * card shows lifetime progress (X/60) with period-aware "Next due"
   * (e.g. "Jun 2026" not just "Jun"), and surfaces the most recent paid
   * contribution as a confirmation chip. When undefined (flag off, or
   * fetch failed), falls back to the 12-month projected shape via the
   * `contributions` prop above so the legacy UI keeps working.
   */
  contributionRows?: LehumoContribution[];
}

/**
 * Format a YYYY-MM period as "MMM YYYY" (e.g. "Jun 2026"). Inline so the
 * client component doesn't pull in lib/member-contributions-view.ts (which
 * imports `server-only`).
 */
const SHORT_MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
function formatPeriodShort(period: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(period);
  if (!m) return period;
  const monthIdx = Number(m[2]) - 1;
  return `${SHORT_MONTH_NAMES[monthIdx] ?? "?"} ${m[1]}`;
}

export function PaymentCard({
  contributions,
  email,
  memberId,
  beforeLaunch = false,
  contributionRows,
}: PaymentCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Derived data ──
  // Prefer the rich shape (60-period awareness) when available; fall
  // back to the 12-key projection for the flag-off path. Both branches
  // produce the same {paidCount, totalCount, allPaid, nextLabel} ABI
  // so the JSX below stays uniform.
  const richShape = (contributionRows?.length ?? 0) > 0;

  let paidCount: number;
  let totalCount: number;
  let nextDueLabel: string | null;
  let lastPaidLabel: string | null;
  let lastPaidAmount: number | null;

  if (richShape && contributionRows) {
    // Sort defensively — the hydration path returns sorted, but caller
    // could pass anything.
    const sorted = [...contributionRows].sort((a, b) =>
      a.period.localeCompare(b.period),
    );
    const paidRows = sorted.filter(
      (c) => c.status === CONTRIBUTION_STATUS.paid,
    );
    paidCount = paidRows.length;
    totalCount = sorted.length || TRUST_DURATION_MONTHS;
    const nextUnpaid = sorted.find(
      (c) => c.status !== CONTRIBUTION_STATUS.paid,
    );
    nextDueLabel = nextUnpaid ? formatPeriodShort(nextUnpaid.period) : null;
    const lastPaid = paidRows[paidRows.length - 1] ?? null;
    lastPaidLabel = lastPaid ? formatPeriodShort(lastPaid.period) : null;
    lastPaidAmount = lastPaid?.amountReceived ?? null;
  } else {
    paidCount = Object.values(contributions).filter(Boolean).length;
    totalCount = 12;
    // Find the next unpaid month — using collection order (Jun → May), not
    // calendar order. Otherwise pre-Jun members would see "Next due: Jan"
    // even though Jan-May 2027 are *future* contributions, not arrears.
    const nextUnpaidMonth = CONTRIBUTION_MONTH_ORDER.find(
      (month) => contributions[month] !== true,
    );
    nextDueLabel = nextUnpaidMonth ?? null;
    lastPaidLabel = null;
    lastPaidAmount = null;
  }

  const allPaid = paidCount > 0 && paidCount === totalCount;

  async function handlePayment() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/lehumo/paystack/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          memberRecordId: memberId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Could not initiate payment. Please try again.");
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        setError("Payment URL not received. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#0F2040] rounded-[20px] border border-white/[0.06] p-6 h-full flex flex-col">
      <h2 className="text-lg font-semibold text-white mb-6">
        Monthly Contribution
      </h2>

      {beforeLaunch ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center text-center py-4"
        >
          <CalendarClock className="h-12 w-12 text-[#46CDCF] mb-3" />
          <h3 className="text-lg font-semibold text-white">
            Contributions begin 1 June 2026
          </h3>
          <p className="text-sm text-white/50 mt-1 max-w-xs">
            Your first R1,000 contribution will be due then. We&rsquo;ll send a
            reminder closer to the date — nothing to do for now.
          </p>
        </motion.div>
      ) : allPaid ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center text-center py-4"
        >
          <CheckCircle2 className="h-12 w-12 text-[#B8FF00] mb-3" />
          <h3 className="text-lg font-semibold text-white">All caught up!</h3>
          <p className="text-sm text-white/50 mt-1">
            All {totalCount} monthly contributions have been paid. Thank you
            for your commitment.
          </p>
        </motion.div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Amount */}
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-3xl font-bold text-white">R1,000</span>
            <span className="text-white/40 text-sm">/month</span>
          </div>

          {/* Next due — period-aware (Jun 2026) when rich shape is available,
              falls back to month-only (Jun) for the legacy projection */}
          {nextDueLabel && (
            <p className="text-sm text-white/50 mb-2">
              Next due:{" "}
              <span className="text-[#46CDCF] font-medium">
                {nextDueLabel}
              </span>
            </p>
          )}

          {/* Last paid — only surfaces with the rich shape, since the
              projection can't tell us a payment date or amount.
              Membership-level "you're on track" reassurance. */}
          {lastPaidLabel && (
            <p className="text-xs text-white/35 mb-6">
              Last paid:{" "}
              <span className="text-white/50">{lastPaidLabel}</span>
              {lastPaidAmount !== null && lastPaidAmount > 0 && (
                <>
                  {" · "}
                  <span className="text-white/50">
                    R{lastPaidAmount.toLocaleString("en-ZA")}
                  </span>
                </>
              )}
            </p>
          )}
          {!lastPaidLabel && <div className="mb-4" />}

          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-white/40 mb-2">
              <span>Progress</span>
              <span>
                {paidCount}/{totalCount} months
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#B8FF00] transition-all"
                style={{ width: `${(paidCount / totalCount) * 100}%` }}
              />
            </div>
            {/* Footnote — clarifies "X/60" is the trust lifetime, not a
                12-month tally. Only shown for the rich shape. */}
            {richShape && (
              <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-white/30">
                Across the 5-year trust ({totalCount} months total)
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Pay button */}
          <div className="mt-auto">
            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-[#B8FF00] py-3 px-6 text-sm font-semibold text-[#0B1933] hover:bg-[#a8ef00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Make Payment
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
