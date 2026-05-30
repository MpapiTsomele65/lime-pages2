"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Settings2,
  Wallet,
} from "lucide-react";

import {
  formatMemberNumber,
  type LehumoMember,
  type MemberPlan,
} from "@/lib/definitions";

import { PortalCard } from "./PortalCard";

/**
 * Always-available plan management card.
 *
 * Previously the plan switcher lived inside SetUpPaymentsCard, which
 * retires the moment a member's first contribution lands. Once that
 * card disappeared, members had no way to pause their auto-debit and
 * switch to manual EFT without emailing admin — and we want self-
 * service control over the payment method, not a support ticket.
 *
 * This card sits in the dashboard for any member who's past their
 * first payment. It exposes a single primary action: flip between
 * Standard (Paystack auto-debit) and Basic (manual EFT). VIP stays
 * coming-soon for now.
 *
 * Paystack subscription cancellation caveat: we don't currently
 * persist the `subscription_code` returned when a Standard member
 * subscribes, so when a member downgrades to Basic we can't disable
 * the recurring charge on Paystack's side programmatically. The
 * server response includes `requiresAdminCancelSubscription` for the
 * Standard → Basic + has-paid path; we surface a clear message and a
 * pre-filled mailto so the member loops admin in with one click.
 * Once we capture subscription codes in the webhook + Airtable, this
 * caveat goes away and the cancellation becomes automatic.
 */

interface PlanManagementCardProps {
  member: LehumoMember;
}

interface SwitchResponse {
  ok: boolean;
  plan?: MemberPlan;
  previousPlan?: MemberPlan | null;
  subscriptionAutoCancelled?: boolean;
  requiresAdminCancelSubscription?: boolean;
  error?: string;
}

const PLAN_LABELS: Record<MemberPlan, string> = {
  basic: "Basic",
  standard: "Standard",
  vip: "VIP",
};

const PLAN_DESCRIPTIONS: Record<MemberPlan, string> = {
  basic: "Manual EFT · R1,000/month · You control the timing",
  standard: "Automatic debit · R1,035/month · 3.5% service fee (covers Paystack collection cost)",
  vip: "Coming soon · R1,050/month · 5% service fee",
};

