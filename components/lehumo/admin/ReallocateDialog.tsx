"use client";

/**
 * ReallocateDialog — quick "this payment is on the wrong month" repair
 * for the admin Contributions table. Two one-click outcomes:
 *
 *   • Move payment → copies the payment onto another month's row (for
 *     the same member) and re-opens the source month. Fixes the case
 *     where an EFT meant for e.g. July auto-allocated to August.
 *   • Void payment → just re-opens the source month (marks it unpaid,
 *     clears received / reference / date), leaving the money to be
 *     re-logged wherever it belongs.
 *
 * The full EditContributionDialog can technically do both by hand, but
 * a straight period change collides when the target month already has a
 * row — this handles the two-row move safely.
 */

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeftRight, Loader2, X, AlertTriangle } from "lucide-react";

import {
  CONTRIBUTION_STATUS,
  LEHUMO_FIRST_DUE_PERIOD,
  formatMemberNumber,
  type LehumoContribution,
  type LehumoMember,
} from "@/lib/definitions";

type ActionResult = { ok: true } | { ok: false; error: string };

interface ReallocateDialogProps {
  /** Source row. Null = closed. */
  contribution: LehumoContribution | null;
  member: LehumoMember | null;
  /** All of the member's contribution rows — used to offer target months. */
  memberRows: LehumoContribution[];
  onReallocate: (targetPeriod: string) => Promise<ActionResult>;
  onVoid: () => Promise<ActionResult>;
  onCancel: () => void;
}

export function ReallocateDialog(props: ReallocateDialogProps) {
  return (
    <AnimatePresence>
      {props.contribution && (
        <ReallocateDialogInner
          key={props.contribution.id}
          {...props}
          contribution={props.contribution}
        />
      )}
    </AnimatePresence>
  );
}

function ReallocateDialogInner({
  contribution,
  member,
  memberRows,
  onReallocate,
  onVoid,
  onCancel,
}: ReallocateDialogProps & { contribution: LehumoContribution }) {
  const [targetPeriod, setTargetPeriod] = useState("");
  const [busy, setBusy] = useState<"move" | "void" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  const currentPeriod = useMemo(
    () =>
      new Date()
        .toLocaleDateString("en-CA", { timeZone: "Africa/Johannesburg" })
        .slice(0, 7),
    [],
  );

  // Target months = the member's unpaid periods (launch → current),
  // excluding the source month itself.
  const targets = useMemo(
    () =>
      memberRows
        .filter(
          (r) =>
            r.period !== contribution.period &&
            r.status !== CONTRIBUTION_STATUS.paid &&
            r.period >= LEHUMO_FIRST_DUE_PERIOD &&
            r.period <= currentPeriod,
        )
        .sort((a, b) => a.period.localeCompare(b.period)),
    [memberRows, contribution.period, currentPeriod],
  );

  const amount = contribution.amountReceived ?? 0;
  const memberLabel = member
    ? `${member.fullName} · ${formatMemberNumber(member.memberNumber)}`
    : "this member";

  async function run(action: "move" | "void") {
    setError(null);
    setBusy(action);
    const res =
      action === "move" ? await onReallocate(targetPeriod) : await onVoid();
    if (!res.ok) {
      setError(res.error);
      setBusy(null);
      return;
    }
    // Parent closes + refreshes on success.
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
      aria-labelledby="reallocate-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0F2040] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b border-white/[0.06]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#B8FF00]/15 text-[#B8FF00]">
            <ArrowLeftRight className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="reallocate-title" className="text-lg font-semibold text-white">
              Move or void payment
            </h2>
            <p className="mt-1 text-xs text-white/60 truncate">
              R{amount.toLocaleString("en-ZA")} on{" "}
              <span className="text-white/80 font-medium">
                {formatPeriod(contribution.period)}
              </span>{" "}
              · {memberLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={!!busy}
            className="text-white/60 hover:text-white disabled:opacity-40 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Move to month */}
          <div>
            <label
              htmlFor="reallocate-target"
              className="block text-[11px] uppercase tracking-wider text-white/60 mb-1"
            >
              Move payment to
            </label>
            <select
              id="reallocate-target"
              value={targetPeriod}
              onChange={(e) => setTargetPeriod(e.target.value)}
              disabled={!!busy}
              className="w-full rounded-lg bg-white/[0.04] border border-white/[0.1] px-3 py-2 text-sm text-white outline-none focus:border-[#B8FF00]/50 focus:ring-1 focus:ring-[#B8FF00]/20 transition-colors disabled:opacity-60 appearance-none cursor-pointer"
            >
              <option value="" className="bg-[#0F2040]">
                Choose a month…
              </option>
              {targets.map((r) => (
                <option key={r.period} value={r.period} className="bg-[#0F2040]">
                  {formatPeriod(r.period)} · {r.status}
                </option>
              ))}
            </select>
            {targets.length === 0 && (
              <p className="mt-1.5 text-[11px] text-white/60">
                No other open months to move this to — you can still void it.
              </p>
            )}
            <button
              type="button"
              onClick={() => run("move")}
              disabled={!!busy || !targetPeriod}
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#B8FF00] px-4 py-2.5 text-sm font-bold text-[#0B1933] hover:bg-[#a8ef00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {busy === "move" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Moving…
                </>
              ) : (
                <>
                  Move payment
                  {targetPeriod && ` to ${formatPeriod(targetPeriod)}`}
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-white/40">
            <span className="h-px flex-1 bg-white/[0.08]" />
            or
            <span className="h-px flex-1 bg-white/[0.08]" />
          </div>

          {/* Void */}
          <button
            type="button"
            onClick={() => run("void")}
            disabled={!!busy}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-red-400/30 bg-red-500/[0.08] px-4 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/[0.15] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {busy === "void" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Voiding…
              </>
            ) : (
              `Void — re-open ${formatPeriod(contribution.period)} as unpaid`
            )}
          </button>

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-400/30 bg-red-500/10 px-3.5 py-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-300" />
              <p className="text-[12.5px] text-red-300 leading-snug">{error}</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function formatPeriod(period: string): string {
  const [year, m] = period.split("-");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[Number(m) - 1] ?? m} ${year}`;
}
