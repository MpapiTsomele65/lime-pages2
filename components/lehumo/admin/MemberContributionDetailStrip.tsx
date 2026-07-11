"use client";

/**
 * MemberContributionDetailStrip — the expanded per-period rows
 * that appear beneath a rollup row when the admin clicks expand.
 *
 * Receives pre-filtered rows (member ∩ expand window) and a member
 * record, plus the parent's busyId + per-row action handlers. The
 * parent (AdminContributionsRollupTable) hosts the EditContributionDialog
 * once at root and forwards open-edit calls up.
 *
 * Animated with the same height keyframe shape as CollapsibleBlock —
 * AnimatePresence + motion.div, initial/animate/exit on height +
 * opacity. The keyframe is duplicated here rather than imported
 * because CollapsibleBlock is card-shaped (no per-row context) and
 * this strip is row-shaped.
 */

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

import {
  formatMemberNumber,
  type ContributionStatus,
  type LehumoContribution,
  type LehumoMember,
} from "@/lib/definitions";
import { ContributionDetailRow } from "./ContributionDetailRow";

interface MemberContributionDetailStripProps {
  /** Set this to null to collapse (no animation render at all). The
   *  parent controls open/closed via `expandedMemberId === row.memberId`. */
  rows: LehumoContribution[] | null;
  member: LehumoMember;
  busyId: string | null;
  onStatusChange: (row: LehumoContribution, next: ContributionStatus) => void;
  onReconcile: (row: LehumoContribution) => void;
  onOpenEdit: (row: LehumoContribution) => void;
  onOpenReallocate: (row: LehumoContribution) => void;
}

export function MemberContributionDetailStrip({
  rows,
  member,
  busyId,
  onStatusChange,
  onReconcile,
  onOpenEdit,
  onOpenReallocate,
}: MemberContributionDetailStripProps) {
  return (
    <AnimatePresence initial={false}>
      {rows !== null && (
        <motion.div
          key="strip"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="overflow-hidden bg-[#FAFBFC]"
        >
          <DetailStripBody
            rows={rows}
            member={member}
            busyId={busyId}
            onStatusChange={onStatusChange}
            onReconcile={onReconcile}
            onOpenEdit={onOpenEdit}
            onOpenReallocate={onOpenReallocate}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DetailStripBody({
  rows,
  member,
  busyId,
  onStatusChange,
  onReconcile,
  onOpenEdit,
  onOpenReallocate,
}: {
  rows: LehumoContribution[];
  member: LehumoMember;
  busyId: string | null;
  onStatusChange: (row: LehumoContribution, next: ContributionStatus) => void;
  onReconcile: (row: LehumoContribution) => void;
  onOpenEdit: (row: LehumoContribution) => void;
  onOpenReallocate: (row: LehumoContribution) => void;
}) {
  // Sort chronologically — oldest period first. Admins reading a
  // member's history naturally scan from launch (June 2026) forward.
  const sorted = useMemo(
    () => [...rows].sort((a, b) => a.period.localeCompare(b.period)),
    [rows],
  );

  if (sorted.length === 0) {
    return (
      <div className="px-6 py-6 text-center text-sm text-[#6B7280] border-l-2 border-[#B8FF00]/40 ml-4">
        No contribution rows for {member.fullName} in the expand window
        (launch through 6 months forward).
      </div>
    );
  }

  return (
    <div className="border-l-2 border-[#B8FF00]/40 ml-4 my-2">
      {/* Subhead — names the context so the admin knows what window
          they're looking at. */}
      <div className="px-4 py-2 flex items-center justify-between bg-[#F0F1F4]">
        <div className="text-[11px] uppercase tracking-wider text-[#6B7280] font-semibold">
          {member.fullName} · {formatMemberNumber(member.memberNumber)} ·
          per-period detail
        </div>
        <div className="text-[11px] text-[#6B7280]">
          {sorted.length} {sorted.length === 1 ? "row" : "rows"}
        </div>
      </div>

      {/* Detail rows — no member col since the strip is rooted under
          the member's own rollup row. */}
      <div>
        {sorted.map((row) => (
          <ContributionDetailRow
            key={row.id}
            row={row}
            member={member}
            isBusy={busyId === row.id}
            onStatusChange={onStatusChange}
            onReconcile={onReconcile}
            onOpenEdit={onOpenEdit}
            onOpenReallocate={onOpenReallocate}
            showMemberCol={false}
          />
        ))}
      </div>
    </div>
  );
}
