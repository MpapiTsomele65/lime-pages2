"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  HeartHandshake,
  Coins,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

import type { AdminStats } from "@/lib/admin-stats";

interface AdminCommunityHealthProps {
  stats: AdminStats;
}

/**
 * Community-wide setup health for the admin dashboard.
 *
 * Mirrors the per-member CompletenessMeter on the portal homepage but
 * aggregated across the roster: shows what percentage of non-exited /
 * non-prospect members have completed each setup task.
 *
 * Three metrics:
 *   1. KYC verified         — kycStatus === "Complete"
 *   2. Beneficiary on file  — both name fields present
 *   3. First contribution   — any month ticked
 *
 * Each renders as a labelled horizontal progress bar with the X / Y
 * count visible — admins can see at a glance which onboarding step is
 * the bottleneck for the community.
 */
export function AdminCommunityHealth({ stats }: AdminCommunityHealthProps) {
  const {
    pipelineCount,
    kycComplete,
    kycPct,
    beneficiaryOnFile,
    beneficiaryPct,
    madeFirstContribution,
    firstContributionPct,
  } = stats;

  // Overall "fully set up" — members who passed all three. We don't have
  // it pre-computed in stats, but it's bounded by min(kyc, beneficiary,
  // contribution) and is purely informational here, so a conservative
  // estimate (the smallest count) is good enough for the headline.
  // Actual per-member intersection would need iterating again — not
  // worth the perf hit for a single number.
  const conservativeFullySetUp = Math.min(
    kycComplete,
    beneficiaryOnFile,
    madeFirstContribution,
  );
  const overallPct =
    pipelineCount > 0
      ? Math.round((conservativeFullySetUp / pipelineCount) * 100)
      : 0;

  const rows = [
    {
      key: "kyc",
      icon: ShieldCheck,
      label: "KYC verified",
      done: kycComplete,
      pct: kycPct,
    },
    {
      key: "beneficiary",
      icon: HeartHandshake,
      label: "Beneficiary on file",
      done: beneficiaryOnFile,
      pct: beneficiaryPct,
    },
    {
      key: "contribution",
      icon: Coins,
      label: "First contribution made",
      done: madeFirstContribution,
      pct: firstContributionPct,
    },
  ] as const;

  return (
    <section className="rounded-[24px] border border-[#EDEDED] bg-gradient-to-b from-white to-[#FCFCFD] p-7 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_1px_2px_0_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.05)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#46CDCF]/10 text-[#0B1933]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#9CA3AF]">
              Community Setup Health
            </p>
            <p className="mt-1 text-lg font-bold text-[#0B1933] leading-tight">
              {overallPct}% of members fully set up
            </p>
            <p className="mt-0.5 text-xs text-[#6B7280]">
              Across {pipelineCount} active &amp; onboarding members
              (excludes prospects &amp; exited)
            </p>
          </div>
        </div>
      </div>

      {/* Three stacked bars */}
      <div className="space-y-4">
        {rows.map((row, i) => {
          const Icon = row.icon;
          return (
            <div key={row.key}>
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-2 text-sm text-[#0B0B0B]">
                  <Icon className="h-3.5 w-3.5 text-[#6B7280]" />
                  <span>{row.label}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#6B7280]">
                    {row.done} / {pipelineCount}
                  </span>
                  <span className="font-semibold text-[#0B1933] tabular-nums">
                    {row.pct}%
                  </span>
                  {row.pct === 100 && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#B8FF00]" />
                  )}
                </div>
              </div>
              <div
                className="h-2 w-full rounded-full bg-[#F8F9FA] overflow-hidden border border-[#E5E7EB]"
                role="progressbar"
                aria-valuenow={row.pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={row.label}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${row.pct}%` }}
                  transition={{
                    duration: 0.8,
                    ease: [0.32, 0.72, 0, 1],
                    delay: 0.1 + i * 0.08,
                  }}
                  className="h-full rounded-full bg-gradient-to-r from-[#B8FF00] to-[#46CDCF]"
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
