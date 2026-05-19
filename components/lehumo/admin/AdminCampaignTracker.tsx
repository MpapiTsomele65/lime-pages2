"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Mail,
  TrendingUp,
} from "lucide-react";

import { formatMemberNumber } from "@/lib/definitions";
import type { CampaignReport } from "@/lib/campaign-analytics";

interface AdminCampaignTrackerProps {
  reports: CampaignReport[];
}

/**
 * Admin Campaign Tracker — at-a-glance conversion for every cohort
 * email blast we've sent. Each campaign card shows:
 *
 *   - Headline: name + send date
 *   - Three count chips (converted / in-progress / not-yet) plus
 *     unreached if there were unconverted leads
 *   - A two-segment progress bar (lime = converted, teal = in-progress)
 *   - Expandable per-recipient breakdown so admin can see exactly
 *     who's moved and who hasn't
 *
 * Self-hides when there are no campaigns yet (empty COHORT_CAMPAIGNS).
 */
export function AdminCampaignTracker({ reports }: AdminCampaignTrackerProps) {
  if (reports.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
      aria-labelledby="campaign-tracker-title"
      className="rounded-[24px] border border-[#EDEDED] bg-gradient-to-b from-white to-[#FCFCFD] p-6 md:p-7"
      style={{
        boxShadow:
          "inset 0 1px 0 0 rgba(255, 255, 255, 0.6), " +
          "0 1px 2px 0 rgba(0, 0, 0, 0.04), " +
          "0 4px 16px -4px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div className="flex items-start gap-4 mb-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#46CDCF]/12 text-[#0E7C8A]">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9CA3AF] mb-1">
            Nudge campaigns
          </p>
          <h2
            id="campaign-tracker-title"
            className="text-[18px] font-semibold tracking-tight text-[#0B1933] leading-tight"
          >
            Cohort blast conversion
          </h2>
          <p className="mt-1 text-[12.5px] text-[#6B7280] leading-relaxed">
            Recipient lists snapshotted at send-time, compared against the
            live member roster. Updates automatically as members
            progress.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {reports.map((r) => (
          <CampaignCard key={r.campaign.id} report={r} />
        ))}
      </div>
    </motion.section>
  );
}

function CampaignCard({ report }: { report: CampaignReport }) {
  const [expanded, setExpanded] = useState(false);
  const { campaign, totalRecipients, counts, conversionPct, anyMovementPct } =
    report;

  // Progress bar widths — two-segment with lime for converted +
  // teal for in-progress. The remainder is the unfilled track.
  const convertedW =
    totalRecipients > 0 ? (counts.converted / totalRecipients) * 100 : 0;
  const inProgressW =
    totalRecipients > 0 ? (counts.in_progress / totalRecipients) * 100 : 0;

  const sentDate = new Date(campaign.sentAt + "T00:00:00+02:00");
  const sentLabel = sentDate.toLocaleDateString("en-ZA", {
    timeZone: "Africa/Johannesburg",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-4 md:p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-[#0B1933] leading-tight">
            {campaign.name}
          </p>
          <p className="text-[11.5px] text-[#9CA3AF] mt-0.5 flex items-center gap-1.5">
            <Mail className="h-3 w-3" />
            {totalRecipients} sent · {sentLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#6B7280] hover:text-[#0B1933] hover:border-[#0B1933]/20 transition-colors shrink-0"
        >
          {expanded ? "Hide" : "Details"}
          {expanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>
      </div>

      {/* Stat chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <Chip
          label="Converted"
          value={counts.converted}
          tone="lime"
          icon={<CheckCircle2 className="h-3 w-3" />}
        />
        <Chip
          label="In progress"
          value={counts.in_progress}
          tone="teal"
          icon={<Clock className="h-3 w-3" />}
        />
        <Chip label="Not yet" value={counts.not_yet} tone="neutral" />
        {counts.unreached > 0 && (
          <Chip label="Unreached" value={counts.unreached} tone="amber" />
        )}
      </div>

      {/* Two-segment progress bar */}
      <div className="relative h-2 rounded-full bg-[#F3F4F6] overflow-hidden mb-2">
        {/* Lime — converted */}
        <div
          className="absolute top-0 left-0 h-full bg-[#B8FF00] transition-all"
          style={{ width: `${convertedW}%` }}
        />
        {/* Teal — in-progress, stacked after lime */}
        <div
          className="absolute top-0 h-full bg-[#46CDCF] transition-all"
          style={{ left: `${convertedW}%`, width: `${inProgressW}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] text-[#9CA3AF]">
        <span>
          <span className="font-semibold text-[#0B1933]">{conversionPct}%</span>{" "}
          converted
        </span>
        <span>
          <span className="font-semibold text-[#0B1933]">{anyMovementPct}%</span>{" "}
          any movement
        </span>
      </div>

      {/* Description + expanded recipient list */}
      <p className="mt-3 text-[11.5px] text-[#6B7280] leading-relaxed">
        {campaign.description}
      </p>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF] mb-2">
            Per-recipient breakdown
          </p>
          <ul className="space-y-1.5">
            {report.recipients
              // Sort: converted first, then in-progress, then not yet, then unreached
              .slice()
              .sort((a, b) => {
                const order = {
                  converted: 0,
                  in_progress: 1,
                  not_yet: 2,
                  unreached: 3,
                };
                return order[a.engagement] - order[b.engagement];
              })
              .map((r) => (
                <li
                  key={r.email}
                  className="flex items-center justify-between gap-2 text-[12px]"
                >
                  <span className="min-w-0 flex-1 truncate">
                    {r.memberNumber !== undefined && (
                      <span className="font-mono text-[#9CA3AF] mr-2">
                        {formatMemberNumber(r.memberNumber)}
                      </span>
                    )}
                    <span className="text-[#0B0B0B]">
                      {r.fullName || r.email}
                    </span>
                    {r.fullName && (
                      <span className="text-[#9CA3AF] ml-1.5">· {r.email}</span>
                    )}
                  </span>
                  <EngagementBadge engagement={r.engagement} />
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Chip({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: "lime" | "teal" | "neutral" | "amber";
  icon?: React.ReactNode;
}) {
  const toneClasses = {
    lime: "bg-[#B8FF00]/12 border-[#B8FF00]/30 text-[#3F5A00]",
    teal: "bg-[#46CDCF]/12 border-[#46CDCF]/30 text-[#0E7C8A]",
    neutral: "bg-[#F8F9FA] border-[#E5E7EB] text-[#6B7280]",
    amber: "bg-[#F59E0B]/12 border-[#F59E0B]/30 text-[#B45309]",
  }[tone];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${toneClasses}`}
    >
      {icon}
      {label}: {value}
    </span>
  );
}

function EngagementBadge({
  engagement,
}: {
  engagement: "not_yet" | "in_progress" | "converted" | "unreached";
}) {
  const meta = {
    converted: {
      label: "Converted",
      classes: "bg-[#B8FF00]/15 border-[#B8FF00]/35 text-[#3F5A00]",
    },
    in_progress: {
      label: "In progress",
      classes: "bg-[#46CDCF]/15 border-[#46CDCF]/35 text-[#0E7C8A]",
    },
    not_yet: {
      label: "Not yet",
      classes: "bg-[#F8F9FA] border-[#E5E7EB] text-[#6B7280]",
    },
    unreached: {
      label: "Unreached",
      classes: "bg-[#F59E0B]/12 border-[#F59E0B]/35 text-[#B45309]",
    },
  }[engagement];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider shrink-0 ${meta.classes}`}
    >
      {meta.label}
    </span>
  );
}
