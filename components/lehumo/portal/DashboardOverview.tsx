"use client";

import { motion } from "framer-motion";
import type { LehumoMember } from "@/lib/definitions";
import { MemberProfileCard } from "./MemberProfileCard";
import { ContributionGrid } from "./ContributionGrid";
import { KycStatusTracker } from "./KycStatusTracker";
import { PaymentCard } from "./PaymentCard";

interface DashboardOverviewProps {
  member: LehumoMember;
}

export function DashboardOverview({ member }: DashboardOverviewProps) {
  const firstName = member.fullName.split(" ")[0];

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
          Member #{member.memberNumber}
        </span>
      </motion.div>

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
          <ContributionGrid contributions={member.contributions} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
        >
          <KycStatusTracker status={member.kycStatus} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
        >
          <PaymentCard
            contributions={member.contributions}
            email={member.email}
            memberId={member.id}
          />
        </motion.div>
      </div>
    </div>
  );
}
