"use client";

/**
 * OrphanContributionsBanner — surfaces contribution rows whose
 * memberId points at no live Members record.
 *
 * Real cases this catches:
 *   • Paystack webhook delivered a payment with a member ID that's
 *     since been deleted from the Members table.
 *   • Hand-entered Adjustment / Cash row used the wrong member ID.
 *   • A member was reassigned to a different cohort and their
 *     historic rows still point at the old record.
 *
 * Each orphan row gets the standard ContributionDetailRow render
 * (with showMemberCol=true so the "Unknown member" label is visible)
 * and the pencil-Edit affordance — clicking it opens the same
 * EditContributionDialog the rollup table uses, where the admin
 * picks the correct member and Saves. After save, the row's
 * memberId now matches a live member, it drops out of the orphan
 * filter, and the parent re-renders without it in this banner.
 *
 * Hosts its own busyId + editingRow state — independent from the
 * rollup table below — so an in-flight rollup edit doesn't lock
 * out an orphan edit and vice versa.
 */

import { useCallback, useState } from "react";
import { AlertTriangle } from "lucide-react";

import {
  type ContributionStatus,
  type LehumoContribution,
  type LehumoMember,
} from "@/lib/definitions";
import {
  adminReconcileContribution,
  adminUpdateContribution,
  adminUpdateContributionStatus,
  type AdminUpdateContributionInput,
} from "@/app/lehumo/portal/admin/actions";

import { ContributionDetailRow } from "./ContributionDetailRow";
import { EditContributionDialog } from "./EditContributionDialog";

interface OrphanContributionsBannerProps {
  orphans: LehumoContribution[];
  /** Passed to the EditContributionDialog so the combobox can list
   *  members for reassignment. */
  members: LehumoMember[];
  onContributionUpdate: (updated: LehumoContribution) => void;
}

export function OrphanContributionsBanner({
  orphans,
  members,
  onContributionUpdate,
}: OrphanContributionsBannerProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<LehumoContribution | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

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

  if (orphans.length === 0) return null;

  return (
    <section className="rounded-[20px] border border-[#F59E0B]/30 bg-[#FEF3C7]/40 overflow-hidden">
      <div className="px-5 py-3 border-b border-[#F59E0B]/20 bg-[#FEF3C7]/60">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-[#92400E] mt-0.5 shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[#92400E]">
              Unallocated payments — {orphans.length} of {orphans.length}
            </h3>
            <p className="text-xs text-[#92400E]/80 mt-0.5">
              Paid contributions whose linked member record is missing or
              deleted. Click the pencil to reassign each to the correct
              member &amp; period.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="border-b border-red-200 bg-red-50 px-5 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white">
        {orphans.map((row) => (
          <ContributionDetailRow
            key={row.id}
            row={row}
            member={null}
            isBusy={busyId === row.id}
            onStatusChange={handleStatusChange}
            onReconcile={handleReconcile}
            onOpenEdit={(r) => setEditingRow(r)}
            showMemberCol={true}
          />
        ))}
      </div>

      <EditContributionDialog
        contribution={editingRow}
        members={members}
        onSubmit={handleEditSubmit}
        onCancel={() => setEditingRow(null)}
      />
    </section>
  );
}
