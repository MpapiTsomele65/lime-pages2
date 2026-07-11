"use client";

/**
 * LogManualDepositCard — primary action surface on the admin
 * Contributions page for recording an EFT / direct bank deposit /
 * cash drop against a member.
 *
 * Replaces the row-scoped LogEftDialog that used to live on each
 * Members table row. The flow is now:
 *   1. Pick a member (typeahead combobox)
 *   2. Enter amount + reference + date + optional notes
 *   3. See live allocation preview (multi-row split shown the same
 *      way the dialog used to)
 *   4. Click Log deposit — calls existing logEftPayment server
 *      action, which uses the same allocateEftPayment algorithm
 *      server-side so the preview is always honest.
 *
 * Reuses Foundation A+C tokens — shadow-card-soft, lime/teal,
 * <CTAButton variant="primary">. Light-theme to match the rest of
 * the admin chrome.
 */

import { useEffect, useMemo, useState } from "react";
import { Banknote, CheckCircle2, AlertTriangle } from "lucide-react";

import {
  allocateEftPayment,
  summarizeEftAllocation,
  type EftAllocationPlan,
} from "@/lib/eft-allocation";
import {
  CONTRIBUTION_STATUS,
  LEHUMO_FIRST_DUE_PERIOD,
  type LehumoContribution,
  type LehumoMember,
} from "@/lib/definitions";
import { logEftPayment } from "@/app/lehumo/portal/admin/actions";
import { CTAButton } from "@/components/ui/CTAButton";
import { MemberCombobox } from "./MemberCombobox";

interface LogManualDepositCardProps {
  members: LehumoMember[];
  /** Cross-member contribution snapshot from the parent. Used to
   *  build the per-member subset that the live allocation preview
   *  works against (no extra fetch). */
  contributions: LehumoContribution[];
  /** Called after a successful submit so the parent can refresh
   *  its local state with the new Paid rows. The plan describes
   *  which rows got touched. */
  onLogged: (member: LehumoMember, plan: EftAllocationPlan) => void;
}

