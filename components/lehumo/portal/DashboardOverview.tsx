"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Shield, X } from "lucide-react";
import type { CommunityPoolStats, LehumoMember } from "@/lib/definitions";
import { formatMemberNumber } from "@/lib/definitions";
import { MemberProfileCard } from "./MemberProfileCard";
import { ContributionGrid } from "./ContributionGrid";
import { ContributionReminderCard } from "./ContributionReminderCard";
import { KycStatusTracker } from "./KycStatusTracker";
import { KycDocumentsCard } from "./KycDocumentsCard";
import { BeneficiaryCard } from "./BeneficiaryCard";
import { PaymentCard } from "./PaymentCard";
import { SetUpPaymentsCard } from "./SetUpPaymentsCard";
import { CommunityPoolCard } from "./CommunityPoolCard";
import { CompletenessMeter } from "./CompletenessMeter";
import { BankDepositCard } from "./BankDepositCard";
import { EmergencyAccessCard } from "./EmergencyAccessCard";
import { PlanManagementCard } from "./PlanManagementCard";
import { QGMSummaryCard } from "./QGMSummaryCard";

interface DashboardOverviewProps {
  member: LehumoMember;
  communityStats: CommunityPoolStats | null;
  isAdmin?: boolean;
  /** SAST month code (e.g. "Apr") computed server-side. Powers the
   *  ContributionReminderCard's "pay this month" copy. */
  currentMonth: string;
  /** SAST period (`YYYY-MM`) computed server-side. Used by the
   *  reminder card and contribution grid to disambiguate years post-launch
   *  — the bare month code is only enough for year 1 of the trust. */
  currentPeriod: string;
  /** Days remaining in the current SAST month (1-31). Used for the
   *  reminder card's urgency tier. */
  daysLeftInMonth: number;
  /** True until 1 Jun 2026 SAST — when set, the dashboard hides
   *  contribution-due prompts and PaymentCard shows a "starts 1 June
   *  2026" placeholder instead of "Next due: Jan". */
  beforeLaunch: boolean;
  /** Set to true when the page receives a `?payment=success` query
   *  param from the Paystack callback URL — i.e. the member has just
   *  completed card setup + first charge inside the portal. Renders the
   *  celebration banner at the top of the dashboard and the URL params
   *  are stripped client-side on mount so a refresh doesn't keep
   *  retriggering it. */
  paymentSuccess?: boolean;
}

