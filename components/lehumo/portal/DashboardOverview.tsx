"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Shield } from "lucide-react";
import type { CommunityPoolStats, LehumoMember } from "@/lib/definitions";
import { formatMemberNumber } from "@/lib/definitions";
import { MemberProfileCard } from "./MemberProfileCard";
import { ContributionGrid } from "./ContributionGrid";
import { ContributionReminderCard } from "./ContributionReminderCard";
import { KycStatusTracker } from "./KycStatusTracker";
import { KycDocumentsCard } from "./KycDocumentsCard";
import { BeneficiaryCard } from "./BeneficiaryCard";
import { PaymentCard } from "./PaymentCard";
import { CommunityPoolCard } from "./CommunityPoolCard";
import { CompletenessMeter } from "./CompletenessMeter";
import { EmergencyAccessCard } from "./EmergencyAccessCard";

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
}

export function DashboardOverview({
  member,
  communityStats,
  isAdmin = false,
  currentMonth,
  currentPeriod,
  daysLeftInMonth,
  beforeLaunch,
}: DashboardOverviewProps) {
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

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Welcome back, {firstName}
        </h1>
        <span className="inline-flex items-center self-start rounded-full bg-[#B8FF00]/10 px-3 py-1 text-xs font-medium text-[#B8FF00]">
          Member {formatMemberNumber(member.memberNumber)}
        </span>
      </motion.div>

      {/* Account-setup completeness meter — three checks (KYC verified,
          beneficiary on file, first contribution). Hides itself once a
          member is fully set up. Each pending chip is an anchor link to
          the matching card lower on the page. */}
      <CompletenessMeter member={member} />

      {/* Admin banner — only visible to members whose email is in LEHUMO_ADMIN_EMAILS */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Link
            href="/lehumo/portal/admin"
            className="group flex items-center justify-between gap-4 rounded-2xl border border-[#B8FF00]/30 bg-gradient-to-r from-[#B8FF00]/[0.08] to-[#46CDCF]/[0.04] p-5 hover:border-[#B8FF00]/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#B8FF00]/15 text-[#B8FF00]">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Admin Panel
                </p>
                <p className="text-xs text-white/50">
                  Manage members, contributions, and KYC status
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#B8FF00] group-hover:translate-x-0.5 transition-transform">
              Open
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        </motion.div>
      )}

      {/* Current-month contribution reminder. Sits high so the most
          common monthly action is one tap away. Renders nothing when
          the member has paid all 12 months (PaymentCard already shows
          the celebration state in that case) — and renders a quiet
          confirmation chip when this month is already paid. */}
      <ContributionReminderCard
        contributions={member.contributions}
        contributionRows={member.contributionRows}
        currentMonth={currentMonth}
        currentPeriod={currentPeriod}
        daysLeftInMonth={daysLeftInMonth}
        beforeLaunch={beforeLaunch}
      />

      {/* Community pool overview */}
      {communityStats && (
        <CommunityPoolCard stats={communityStats} myContributed={myContributed} />
      )}

      {/* Dashboard grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        >
          <MemberProfileCard member={member} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
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
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
        >
          <KycStatusTracker status={member.kycStatus} />
        </motion.div>

        <motion.div
          id="payment"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
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
      </div>

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
        transition={{ duration: 0.5, delay: 0.45, ease: "easeOut" }}
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
        transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
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
        transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
        className="scroll-mt-24"
      >
        <BeneficiaryCard member={member} />
      </motion.div>
    </div>
  );
}
