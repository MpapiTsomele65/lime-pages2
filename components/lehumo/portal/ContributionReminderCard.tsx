"use client";

import { motion } from "framer-motion";
import { CalendarClock, ArrowRight, CheckCircle2 } from "lucide-react";

import {
  CONTRIBUTION_MONTH_ORDER,
  CONTRIBUTION_STATUS,
  type LehumoContribution,
} from "@/lib/definitions";

interface ContributionReminderCardProps {
  contributions: Record<string, boolean>;
  /** Three-letter month code in SAST, e.g. "Apr". Computed server-side
   *  by the dashboard page so the card renders correctly on first paint
   *  without a hydration mismatch (Vercel runs in UTC; SA is UTC+2). */
  currentMonth: string;
  /** How many calendar days are left in the current SAST month (1-31). */
  daysLeftInMonth: number;
  /** SAST-current period in `YYYY-MM` form (e.g. `2026-06`). When
   *  provided alongside `contributionRows`, the card uses the period
   *  to look up "this month's row" in the new 60-period shape — so
   *  members in 2027 see "Pay your June 2027 contribution", not
   *  "Pay your June" with last year's row matching by accident. */
  currentPeriod?: string;
  /** Pre-launch flag — when true the card renders nothing. Lehumo
   *  collections start 1 Jun 2026; before then there's no contribution
   *  to remind anyone about, and the PaymentCard already shows a
   *  "Contributions begin 1 June 2026" placeholder. */
  beforeLaunch?: boolean;
  /** Phase 4 — full 60-period contribution history. Powers the
   *  period-aware "next due" hint (e.g. `Jun 2026`). Falls back to the
   *  12-month projected `contributions` shape when undefined. */
  contributionRows?: LehumoContribution[];
}

const MONTH_FULL_NAMES: Record<string, string> = {
  Jan: "January",
  Feb: "February",
  Mar: "March",
  Apr: "April",
  May: "May",
  Jun: "June",
  Jul: "July",
  Aug: "August",
  Sep: "September",
  Oct: "October",
  Nov: "November",
  Dec: "December",
};
const SHORT_MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
function periodToShort(period: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(period);
  if (!m) return period;
  return `${SHORT_MONTH_NAMES[Number(m[2]) - 1] ?? "?"} ${m[1]}`;
}
function periodToLong(period: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(period);
  if (!m) return period;
  const idx = Number(m[2]) - 1;
  const monthCode = SHORT_MONTH_NAMES[idx];
  const monthFull = monthCode ? MONTH_FULL_NAMES[monthCode] : null;
  if (!monthFull) return period;
  return `${monthFull} ${m[1]}`;
}

/**
 * Member-portal current-month contribution reminder.
 *
 * Sits high on the dashboard so the most common monthly action — paying
 * the R1,000 contribution — is one tap away. Three states:
 *
 *   1. Current month already paid → quiet confirmation chip (no urgency,
 *      keeps the page visually clean for caught-up members).
 *   2. Current month unpaid → bold nudge with deadline copy and an
 *      anchor CTA to the PaymentCard (single source of truth for the
 *      Paystack init flow; the reminder doesn't duplicate that logic).
 *   3. All months paid → returns null. The PaymentCard already has
 *      its own "All caught up!" celebration state and we don't want
 *      two of them stacked.
 *
 * Urgency tier is decided by `daysLeftInMonth`:
 *   - ≤ 7 days → red/orange "X days left" framing
 *   - > 7 days → teal "due this month" framing
 *
 * Both states share the same lime CTA so the action target is consistent.
 *
 * Hydration-safe by design: `currentMonth` and `daysLeftInMonth` come in
 * as props from the server component, so first paint shows the right
 * state. No useEffect, no flicker.
 *
 * Phase 4 — when `contributionRows` + `currentPeriod` are supplied, the
 * card resolves "this month" against the rich 60-period shape, which
 * unambiguously identifies *which year* of the 5-year trust we're in.
 * Without those props it falls back to the 12-key projection that
 * Phase 3 produces.
 */
