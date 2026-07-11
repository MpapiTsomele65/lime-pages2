"use client";

import { motion } from "framer-motion";

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
      <SectionHeader eyebrow="My money" title="Manage my contributions" />

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
