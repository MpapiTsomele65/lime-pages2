"use client";

import { motion } from "framer-motion";
import { Download } from "lucide-react";

import type { LehumoMember } from "@/lib/definitions";
import { derivePortalMemberView } from "@/lib/portal-member-view";
import { SectionHeader } from "./SectionHeader";
import { PaymentCard } from "../PaymentCard";
import { ContributionGrid } from "../ContributionGrid";
import { StakeProjectionCard } from "../StakeProjectionCard";
import { PlanManagementCard } from "../PlanManagementCard";
import { BankDepositCard } from "../BankDepositCard";

interface ContributionsSectionProps {
  member: LehumoMember;
  currentPeriod: string;
  beforeLaunch: boolean;
}

export function ContributionsSection({
  member,
  currentPeriod,
  beforeLaunch,
}: ContributionsSectionProps) {
  const { needsPaymentSetup, hasFirstContribution } =
    derivePortalMemberView(member);
  const iosEase = [0.32, 0.72, 0, 1] as const;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHeader eyebrow="My money" title="Manage my contributions" />
        {/* Self-audit: the member's full contribution history as CSV.
            Plain <a> so the browser handles the download (session cookie
            rides along to the auth-gated route). */}
        <a
          href="/api/lehumo/portal/member/statement"
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-3.5 py-1.5 text-[11.5px] font-medium text-white/70 hover:text-white hover:border-white/15 hover:bg-white/[0.05] transition-all duration-200"
        >
          <Download className="h-3.5 w-3.5" />
          Download statement (CSV)
        </a>
      </div>

      {/* Per-month PaymentCard — suppressed during the first-payment setup
          phase (that ceremony lives on Overview). */}
      {!needsPaymentSetup && (
        <motion.div
          id="payment"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: iosEase }}
          className="scroll-mt-24"
        >
          <PaymentCard
            contributions={member.contributions}
            contributionRows={member.contributionRows}
            currentPeriod={currentPeriod}
            email={member.email}
            memberId={member.id}
            memberNumber={member.memberNumber}
            fullName={member.fullName}
            beforeLaunch={beforeLaunch}
          />
        </motion.div>
      )}

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

      {/* Your stake & future value — projection from the member's pace. */}
      <div id="stake" className="scroll-mt-24">
        <StakeProjectionCard member={member} currentPeriod={currentPeriod} />
      </div>

      {/* Plan management — only once past the first payment. */}
      {hasFirstContribution && <PlanManagementCard member={member} />}

      {/* Bank deposit / EFT details. */}
      <BankDepositCard member={member} />
    </div>
  );
}
