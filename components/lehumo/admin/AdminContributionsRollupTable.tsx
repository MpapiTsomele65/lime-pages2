"use client";

/**
 * AdminContributionsRollupTable — row-per-member rollup view.
 *
 * Replaces the long row-per-(member,period) AdminContributionsTable.
 * Renders ~30 rows fixed (one per onboarded member) regardless of
 * the active period filter. Aggregated Expected / Received / Balance
 * across whatever periods the filter spans, plus a derived rollup
 * status pill (Paid all / Partial / Pending / No data).
 *
 * Clicking a row expands a nested per-period strip beneath it,
 * windowed to LEHUMO_FIRST_DUE_PERIOD through current SAST + 6mo
 * (the buildExpandWindow() helper) so the irrelevant far-future
 * schedule rows stay hidden. The strip hosts the existing per-row
 * pencil-Edit, status select, and Reconcile button — full
 * reconciliation power preserved.
 *
 * Single-open accordion: clicking a new row's chevron auto-closes
 * the prior one, so the page never has more than one strip open at
 * a time.
 */

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronDown, Loader2 } from "lucide-react";

import {
  formatMemberNumber,
  type ContributionStatus,
  type LehumoContribution,
  type LehumoMember,
} from "@/lib/definitions";
import {
  adminBackfillMemberSchedule,
  adminReconcileContribution,
  adminUpdateContribution,
  adminUpdateContributionStatus,
  type AdminUpdateContributionInput,
} from "@/app/lehumo/portal/admin/actions";
import {
  ROLLUP_STATUS_PRIORITY,
  aggregateMemberContributions,
  type MemberContributionRollup,
  type RollupStatus,
} from "@/lib/contributions-aggregate";
import { buildExpandWindow } from "@/lib/contribution-periods";

import { EditContributionDialog } from "./EditContributionDialog";
import { MemberContributionDetailStrip } from "./MemberContributionDetailStrip";

interface AdminContributionsRollupTableProps {
  /** All contribution rows in scope, already filtered by the parent
   *  filter bar (period / status / source / member). */
  rows: LehumoContribution[];
  /** Full cohort for the EditContributionDialog combobox. */
  members: LehumoMember[];
  memberById: Map<string, LehumoMember>;
  /** Active period filter as a Set. `null` = "All periods" / no
   *  period constraint. Drives the aggregated totals. */
  activePeriodSet: Set<string> | null;
  onContributionUpdate: (updated: LehumoContribution) => void;
}

