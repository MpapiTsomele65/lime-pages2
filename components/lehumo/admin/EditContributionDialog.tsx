"use client";

/**
 * EditContributionDialog — full row editor for the admin
 * Contributions table. Mirrors BeneficiaryDialog's modal pattern
 * (dark surface on a light-themed admin page, framer-motion
 * entrance, Esc / outside-click to dismiss, busy-state lock during
 * save).
 *
 * Two repair flows it handles in one form:
 *   1. Simple metadata edit — backfill a missing reference, fix
 *      amounts, flip status, add notes. Routes through
 *      updateContribution() server-side via the
 *      adminUpdateContribution action.
 *   2. Reassign to a different (member, period) slot — fixes
 *      orphan "Unknown member" rows that have a stale memberId
 *      link, or moves a payment from one month to another.
 *      Recomputes the composite primary key server-side via
 *      reassignContribution(); rejects on collision with a
 *      visible error banner.
 *
 * Pre-fills with the current row's values via lazy useState init.
 * Submit is disabled until at least one field has changed —
 * prevents accidental writes that just bump `updatedAt` without
 * any real intent.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Pencil, X, AlertTriangle } from "lucide-react";

import {
  CONTRIBUTION_SOURCE,
  CONTRIBUTION_STATUS,
  formatMemberNumber,
  type ContributionSource,
  type ContributionStatus,
  type LehumoContribution,
  type LehumoMember,
} from "@/lib/definitions";
import { MemberCombobox } from "./MemberCombobox";
import type { AdminUpdateContributionInput } from "@/app/lehumo/portal/admin/actions";

interface EditContributionDialogProps {
  /** Render gate. Null = closed. */
  contribution: LehumoContribution | null;
  members: LehumoMember[];
  /** Caller fires the actual server action; the dialog just
   *  collects + validates input. The promise resolves with the
   *  full action result so the dialog can surface server-side
   *  errors inline. */
  onSubmit: (
    contribution: LehumoContribution,
    patch: AdminUpdateContributionInput,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  onCancel: () => void;
}

interface EditContributionDialogInnerProps {
  contribution: LehumoContribution;
  members: LehumoMember[];
  onSubmit: EditContributionDialogProps["onSubmit"];
  onCancel: () => void;
}

const STATUS_VALUES = Object.values(CONTRIBUTION_STATUS);
const SOURCE_VALUES = Object.values(CONTRIBUTION_SOURCE);

export function EditContributionDialog(props: EditContributionDialogProps) {
  // Outer keys the inner on the row's record id so React tears down
  // + remounts whenever the admin opens edit on a different row.
  // This lets the inner use lazy useState seeded from the right
  // row's values without setState-in-effect anti-pattern.
  return (
    <AnimatePresence>
      {props.contribution && (
        <EditContributionDialogInner
          key={props.contribution.id}
          contribution={props.contribution}
          members={props.members}
          onSubmit={props.onSubmit}
          onCancel={props.onCancel}
        />
      )}
    </AnimatePresence>
  );
}

