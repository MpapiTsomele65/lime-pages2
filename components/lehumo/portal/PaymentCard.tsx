"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CalendarClock,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import {
  CONTRIBUTION_MONTH_ORDER,
  type LehumoContribution,
} from "@/lib/definitions";
import { computeContributionLedger } from "@/lib/contribution-ledger";

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
   * card shows the lifetime R60,000 goal, R-amount contributed,
   * R-outstanding for arrears, and a R-based progress bar. Falls back
   * to the 12-month projected shape via `contributions` when undefined.
   */
  contributionRows?: LehumoContribution[];
  /** SAST current period (`YYYY-MM`). Required to compute the
   *  "outstanding" arrears figure — without it we can't tell which
   *  rows are "due so far". */
  currentPeriod?: string;
}

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
function formatZAR(amount: number): string {
  // en-ZA grouping — R60 000 not R60,000. Matches local convention so
  // members see numbers the same way their bank statements show them.
  return `R${amount.toLocaleString("en-ZA")}`;
}

export function PaymentCard({
  contributions,
  email,
  memberId,
  beforeLaunch = false,
  contributionRows,
  currentPeriod,
}: PaymentCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Rich-shape branch is gated on having BOTH the rows and a currentPeriod
  // — the ledger needs the period to draw the "due so far" line. Without
  // it we'd misclassify everything as Outstanding.
  const richShape =
    (contributionRows?.length ?? 0) > 0 && Boolean(currentPeriod);
  const ledger = richShape
    ? computeContributionLedger(contributionRows!, currentPeriod!)
    : null;

  // Legacy-fallback derived data (flag off, or fetch failed).
  const legacyPaidCount = Object.values(contributions).filter(Boolean).length;
  const legacyAllPaid = legacyPaidCount === 12;
  const legacyNextUnpaidMonth = CONTRIBUTION_MONTH_ORDER.find(
    (month) => contributions[month] !== true,
  );

  // Goal-attainment state — once lifetime goal is hit, switch to the
  // celebration view (this is "all 60 contributions paid").
  const allPaid = ledger
    ? ledger.lifetimeGoal > 0 &&
      ledger.lifetimeReceived >= ledger.lifetimeGoal
    : legacyAllPaid;

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

      {allPaid ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center text-center py-4"
        >
          <CheckCircle2 className="h-12 w-12 text-[#B8FF00] mb-3" />
          <h3 className="text-lg font-semibold text-white">
            Goal reached!
          </h3>
          <p className="text-sm text-white/50 mt-1">
            You&rsquo;ve completed your{" "}
            {ledger ? formatZAR(ledger.lifetimeGoal) : "R60,000"} contribution
            commitment to the trust. Thank you.
          </p>
        </motion.div>
      ) : ledger ? (
        // ── Rich-shape goal-anchored layout ──────────────────────────
        <div className="flex-1 flex flex-col">
          {/* Hero — R-amount contributed of the R60,000 lifetime anchor.
              The number that answers "how am I doing toward the 5-year
              commitment?" */}
          <div className="mb-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#B8FF00]">
                {formatZAR(ledger.lifetimeReceived)}
              </span>
              <span className="text-white/40 text-sm">
                of {formatZAR(ledger.lifetimeGoal)} goal
              </span>
            </div>
          </div>

          {/* Running target — what should be paid by end of `monthsDue`.
              Hidden pre-first-month so we don't flash "Target so far: R0". */}
          {ledger.monthsDue > 0 && (
            <p className="mt-1 text-xs text-white/50">
              Target so far:{" "}
              <span className="text-[#46CDCF] font-medium">
                {formatZAR(ledger.cumulativeExpected)}
              </span>
              <span className="text-white/35">
                {" "}
                · {ledger.monthsDue}/{ledger.totalMonths} months due
              </span>
            </p>
          )}

          {/* Progress bar — three layers anchored to the R60,000 max.
              Shows lime achievement against the running teal target so
              members see at a glance whether they're on track:
                • Background (dark)        — R0 to R60,000 reference
                • Dim teal layer           — R0 to cumulativeExpected
                                              (where you should be by now)
                • Amber overlay (if behind)— received → expected
                                              (the outstanding gap)
                • Lime fill                — R0 to lifetimeReceived
                                              (your actual contributions)
              At month 12 with 12 paid: lime ends exactly at the 20% mark
              (R12,000 of R60,000), tucked against the target boundary.
              At month 60 with all paid: full lime bar.
              At month 6 with 0 paid: dim teal + amber visible to 10%
              (R6,000), no lime — visualises the R6,000 outstanding. */}
          <div className="mt-3 relative h-3 rounded-full bg-white/[0.06] overflow-hidden">
            {/* Dim teal "target zone" — R0 → cumulativeExpected. Sits
                behind everything so it shows through where lime/amber
                aren't drawn. */}
            {ledger.cumulativeExpected > 0 && (
              <div
                className="absolute inset-y-0 left-0 bg-[#46CDCF]/20"
                style={{
                  width: `${Math.min(100, (ledger.cumulativeExpected / ledger.lifetimeGoal) * 100)}%`,
                }}
              />
            )}
            {/* Amber outstanding gap — only when lifetimeReceived <
                cumulativeExpected. Spans from received to expected so
                the gap colour-codes the R-balance owed. */}
            {ledger.outstanding > 0 && ledger.lifetimeGoal > 0 && (
              <div
                className="absolute inset-y-0 bg-[#F59E0B]/35"
                style={{
                  left: `${(ledger.lifetimeReceived / ledger.lifetimeGoal) * 100}%`,
                  width: `${(ledger.outstanding / ledger.lifetimeGoal) * 100}%`,
                }}
              />
            )}
            {/* Lime achievement — R0 → lifetimeReceived. Drawn on top so
                it covers the dim teal in the achieved region. */}
            <div
              className="absolute inset-y-0 left-0 bg-[#B8FF00] transition-all"
              style={{
                width: `${ledger.lifetimeGoal > 0
                  ? Math.min(100, (ledger.lifetimeReceived / ledger.lifetimeGoal) * 100)
                  : 0}%`,
              }}
            />
          </div>
          {/* Bar caption — R0 / R60K range markers. Static under the bar
              so members see the absolute scale at a glance. */}
          <div className="mt-1.5 flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-white/25">
            <span>R0</span>
            <span>{formatZAR(ledger.lifetimeGoal)} · 5-year goal</span>
          </div>

          {/* Outstanding chip — R-amount owed RIGHT NOW. Yellow alert
              if >0, quiet "Up to date" chip if 0 (and at least one
              month is due so far — pre-first-month it stays hidden so
              members don't see "Up to date" before launch). */}
          {ledger.monthsDue > 0 && ledger.outstanding > 0 ? (
            <div className="mt-4 mb-4 rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/[0.07] px-4 py-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-[#F59E0B] shrink-0" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#F59E0B]">
                  Outstanding
                </span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-xl font-bold text-white">
                  {formatZAR(ledger.outstanding)}
                </span>
                <span className="text-xs text-white/45">
                  · {ledger.monthsOutstanding} month
                  {ledger.monthsOutstanding === 1 ? "" : "s"} behind
                </span>
              </div>
            </div>
          ) : ledger.monthsDue > 0 ? (
            <div className="mt-4 mb-4 rounded-xl border border-[#B8FF00]/20 bg-[#B8FF00]/[0.04] px-4 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#B8FF00] shrink-0" />
                <span className="text-sm font-semibold text-white">
                  On track — no balance owed
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-4 mb-4" />
          )}

          {/* Next due / Last paid — period-aware secondary detail */}
          <div className="space-y-1.5 mb-5">
            {ledger.nextDuePeriod && (
              <p className="text-sm text-white/55">
                Next due:{" "}
                <span className="text-[#46CDCF] font-medium">
                  {formatPeriodShort(ledger.nextDuePeriod)}
                </span>
              </p>
            )}
            {ledger.lastPaidPeriod && (
              <p className="text-xs text-white/35">
                Last paid:{" "}
                <span className="text-white/50">
                  {formatPeriodShort(ledger.lastPaidPeriod)}
                </span>
                {ledger.lastPaidAmount !== null && ledger.lastPaidAmount > 0 && (
                  <>
                    {" · "}
                    <span className="text-white/50">
                      {formatZAR(ledger.lastPaidAmount)}
                    </span>
                  </>
                )}
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Action — pre-launch shows a "Begins 1 June 2026" hint
              alongside a disabled Pay button so the goal-anchored shape
              above stays fully visible without giving members a way to
              charge before the schedule starts. Post-launch the button
              is live. */}
          <div className="mt-auto">
            {beforeLaunch ? (
              <div className="rounded-2xl border border-[#46CDCF]/25 bg-[#46CDCF]/[0.06] px-4 py-3 flex items-center gap-3">
                <CalendarClock className="h-4 w-4 text-[#46CDCF] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#46CDCF]">
                    Begins 1 June 2026
                  </p>
                  <p className="text-xs text-white/55 mt-0.5">
                    Your first R1,000 contribution unlocks the Pay
                    button — nothing to do for now.
                  </p>
                </div>
              </div>
            ) : (
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
            )}
          </div>

          {/* Footnote — the "month count" framing as quiet supporting
              detail, not the headline. Only shown for rich-shape members
              so the 12-key fallback doesn't surface a misleading 60-count. */}
          <p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-white/25 text-center">
            {ledger.monthsPaid} of {ledger.totalMonths} contributions paid · 5-year trust
          </p>
        </div>
      ) : (
        // ── Legacy fallback — flag off, or contributionRows missing ──
        <div className="flex-1 flex flex-col">
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-3xl font-bold text-white">R1,000</span>
            <span className="text-white/40 text-sm">/month</span>
          </div>
          {legacyNextUnpaidMonth && (
            <p className="text-sm text-white/50 mb-6">
              Next due:{" "}
              <span className="text-[#46CDCF] font-medium">
                {legacyNextUnpaidMonth}
              </span>
            </p>
          )}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-white/40 mb-2">
              <span>Progress</span>
              <span>{legacyPaidCount}/12 months</span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#B8FF00] transition-all"
                style={{ width: `${(legacyPaidCount / 12) * 100}%` }}
              />
            </div>
          </div>
          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
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
