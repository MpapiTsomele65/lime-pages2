"use client";

/**
 * ContributionDetailRow — one rendered line of contribution detail.
 *
 * Shared by the expanded per-period strip inside the rollup table
 * AND the orphan banner above the table. Owns no state — the parent
 * passes `isBusy`, status-change handler, reconcile handler, and
 * open-edit handler, and the parent renders the EditContributionDialog
 * exactly once for the whole surface.
 *
 * Render shape is a flex/grid div, not a `<tr>`, so it doesn't need
 * a `<table>` ancestor. That's deliberate — the expanded strip is a
 * `<motion.div>` slot under a parent `<tr>`, and the orphan banner
 * is a freestanding card. Forcing a `<tr>` here would force both
 * callers to wrap in tables.
 */

import { Check, Loader2, Pencil, ShieldCheck } from "lucide-react";

import {
  CONTRIBUTION_STATUS,
  formatMemberNumber,
  type ContributionStatus,
  type LehumoContribution,
  type LehumoMember,
} from "@/lib/definitions";

interface ContributionDetailRowProps {
  row: LehumoContribution;
  /** null when the row's memberId points at no live member (orphan).
   *  The component still renders — it shows "Unknown member" for the
   *  identity column so the admin can spot + reassign. */
  member: LehumoMember | null;
  /** Per-row in-flight indicator from the parent's busyId map. */
  isBusy: boolean;
  onStatusChange: (row: LehumoContribution, next: ContributionStatus) => void;
  onReconcile: (row: LehumoContribution) => void;
  onOpenEdit: (row: LehumoContribution) => void;
  /** When true, the Member identity column renders. Use in the orphan
   *  banner. The expanded strip hides this column because the rollup
   *  row above already identifies the member. */
  showMemberCol?: boolean;
}

const STATUS_VALUES = Object.values(
  CONTRIBUTION_STATUS,
) as ContributionStatus[];

export function ContributionDetailRow({
  row,
  member,
  isBusy,
  onStatusChange,
  onReconcile,
  onOpenEdit,
  showMemberCol = false,
}: ContributionDetailRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 text-sm border-t border-[#E5E7EB] hover:bg-[#F8F9FA]/60">
      {/* Member identity — only in orphan banner. The expanded strip
          already has the member name on the parent row, so this is
          redundant in that context. */}
      {showMemberCol && (
        <div className="w-[180px] shrink-0">
          <div className="font-medium text-[#0B0B0B]">
            {member?.fullName || (
              <span className="text-[#9CA3AF]">—</span>
            )}
          </div>
          <div className="text-xs text-[#6B7280]">
            {member
              ? formatMemberNumber(member.memberNumber)
              : "Unknown member"}
          </div>
        </div>
      )}

      {/* Period — fixed width for alignment with the parent table */}
      <div className="w-[90px] shrink-0 text-[#0B1933] font-mono tabular-nums text-xs">
        {formatPeriod(row.period)}
      </div>

      {/* Status select */}
      <div className="w-[120px] shrink-0">
        <div className="inline-flex items-center gap-1.5">
          <select
            value={row.status}
            disabled={isBusy}
            onChange={(e) =>
              onStatusChange(row, e.target.value as ContributionStatus)
            }
            className={`rounded-md border px-2 py-1 text-[11px] font-semibold appearance-none cursor-pointer outline-none focus:ring-1 focus:ring-[#0B1933]/15 disabled:opacity-50 ${statusClass(row.status)}`}
          >
            {STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {isBusy && (
            <Loader2 className="h-3 w-3 animate-spin text-[#6B7280]" />
          )}
        </div>
      </div>

      {/* Source */}
      <div className="w-[100px] shrink-0 text-xs text-[#0B1933]">
        {row.source ?? <span className="text-[#9CA3AF]">—</span>}
      </div>

      {/* Expected */}
      <div className="w-[90px] shrink-0 text-right tabular-nums text-xs text-[#6B7280]">
        {row.amountExpected != null
          ? `R${row.amountExpected.toLocaleString("en-ZA")}`
          : "—"}
      </div>

      {/* Received */}
      <div className="w-[90px] shrink-0 text-right tabular-nums text-xs font-semibold text-[#0B1933]">
        {row.amountReceived != null ? (
          `R${row.amountReceived.toLocaleString("en-ZA")}`
        ) : (
          <span className="text-[#9CA3AF] font-normal">—</span>
        )}
      </div>

      {/* Reference — flex-grow so long Paystack refs have room */}
      <div className="flex-1 min-w-0 text-xs text-[#0B1933] font-mono truncate">
        {row.paymentReference || (
          <span className="text-[#9CA3AF]">—</span>
        )}
      </div>

      {/* Date */}
      <div className="w-[95px] shrink-0 text-xs text-[#6B7280] tabular-nums">
        {row.paymentDate ?? "—"}
      </div>

      {/* Reconciled — pill when reconciled, Mark button when paid+unreconciled */}
      <div className="w-[130px] shrink-0">
        {row.reconciled ? (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-[#B8FF00]/15 border border-[#B8FF00]/40 px-2 py-0.5 text-[10.5px] font-semibold text-[#0B1933]"
            title={
              row.reconciledBy ? `by ${row.reconciledBy}` : undefined
            }
          >
            <Check className="h-3 w-3" />
            Reconciled
          </span>
        ) : row.status === CONTRIBUTION_STATUS.paid ? (
          <button
            type="button"
            onClick={() => onReconcile(row)}
            disabled={isBusy}
            className="inline-flex items-center gap-1 rounded-full border border-[#0B1933]/20 bg-white px-2 py-0.5 text-[10.5px] font-semibold text-[#0B1933] hover:border-[#0B1933]/40 hover:bg-[#F8F9FA] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isBusy ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <ShieldCheck className="h-3 w-3" />
            )}
            Mark reconciled
          </button>
        ) : (
          <span className="text-xs text-[#9CA3AF]">—</span>
        )}
      </div>

      {/* Edit pencil */}
      <div className="w-[36px] shrink-0 flex justify-center">
        <button
          type="button"
          onClick={() => onOpenEdit(row)}
          disabled={isBusy}
          className="inline-flex items-center justify-center rounded-md border border-[#E5E7EB] bg-white h-7 w-7 text-[#6B7280] hover:border-[#0B1933]/30 hover:text-[#0B1933] hover:bg-[#F8F9FA] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Edit contribution"
          aria-label="Edit contribution"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────

function formatPeriod(period: string): string {
  const [year, m] = period.split("-");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const monthIdx = Number(m) - 1;
  return `${months[monthIdx] ?? m} ${year}`;
}

function statusClass(status: ContributionStatus): string {
  switch (status) {
    case CONTRIBUTION_STATUS.paid:
      return "bg-[#B8FF00]/15 border-[#B8FF00]/40 text-[#0B1933]";
    case CONTRIBUTION_STATUS.pending:
      return "bg-[#F8F9FA] border-[#E5E7EB] text-[#6B7280]";
    case CONTRIBUTION_STATUS.failed:
      return "bg-red-50 border-red-200 text-red-800";
    case CONTRIBUTION_STATUS.refunded:
      return "bg-[#FEF3C7] border-[#F59E0B]/40 text-[#92400E]";
    case CONTRIBUTION_STATUS.waived:
      return "bg-[#E0E7FF] border-[#6366F1]/30 text-[#3730A3]";
    default:
      return "bg-[#F8F9FA] border-[#E5E7EB] text-[#6B7280]";
  }
}