export function PlanManagementCard({ member }: PlanManagementCardProps) {
  const router = useRouter();
  const currentPlan: MemberPlan = member.plan ?? "standard";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Confirmation state — populated immediately after a successful
  // switch so the member sees what just happened + the
  // admin-cancellation handoff (when relevant). Cleared on next
  // switch or via the dismiss action.
  const [confirmation, setConfirmation] = useState<{
    target: MemberPlan;
    requiresAdminCancel: boolean;
    autoCancelled: boolean;
  } | null>(null);

  async function handleSwitch(target: MemberPlan) {
    if (busy || target === currentPlan) return;
    if (target === "vip") {
      // VIP is gated until the plan code + processing exist on
      // Paystack — keep the option visually present but explain why
      // it doesn't work yet.
      setError(
        "VIP is coming soon — we'll open it up once Paystack processing is live.",
      );
      return;
    }
    setBusy(true);
    setError(null);
    setConfirmation(null);
    try {
      const res = await fetch("/api/lehumo/portal/member/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: target }),
      });
      const data = (await res.json().catch(() => ({}))) as SwitchResponse;
      if (!res.ok || !data.ok) {
        throw new Error(
          data.error ||
            "Could not switch your plan. Please try again or email lehumo@limepages.co.za.",
        );
      }
      setConfirmation({
        target,
        requiresAdminCancel: Boolean(data.requiresAdminCancelSubscription),
        autoCancelled: Boolean(data.subscriptionAutoCancelled),
      });
      // Refresh so the rest of the dashboard (SetUpPaymentsCard if
      // present, MemberProfileCard, etc.) re-renders with the new
      // plan tier. Doesn't lose this card's confirmation state because
      // the state is local to the card.
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong switching your plan.",
      );
    } finally {
      setBusy(false);
    }
  }

  // Pre-filled email so members downgrading to Basic can loop admin
  // in with one click to cancel their Paystack auto-debit.
  const adminCancelMailto = `mailto:lehumo@limepages.co.za?subject=${encodeURIComponent(
    `Cancel Paystack auto-debit — ${formatMemberNumber(member.memberNumber)} ${member.fullName}`,
  )}&body=${encodeURIComponent(
    `Hi Lehumo team,\n\nI've switched my plan from Standard to Basic on the member portal.\nPlease cancel my Paystack auto-debit subscription so the next charge doesn't run.\n\nMember: ${formatMemberNumber(member.memberNumber)} — ${member.fullName}\nEmail: ${member.email}\n\nThanks,\n${member.fullName}`,
  )}`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      id="plan-management"
      className="scroll-mt-24"
      aria-labelledby="plan-management-title"
    >
      <PortalCard className="p-6 md:p-7">
        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#46CDCF]/15 text-[#46CDCF]">
            <Settings2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-1">
              Plan management
            </p>
            <h2
              id="plan-management-title"
              className="text-[17px] font-semibold tracking-tight text-white leading-tight"
            >
              Your contribution plan
            </h2>
            <p className="mt-1 text-[12.5px] text-white/55 leading-relaxed">
              Pause your auto-debit and switch to manual EFT, or jump
              back to automated debit whenever you&rsquo;re ready. Plan
              changes apply to future months only — historical
              contributions stay tagged with the plan that was active
              when they landed.
            </p>
          </div>
        </div>

        {/* Current plan banner */}
        <div className="rounded-[16px] border border-[#B8FF00]/20 bg-[#B8FF00]/[0.05] p-4 mb-5">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="h-4 w-4 text-[#B8FF00] shrink-0" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B8FF00]">
              Current plan
            </span>
          </div>
          <p className="text-[18px] font-semibold tracking-tight text-white">
            {PLAN_LABELS[currentPlan]}
          </p>
          <p className="mt-0.5 text-[12px] text-white/55">
            {PLAN_DESCRIPTIONS[currentPlan]}
          </p>
        </div>

        {/* Switch options */}
        <div className="space-y-2.5">
          <PlanOption
            label={PLAN_LABELS.basic}
            description={PLAN_DESCRIPTIONS.basic}
            current={currentPlan === "basic"}
            disabled={busy}
            onClick={() => handleSwitch("basic")}
          />
          <PlanOption
            label={PLAN_LABELS.standard}
            description={PLAN_DESCRIPTIONS.standard}
            current={currentPlan === "standard"}
            disabled={busy}
            onClick={() => handleSwitch("standard")}
          />
          <PlanOption
            label={PLAN_LABELS.vip}
            description={PLAN_DESCRIPTIONS.vip}
            current={currentPlan === "vip"}
            disabled
            onClick={() => handleSwitch("vip")}
            badge="Soon"
          />
        </div>

        {/* Inline error — switch failed or VIP not yet available */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/[0.08] p-3 text-[13px] text-red-300">
            {error}
          </div>
        )}

        {/* Confirmation panel — shown after a successful switch.
            Branches on whether we need the admin to cancel the
            Paystack subscription (Standard → Basic with prior
            payment). */}
        {confirmation && (
          <div className="mt-4 rounded-xl border border-[#B8FF00]/25 bg-gradient-to-br from-[#B8FF00]/[0.06] to-[#46CDCF]/[0.04] p-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#B8FF00] mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-white">
                  Switched to {PLAN_LABELS[confirmation.target]}
                </p>
                {confirmation.autoCancelled ? (
                  <p className="mt-1.5 text-[12.5px] text-white/65 leading-relaxed">
                    Your Paystack auto-debit has been cancelled — no
                    further charges will run. Use the bank deposit
                    details below for your next contribution and
                    we&rsquo;ll allocate it on recon.
                  </p>
                ) : confirmation.requiresAdminCancel ? (
                  <>
                    <p className="mt-1.5 text-[12.5px] text-white/65 leading-relaxed">
                      Your Paystack auto-debit is still scheduled — we
                      couldn&rsquo;t cancel it from here automatically.
                      Email admin (one click below) and your next
                      auto-charge will be stopped within 24 hours. In
                      the meantime you can pay this month&rsquo;s
                      contribution via the bank deposit details below.
                    </p>
                    <a
                      href={adminCancelMailto}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#B8FF00]/40 bg-[#B8FF00]/[0.12] px-3.5 py-2 text-[12px] font-semibold text-[#B8FF00] hover:bg-[#B8FF00]/[0.18] transition-colors"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Email admin to cancel auto-debit
                    </a>
                  </>
                ) : confirmation.target === "standard" ? (
                  <p className="mt-1.5 text-[12.5px] text-white/65 leading-relaxed">
                    Set up your card next time you visit the dashboard
                    — the Paystack setup will appear on first paint
                    until your auto-debit is live.
                  </p>
                ) : (
                  <p className="mt-1.5 text-[12.5px] text-white/65 leading-relaxed">
                    Use the bank deposit details below for your next
                    monthly contribution. We&rsquo;ll allocate it
                    automatically when we reconcile.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </PortalCard>
    </motion.section>
  );
}

function PlanOption({
  label,
  description,
  current,
  disabled,
  onClick,
  badge,
}: {
  label: string;
  description: string;
  current: boolean;
  disabled: boolean;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || current}
      className={`group w-full flex items-center justify-between gap-3 rounded-[14px] border px-4 py-3 text-left transition-all ${
        current
          ? "border-[#B8FF00]/30 bg-[#B8FF00]/[0.06] cursor-default"
          : disabled
            ? "border-white/[0.06] bg-white/[0.02] opacity-50 cursor-not-allowed"
            : "border-white/[0.08] bg-white/[0.02] hover:border-[#46CDCF]/30 hover:bg-[#46CDCF]/[0.06] cursor-pointer"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {label === "Basic" ? (
            <Wallet className="h-3.5 w-3.5 text-white/45 shrink-0" />
          ) : (
            <CreditCard className="h-3.5 w-3.5 text-white/45 shrink-0" />
          )}
          <span className="text-[13.5px] font-semibold text-white">
            {label}
          </span>
          {badge && (
            <span className="inline-flex items-center rounded-full bg-white/[0.06] border border-white/[0.1] px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-white/50">
              {badge}
            </span>
          )}
          {current && (
            <span className="inline-flex items-center rounded-full bg-[#B8FF00]/[0.12] border border-[#B8FF00]/20 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-[#B8FF00]">
              Current
            </span>
          )}
        </div>
        <p className="mt-1 text-[11.5px] text-white/50 leading-relaxed">
          {description}
        </p>
      </div>
      {!current && !disabled && (
        <ArrowRight className="h-4 w-4 text-white/40 shrink-0 group-hover:text-[#46CDCF] group-hover:translate-x-0.5 transition-all" />
      )}
    </button>
  );
}