export function AdminContributionsRollupTable({
  rows,
  members,
  memberById,
  activePeriodSet,
  onContributionUpdate,
}: AdminContributionsRollupTableProps) {
  // Single-open accordion. Clicking the open row's chevron closes it;
  // clicking another row's chevron closes the prior + opens the new
  // one. Keeps the page from growing unbounded when an admin walks
  // down the list.
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(
    null,
  );

  // Per-row in-flight tracker, shared across all rows + the
  // expanded strip's rows. Identical pattern to the old table.
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Single EditContributionDialog instance hoisted to the table
  // root — opens for whichever row's pencil was clicked, whether
  // that row was in the visible aggregated layer or the expanded
  // strip below.
  const [editingRow, setEditingRow] = useState<LehumoContribution | null>(
    null,
  );

  // Schedule backfill in-flight tracker — keyed by memberId so the
  // spinner shows on the right row while other rows stay clickable.
  const [backfillingMemberId, setBackfillingMemberId] = useState<
    string | null
  >(null);
  const router = useRouter();

  // Compute the expand-window period set once — it's the same for
  // every row and doesn't depend on the active filter. We pre-resolve
  // it so each opened strip doesn't re-walk the period math.
  const expandWindow = useMemo(() => buildExpandWindow(), []);

  // Compute one rollup per member, applying the active period filter.
  // We iterate `members` (not `rows`) so members with zero rows still
  // show up as a "no-data" row — the full cohort stays visible no
  // matter the filter shape.
  const rollups = useMemo(() => {
    const out: Array<{
      member: LehumoMember;
      rollup: MemberContributionRollup;
    }> = [];
    for (const m of members) {
      out.push({
        member: m,
        rollup: aggregateMemberContributions(rows, m.id, activePeriodSet),
      });
    }
    return out;
  }, [members, rows, activePeriodSet]);

  // Sort by rollup status (paid first, then partial, then pending,
  // then no-data) and within each bucket alphabetical by name —
  // mirrors the old per-period table's "paid first" sort.
  const sorted = useMemo(() => {
    return [...rollups].sort((a, b) => {
      const aP = ROLLUP_STATUS_PRIORITY[a.rollup.rollupStatus];
      const bP = ROLLUP_STATUS_PRIORITY[b.rollup.rollupStatus];
      if (aP !== bP) return aP - bP;
      return a.member.fullName.localeCompare(b.member.fullName);
    });
  }, [rollups]);

  // ── Action handlers — same shape as the old table. They're
  //    threaded down to every row in the expanded strip too. ──

  const handleStatusChange = useCallback(
    async (row: LehumoContribution, next: ContributionStatus) => {
      if (next === row.status) return;
      setBusyId(row.id);
      setError(null);
      try {
        const res = await adminUpdateContributionStatus(row.id, next);
        if (!res.ok) {
          setError(res.error);
          return;
        }
        onContributionUpdate(res.contribution);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Status update failed");
      } finally {
        setBusyId(null);
      }
    },
    [onContributionUpdate],
  );

  const handleReconcile = useCallback(
    async (row: LehumoContribution) => {
      setBusyId(row.id);
      setError(null);
      try {
        const res = await adminReconcileContribution(row.id);
        if (!res.ok) {
          setError(res.error);
          return;
        }
        onContributionUpdate(res.contribution);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Reconcile failed");
      } finally {
        setBusyId(null);
      }
    },
    [onContributionUpdate],
  );

  const handleEditSubmit = useCallback(
    async (
      row: LehumoContribution,
      patch: AdminUpdateContributionInput,
    ): Promise<{ ok: true } | { ok: false; error: string }> => {
      const res = await adminUpdateContribution(row.id, patch);
      if (!res.ok) {
        return { ok: false, error: res.error };
      }
      onContributionUpdate(res.contribution);
      setEditingRow(null);
      return { ok: true };
    },
    [onContributionUpdate],
  );

  const handleOpenEdit = useCallback((row: LehumoContribution) => {
    setEditingRow(row);
  }, []);

  // Regenerate the missing schedule rows for a member. Idempotent on
  // the server (only inserts gaps, never overwrites existing rows),
  // so a stray double-click is safe. On success we router.refresh()
  // to repull the server-side snapshot — the new rows surface in
  // the rollup denominators + the expanded strip without a manual
  // reload.
  const handleBackfillSchedule = useCallback(
    async (memberId: string) => {
      setBackfillingMemberId(memberId);
      setError(null);
      try {
        const res = await adminBackfillMemberSchedule(memberId);
        if (!res.ok) {
          setError(res.error);
          return;
        }
        // Even when generated=0 (no gaps), refresh so the warning
        // chip clears in case the gap was repaired out-of-band.
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Schedule backfill failed",
        );
      } finally {
        setBackfillingMemberId(null);
      }
    },
    [router],
  );

  return (
    <section className="rounded-[24px] border border-[#EDEDED] bg-white overflow-hidden">
      {error && (
        <div className="border-b border-red-200 bg-red-50 px-5 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="grid grid-cols-[minmax(0,1.5fr)_140px_90px_120px_120px_120px_130px_44px] gap-3 px-5 py-3 text-[11px] uppercase tracking-wider text-[#6B7280] bg-[#F8F9FA] font-medium border-b border-[#EDEDED]">
        <div>Member</div>
        <div>Status</div>
        <div className="text-right">Paid</div>
        <div className="text-right">Expected</div>
        <div className="text-right">Received</div>
        <div className="text-right">Balance</div>
        <div>Last payment</div>
        <div className="text-center">Expand</div>
      </div>

      {/* Body */}
      {sorted.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-[#6B7280]">
          No members in the cohort yet.
        </div>
      ) : (
        sorted.map(({ member, rollup }) => {
          const isExpanded = expandedMemberId === member.id;
          // Rows to feed the expanded strip — re-aggregate per member
          // against the broader expand window (launch → current+6mo)
          // rather than the active filter so the strip surfaces
          // context the filter might be hiding (e.g. admin filtered
          // to "Pending" but wants to see what's already Paid too).
          const stripRollup = isExpanded
            ? aggregateMemberContributions(rows, member.id, expandWindow)
            : null;
          return (
            <div
              key={member.id}
              className="border-b border-[#EDEDED] last:border-b-0"
            >
              {/* Rollup row */}
              <div
                className={`grid grid-cols-[minmax(0,1.5fr)_140px_90px_120px_120px_120px_130px_44px] gap-3 px-5 py-3 items-center text-sm cursor-pointer transition-colors ${
                  isExpanded ? "bg-[#F8F9FA]" : "hover:bg-[#F8F9FA]/60"
                }`}
                onClick={() =>
                  setExpandedMemberId(isExpanded ? null : member.id)
                }
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setExpandedMemberId(isExpanded ? null : member.id);
                  }
                }}
              >
                {/* Member identity */}
                <div className="min-w-0">
                  <div className="font-medium text-[#0B0B0B] truncate">
                    {member.fullName}
                  </div>
                  <div className="text-xs text-[#6B7280]">
                    {formatMemberNumber(member.memberNumber)}
                  </div>
                </div>

                {/* Status rollup pill + missing-schedule fix button.
                    The button stops propagation so clicking it doesn't
                    also toggle the row's expand state. */}
                <div className="flex items-center gap-1.5">
                  <RollupStatusPill status={rollup.rollupStatus} />
                  {rollup.missingRowCount > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBackfillSchedule(member.id);
                      }}
                      disabled={backfillingMemberId === member.id}
                      className="inline-flex items-center gap-1 rounded-full border border-[#F59E0B]/40 bg-[#F59E0B]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#92400E] hover:bg-[#F59E0B]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title={`Schedule incomplete — ${rollup.missingRowCount} ${
                        rollup.missingRowCount === 1 ? "month" : "months"
                      } missing. Click to backfill from Jun 2026.`}
                      aria-label={`Regenerate missing schedule rows for ${member.fullName}`}
                    >
                      {backfillingMemberId === member.id ? (
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      ) : (
                        <AlertTriangle className="h-2.5 w-2.5" />
                      )}
                      <span>Fix {rollup.missingRowCount}</span>
                    </button>
                  )}
                </div>

                {/* Paid count — "2/4" against the filter's period
                    count, not the count of rows that happen to exist
                    in Airtable. Keeps the denominator consistent
                    across the cohort even when some members'
                    schedule rows are missing — those gaps are
                    surfaced via the warning chip on the status pill. */}
                <div className="text-right tabular-nums text-xs text-[#6B7280]">
                  {rollup.expectedPeriodCount === 0 ? (
                    "—"
                  ) : (
                    <span>
                      <span className="text-[#0B1933] font-semibold">
                        {rollup.paidCount}
                      </span>
                      <span className="text-[#9CA3AF]">
                        /{rollup.expectedPeriodCount}
                      </span>
                    </span>
                  )}
                </div>

                {/* Expected */}
                <div className="text-right tabular-nums text-[#6B7280]">
                  {rollup.expectedTotal > 0
                    ? `R${rollup.expectedTotal.toLocaleString("en-ZA")}`
                    : "—"}
                </div>

                {/* Received */}
                <div className="text-right tabular-nums font-semibold text-[#0B1933]">
                  {rollup.receivedTotal > 0
                    ? `R${rollup.receivedTotal.toLocaleString("en-ZA")}`
                    : <span className="text-[#9CA3AF] font-normal">—</span>}
                </div>

                {/* Balance — only render non-zero. A zero balance on
                    a fully paid row would otherwise read as "still
                    owes R0" which is noise. */}
                <div className="text-right tabular-nums">
                  {rollup.balance > 0 ? (
                    <span className="text-[#92400E] font-semibold">
                      R{rollup.balance.toLocaleString("en-ZA")}
                    </span>
                  ) : rollup.rollupStatus === "paid" ? (
                    <span className="text-[#0B1933] text-xs">Settled</span>
                  ) : (
                    <span className="text-[#9CA3AF]">—</span>
                  )}
                </div>

                {/* Last payment */}
                <div className="text-xs text-[#6B7280] tabular-nums truncate">
                  {rollup.lastPaymentDate
                    ? `${rollup.lastPaymentDate} · R${(rollup.lastPaymentAmount ?? 0).toLocaleString("en-ZA")}`
                    : <span className="text-[#9CA3AF]">—</span>}
                </div>

                {/* Expand chevron */}
                <div className="flex justify-center">
                  <div
                    className={`flex items-center justify-center h-7 w-7 rounded-md border border-[#E5E7EB] bg-white text-[#6B7280] transition-transform ${
                      isExpanded ? "rotate-180 bg-[#F8F9FA]" : ""
                    }`}
                    aria-hidden
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

              {/* Expanded detail strip — animated via AnimatePresence
                  inside the component. When stripRollup is null
                  (collapsed) the component returns null. */}
              <MemberContributionDetailStrip
                rows={stripRollup ? stripRollup.rows : null}
                member={member}
                busyId={busyId}
                onStatusChange={handleStatusChange}
                onReconcile={handleReconcile}
                onOpenEdit={handleOpenEdit}
              />
            </div>
          );
        })
      )}

      {/* Edit dialog — single instance, hoisted here so both the
          aggregated row's pencil (if we add one later) and the
          per-period rows inside the expanded strip share it. */}
      <EditContributionDialog
        contribution={editingRow}
        members={members}
        onSubmit={handleEditSubmit}
        onCancel={() => setEditingRow(null)}
      />
    </section>
  );
}

// ── Status pill ──────────────────────────────────────────────────

function RollupStatusPill({ status }: { status: RollupStatus }) {
  const { label, className } = ROLLUP_STATUS_DISPLAY[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${className}`}
    >
      {label}
    </span>
  );
}

const ROLLUP_STATUS_DISPLAY: Record<
  RollupStatus,
  { label: string; className: string }
> = {
  paid: {
    label: "Paid",
    className: "bg-[#B8FF00]/15 border-[#B8FF00]/40 text-[#0B1933]",
  },
  partial: {
    label: "Partial",
    className: "bg-[#FEF3C7] border-[#F59E0B]/40 text-[#92400E]",
  },
  pending: {
    label: "Pending",
    className: "bg-[#F8F9FA] border-[#E5E7EB] text-[#6B7280]",
  },
  "no-data": {
    label: "No data",
    className: "bg-white border-[#E5E7EB] text-[#9CA3AF]",
  },
};

