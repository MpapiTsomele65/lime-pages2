"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  RotateCcw,
  ShieldOff,
} from "lucide-react";

import { formatMemberNumber, type LehumoMember } from "@/lib/definitions";
import { resolveSubscriptionCancel } from "@/app/lehumo/portal/admin/actions";

interface SubscriptionDetailsByMember {
  [memberId: string]:
    | { nextPaymentDate: string | null; status: string }
    | null;
}

interface AdminPendingActionsProps {
  /** Members whose `subscriptionAction === "Cancel Pending"` — i.e.
   *  downgraded from Standard → Basic but the auto-cancel didn't go
   *  through. Sourced from `stats.subscriptionCancelPending` on the
   *  admin page. */
  pending: LehumoMember[];
  /** Per-member Paystack subscription details fetched server-side on
   *  page load — fuels the "X days until next bill" countdown. Maps
   *  `memberId` to `{ nextPaymentDate, status }` or `null` when the
   *  lookup failed / no code was stored. */
  subscriptionDetailsByMember: SubscriptionDetailsByMember;
}

/**
 * Build a human-friendly "in X days / hours / minutes" countdown
 * between two timestamps. Returns null when the target is null /
 * unparseable (no code stored, or Paystack lookup errored).
 *
 * Branches at three thresholds:
 *   - > 36 hours: "in N days"
 *   - 1–36 hours: "in N hours" + colour-coded urgency
 *   - < 1 hour: "in N minutes" — the bell-rings tier
 *   - past: "Billed N days/hours ago" so admins see they're late
 */
function formatCountdown(
  targetIso: string | null,
  now: Date,
): { label: string; tone: "ok" | "warn" | "urgent" | "past" } | null {
  if (!targetIso) return null;
  const target = new Date(targetIso);
  if (Number.isNaN(target.getTime())) return null;
  const diffMs = target.getTime() - now.getTime();
  const past = diffMs < 0;
  const absMs = Math.abs(diffMs);
  const minutes = Math.round(absMs / (60 * 1000));
  const hours = Math.round(absMs / (60 * 60 * 1000));
  const days = Math.round(absMs / (24 * 60 * 60 * 1000));

  if (past) {
    if (hours < 36) {
      return {
        label: `Billed ${hours}h ago`,
        tone: "past",
      };
    }
    return { label: `Billed ${days}d ago`, tone: "past" };
  }

  // Urgency tiers — colour the countdown so admin eye lands on the
  // soonest cancellations first.
  let tone: "ok" | "warn" | "urgent";
  if (hours <= 24) tone = "urgent";
  else if (days <= 3) tone = "warn";
  else tone = "ok";

  if (hours < 1) return { label: `in ${minutes}m`, tone };
  if (hours < 36) return { label: `in ${hours}h`, tone };
  return { label: `in ${days} ${days === 1 ? "day" : "days"}`, tone };
}

/**
 * Pending admin actions surface.
 *
 * Today this is single-purpose: a list of members whose Paystack auto-
 * debit subscription needs to be cancelled before the next billing
 * cycle. Members who downgraded from Standard → Basic on the portal
 * are flagged here whenever the auto-cancel didn't succeed (no
 * subscription_code stored for legacy members, or the Paystack
 * disable API call errored at switch time).
 *
 * Two ways to resolve a row:
 *   - **Retry auto-cancel** — re-runs `disableSubscription` against
 *     the stored code. Useful for the "API blip at switch time" case.
 *   - **Mark as resolved** — admin has cancelled it manually from the
 *     Paystack dashboard and is acknowledging the action is done.
 *     Used for legacy members with no stored code.
 *
 * Hides itself entirely when the queue is empty — no zero-state noise
 * on a clean dashboard.
 */
