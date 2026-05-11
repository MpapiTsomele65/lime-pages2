"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Banknote, Loader2, X } from "lucide-react";

import type { LehumoMember } from "@/lib/definitions";
import {
  allocateEftPayment,
  summarizeEftAllocation,
} from "@/lib/eft-allocation";
import type { LogEftPaymentResult } from "@/app/lehumo/portal/admin/actions";

interface LogEftDialogProps {
  /** Render gate. Renders nothing when null. The member object is
   *  passed in so the live preview can run client-side against the
   *  member's contribution rows (no extra round trip) and the title
   *  can name the member. */
  member: LehumoMember | null;
  /** Called when the admin clicks Apply with valid form data. The
   *  parent fires the actual server action; the dialog just collects
   *  + validates input. The promise resolves with the full server
   *  action result so the dialog can keep its busy state until the
   *  write lands and surface server-side errors inline. */
  onSubmit: (
    member: LehumoMember,
    fields: {
      amount: number;
      paymentReference: string;
      paymentDate?: string;
      notes?: string;
    },
  ) => Promise<LogEftPaymentResult>;
  /** Cancel / close. Wipes form state in the parent. */
  onCancel: () => void;
}

interface LogEftDialogInnerProps {
  member: LehumoMember;
  onSubmit: LogEftDialogProps["onSubmit"];
  onCancel: () => void;
}

/**
 * Manual EFT payment logger.
 *
 * The recon use case: admin pulls the bank statement, sees a R2,000
 * deposit from John, opens this dialog from John's row, types
 * `2000` + ref, sees a live preview ("Jun 2026 R1,000 + Jul 2026
 * R1,000"), clicks Apply. The same multi-row allocation logic runs
 * both client-side (preview) and server-side (commit) — shared via
 * `lib/eft-allocation.ts`.
 */
export function LogEftDialog(props: LogEftDialogProps) {
  return (
    <AnimatePresence>
      {props.member && (
        <LogEftDialogInner
          key={props.member.id}
          member={props.member}
          onSubmit={props.onSubmit}
          onCancel={props.onCancel}
        />
      )}
    </AnimatePresence>
  );
}

function LogEftDialogInner({
  member,
  onSubmit,
  onCancel,
}: LogEftDialogInnerProps) {
  // Default the date to today (SAST) — admins reconciling same-day
  // EFTs don't have to fiddle with the date picker. Backdating is
  // still one click away when working through last week's statement.
  const todayIso = new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Johannesburg",
  });

  const [amountStr, setAmountStr] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayIso);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const amountRef = useRef<HTMLInputElement | null>(null);

  // Focus into the amount field on mount.
  useEffect(() => {
    requestAnimationFrame(() => amountRef.current?.focus());
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

  const amountNum = Number(amountStr);
  const amountValid = !Number.isNaN(amountNum) && amountNum > 0;

  // Live allocation preview. Recomputes whenever the amount changes,
  // using the same pure helper the server uses to commit — no risk
  // of preview drifting from actual.
  const plan = useMemo(() => {
    if (!amountValid || !member.contributionRows) return null;
    return allocateEftPayment(member.contributionRows, amountNum);
  }, [amountValid, amountNum, member.contributionRows]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    if (!amountValid) {
      setError("Enter a valid amount in Rand");
      return;
    }
    if (!paymentReference.trim()) {
      setError("Reference is required");
      return;
    }

    setError(null);
    setBusy(true);

    const res = await onSubmit(member, {
      amount: amountNum,
      paymentReference: paymentReference.trim(),
      paymentDate: paymentDate || undefined,
      notes: notes.trim() || undefined,
    });

    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }
    // Parent closes the dialog on success.
  }

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
      aria-labelledby="log-eft-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0F2040] shadow-2xl"
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-start gap-4 p-6 border-b border-white/[0.06]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#B8FF00]/15 text-[#B8FF00]">
              <Banknote className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="log-eft-title" className="text-lg font-semibold text-white">
                Log EFT payment
              </h2>
              <p className="mt-1 text-xs text-white/60">
                {member.fullName || "—"}
                {member.email ? ` · ${member.email}` : ""}
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
            <Field label="Amount (R)" required>
              <input
                ref={amountRef}
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="e.g. 2000"
                autoComplete="off"
                className={inputClass}
              />
            </Field>

            <Field label="Reference" required>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="EFT ref, bank statement line, etc."
                autoComplete="off"
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Date received">
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Notes">
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional"
                  autoComplete="off"
                  className={inputClass}
                />
              </Field>
            </div>

            {/* Live allocation preview — only renders when the amount is
                valid + contribution rows exist. Shows exactly how the
                EFT will land before the admin commits. */}
            {plan && plan.rows.length > 0 && (
              <div className="rounded-xl bg-[#B8FF00]/[0.05] border border-[#B8FF00]/20 p-3">
                <p className="text-[10px] uppercase tracking-wider text-[#B8FF00] font-semibold mb-2">
                  Will be applied as
                </p>
                <ul className="space-y-1.5">
                  {plan.rows.map((row) => (
                    <li
                      key={row.period}
                      className="flex items-center justify-between text-[13px]"
                    >
                      <span className="text-white">
                        {formatPeriod(row.period)}
                      </span>
                      <span
                        className={`font-semibold ${
                          row.status === "fully-covers"
                            ? "text-[#B8FF00]"
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
                  <p className="mt-2 pt-2 border-t border-white/[0.06] text-[11px] text-[#F59E0B]">
                    R{plan.remainder.toLocaleString("en-ZA")} unallocated —
                    every scheduled row covered. Decide separately
                    whether to refund or hold as credit.
                  </p>
                )}
              </div>
            )}

            {/* Edge case: amount entered but every row is already
                fully covered (e.g. member already paid up). Surface
                this clearly so admin doesn't think the form is broken. */}
            {plan && plan.rows.length === 0 && amountValid && (
              <div className="rounded-xl bg-[#F59E0B]/[0.06] border border-[#F59E0B]/20 p-3 text-xs text-[#F59E0B]">
                Every scheduled row is already covered for this member.
                The R{amountNum.toLocaleString("en-ZA")} would sit as
                unallocated credit — no rows will be updated.
              </div>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-white/[0.06]">
            <p className="text-[11px] text-white/40 hidden sm:block">
              {plan && plan.totalApplied > 0
                ? `Applying R${plan.totalApplied.toLocaleString("en-ZA")} across ${plan.rows.length} ${plan.rows.length === 1 ? "row" : "rows"}`
                : "Enter an amount to preview"}
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
                disabled={busy || !amountValid || !paymentReference.trim()}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#B8FF00] px-4 py-2 text-sm font-bold text-[#0B1933] hover:bg-[#a8ef00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Applying…
                  </>
                ) : (
                  "Apply payment"
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
// self-contained and dialog-only styling doesn't leak.
// ──────────────────────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-lg bg-white/[0.04] border border-white/[0.1] px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#B8FF00]/50 focus:ring-1 focus:ring-[#B8FF00]/20 transition-colors";

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

function formatPeriod(period: string): string {
  const [year, m] = period.split("-");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const monthIdx = Number(m) - 1;
  return `${months[monthIdx] ?? m} ${year}`;
}

// Re-export so the summary helper is callable from the parent component
// for inline toast / status messaging (e.g. "R2,000 → Jun + Jul 2026").
export { summarizeEftAllocation };
