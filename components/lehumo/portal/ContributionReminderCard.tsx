"use client";

import { motion } from "framer-motion";
import { CalendarClock, ArrowRight, CheckCircle2 } from "lucide-react";

import { MONTH_NAMES } from "@/lib/definitions";

interface ContributionReminderCardProps {
  contributions: Record<string, boolean>;
  /** Three-letter month code in SAST, e.g. "Apr". Computed server-side
   *  by the dashboard page so the card renders correctly on first paint
   *  without a hydration mismatch (Vercel runs in UTC; SA is UTC+2). */
  currentMonth: string;
  /** How many calendar days are left in the current SAST month (1-31). */
  daysLeftInMonth: number;
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
 *   3. All 12 months paid → returns null. The PaymentCard already has
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
 */
export function ContributionReminderCard({
  contributions,
  currentMonth,
  daysLeftInMonth,
}: ContributionReminderCardProps) {
  const paidCount = Object.values(contributions).filter(Boolean).length;
  const allPaid = paidCount === 12;

  // All 12 paid → defer to PaymentCard's celebration state. Two
  // congratulations cards would be noise.
  if (allPaid) return null;

  const currentMonthPaid = contributions[currentMonth] === true;
  const monthFull = MONTH_FULL_NAMES[currentMonth] ?? currentMonth;

  // ── Paid state — subdued confirmation ──────────────────────────────
  if (currentMonthPaid) {
    // Find the next unpaid month for the "next due" hint.
    const nextUnpaidMonth = MONTH_NAMES.find(
      (m) => contributions[m] !== true,
    );
    const nextDueFull = nextUnpaidMonth
      ? (MONTH_FULL_NAMES[nextUnpaidMonth] ?? nextUnpaidMonth)
      : null;

    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="rounded-2xl border border-[#B8FF00]/20 bg-[#B8FF00]/[0.04] p-5"
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
            {nextDueFull && (
              <p className="mt-0.5 text-xs text-white/50">
                Next due:{" "}
                <span className="text-[#46CDCF] font-medium">
                  {nextDueFull}
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
    ? "rounded-2xl border border-[#F59E0B]/30 bg-gradient-to-r from-[#F59E0B]/[0.08] to-[#0F2040] p-5 md:p-6"
    : "rounded-2xl border border-[#46CDCF]/25 bg-gradient-to-r from-[#46CDCF]/[0.06] to-[#0F2040] p-5 md:p-6";
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
      transition={{ duration: 0.4, ease: "easeOut" }}
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