export function AdminPendingActions({
  pending,
  subscriptionDetailsByMember,
}: AdminPendingActionsProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});

  // Tick `now` every 30s so the countdowns roll forward without a
  // full page reload. 30s is fine — admins aren't watching this card
  // second-by-second, and we want the values to feel "live enough"
  // when they leave the tab open over lunch.
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Soonest next-billing date across all pending rows — anchors the
  // headline countdown so admins know the deadline at a glance
  // without scanning each row.
  const soonest = useMemo(() => {
    let earliest: Date | null = null;
    for (const m of pending) {
      const iso = subscriptionDetailsByMember[m.id]?.nextPaymentDate;
      if (!iso) continue;
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) continue;
      if (!earliest || d < earliest) earliest = d;
    }
    return earliest;
  }, [pending, subscriptionDetailsByMember]);
  const soonestCountdown = soonest
    ? formatCountdown(soonest.toISOString(), now)
    : null;

  async function handle(
    memberId: string,
    mode: "retry" | "mark-done",
  ) {
    if (busyId) return;
    setBusyId(memberId);
    setRowError((prev) => {
      const next = { ...prev };
      delete next[memberId];
      return next;
    });
    try {
      const res = await resolveSubscriptionCancel(memberId, mode);
      if (!res.ok) {
        setRowError((prev) => ({ ...prev, [memberId]: res.error }));
        return;
      }
      // Refresh server data so the row drops out of the list on next paint.
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (pending.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
      aria-labelledby="pending-actions-title"
      className="rounded-[24px] border border-[#F59E0B]/35 bg-gradient-to-b from-[#FFFBEB] to-white p-6 md:p-7"
      style={{
        boxShadow:
          "inset 0 1px 0 0 rgba(255, 255, 255, 0.6), " +
          "0 1px 2px 0 rgba(245, 158, 11, 0.08), " +
          "0 4px 16px -4px rgba(245, 158, 11, 0.12)",
      }}
    >
      <div className="flex items-start gap-4 mb-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F59E0B]/15 text-[#F59E0B]">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F59E0B] mb-1">
            Action required · before next billing cycle
          </p>
          <h2
            id="pending-actions-title"
            className="text-[18px] font-semibold tracking-tight text-[#0B1933] leading-tight"
          >
            Pending subscription cancellations ({pending.length})
          </h2>
          <p className="mt-1 text-[12.5px] text-[#6B7280] leading-relaxed">
            These members downgraded from Standard to Basic but their
            Paystack auto-debit wasn&rsquo;t cancelled automatically. If
            not actioned, they&rsquo;ll be charged again at the next
            billing cycle.
          </p>
          {/* Headline countdown — anchors urgency on the soonest
              next-bill across the queue. Skipped silently when no
              billing dates are available (every pending member is a
              legacy with no code stored), since the per-row footer
              already explains the "unknown" case. */}
          {soonestCountdown && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#0B1933] px-3 py-1 text-[11px] font-semibold text-white">
              <Clock className="h-3 w-3" />
              <span>Next billing cycle</span>
              <span
                className={
                  soonestCountdown.tone === "urgent"
                    ? "text-[#FCA5A5]"
                    : soonestCountdown.tone === "warn"
                      ? "text-[#FCD34D]"
                      : soonestCountdown.tone === "past"
                        ? "text-[#FCA5A5]"
                        : "text-[#B8FF00]"
                }
              >
                · {soonestCountdown.label}
              </span>
            </div>
          )}
        </div>
        <a
          href="https://dashboard.paystack.com/#/subscriptions"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-[11.5px] font-medium text-[#6B7280] hover:text-[#0B1933] hover:border-[#0B1933]/30 transition-colors"
          title="Open Paystack subscriptions dashboard"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Paystack
        </a>
      </div>

      <ul className="space-y-2.5">
        {pending.map((m) => {
          const isBusy = busyId === m.id;
          const err = rowError[m.id];
          const hasCode = Boolean(m.subscriptionCode);
          const subDetails = subscriptionDetailsByMember[m.id];
          const rowCountdown = formatCountdown(
            subDetails?.nextPaymentDate ?? null,
            now,
          );
          const billingDateLabel = subDetails?.nextPaymentDate
            ? new Date(subDetails.nextPaymentDate).toLocaleDateString("en-ZA", {
                timeZone: "Africa/Johannesburg",
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : null;
          return (
            <li
              key={m.id}
              className="rounded-[14px] border border-[#F59E0B]/25 bg-white p-4"
            >
              <div className="flex flex-wrap items-start gap-3 justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-[#0B1933]">
                    {m.fullName || "—"}
                    <span className="ml-2 inline-flex items-center rounded-full bg-[#F8F9FA] border border-[#E5E7EB] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
                      {formatMemberNumber(m.memberNumber)}
                    </span>
                    {/* Per-row countdown chip — colour-tiered so the
                        most urgent rows visually pop. Hidden when we
                        couldn't resolve a next-bill date (legacy or
                        Paystack lookup error). */}
                    {rowCountdown && (
                      <span
                        className={`ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${
                          rowCountdown.tone === "urgent" ||
                          rowCountdown.tone === "past"
                            ? "bg-red-50 border-red-200 text-red-700"
                            : rowCountdown.tone === "warn"
                              ? "bg-[#FFFBEB] border-[#F59E0B]/30 text-[#B45309]"
                              : "bg-[#F0FDF4] border-[#86EFAC]/40 text-[#16A34A]"
                        }`}
                        title={
                          billingDateLabel
                            ? `Next bill: ${billingDateLabel}`
                            : undefined
                        }
                      >
                        <Clock className="h-3 w-3" />
                        {rowCountdown.label}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-[12px] text-[#6B7280]">
                    {m.email || "no email"}
                    {hasCode && (
                      <>
                        {" · "}
                        <span className="font-mono text-[11.5px] text-[#9CA3AF]">
                          {m.subscriptionCode}
                        </span>
                      </>
                    )}
                    {billingDateLabel && (
                      <>
                        {" · "}
                        <span className="text-[11.5px] text-[#9CA3AF]">
                          Next bill {billingDateLabel}
                        </span>
                      </>
                    )}
                  </p>
                  <p className="mt-1.5 text-[11.5px] text-[#9CA3AF]">
                    {hasCode
                      ? "Subscription code stored — retry auto-cancel first; if that fails, mark resolved after cancelling on Paystack."
                      : "No subscription code stored (legacy member). Cancel on Paystack manually, then mark resolved."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 shrink-0">
                  {hasCode && (
                    <button
                      type="button"
                      onClick={() => handle(m.id, "retry")}
                      disabled={isBusy}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#46CDCF]/30 bg-[#46CDCF]/10 px-3 py-1.5 text-[11.5px] font-semibold text-[#0E7C8A] hover:bg-[#46CDCF]/20 disabled:opacity-50 transition-colors"
                    >
                      {isBusy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3.5 w-3.5" />
                      )}
                      Retry auto-cancel
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handle(m.id, "mark-done")}
                    disabled={isBusy}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#0B1933]/15 bg-[#0B1933] px-3 py-1.5 text-[11.5px] font-semibold text-white hover:bg-[#0F2040] disabled:opacity-50 transition-colors"
                  >
                    {isBusy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    Mark as resolved
                  </button>
                </div>
              </div>
              {err && (
                <div className="mt-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11.5px] text-red-700 flex items-start gap-2">
                  <ShieldOff className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{err}</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
}
