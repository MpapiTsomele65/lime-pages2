"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Lock, Shield, X } from "lucide-react";

import type { CommunityPoolStats, LehumoMember } from "@/lib/definitions";
import { formatMemberNumber } from "@/lib/definitions";
import { derivePortalMemberView } from "@/lib/portal-member-view";
import { CompletenessMeter } from "../CompletenessMeter";
import { SetUpPaymentsCard } from "../SetUpPaymentsCard";
import { ContributionReminderCard } from "../ContributionReminderCard";
import { MilestonesCard } from "../MilestonesCard";
import { CommunityPoolCard } from "../CommunityPoolCard";
import { LeaderboardCard } from "../LeaderboardCard";

interface OverviewSectionProps {
  member: LehumoMember;
  communityStats: CommunityPoolStats | null;
  isAdmin?: boolean;
  currentMonth: string;
  currentPeriod: string;
  daysLeftInMonth: number;
  beforeLaunch: boolean;
  paymentSuccess?: boolean;
}

export function OverviewSection({
  member,
  communityStats,
  isAdmin = false,
  currentMonth,
  currentPeriod,
  daysLeftInMonth,
  beforeLaunch,
  paymentSuccess = false,
}: OverviewSectionProps) {
  const router = useRouter();
  const [showSuccessBanner, setShowSuccessBanner] = useState(paymentSuccess);

  const { firstName, myContributed, needsPaymentSetup, memberPlan } =
    derivePortalMemberView(member);

  // Clean the `?payment=success&reference=…` params off the URL after mount
  // so a refresh doesn't keep re-showing the banner. router.replace keeps
  // the React tree intact.
  useEffect(() => {
    if (paymentSuccess && typeof window !== "undefined") {
      router.replace("/lehumo/portal", { scroll: false });
    }
  }, [paymentSuccess, router]);

  const iosEase = [0.32, 0.72, 0, 1] as const;

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: iosEase }}
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55 mb-1.5">
            Member Portal
          </p>
          <h1 className="text-[28px] md:text-[34px] font-semibold tracking-tight text-white leading-[1.1]">
            Welcome back, {firstName}
          </h1>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2">
          <span className="inline-flex items-center rounded-full bg-[#B8FF00]/[0.12] border border-[#B8FF00]/20 px-3 py-1.5 text-[11px] font-semibold text-[#B8FF00] tracking-tight">
            Member {formatMemberNumber(member.memberNumber)}
          </span>
          {!member.passwordHash && (
            <Link
              href="/lehumo/portal/security"
              className="group inline-flex items-center gap-1.5 rounded-full border border-[#46CDCF]/30 bg-[#46CDCF]/[0.08] px-3 py-1.5 text-[11px] font-semibold text-[#46CDCF] hover:bg-[#46CDCF]/[0.15] hover:border-[#46CDCF]/50 transition-all tracking-tight"
              aria-label="Enhance your security — set up a portal password"
            >
              <Lock className="h-3 w-3" />
              Enhance your security
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      </motion.div>

      {/* Payment-success banner */}
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
              className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Account-setup completeness meter */}
      <CompletenessMeter member={member} />

      {/* Admin banner */}
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
                <p className="text-[12px] text-white/60 mt-0.5">
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

      {/* First-payment ceremony — highest-priority action for a freshly
          verified, not-yet-paid member. */}
      {needsPaymentSetup && (
        <SetUpPaymentsCard
          plan={memberPlan}
          memberId={member.id}
          email={member.email}
          fullName={member.fullName}
          memberNumber={member.memberNumber}
        />
      )}

      {/* This-month contribution reminder */}
      {!needsPaymentSetup && (
        <ContributionReminderCard
          contributions={member.contributions}
          contributionRows={member.contributionRows}
          currentMonth={currentMonth}
          currentPeriod={currentPeriod}
          daysLeftInMonth={daysLeftInMonth}
          beforeLaunch={beforeLaunch}
          member={member}
        />
      )}

      {/* Milestones & streak */}
      <MilestonesCard member={member} currentPeriod={currentPeriod} />

      {/* Community pulse — pool + leaderboard surfaced on the landing.
          Full breakdown, allocation & governance live under Lehumo
          community. */}
      {communityStats && (
        <CommunityPoolCard
          stats={communityStats}
          myContributed={myContributed}
          beforeLaunch={beforeLaunch}
        />
      )}
      {communityStats?.leaderboard && (
        <LeaderboardCard
          leaderboard={communityStats.leaderboard}
          viewerNumber={formatMemberNumber(member.memberNumber)}
          activeMembers={communityStats.activeMembers}
        />
      )}
    </div>
  );
}
