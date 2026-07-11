"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarClock,
  ArrowRight,
  CheckCircle2,
  Check,
  ChevronDown,
  Copy,
  CreditCard,
  Landmark,
  Loader2,
} from "lucide-react";

import {
  CONTRIBUTION_MONTH_ORDER,
  CONTRIBUTION_STATUS,
  LEHUMO_FIRST_DUE_PERIOD,
  formatEftReference,
  type LehumoContribution,
  type LehumoMember,
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
  /** Member — drives the Make Payment expansion (EFT reference for
   *  the bank-details panel; plan to decide whether to show the
   *  Paystack option; email + id for the one-off Paystack init call). */
  member: LehumoMember;
}

// Bank details — mirror BankDepositCard's source of truth so admin
// recon sees consistent reference shape across surfaces. If the trust
// ever changes account, both this file + BankDepositCard need the
// same update.
const BANK_DETAILS = {
  accountHolder: "Lime Pages Pty Ltd",
  bankName: "Capitec Business Account",
  accountNumber: "1054 7373 47",
  branchCode: "470010",
} as const;

/**
 * Expandable "Make Payment" panel — inline payment options revealed
 * below the reminder copy when a member clicks the action button. EFT
 * is offered to everyone with the member's personalised reference
 * pre-filled; Standard/VIP members who haven't yet set up their
 * Paystack auto-debit see a "Setup recurring payments" block that
 * routes them into Paystack to add a card. Once Paystack has the card
 * on file, it'll debit the same amount on the 25th of every month —
 * so this block is hidden for members who already have an active
 * subscription (`subscriptionCode` is set) to avoid duplicates.
 */