function EditContributionDialogInner({
  contribution,
  members,
  onSubmit,
  onCancel,
}: EditContributionDialogInnerProps) {
  // Lazy-init from the row prop. The outer keys this component on
  // contribution.id, so the inits re-fire (with fresh values) every
  // time the admin opens edit on a different row.
  const [memberId, setMemberId] = useState<string | null>(
    () => contribution.memberId,
  );
  const [period, setPeriod] = useState<string>(() => contribution.period);
  const [status, setStatus] = useState<ContributionStatus>(
    () => contribution.status,
  );
  const [source, setSource] = useState<string>(() => contribution.source ?? "");
  const [amountExpectedStr, setAmountExpectedStr] = useState<string>(() =>
    contribution.amountExpected != null
      ? String(contribution.amountExpected)
      : "",
  );
  const [amountReceivedStr, setAmountReceivedStr] = useState<string>(() =>
    contribution.amountReceived != null
      ? String(contribution.amountReceived)
      : "",
  );
  const [paymentReference, setPaymentReference] = useState<string>(
    () => contribution.paymentReference ?? "",
  );
  const [paymentDate, setPaymentDate] = useState<string>(
    () => contribution.paymentDate ?? "",
  );
  const [notes, setNotes] = useState<string>(() => contribution.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const referenceRef = useRef<HTMLInputElement | null>(null);

  // Focus the Reference field on mount — that's the most common
  // edit (backfilling a missing reference from a bank statement).
  useEffect(() => {
    requestAnimationFrame(() => referenceRef.current?.focus());
  }, []);

  // Esc closes — but not mid-save.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) {
        e.preventDefault();
        onCancel();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  // ── Diff detection — submit is disabled until at least one
  //    field has actually changed from its loaded value. Prevents
  //    bumping `updatedAt` with a no-op write. ──
  const expectedNum =
    amountExpectedStr === "" ? null : Number(amountExpectedStr);
  const receivedNum =
    amountReceivedStr === "" ? null : Number(amountReceivedStr);

  const memberChanged = memberId !== contribution.memberId;
  const periodChanged = period !== contribution.period;
  const statusChanged = status !== contribution.status;
  const sourceChanged = source !== (contribution.source ?? "");
  const expectedChanged = expectedNum !== (contribution.amountExpected ?? null);
  const receivedChanged = receivedNum !== (contribution.amountReceived ?? null);
  const referenceChanged =
    paymentReference !== (contribution.paymentReference ?? "");
  const dateChanged = paymentDate !== (contribution.paymentDate ?? "");
  const notesChanged = notes !== (contribution.notes ?? "");

  const hasChanges =
    memberChanged ||
    periodChanged ||
    statusChanged ||
    sourceChanged ||
    expectedChanged ||
    receivedChanged ||
    referenceChanged ||
    dateChanged ||
    notesChanged;

  const isReassignment = memberChanged || periodChanged;
  const targetMember = isReassignment
    ? (members.find((m) => m.id === memberId) ?? null)
    : null;
  const reassignmentKey =
    isReassignment && targetMember
      ? `${formatMemberNumber(targetMember.memberNumber)}-${period}`
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !hasChanges) return;

    // Light client-side validation
    if (!memberId) {
      setError("Pick a member to assign this contribution to.");
      return;
    }
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
      setError("Period must be YYYY-MM (e.g. 2026-06).");
      return;
    }
    if (expectedNum != null && (Number.isNaN(expectedNum) || expectedNum < 0)) {
      setError("Expected amount must be 0 or greater.");
      return;
    }
    if (receivedNum != null && (Number.isNaN(receivedNum) || receivedNum < 0)) {
      setError("Received amount must be 0 or greater.");
      return;
    }

    setError(null);
    setBusy(true);

    // Build the patch from changed fields only. Sending unchanged
    // fields would still work but produces noisier diffs server-side
    // and bloats the Airtable PATCH payload.
    const patch: AdminUpdateContributionInput = {};
    if (memberChanged) patch.memberId = memberId;
    if (periodChanged) patch.period = period;
    if (statusChanged) patch.status = status;
    if (sourceChanged) patch.source = source === "" ? null : (source as ContributionSource);
    if (expectedChanged && expectedNum != null) patch.amountExpected = expectedNum;
    if (receivedChanged) patch.amountReceived = receivedNum;
    if (referenceChanged) patch.paymentReference = paymentReference;
    if (dateChanged) patch.paymentDate = paymentDate;
    if (notesChanged) patch.notes = notes;

    const res = await onSubmit(contribution, patch);
    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }
    // Parent handles closing the dialog on success.
  }

  // Derive a small display label for the row context shown in the
  // header — e.g. "Leh22-2026-06 · R1,000 received".
  const currentMember = members.find((m) => m.id === contribution.memberId);
  const currentMemberLabel = currentMember
    ? `${currentMember.fullName} · ${formatMemberNumber(currentMember.memberNumber)}`
    : "Unknown member";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-8 overflow-y-auto"
      onClick={() => !busy && onCancel()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-contribution-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl border border-white/[0.08] bg-[#0F2040] shadow-2xl"
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-start gap-4 p-6 border-b border-white/[0.06]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#B8FF00]/15 text-[#B8FF00]">
              <Pencil className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                id="edit-contribution-title"
                className="text-lg font-semibold text-white"
              >
                Edit contribution
              </h2>
              <p className="mt-1 text-xs text-white/60 truncate">
                {contribution.contributionKey} · {currentMemberLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="text-white/40 hover:text-white disabled:opacity-40 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Fields */}
          <div className="p-6 space-y-4">
            {/* Member combobox — sits at top because it's the most
                impactful change (reassignment). */}
            <Field label="Member" required>
              <MemberCombobox
                members={members}
                value={memberId}
                onChange={setMemberId}
                disabled={busy}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Period (YYYY-MM)" required>
                <input
                  type="text"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="2026-06"
                  pattern="\d{4}-\d{2}"
                  disabled={busy}
                  className={inputClass}
                />
              </Field>
              <Field label="Status" required>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as ContributionStatus)
                  }
                  disabled={busy}
                  className={`${inputClass} appearance-none pr-8 cursor-pointer`}
                >
                  {STATUS_VALUES.map((s) => (
                    <option key={s} value={s} className="bg-[#0F2040]">
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Source">
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  disabled={busy}
                  className={`${inputClass} appearance-none pr-8 cursor-pointer`}
                >
                  <option value="" className="bg-[#0F2040]">
                    (unset)
                  </option>
                  {SOURCE_VALUES.map((s) => (
                    <option key={s} value={s} className="bg-[#0F2040]">
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Payment date">
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  disabled={busy}
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Expected (R)">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={amountExpectedStr}
                  onChange={(e) => setAmountExpectedStr(e.target.value)}
                  placeholder="1000"
                  disabled={busy}
                  className={inputClass}
                />
              </Field>
              <Field label="Received (R)">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={amountReceivedStr}
                  onChange={(e) => setAmountReceivedStr(e.target.value)}
                  placeholder="0"
                  disabled={busy}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Payment reference">
              <input
                ref={referenceRef}
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Paystack ref, EFT ref, bank statement line…"
                disabled={busy}
                className={inputClass}
              />
            </Field>

            <Field label="Notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Admin context — partial payment, recon flag, follow-up…"
                rows={3}
                maxLength={500}
                disabled={busy}
                className={`${inputClass} resize-none`}
              />
            </Field>

            {/* Reassignment warning chip — only when member OR
                period has been changed. Surfaces the new composite
                key so the admin sees exactly what's about to happen. */}
            {isReassignment && reassignmentKey && (
              <div className="rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/[0.06] px-3.5 py-2.5 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-[#F59E0B]" />
                <p className="text-[12.5px] text-[#F59E0B] leading-snug">
                  Reassigning to{" "}
                  <strong className="text-white">{reassignmentKey}</strong> —
                  composite key will be recomputed. The save will fail if a
                  row already exists at that slot.
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-3.5 py-2.5">
                <p className="text-[12.5px] text-red-300 leading-snug">
                  {error}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-white/[0.06]">
            <p className="text-[11px] text-white/40 hidden sm:block">
              {hasChanges
                ? `${countChanges(memberChanged, periodChanged, statusChanged, sourceChanged, expectedChanged, receivedChanged, referenceChanged, dateChanged, notesChanged)} change${
                    countChanges(memberChanged, periodChanged, statusChanged, sourceChanged, expectedChanged, receivedChanged, referenceChanged, dateChanged, notesChanged) === 1
                      ? ""
                      : "s"
                  } pending`
                : "No changes yet"}
            </p>
            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="rounded-full border border-white/[0.1] bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/[0.08] disabled:opacity-40 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy || !hasChanges}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#B8FF00] px-4 py-2 text-sm font-bold text-[#0B1933] hover:bg-[#a8ef00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Internal layout primitives — kept local so the dialog stays
// self-contained and the styling doesn't leak.
// ──────────────────────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-lg bg-white/[0.04] border border-white/[0.1] px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#B8FF00]/50 focus:ring-1 focus:ring-[#B8FF00]/20 transition-colors disabled:opacity-60";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wider text-white/50 mb-1">
        {label}
        {required && <span className="text-[#B8FF00] ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}

function countChanges(...flags: boolean[]): number {
  return flags.reduce((n, f) => n + (f ? 1 : 0), 0);
}
