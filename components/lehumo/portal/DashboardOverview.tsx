"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Shield } from "lucide-react";
import type { CommunityPoolStats, LehumoMember } from "@/lib/definitions";
import { formatMemberNumber } from "@/lib/definitions";
import { MemberProfileCard } from "./MemberProfileCard";
import { ContributionGrid } from "./ContributionGrid";
import { KycStatusTracker } from "./KycStatusTracker";
import { PaymentCard } from "./PaymentCard";
import { CommunityPoolCard } from "./CommunityPoolCard";

interface DashboardOverviewProps {
  member: LehumoMember;
  communityStats: CommunityPoolStats | null;
  isAdmin?: boolean;
}

export function DashboardOverview({
  member,
  communityStats,
  isAdmin = false,
}: DashboardOverviewProps) {
  const firstName = member.fullName.split(" ")[0];

  const myContributed =
    Object.values(member.contributions).filter(Boolean).length * 1000;

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