function MakePaymentPanel({ member }: { member: LehumoMember }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [paystackBusy, setPaystackBusy] = useState(false);
  const [paystackError, setPaystackError] = useState<string | null>(null);

  const reference = formatEftReference(member.memberNumber, member.fullName);
  const isStandardOrVip = member.plan === "standard" || member.plan === "vip";
  // Only offer the Paystack setup path to Standard/VIP members who
  // don't already have a subscription. If `subscriptionCode` is set,
  // their auto-debit is live — surfacing another "set up" CTA would
  // risk a duplicate subscription on their card.
  const needsRecurringSetup = isStandardOrVip && !member.subscriptionCode;
  const paystackAmount = member.plan === "vip" ? "R1,050" : "R1,035";
  const paystackFeeNote = member.plan === "vip" ? "R50" : "R35";

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  async function payViaPaystack() {
    if (paystackBusy) return;
    setPaystackBusy(true);
    setPaystackError(null);
    try {
      const res = await fetch("/api/lehumo/paystack/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: member.email,
          memberRecordId: member.id,
          plan: member.plan,
          returnTo: "portal",
          // No `oneOff` — we WANT a subscription created here. Adding
          // the card on Paystack should kick off the monthly auto-debit
          // straight away. The button is gated on
          // `!member.subscriptionCode` above so we don't stack two.
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.authorization_url) {
        throw new Error(data.error || "Could not start payment.");
      }
      window.location.href = data.authorization_url;
    } catch (err) {
      setPaystackError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
      setPaystackBusy(false);
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
      {/* Paystack setup — Standard/VIP members who haven't yet got
          their auto-debit running. Sits ABOVE the EFT option because
          it's the one-tap fix that turns this monthly chore into a
          set-and-forget. Hidden once `subscriptionCode` is on file. */}
      {needsRecurringSetup && (
        <div className="rounded-[14px] border border-[#B8FF00]/25 bg-[#B8FF00]/[0.05] p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#B8FF00]/15 text-[#B8FF00]">
              <CreditCard className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-white">
                Setup recurring payments
              </p>
              <p className="mt-0.5 text-[11.5px] text-white/55 leading-relaxed">
                Add your card on Paystack once — they&rsquo;ll debit{" "}
                {paystackAmount} on the 25th of every month. R1,000 to the
                pool, {paystackFeeNote} covers card processing. Cancel
                anytime from your dashboard.
              </p>
            </div>
          </div>
          <button
            onClick={payViaPaystack}
            disabled={paystackBusy}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-[#B8FF00] py-2.5 px-4 text-[13px] font-bold text-[#0B1933] hover:bg-[#a8ef00] disabled:opacity-50 transition-colors"
          >
            {paystackBusy ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Connecting to Paystack…
              </>
            ) : (
              <>
                Set up auto-debit
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
          {paystackError && (
            <p className="mt-2 text-[11.5px] text-red-300">{paystackError}</p>
          )}
        </div>
      )}

      {/* EFT option — always available. Shows the member's
          personalised reference with copy-to-clipboard, plus the
          bank fields needed to set up an EFT in any banking app. */}
      <div className="rounded-[14px] border border-[#46CDCF]/25 bg-[#46CDCF]/[0.04] p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#46CDCF]/15 text-[#46CDCF]">
            <Landmark className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-white">
              Pay R1,000 via EFT
            </p>
            <p className="mt-0.5 text-[11.5px] text-white/55 leading-relaxed">
              Transfer R1,000 from any SA bank using the details below.
              Use the reference exactly so admin can match it to you.
            </p>
          </div>
        </div>

        {/* Reference — most important field, copy-button prominent */}
        <div className="rounded-lg bg-[#B8FF00]/[0.08] border border-[#B8FF00]/20 p-3 mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#B8FF00] mb-0.5">
              Your reference (use EXACTLY)
            </p>
            <p className="text-[14px] font-bold font-mono text-white truncate">
              {reference}
            </p>
          </div>
          <button
            type="button"
            onClick={() => copy(reference, "reference")}
            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10.5px] font-semibold transition-colors ${
              copied === "reference"
                ? "border-[#B8FF00]/40 bg-[#B8FF00]/[0.12] text-[#B8FF00]"
                : "border-white/[0.1] bg-white/[0.04] text-white/70 hover:bg-white/[0.08]"
            }`}
            aria-label={copied === "reference" ? "Copied" : "Copy"}
          >
            {copied === "reference" ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            {copied === "reference" ? "Copied" : "Copy"}
          </button>
        </div>

        {/* Bank fields */}
        <dl className="space-y-2 text-[11.5px]">
          <BankRow label="Account holder" value={BANK_DETAILS.accountHolder} />
          <BankRow label="Bank" value={BANK_DETAILS.bankName} />
          <BankRow
            label="Account #"
            value={BANK_DETAILS.accountNumber}
            mono
            copyKey="account"
            copied={copied === "account"}
            onCopy={() =>
              copy(BANK_DETAILS.accountNumber.replace(/\s/g, ""), "account")
            }
          />
          <BankRow
            label="Branch code"
            value={BANK_DETAILS.branchCode}
            mono
            copyKey="branch"
            copied={copied === "branch"}
            onCopy={() => copy(BANK_DETAILS.branchCode, "branch")}
          />
        </dl>
      </div>
    </div>
  );
}

function BankRow({
  label,
  value,
  mono,
  copyKey,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyKey?: string;
  copied?: boolean;
  onCopy?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-white/60 shrink-0">{label}</dt>
      <dd
        className={`flex items-center gap-1.5 min-w-0 text-right ${mono ? "font-mono" : ""} text-white/85`}
      >
        <span className="truncate">{value}</span>
        {copyKey && onCopy && (
          <button
            type="button"
            onClick={onCopy}
            className={`inline-flex shrink-0 items-center justify-center rounded-full border w-5 h-5 transition-colors ${
              copied
                ? "border-[#B8FF00]/40 bg-[#B8FF00]/[0.12] text-[#B8FF00]"
                : "border-white/[0.1] bg-white/[0.04] text-white/60 hover:bg-white/[0.08]"
            }`}
            aria-label={copied ? "Copied" : "Copy"}
          >
            {copied ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
          </button>
        )}
      </dd>
    </div>
  );
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
  member,
}: ContributionReminderCardProps) {
  const richShape = (contributionRows?.length ?? 0) > 0;
  // Make Payment expansion — toggled by the action button. Shared
  // across pre-launch / unpaid states; not relevant on the paid /
  // all-paid celebratory states (those return early).
  const [showPayment, setShowPayment] = useState(false);

  // Pre-launch (before 1 Jun 2026): render a quiet "next contribution
  // due X" hint instead of returning null. The "first" vs "next" copy
  // branches on whether the member already has a paid row — a member
  // who's prepaid June sees "Next contribution Jul 2026", a member who
  // hasn't paid sees "First contribution Jun 2026".
  if (beforeLaunch) {
    // Resolve the first unpaid SCHEDULED period (>= LEHUMO_FIRST_DUE).
    // Without the launch-period gate, the May 2026 seed row (Pending,
    // pre-schedule) gets picked first for members onboarded before
    // launch — surfacing "Due May 2026" copy that contradicts our own
    // recon rule. Filter pre-launch rows out at the source.
    const { firstDue, hasPaidYet } = (() => {
      if (richShape && contributionRows) {
        const sorted = [...contributionRows].sort((a, b) =>
          a.period.localeCompare(b.period),
        );
        const paidScheduled = sorted.some(
          (c) =>
            c.status === CONTRIBUTION_STATUS.paid &&
            c.period >= LEHUMO_FIRST_DUE_PERIOD,
        );
        const next = sorted.find(
          (c) =>
            c.status !== CONTRIBUTION_STATUS.paid &&
            c.period >= LEHUMO_FIRST_DUE_PERIOD,
        );
        return {
          firstDue: next?.period ?? null,
          hasPaidYet: paidScheduled,
        };
      }
      return { firstDue: "2026-06", hasPaidYet: false };
    })();

    // No unpaid scheduled rows remain — member is caught up through
    // the schedule horizon (or there's no schedule yet). PaymentCard's
    // own state takes over so we don't show two competing "all good"
    // surfaces.
    if (!firstDue) return null;

    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
        className="rounded-[24px] border border-[#46CDCF]/25 bg-gradient-to-br from-[#46CDCF]/[0.06] via-[#10224a] to-[#0F2040] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_8px_32px_-8px_rgba(70,205,207,0.12)] p-5 md:p-6"
        aria-label="Contribution schedule"
      >
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#46CDCF]/15 text-[#46CDCF]">
            <CalendarClock className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#46CDCF]">
              {hasPaidYet ? "Next contribution" : "First contribution"}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-white">
              Due {periodToLong(firstDue)} · R1,000
            </p>
            <p className="mt-1 text-xs text-white/60">
              {hasPaidYet
                ? "You're ahead of schedule — we'll send a reminder closer to the date."
                : "No action needed yet — we'll send a reminder closer to the date."}
            </p>
          </div>
          {/* Make Payment toggle — pre-launch members can choose to
              pay ahead of the due date. Especially useful for Basic
              members who want to lock in their first contribution
              before launch, or Standard/VIP who want a one-off
              advance separate from their auto-debit. */}
          <button
            type="button"
            onClick={() => setShowPayment((v) => !v)}
            aria-expanded={showPayment}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#B8FF00]/30 bg-[#B8FF00]/[0.08] px-3.5 py-1.5 text-[12px] font-semibold text-[#B8FF00] hover:bg-[#B8FF00]/[0.14] transition-colors self-start"
          >
            {showPayment ? "Close" : "Make payment"}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${showPayment ? "rotate-180" : ""}`}
            />
          </button>
        </div>
        <AnimatePresence initial={false}>
          {showPayment && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              style={{ overflow: "hidden" }}
            >
              <MakePaymentPanel member={member} />
            </motion.div>
          )}
        </AnimatePresence>
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
    // Only the canonical schedule counts. Pre-launch rows (period <
    // LEHUMO_FIRST_DUE_PERIOD — e.g. a stray 2026-05) must never drive
    // "next due" or "all paid", otherwise a member who's paid June
    // sees an incoherent "Next due: May 2026". Mirrors the same guard
    // in computeContributionLedger (lib/contribution-ledger.ts).
    const scheduled = [...contributionRows]
      .filter((r) => r.period >= LEHUMO_FIRST_DUE_PERIOD)
      .sort((a, b) => a.period.localeCompare(b.period));
    const currentRow = scheduled.find((r) => r.period === currentPeriod);
    currentMonthPaid = currentRow?.status === CONTRIBUTION_STATUS.paid;
    allPaid =
      scheduled.length > 0 &&
      scheduled.every((r) => r.status === CONTRIBUTION_STATUS.paid);
    monthFull = periodToLong(currentPeriod);
    const nextUnpaid = scheduled.find(
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
              <p className="mt-0.5 text-xs text-white/60">
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

        <button
          type="button"
          onClick={() => setShowPayment((v) => !v)}
          aria-expanded={showPayment}
          className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#B8FF00] px-5 py-2.5 text-sm font-semibold text-[#0B1933] hover:bg-[#a8ef00] transition-colors self-start sm:self-auto"
        >
          {showPayment ? "Close" : "Make payment"}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${showPayment ? "rotate-180" : ""}`}
          />
        </button>
      </div>
      <AnimatePresence initial={false}>
        {showPayment && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            style={{ overflow: "hidden" }}
          >
            <MakePaymentPanel member={member} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