export function DashboardOverview({
  member,
  communityStats,
  isAdmin = false,
  currentMonth,
  currentPeriod,
  daysLeftInMonth,
  beforeLaunch,
  paymentSuccess = false,
}: DashboardOverviewProps) {
  const router = useRouter();
  const [showSuccessBanner, setShowSuccessBanner] = useState(paymentSuccess);

  // When the page mounts with `?payment=success&reference=…`, replace the
  // URL with the bare /lehumo/portal path so a refresh doesn't keep
  // showing the banner. Using router.replace keeps the in-memory state
  // (and the React tree) intact — we just clean up the bar.
  useEffect(() => {
    if (paymentSuccess && typeof window !== "undefined") {
      router.replace("/lehumo/portal", { scroll: false });
    }
  }, [paymentSuccess, router]);

  const firstName = member.fullName.split(" ")[0];

  // Lifetime contribution total. Prefer the rich 60-period shape (sums
  // actual `amountReceived` from every Paid row, lifetime, in ZAR) so
  // years 2027-2031 of history show up in the community card. Falls
  // back to the 12-month projection × R1,000 for the flag-off path.
  const myContributed = member.contributionRows
    ? member.contributionRows.reduce(
        (sum, row) =>
          row.status === "Paid" && row.amountReceived
            ? sum + row.amountReceived
            : sum,
        0,
      )
    : Object.values(member.contributions).filter(Boolean).length * 1000;

  // Has the member made their first payment? Same dual-source-of-truth
  // pattern: prefer the rich Contributions table when available, fall
  // back to the 12-month boolean projection. Drives the SetUpPaymentsCard
  // → PaymentCard transition — the setup card retires the moment any
  // contribution lands (Paystack debit, manual EFT reconciled by admin,
  // anything counted).
  const hasFirstContribution = member.contributionRows
    ? member.contributionRows.some((row) => row.status === "Paid")
    : Object.values(member.contributions).some(Boolean);

  // Show the post-onboarding payment-setup ceremony only when the
  // member has actually been verified AND hasn't paid yet. Before KYC
  // verification, asking for card details is premature — the flow
  // gates payment behind admin approval per the May 2026 onboarding
  // redesign.
  const needsPaymentSetup =
    member.kycStatus === "Complete" && !hasFirstContribution;
  const memberPlan = member.plan ?? "standard";

  // Apple's iOS easing curve. Adopted across every motion entry on
  // the dashboard so the page reveal feels like a single coherent
  // animation rather than a stack of slightly-different fades.
  const iosEase = [0.32, 0.72, 0, 1] as const;

  return (
    <div className="space-y-8">
      {/* Welcome header — refined typography with tighter tracking
          and subtler member chip. Apple uses semibold for most
          display text; reserving font-extrabold for the rare
          numeric showcase. */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: iosEase }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35 mb-1.5">
            Member Portal
          </p>
          <h1 className="text-[28px] md:text-[34px] font-semibold tracking-tight text-white leading-[1.1]">
            Welcome back, {firstName}
          </h1>
        </div>
        <span className="inline-flex items-center self-start rounded-full bg-[#B8FF00]/[0.12] border border-[#B8FF00]/20 px-3 py-1.5 text-[11px] font-semibold text-[#B8FF00] tracking-tight">
          Member {formatMemberNumber(member.memberNumber)}
        </span>
      </motion.div>

      {/* Payment-success banner — only renders when the member has just
          bounced back from Paystack with `?payment=success` set. Server
          already kicked off a verify; this is the celebratory surface
          + dismissible. The URL gets cleaned up on mount, so a refresh
          drops this naturally. */}
      <AnimatePresence>
        {showSuccessBanner && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.4, ease: iosEase }}
            className="relative rounded-[20px] border border-[#B8FF00]/25 bg-gradient-to-br from-[#B8FF00]/[0.08] to-[#46CDCF]/[0.04] p-5 pr-12"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#B8FF00]/15 text-[#B8FF00]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold tracking-tight text-white">
                  Payment received — welcome aboard
                </p>
                <p className="mt-1 text-[12.5px] text-white/65 leading-relaxed">
                  {beforeLaunch
                    ? "Your contribution has cleared and your monthly debit order is now set up. Collections officially start 1 June 2026 — your payment has been credited to June 2026 so your record stays clean."
                    : "Your contribution has cleared and your monthly debit order is now active. Your dashboard will refresh within a moment to reflect this payment."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSuccessBanner(false)}
              className="absolute top-3 right-3 text-white/35 hover:text-white/80 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Account-setup completeness meter — three checks (KYC verified,
          beneficiary on file, first contribution). Hides itself once a
          member is fully set up. Each pending chip is an anchor link to
          the matching card lower on the page. */}
      <CompletenessMeter member={member} />

      {/* Admin banner — only visible to members whose email is in
          LEHUMO_ADMIN_EMAILS. Refined to match the new card system:
          larger radius, layered shadow, soft gradient surface, and
          the subtle hover lift that signals tappability. */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: iosEase, delay: 0.05 }}
        >
          <Link
            href="/lehumo/portal/admin"
            className="group flex items-center justify-between gap-4 rounded-[24px] border border-[#B8FF00]/25 bg-gradient-to-br from-[#B8FF00]/[0.10] via-[#46CDCF]/[0.04] to-transparent p-5 hover:border-[#B8FF00]/45 hover:-translate-y-[1px] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{
              boxShadow:
                "inset 0 1px 0 0 rgba(255, 255, 255, 0.05), " +
                "0 1px 2px 0 rgba(0, 0, 0, 0.2), " +
                "0 8px 32px -8px rgba(184, 255, 0, 0.12)",
            }}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#B8FF00]/[0.20] to-[#B8FF00]/[0.08] border border-[#B8FF00]/20 text-[#B8FF00]">
                <Shield className="h-[18px] w-[18px]" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-white tracking-tight">
                  Admin Panel
                </p>
                <p className="text-[12px] text-white/50 mt-0.5">
                  Manage members, contributions, and KYC status
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#B8FF00] group-hover:translate-x-0.5 transition-transform duration-300">
              Open
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        </motion.div>
      )}

      {/* Set-up-payments card — first-payment ceremony for verified
          members. Shown ABOVE the regular dashboard grid because it's
          the highest-priority action a freshly-onboarded member has,
          and it has to compete with nothing else for attention. Once
          the first contribution lands, this card retires and the
          ContributionReminderCard + PaymentCard take over below. */}
      {needsPaymentSetup && (
        <SetUpPaymentsCard
          plan={memberPlan}
          memberId={member.id}
          email={member.email}
          fullName={member.fullName}
          memberNumber={member.memberNumber}
        />
      )}

      {/* Current-month contribution reminder. Sits high so the most
          common monthly action is one tap away. Renders nothing when
          the member has paid all 12 months (PaymentCard already shows
          the celebration state in that case) — and renders a quiet
          confirmation chip when this month is already paid.
          Also suppressed during the SetUpPaymentsCard phase so we
          don't give a member two competing "pay" prompts pre-first-
          contribution. */}
      {!needsPaymentSetup && (
        <ContributionReminderCard
          contributions={member.contributions}
          contributionRows={member.contributionRows}
          currentMonth={currentMonth}
          currentPeriod={currentPeriod}
          daysLeftInMonth={daysLeftInMonth}
          beforeLaunch={beforeLaunch}
        />
      )}

      {/* Community pool overview */}
      {communityStats && (
        <CommunityPoolCard stats={communityStats} myContributed={myContributed} />
      )}

      {/* Quarterly General Meeting — community-cadence touchpoint. Sits
          between the pool overview (community money state) and the
          personal dashboard grid (member's own account) so the flow
          reads: "where the group's money is" → "when the group meets" →
          "where my account stands". Both calendar exports use an RRULE
          covering the entire QGM series so members add once and stay
          tracked for every quarter. */}
      <div id="qgm" className="scroll-mt-24">
        <QGMSummaryCard />
      </div>

      {/* Dashboard grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: iosEase }}
        >
          <MemberProfileCard member={member} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: iosEase }}
        >
          <ContributionGrid
            contributions={member.contributions}
            contributionRows={member.contributionRows}
            currentPeriod={currentPeriod}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: iosEase }}
        >
          <KycStatusTracker status={member.kycStatus} />
        </motion.div>

        {/* Per-month PaymentCard — suppressed during the first-payment
            setup phase so members see the SetUpPaymentsCard at the top
            without a second pay-now affordance below. Once the first
            contribution lands, this card returns and handles every
            subsequent month's status in its rich 60-period view. */}
        {!needsPaymentSetup && (
          <motion.div
            id="payment"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease: iosEase }}
            className="scroll-mt-24"
          >
            <PaymentCard
              contributions={member.contributions}
              contributionRows={member.contributionRows}
              currentPeriod={currentPeriod}
              email={member.email}
              memberId={member.id}
              beforeLaunch={beforeLaunch}
            />
          </motion.div>
        )}
      </div>

      {/* Plan management — only shown post-first-payment, since pre-
          payment the SetUpPaymentsCard above already owns the plan
          choice. Once a member is past their first contribution,
          this card becomes the persistent surface for switching
          between Standard (auto-debit) and Basic (manual EFT) — so
          they can pause their card debit any time without emailing
          admin. Sits directly above BankDepositCard because the two
          flow as a pair: pick how you'd like to pay, then (if Basic)
          here are the bank details. */}
      {!needsPaymentSetup && hasFirstContribution && (
        <PlanManagementCard member={member} />
      )}

      {/* Bank deposit / EFT details — visible to every member. Basic
          plan members need this as their primary payment route; Standard
          / VIP members fall back to it when their card has issues or
          they prefer manual control. The member's personalised
          reference (Leh## I.Surname) is generated client-side from
          their profile so admin recon always matches a known member. */}
      <BankDepositCard member={member} />

      {/* Emergency Access — surfaces the member's 20% self-loan position.
          Adapts to three states (locked / available / active-loan). For
          members <6 months in it serves as an aspirational signal of the
          safety net coming; for eligible members it's an actionable
          request CTA; for active borrowers it's the outstanding-balance
          ledger. Sits between the immediate-action grid and the KYC /
          beneficiary maintenance cards. */}
      <motion.div
        id="emergency-access"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45, ease: iosEase }}
        className="scroll-mt-24"
      >
        <EmergencyAccessCard member={member} />
      </motion.div>

      {/* KYC Documents — full-width below the grid. Stays mounted even
          after verification so members can re-find their submitted docs;
          the card itself swaps to a verified-state view internally. */}
      <motion.div
        id="kyc-docs"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5, ease: iosEase }}
        className="scroll-mt-24"
      >
        <KycDocumentsCard member={member} />
      </motion.div>

      {/* Next of Kin / Beneficiary — full-width row matching the KYC card.
          Placed below KYC because next-of-kin is the natural follow-up to
          identity verification: once the member is verified, the next thing
          we need is who to contact if anything happens to them. */}
      <motion.div
        id="beneficiary"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6, ease: iosEase }}
        className="scroll-mt-24"
      >
        <BeneficiaryCard member={member} />
      </motion.div>
    </div>
  );
}