export function ContributionReminderCard({
  contributions,
  currentMonth,
  daysLeftInMonth,
  currentPeriod,
  beforeLaunch = false,
  contributionRows,
}: ContributionReminderCardProps) {
  const richShape = (contributionRows?.length ?? 0) > 0;

  // Pre-launch (before 1 Jun 2026): render a quiet "first contribution
  // due 1 Jun 2026" hint instead of returning null. Lets members see
  // the period-aware reminder shape ahead of launch — it'll quietly
  // morph into the urgent-or-paid states once the schedule kicks in.
  if (beforeLaunch) {
    // Resolve the first unpaid period from the rich shape so the hint
    // tracks any back-channel members who might already have a row
    // marked Paid via admin tooling. Fall back to the canonical 1 Jun
    // 2026 launch period when contributionRows is empty.
    const firstDue = (() => {
      if (richShape && contributionRows) {
        const sorted = [...contributionRows].sort((a, b) =>
          a.period.localeCompare(b.period),
        );
        const next = sorted.find(
          (c) => c.status !== CONTRIBUTION_STATUS.paid,
        );
        if (next) return next.period;
      }
      return "2026-06";
    })();

    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
        className="rounded-[24px] border border-[#46CDCF]/25 bg-gradient-to-br from-[#46CDCF]/[0.06] via-[#10224a] to-[#0F2040] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_8px_32px_-8px_rgba(70,205,207,0.12)] p-5 md:p-6"
        aria-label="Contribution schedule"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#46CDCF]/15 text-[#46CDCF]">
            <CalendarClock className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#46CDCF]">
              First contribution
            </p>
            <p className="mt-0.5 text-sm font-semibold text-white">
              Due {periodToLong(firstDue)} · R1,000
            </p>
            <p className="mt-1 text-xs text-white/50">
              No action needed yet — we&rsquo;ll send a reminder closer
              to the date.
            </p>
          </div>
        </div>
      </motion.section>
    );
  }

  // ── Resolve "is the current month paid?" + "what's the next due?"
  //    against either the rich 60-period shape (preferred) or the 12-key
  //    projection (fallback). ──
  let allPaid: boolean;
  let currentMonthPaid: boolean;
  let monthFull: string;
  let nextDueLabel: string | null;

  if (richShape && contributionRows && currentPeriod) {
    const sorted = [...contributionRows].sort((a, b) =>
      a.period.localeCompare(b.period),
    );
    const currentRow = sorted.find((r) => r.period === currentPeriod);
    currentMonthPaid = currentRow?.status === CONTRIBUTION_STATUS.paid;
    allPaid = sorted.every((r) => r.status === CONTRIBUTION_STATUS.paid);
    monthFull = periodToLong(currentPeriod);
    const nextUnpaid = sorted.find(
      (r) => r.status !== CONTRIBUTION_STATUS.paid,
    );
    nextDueLabel = nextUnpaid ? periodToShort(nextUnpaid.period) : null;
  } else {
    const paidCount = Object.values(contributions).filter(Boolean).length;
    allPaid = paidCount === 12;
    currentMonthPaid = contributions[currentMonth] === true;
    monthFull = MONTH_FULL_NAMES[currentMonth] ?? currentMonth;
    const nextUnpaidMonth = CONTRIBUTION_MONTH_ORDER.find(
      (m) => contributions[m] !== true,
    );
    nextDueLabel = nextUnpaidMonth
      ? (MONTH_FULL_NAMES[nextUnpaidMonth] ?? nextUnpaidMonth)
      : null;
  }

  // All paid → defer to PaymentCard's celebration state. Two
  // congratulations cards would be noise.
  if (allPaid) return null;

  // ── Paid state — subdued confirmation ──────────────────────────────
  if (currentMonthPaid) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
        className="rounded-[24px] border border-[#B8FF00]/20 bg-gradient-to-br from-[#B8FF00]/[0.06] via-[#10224a] to-[#0F2040] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_8px_32px_-8px_rgba(184,255,0,0.10)] p-5 md:p-6"
        aria-label="Contribution status"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#B8FF00]/15 text-[#B8FF00]">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">
              {monthFull} contribution received
            </p>
            {nextDueLabel && (
              <p className="mt-0.5 text-xs text-white/50">
                Next due:{" "}
                <span className="text-[#46CDCF] font-medium">
                  {nextDueLabel}
                </span>{" "}
                · R1,000
              </p>
            )}
          </div>
        </div>
      </motion.section>
    );
  }

  // ── Unpaid state — colour by urgency ───────────────────────────────
  const urgent = daysLeftInMonth <= 7;
  const containerClass = urgent
    ? "rounded-[24px] border border-[#F59E0B]/30 bg-gradient-to-br from-[#F59E0B]/[0.10] via-[#10224a] to-[#0F2040] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_8px_32px_-8px_rgba(245,158,11,0.18)] p-5 md:p-6"
    : "rounded-[24px] border border-[#46CDCF]/25 bg-gradient-to-br from-[#46CDCF]/[0.07] via-[#10224a] to-[#0F2040] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_8px_32px_-8px_rgba(70,205,207,0.14)] p-5 md:p-6"
  const iconWrapClass = urgent
    ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F59E0B]/15 text-[#F59E0B]"
    : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#46CDCF]/15 text-[#46CDCF]";
  const eyebrowClass = urgent
    ? "text-[11px] font-semibold uppercase tracking-[0.15em] text-[#F59E0B]"
    : "text-[11px] font-semibold uppercase tracking-[0.15em] text-[#46CDCF]";

  const dayWord = daysLeftInMonth === 1 ? "day" : "days";
  const eyebrowText = urgent
    ? `${daysLeftInMonth} ${dayWord} left`
    : "Due this month";
  const subCopy = urgent
    ? `Pay before the end of ${monthFull} to keep your contribution streak intact.`
    : `Your R1,000 contribution for ${monthFull} is due. Pay anytime this month — no late fees, but consistent contributions keep the trust on track.`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
      className={containerClass}
      aria-label={`${monthFull} contribution reminder`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <div className={iconWrapClass}>
            <CalendarClock className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className={eyebrowClass}>{eyebrowText}</p>
            <p className="mt-1 text-base sm:text-lg font-semibold text-white">
              Pay your {monthFull} contribution
            </p>
            <p className="mt-1.5 text-sm text-white/55 leading-relaxed">
              {subCopy}
            </p>
          </div>
        </div>

        <a
          href="#payment"
          className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#B8FF00] px-5 py-2.5 text-sm font-semibold text-[#0B1933] hover:bg-[#a8ef00] transition-colors self-start sm:self-auto"
        >
          Pay R1,000
          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>
    </motion.section>
  );
}