export function LogManualDepositCard({
  members,
  contributions,
  onLogged,
}: LogManualDepositCardProps) {
  // SAST "today" as the default date — admins reconciling
  // same-day EFTs don't have to fiddle with the picker.
  const todayIso = useMemo(
    () =>
      new Date().toLocaleDateString("en-CA", {
        timeZone: "Africa/Johannesburg",
      }),
    [],
  );

  const [memberId, setMemberId] = useState<string | null>(null);
  const [amountStr, setAmountStr] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayIso);
  const [notes, setNotes] = useState("");
  // Optional month override — when set, the deposit is pinned to this
  // period instead of the oldest-unpaid auto-walk. Empty = Auto.
  const [targetPeriod, setTargetPeriod] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  // Auto-clear the green confirmation banner after 6s so it doesn't
  // linger across subsequent deposits.
  useEffect(() => {
    if (!confirmation) return;
    const t = setTimeout(() => setConfirmation(null), 6000);
    return () => clearTimeout(t);
  }, [confirmation]);

  const amountNum = Number(amountStr);
  const amountValid = !Number.isNaN(amountNum) && amountNum > 0;

  // Filter the parent's contribution snapshot down to this
  // member's rows for the allocation preview.
  const memberRows = useMemo(() => {
    if (!memberId) return [];
    return contributions.filter((c) => c.memberId === memberId);
  }, [memberId, contributions]);

  // Current SAST collection period — the override list only offers due /
  // overdue unpaid months (the reconciliation window), not the whole
  // future schedule.
  const currentPeriod = useMemo(
    () =>
      new Date()
        .toLocaleDateString("en-CA", { timeZone: "Africa/Johannesburg" })
        .slice(0, 7),
    [],
  );

  // Unpaid months from launch through the current period — the pickable
  // targets for the "Allocate to" override.
  const outstandingPeriods = useMemo(
    () =>
      memberRows
        .filter(
          (r) =>
            r.status !== CONTRIBUTION_STATUS.paid &&
            r.period >= LEHUMO_FIRST_DUE_PERIOD &&
            r.period <= currentPeriod,
        )
        .sort((a, b) => a.period.localeCompare(b.period)),
    [memberRows, currentPeriod],
  );

  // Live allocation preview — same pure helper the server uses on
  // commit, so what the admin sees is what gets written.
  const plan = useMemo<EftAllocationPlan | null>(() => {
    if (!memberId || !amountValid || memberRows.length === 0) return null;
    return allocateEftPayment(memberRows, amountNum, targetPeriod || undefined);
  }, [memberId, amountValid, amountNum, memberRows, targetPeriod]);

  const canSubmit =
    !busy &&
    memberId !== null &&
    amountValid &&
    paymentReference.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !memberId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await logEftPayment(memberId, {
        amount: amountNum,
        paymentReference: paymentReference.trim(),
        paymentDate: paymentDate || undefined,
        notes: notes.trim() || undefined,
        targetPeriod: targetPeriod || undefined,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setConfirmation(
        `R${res.plan.totalApplied.toLocaleString("en-ZA")} logged — ${summarizeEftAllocation(res.plan)}`,
      );
      onLogged(res.member, res.plan);
      // Reset form so the admin can immediately log the next deposit
      // without picking through stale state.
      setMemberId(null);
      setAmountStr("");
      setPaymentReference("");
      setPaymentDate(todayIso);
      setNotes("");
      setTargetPeriod("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="rounded-[24px] border border-[#EDEDED] bg-gradient-to-b from-white to-[#FCFCFD] p-6 md:p-7"
      style={{
        boxShadow:
          "inset 0 1px 0 0 rgba(255, 255, 255, 0.6), " +
          "0 1px 2px 0 rgba(0, 0, 0, 0.04), " +
          "0 4px 16px -4px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div className="flex items-start gap-3 mb-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#B8FF00]/15 text-[#0B1933]">
          <Banknote className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-[17px] font-semibold tracking-tight text-[#0B0B0B]">
            Log manual deposit
          </h2>
          <p className="mt-0.5 text-[13px] text-[#6B7280]">
            Record a direct bank deposit, cash drop, or any non-Paystack
            contribution. Allocates across outstanding periods automatically —
            or pin a specific month below.
          </p>
        </div>
      </div>

      {/* Confirmation / error banners — both render above the form
          so they're seen immediately on round-trip. */}
      {confirmation && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-[#B8FF00]/40 bg-[#B8FF00]/10 px-3.5 py-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-[#0B1933]" />
          <p className="text-[13px] font-medium text-[#0B1933] leading-snug">
            {confirmation}
          </p>
        </div>
      )}
      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-300 bg-red-50 px-3.5 py-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-700" />
          <p className="text-[13px] font-medium text-red-800 leading-snug">
            {error}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">
            Member
          </label>
          <MemberCombobox
            members={members}
            value={memberId}
            onChange={(id) => {
              setMemberId(id);
              setTargetPeriod("");
            }}
            disabled={busy}
          />
        </div>

        {/* Allocate to — optional month override. Defaults to Auto (oldest
            unpaid first); pin a specific due month to correct which period
            a manual payment lands on (e.g. a July EFT the auto-walk would
            otherwise push to August). */}
        {memberId && (
          <div>
            <label className="block text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">
              Allocate to
            </label>
            <select
              value={targetPeriod}
              onChange={(e) => setTargetPeriod(e.target.value)}
              disabled={busy}
              className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[14px] text-[#0B1933] outline-none focus:border-[#0B1933]/30 focus:ring-1 focus:ring-[#0B1933]/15 transition-colors disabled:opacity-50"
            >
              <option value="">Auto — oldest unpaid first</option>
              {outstandingPeriods.map((r) => (
                <option key={r.period} value={r.period}>
                  {formatPeriod(r.period)} · {r.status}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-[#9CA3AF]">
              Pin the deposit to a specific due month, or leave on Auto to
              fill the oldest unpaid period first.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr] gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">
              Amount (R)
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="e.g. 2000"
              disabled={busy}
              className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[14px] text-[#0B1933] placeholder:text-[#9CA3AF] outline-none focus:border-[#0B1933]/30 focus:ring-1 focus:ring-[#0B1933]/15 transition-colors disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">
              Reference
            </label>
            <input
              type="text"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="EFT ref, statement line, etc."
              disabled={busy}
              className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[14px] text-[#0B1933] placeholder:text-[#9CA3AF] outline-none focus:border-[#0B1933]/30 focus:ring-1 focus:ring-[#0B1933]/15 transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">
              Date received
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              disabled={busy}
              className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[14px] text-[#0B1933] outline-none focus:border-[#0B1933]/30 focus:ring-1 focus:ring-[#0B1933]/15 transition-colors disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">
              Notes (optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Partial payment, follow-up reminder…"
              disabled={busy}
              maxLength={500}
              className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[14px] text-[#0B1933] placeholder:text-[#9CA3AF] outline-none focus:border-[#0B1933]/30 focus:ring-1 focus:ring-[#0B1933]/15 transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        {/* Allocation preview — only renders when there's something
            meaningful to show (member picked + amount valid + at
            least one row gets touched). */}
        {plan && plan.rows.length > 0 && (
          <div className="rounded-xl border border-[#B8FF00]/35 bg-[#B8FF00]/[0.06] p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0B1933] mb-2">
              Will be applied as
            </p>
            <ul className="space-y-1.5">
              {plan.rows.map((row) => (
                <li
                  key={row.period}
                  className="flex items-center justify-between text-[13px]"
                >
                  <span className="text-[#0B1933]">
                    {formatPeriod(row.period)}
                  </span>
                  <span
                    className={`font-semibold ${
                      row.status === "fully-covers"
                        ? "text-[#0B1933]"
                        : "text-[#F59E0B]"
                    }`}
                  >
                    R{row.amountApplied.toLocaleString("en-ZA")}
                    {row.status === "partial" && (
                      <span className="ml-1.5 text-[10px] uppercase tracking-wider font-medium text-[#F59E0B]">
                        partial
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            {plan.hasOverpayment && (
              <p className="mt-2 pt-2 border-t border-[#0B1933]/10 text-[11px] text-[#F59E0B]">
                R{plan.remainder.toLocaleString("en-ZA")} unallocated — every
                scheduled row is covered. Decide separately whether to refund or
                hold as credit.
              </p>
            )}
          </div>
        )}

        {/* Edge case: member picked + amount entered but allocation is
            empty (every row already covered). Surface this clearly so
            the admin doesn't think the form is broken. */}
        {plan && plan.rows.length === 0 && amountValid && memberId && (
          <div className="rounded-xl border border-[#F59E0B]/30 bg-[#FEF3C7]/40 p-3 text-xs text-[#92400E]">
            Every scheduled row is already covered for this member. The R
            {amountNum.toLocaleString("en-ZA")} would sit as unallocated credit
            — no rows will be updated.
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-[11.5px] text-[#9CA3AF] hidden sm:block">
            {plan && plan.totalApplied > 0
              ? `Applying R${plan.totalApplied.toLocaleString("en-ZA")} across ${plan.rows.length} ${plan.rows.length === 1 ? "row" : "rows"}`
              : "Pick a member and enter an amount to preview"}
          </p>
          <CTAButton
            variant="primary"
            size="md"
            type="submit"
            disabled={!canSubmit}
            loading={busy}
            loadingText="Logging…"
            className="ml-auto"
          >
            Log deposit
          </CTAButton>
        </div>
      </form>
    </section>
  );
}

function formatPeriod(period: string): string {
  const [year, m] = period.split("-");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const monthIdx = Number(m) - 1;
  return `${months[monthIdx] ?? m} ${year}`;
}
