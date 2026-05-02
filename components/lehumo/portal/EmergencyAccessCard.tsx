"use client";

import { motion } from "framer-motion";
import {
  Lock,
  Wallet,
  AlertTriangle,
  CalendarClock,
  HandCoins,
  ArrowRight,
} from "lucide-react";

import {
  computeEmergencyAccess,
  formatMemberNumber,
  EMERGENCY_ACCESS_TENURE_MONTHS,
  EMERGENCY_ACCESS_CAP_ZAR,
  type LehumoMember,
} from "@/lib/definitions";

interface EmergencyAccessCardProps {
  member: LehumoMember;
}

/**
 * Format ZAR with thin separators. Mirrors the helper inside
 * AdminPoolTracker — kept local rather than shared because Intl's "ZAR"
 * prefix is wider than "R" and pushes the headline number around on
 * mobile.
 */
function formatZAR(amount: number): string {
  return `R ${amount.toLocaleString("en-ZA")}`;
}

/**
 * Build the mailto request link. The committee facilitates loans
 * manually for v1, so the CTA opens an email pre-filled with the
 * member's identifying info plus the structured fields the admin
 * needs to act (amount, reason, repayment plan).
 */
function buildLoanRequestMailto(
  member: LehumoMember,
  availableZAR: number,
  scope: "self" | "p2p-interest",
): string {
  const subject =
    scope === "self"
      ? `Lehumo — Emergency-access loan request (${formatMemberNumber(member.memberNumber)})`
      : `Lehumo — Above-20% lending interest (${formatMemberNumber(member.memberNumber)})`;

  const intro =
    scope === "self"
      ? `Hi Lehumo team,\n\nI'd like to request an emergency-access loan against my 20% allowance.\nMy current available headroom: ${formatZAR(availableZAR)}.\n\nAmount needed: \nReason: \nRepayment plan (within 90 days): \n\n`
      : `Hi Lehumo team,\n\nI'd like to request a P2P advance above my 20% allowance.\nThe Lending Pledges marketplace isn't live yet — happy for the committee to facilitate.\n\nAdditional amount needed: \nReason: \nProposed repayment plan: \n\n`;

  const body = `${intro}Thanks,\n${member.fullName}\n${formatMemberNumber(member.memberNumber)}`;

  return `mailto:lehumo@limepages.co.za?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Format a YYYY-MM-DD date for display in the card. Localises to en-ZA
 * so the format reads naturally to South African members ("21 Apr 2026"
 * vs. the ISO string).
 */
function formatDate(yyyymmdd: string): string {
  const d = new Date(yyyymmdd);
  if (Number.isNaN(d.getTime())) return yyyymmdd;
  return d.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Days between two dates (signed; negative means `to` is in the past).
 */
function daysBetween(from: Date, toIso: string): number {
  const to = new Date(toIso);
  const ms = to.getTime() - from.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/**
 * Member-portal Emergency Access card.
 *
 * Surfaces the member's current self-loan position derived from
 * `computeEmergencyAccess(member)`:
 *
 *   - locked      → still inside the 6-month tenure window. Counts down
 *                   how many months until the 20% allowance unlocks.
 *   - available   → eligible, no active draw. Shows headroom + a
 *                   request-loan CTA (mailto for v1).
 *   - active-loan → already drawn. Shows outstanding balance + 90-day
 *                   due date + overdue flag, plus any remaining
 *                   self-loan headroom.
 *
 * The card always teases the future Lending Pledges marketplace at the
 * bottom — a single mailto link for "I need more than my 20%" requests
 * keeps the door open while the matching UI is built next session.
 */
export function EmergencyAccessCard({ member }: EmergencyAccessCardProps) {
  const access = computeEmergencyAccess(member);

  // ── Locked state ──
  if (access.kind === "locked") {
    const pct = Math.round(
      (access.monthsContributed / EMERGENCY_ACCESS_TENURE_MONTHS) * 100,
    );
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="rounded-2xl border border-white/[0.06] bg-[#0F2040] p-5 md:p-6"
        aria-label="Emergency access — locked"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-white/60">
            <Lock className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40">
              Emergency Access
            </p>
            <p className="mt-0.5 text-sm font-semibold text-white">
              Unlocks in {access.monthsRemaining}{" "}
              {access.monthsRemaining === 1 ? "month" : "months"}
            </p>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-white/80 leading-none tabular-nums">
            {access.monthsContributed}/{EMERGENCY_ACCESS_TENURE_MONTHS}
          </p>
        </div>

        <div
          className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden mb-4"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            className="h-full rounded-full bg-gradient-to-r from-[#B8FF00] to-[#46CDCF]"
          />
        </div>

        <p className="text-xs text-white/55 leading-relaxed">
          After 6 months of contributions, up to{" "}
          <span className="text-white font-semibold">20% of your savings</span>{" "}
          (capped at {formatZAR(EMERGENCY_ACCESS_CAP_ZAR)}) becomes available
          as an interest-free loan. Keep your monthly contributions on track
          and you&rsquo;ll unlock this safety net automatically.
        </p>

        {/* R-anchor footer — even while locked, members see the lifetime
            max emergency cash they're working toward. Mirrors the bar on
            the available/active-loan states so the framing is consistent
            across all three lifecycle moments. */}
        <p className="mt-3 pt-3 border-t border-white/[0.06] text-[10px] uppercase tracking-[0.12em] text-white/30">
          Working toward{" "}
          <span className="text-white/55">
            {formatZAR(access.maxPossibleZAR)}
          </span>{" "}
          max emergency cash · 5-year trust
        </p>
      </motion.section>
    );
  }

  // ── Active-loan state ──
  if (access.kind === "active-loan") {
    const today = new Date();
    const daysLeft = daysBetween(today, access.dueAt);
    const accent = access.isOverdue
      ? {
          ring: "border-red-500/40",
          chipBg: "bg-red-500/10",
          chipText: "text-red-300",
          icon: "text-red-400",
        }
      : {
          ring: "border-amber-400/30",
          chipBg: "bg-amber-400/10",
          chipText: "text-amber-200",
          icon: "text-amber-300",
        };

    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`rounded-2xl border ${accent.ring} bg-[#0F2040] p-5 md:p-6`}
        aria-label="Emergency access — active loan"
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accent.chipBg} ${accent.icon}`}
          >
            <CalendarClock className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40">
              Active Loan ·{" "}
              <span className={accent.chipText}>
                {access.loanType === "P2P" ? "P2P advance" : "Self-loan"}
              </span>
            </p>
            <p className="mt-0.5 text-sm font-semibold text-white">
              {access.isOverdue
                ? `Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? "" : "s"}`
                : daysLeft === 0
                  ? "Due today"
                  : `${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3">
            <p className="text-[10px] uppercase tracking-wider text-white/40">
              Outstanding
            </p>
            <p className="mt-1 text-2xl font-bold text-white leading-none tabular-nums">
              {formatZAR(access.activeBalanceZAR)}
            </p>
          </div>
          <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3">
            <p className="text-[10px] uppercase tracking-wider text-white/40">
              Due
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              {formatDate(access.dueAt)}
            </p>
            <p className="text-[11px] text-white/50">
              Issued {formatDate(access.issuedAt)}
            </p>
          </div>
        </div>

        {/* R-anchored bar — full = max possible emergency cash for the
            5-year trust. Within that:
              • Amber 0 → activeBalanceZAR  — currently borrowed
              • Lime  activeBalanceZAR → maxAvailableZAR  — remaining
                headroom (still available to draw)
              • Background past maxAvailableZAR — future emergency cash
                that'll unlock as contributions continue to land. */}
        <div className="mb-3">
          <div className="relative h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
            {/* Amber — borrowed slice */}
            {access.maxPossibleZAR > 0 && access.activeBalanceZAR > 0 && (
              <div
                className="absolute inset-y-0 left-0 bg-[#F59E0B]/70"
                style={{
                  width: `${Math.min(100, (access.activeBalanceZAR / access.maxPossibleZAR) * 100)}%`,
                }}
              />
            )}
            {/* Lime — remaining headroom (sits to the right of borrowed,
                ends at maxAvailableZAR) */}
            {access.maxPossibleZAR > 0 && access.remainingHeadroomZAR > 0 && (
              <div
                className="absolute inset-y-0 bg-[#B8FF00]"
                style={{
                  left: `${(access.activeBalanceZAR / access.maxPossibleZAR) * 100}%`,
                  width: `${(access.remainingHeadroomZAR / access.maxPossibleZAR) * 100}%`,
                }}
              />
            )}
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-white/30">
            <span>
              <span className="text-[#F59E0B]">{formatZAR(access.activeBalanceZAR)}</span>
              {" borrowed"}
              {access.remainingHeadroomZAR > 0 && (
                <>
                  {" · "}
                  <span className="text-[#B8FF00]">
                    {formatZAR(access.remainingHeadroomZAR)}
                  </span>
                  {" headroom"}
                </>
              )}
            </span>
            <span>{formatZAR(access.maxPossibleZAR)} · 5-year max</span>
          </div>
        </div>

        {access.remainingHeadroomZAR > 0 && (
          <p className="text-xs text-white/55 leading-relaxed mb-3">
            You still have{" "}
            <span className="text-[#B8FF00] font-semibold">
              {formatZAR(access.remainingHeadroomZAR)}
            </span>{" "}
            of self-loan headroom available — though most members clear one
            loan before drawing again.
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <a
            href={`mailto:lehumo@limepages.co.za?subject=${encodeURIComponent(`Lehumo — Mark loan repaid (${formatMemberNumber(member.memberNumber)})`)}&body=${encodeURIComponent(`Hi Lehumo team,\n\nI've paid off my active loan and need this confirmed on the portal.\nOutstanding before payment: ${formatZAR(access.activeBalanceZAR)}\nDate paid: \nReference: \n\nThanks,\n${member.fullName}\n${formatMemberNumber(member.memberNumber)}`)}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#B8FF00] px-4 py-2 text-xs font-bold text-[#0B1933] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(184,255,0,0.25)] transition-all"
          >
            Notify admin of repayment <ArrowRight className="h-3.5 w-3.5" />
          </a>
          {access.isOverdue && (
            <span className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/[0.05] px-3 py-2 text-[11px] text-red-200">
              <AlertTriangle className="h-3.5 w-3.5" />
              Overdue loans claw back from your year-5 share
            </span>
          )}
        </div>
      </motion.section>
    );
  }

  // ── Available state ──
  const pct =
    access.contributedZAR > 0
      ? Math.round((access.maxAvailableZAR / access.contributedZAR) * 100)
      : 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="rounded-2xl border border-[#B8FF00]/25 bg-gradient-to-br from-[#B8FF00]/[0.05] to-[#0F2040] p-5 md:p-6"
      aria-label="Emergency access — available"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#B8FF00]/15 text-[#B8FF00]">
          <Wallet className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40">
            Emergency Access · Available
          </p>
          <p className="mt-0.5 text-sm font-semibold text-white">
            Interest-free, repayable within 90 days
          </p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-wider text-white/40">
          Available to draw
        </p>
        <p className="mt-1 text-3xl md:text-4xl font-bold text-[#B8FF00] leading-none tabular-nums">
          {formatZAR(access.availableZAR)}
        </p>
        <p className="mt-1.5 text-xs text-white/55">
          {pct}% of your {formatZAR(access.contributedZAR)} contributed ·{" "}
          {access.capReason === "ceiling"
            ? `at the ${formatZAR(EMERGENCY_ACCESS_CAP_ZAR)} ceiling`
            : "below the R20,000 ceiling"}
        </p>

        {/* R-anchored bar — full extent = max possible emergency cash
            for this member's full 5-year contribution
            (`min(20% × R60K, R20K)` = R12K for Standard, climbing toward
            R20K ceiling for higher tiers). Lime fill = currently
            accessible. Grows automatically as contributions land. */}
        <div className="mt-3 relative h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-[#B8FF00] transition-all"
            style={{
              width: `${access.maxPossibleZAR > 0
                ? Math.min(
                    100,
                    (access.availableZAR / access.maxPossibleZAR) * 100,
                  )
                : 0}%`,
            }}
            role="progressbar"
            aria-valuenow={access.availableZAR}
            aria-valuemin={0}
            aria-valuemax={access.maxPossibleZAR}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-white/30">
          <span>R0</span>
          <span>{formatZAR(access.maxPossibleZAR)} · 5-year max</span>
        </div>
      </div>

      <a
        href={buildLoanRequestMailto(member, access.availableZAR, "self")}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#B8FF00] px-4 py-2 text-xs font-bold text-[#0B1933] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(184,255,0,0.25)] transition-all"
      >
        Request loan from my 20% <ArrowRight className="h-3.5 w-3.5" />
      </a>

      {/* Future-state teaser: above-20% Lending Pledges marketplace.
          Until that ships, the link drops the member into a mailto so
          the committee can still facilitate manually. */}
      <div className="mt-5 pt-4 border-t border-white/[0.06]">
        <div className="flex items-start gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#46CDCF]/10 text-[#46CDCF]">
            <HandCoins className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#46CDCF]">
              Need more than {formatZAR(access.availableZAR)}?
            </p>
            <p className="mt-1 text-xs text-white/55 leading-relaxed">
              <span className="text-white font-semibold">Lending Pledges</span>{" "}
              — our peer-to-peer marketplace where members offer spare 20%
              capacity — is shipping soon. In the meantime, the committee
              can facilitate manually.
            </p>
            <a
              href={buildLoanRequestMailto(
                member,
                access.availableZAR,
                "p2p-interest",
              )}
              className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#46CDCF] hover:text-[#B8FF00] transition-colors"
            >
              Express interest <ArrowRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
