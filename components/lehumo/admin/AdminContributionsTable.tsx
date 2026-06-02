"use client";

/**
 * AdminContributionsTable — cross-member contributions view.
 *
 * One row per contribution period record across every member, with
 * inline status editing + reconciliation button. Filter chips above
 * the table (period / status / source / member) are owned by the
 * parent client wrapper (AdminContributionsClient) and the parent
 * passes pre-filtered rows in via `rows`.
 *
 * Mirrors the AdminMemberTable visual language (sticky header,
 * hairline rows, lime active state on status pills) so the two
 * tables read as the same family on adjacent admin pages.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, Loader2, ShieldCheck } from "lucide-react";

import {
  CONTRIBUTION_STATUS,
  CONTRIBUTION_SOURCE,
  formatMemberNumber,
  type ContributionStatus,
  type LehumoContribution,
  type LehumoMember,
} from "@/lib/definitions";
import {
  adminReconcileContribution,
  adminUpdateContributionStatus,
} from "@/app/lehumo/portal/admin/actions";

interface AdminContributionsTableProps {
  rows: LehumoContribution[];
  /** Members keyed by Airtable record ID so each row can resolve
   *  its member's display name + number without a per-row lookup. */
  memberById: Map<string, LehumoMember>;
  onContributionUpdate: (updated: LehumoContribution) => void;
}

const STATUS_VALUES = Object.values(CONTRIBUTION_STATUS) as ContributionStatus[];

export function AdminContributionsTable({
  rows,
  memberById,
  onContributionUpdate,
}: AdminContributionsTableProps) {
  // Per-row in-flight tracker so the inline select + button can
  // disable themselves during the round-trip without holding a
  // global "busy" state that would freeze every other row too.
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Newest unpaid first by default — the reconciliation workflow
  // pulls toward Pending/Failed rows. Within same status, ordered
  // by period descending so this month's work surfaces first.
  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      // Pending / Failed first, then everything else
      const aUrgent =
        a.status === CONTRIBUTION_STATUS.pending ||
        a.status === CONTRIBUTION_STATUS.failed;
      const bUrgent =
        b.status === CONTRIBUTION_STATUS.pending ||
        b.status === CONTRIBUTION_STATUS.failed;
      if (aUrgent !== bUrgent) return aUrgent ? -1 : 1;
      // Within same urgency bucket, newest period first
      return b.period.localeCompare(a.period);
    });
  }, [rows]);

  async function handleStatusChange(
    row: LehumoContribution,
    next: ContributionStatus,
  ) {
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
  }

  async function handleReconcile(row: LehumoContribution) {
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
  }

  return (
    <section className="rounded-[24px] border border-[#EDEDED] bg-white overflow-hidden">
      {error && (
        <div className="border-b border-red-200 bg-red-50 px-5 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-[#6B7280] bg-[#F8F9FA]">
              <th className="sticky left-0 z-10 bg-[#F8F9FA] px-4 py-3 font-medium min-w-[200px]">
                Member
              </th>
              <th className="px-3 py-3 font-medium min-w-[110px]">Period</th>
              <th className="px-3 py-3 font-medium min-w-[140px]">Status</th>
              <th className="px-3 py-3 font-medium min-w-[120px]">Source</th>
              <th className="px-3 py-3 font-medium min-w-[110px] text-right">
                Expected
              </th>
              <th className="px-3 py-3 font-medium min-w-[110px] text-right">
                Received
              </th>
              <th className="px-3 py-3 font-medium min-w-[180px]">Reference</th>
              <th className="px-3 py-3 font-medium min-w-[120px]">Date</th>
              <th className="px-3 py-3 font-medium min-w-[140px]">Reconciled</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-12 text-center text-sm text-[#6B7280]"
                >
                  No contributions match the active filters.
                </td>
              </tr>
            ) : (
              sorted.map((row) => {
                const member = memberById.get(row.memberId);
                const isBusy = busyId === row.id;
                return (
                  <tr
                    key={row.id}
                    className="border-t border-[#E5E7EB] hover:bg-[#F8F9FA]/60"
                  >
                    {/* Member identity */}
                    <td className="sticky left-0 z-10 bg-white px-4 py-3">
                      <div className="font-medium text-[#0B0B0B]">
                        {member?.fullName || "—"}
                      </div>
                      <div className="text-xs text-[#6B7280]">
                        {member
                          ? formatMemberNumber(member.memberNumber)
                          : "Unknown member"}
                      </div>
                    </td>

                    {/* Period */}
                    <td className="px-3 py-3 text-[#0B1933] font-mono tabular-nums">
                      {formatPeriod(row.period)}
                    </td>

                    {/* Status — inline select with colour-coded pills */}
                    <td className="px-3 py-3">
                      <div className="inline-flex items-center gap-1.5">
                        <select
                          value={row.status}
                          disabled={isBusy}
                          onChange={(e) =>
                            handleStatusChange(
                              row,
                              e.target.value as ContributionStatus,
                            )
                          }
                          className={`rounded-md border px-2 py-1 text-xs font-semibold appearance-none cursor-pointer outline-none focus:ring-1 focus:ring-[#0B1933]/15 disabled:opacity-50 ${statusClass(row.status)}`}
                        >
                          {STATUS_VALUES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        {isBusy && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#6B7280]" />
                        )}
                      </div>
                    </td>

                    {/* Source */}
                    <td className="px-3 py-3 text-xs text-[#0B1933]">
                      {row.source ?? <span className="text-[#9CA3AF]">—</span>}
                    </td>

                    {/* Expected */}
                    <td className="px-3 py-3 text-right tabular-nums text-[#6B7280]">
                      {row.amountExpected != null
                        ? `R${row.amountExpected.toLocaleString("en-ZA")}`
                        : "—"}
                    </td>

                    {/* Received */}
                    <td className="px-3 py-3 text-right tabular-nums font-semibold text-[#0B1933]">
                      {row.amountReceived != null
                        ? `R${row.amountReceived.toLocaleString("en-ZA")}`
                        : <span className="text-[#9CA3AF] font-normal">—</span>}
                    </td>

                    {/* Reference */}
                    <td className="px-3 py-3 text-xs text-[#0B1933] font-mono truncate max-w-[180px]">
                      {row.paymentReference || (
                        <span className="text-[#9CA3AF]">—</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-3 py-3 text-xs text-[#6B7280] tabular-nums">
                      {row.paymentDate ?? "—"}
                    </td>

                    {/* Reconciled — pill + Reconcile button when Paid + un-reconciled */}
                    <td className="px-3 py-3">
                      {row.reconciled ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-[#B8FF00]/15 border border-[#B8FF00]/40 px-2 py-0.5 text-[11px] font-semibold text-[#0B1933]"
                          title={
                            row.reconciledBy
                              ? `by ${row.reconciledBy}`
                              : undefined
                          }
                        >
                          <Check className="h-3 w-3" />
                          Reconciled
                        </span>
                      ) : row.status === CONTRIBUTION_STATUS.paid ? (
                        <button
                          type="button"
                          onClick={() => handleReconcile(row)}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1 rounded-full border border-[#0B1933]/20 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#0B1933] hover:border-[#0B1933]/40 hover:bg-[#F8F9FA] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
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

/**
 * Colour-coded background for each status pill / select. Maps onto
 * the same visual logic as the Members table's status column so
 * admins can scan across both tables and recognise state.
 */
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
