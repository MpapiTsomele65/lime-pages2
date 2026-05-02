"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRightLeft, Check, Clock, Copy, CreditCard } from "lucide-react";

import {
  formatMemberNumber,
  type MemberPlan,
} from "@/lib/definitions";

interface SetUpPaymentsCardProps {
  /** Member's chosen plan tier (basic / standard / vip). Falls back to
   *  "standard" when the field hasn't been parsed out of notes yet —
   *  legacy members onboarded before plan capture, or notes that don't
   *  match the regex. Standard is the recommended default tier. */
  plan: MemberPlan;
  memberId: string;
  /** Used to address the member in the welcome line + as the
   *  identifier on the Paystack init payload. */
  email: string;
  fullName: string;
  /** Used to build the EFT reference — `LHM-007-FIRSTNAME` — so manual
   *  EFTs can be reconciled without ambiguity. */
  memberNumber?: number;
}

const PLAN_DETAILS: Record<
  MemberPlan,
  { name: string; monthly: string; fee: string | null; payment: string }
> = {
  basic: {
    name: "Basic",
    monthly: "R1,000/month",
    fee: null,
    payment: "Manual EFT",
  },
  standard: {
    name: "Standard",
    monthly: "R1,020/month",
    fee: "2% service fee",
    payment: "Automated Debit Order",
  },
  vip: {
    name: "VIP",
    monthly: "R1,050/month",
    fee: "5% service fee",
    payment: "Automated Debit Order",
  },
};

const BANK_DETAILS = {
  bank: "Capitec Business",
  accountName: "Lime Pages (Pty) Ltd",
  accountNumber: "1054737347",
  branchCode: "470010",
  accountType: "Current / Cheque",
  swift: "CABLZAJJ",
};

/**
 * First-payment setup card on the member portal.
 *
 * Shown only when:
 *   - Member's KYC has been verified (kycStatus === "Complete"), AND
 *   - No contributions are on file yet (i.e., they haven't paid their
 *     first month).
 *
 * Once the first contribution lands — by Paystack debit-order success
 * webhook for standard/vip, or by admin reconciliation for basic — the
 * gate flips closed and PaymentCard takes over for the per-month
 * payment cadence.
 *
 * This is the post-onboarding equivalent of the old StepPayment wizard
 * step. The wizard was simplified in May 2026 to drop bank-detail
 * capture from the signup ceremony — members commit a plan during
 * onboarding, but the actual payment configuration happens here on
 * the portal once they trust the platform enough to hand over card
 * details.
 */
export function SetUpPaymentsCard({
  plan,
  memberId,
  email,
  fullName,
  memberNumber,
}: SetUpPaymentsCardProps) {
  const router = useRouter();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isStartingPaystack, setIsStartingPaystack] = useState(false);
  const [paystackError, setPaystackError] = useState<string | null>(null);
  const [isSwitchingPlan, setIsSwitchingPlan] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const planInfo = PLAN_DETAILS[plan];
  const isBasic = plan === "basic";
  const isStandard = plan === "standard";
  const isVip = plan === "vip";

  /**
   * Switch the member's plan tier server-side. Updates the notes blob
   * via /api/lehumo/portal/member/plan; on success we router.refresh()
   * so DashboardOverview re-renders this card with the new plan
   * variant (Basic ↔ Standard).
   *
   * Available only pre-first-payment — once a member has paid a
   * contribution, the server-side route 409s with an email-the-admin
   * message and we surface that as a switchError.
   */
  async function handleSwitchPlan(target: MemberPlan) {
    if (target === plan || isSwitchingPlan) return;
    setIsSwitchingPlan(true);
    setSwitchError(null);
    try {
      const res = await fetch("/api/lehumo/portal/member/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: target }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.error ||
            "Could not switch plan. Please try again or email lehumo@limepages.co.za.",
        );
      }
      // Re-fetch the page so DashboardOverview re-mounts this card
      // with the new plan variant. router.refresh() picks up the
      // notes-blob change without a full reload.
      router.refresh();
    } catch (err) {
      setSwitchError(
        err instanceof Error
          ? err.message
          : "Something went wrong switching your plan.",
      );
      setIsSwitchingPlan(false);
    }
  }

  // EFT reference: LHM-007-FIRSTNAME. Mirrors the wizard's StepPayment
  // pattern so admins reconciling EFTs see the same shape members got
  // during onboarding's old payment step. The member-number prefix +
  // first name combo is unique enough across a 30-90 person founding
  // cohort to disambiguate transfers without exposing more PII.
  const firstName = fullName.split(" ")[0] || "MEMBER";
  const eftReference = memberNumber
    ? `LHM-${formatMemberNumber(memberNumber).replace("Leh", "").padStart(3, "0")}-${firstName.toUpperCase()}`
    : `LHM-${firstName.toUpperCase()}`;

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2000);
    });
  }

  /**
   * Start the Paystack debit-order setup ceremony. Calls our /init route
   * which mints a Paystack subscription URL, then redirects the browser
   * off-site. Paystack handles card tokenisation + first charge in one
   * hosted page, then bounces back to /lehumo/onboard?step=confirm with
   * a verification reference. The wizard's StepConfirmation handles that
   * callback and shows the post-payment success state.
   */
  async function handleStandardSubscribe() {
    setIsStartingPaystack(true);
    setPaystackError(null);
    try {
      const res = await fetch("/api/lehumo/paystack/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          memberRecordId: memberId,
          plan,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.authorization_url) {
        throw new Error(
          data.error ||
            "Could not start payment setup. Please try again or email lehumo@limepages.co.za.",
        );
      }
      window.location.href = data.authorization_url;
    } catch (err) {
      setPaystackError(
        err instanceof Error
          ? err.message
          : "Something went wrong starting your payment setup.",
      );
      setIsStartingPaystack(false);
    }
  }

  return (
    <motion.div
      id="set-up-payments"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      className="scroll-mt-24 rounded-[24px] border border-[#B8FF00]/25 bg-gradient-to-br from-[#B8FF00]/[0.08] via-[#10224a] to-[#0F2040] shadow-[inset_0_1px_0_0_rgba(184,255,0,0.10),0_1px_2px_0_rgba(0,0,0,0.20),0_12px_40px_-8px_rgba(184,255,0,0.15)] overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/[0.06]">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#B8FF00]">
              Action Required
            </p>
            <h2 className="text-lg font-semibold text-white mt-1">
              Set up your monthly contribution
            </h2>
            <p className="text-xs text-white/50 mt-1.5 max-w-md leading-relaxed">
              Your KYC is verified — last step is configuring your first
              contribution. Once this is done, payments run automatically.
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-[#B8FF00]/15 px-2.5 py-1 text-[11px] font-bold text-[#B8FF00]">
            {planInfo.name} · {planInfo.monthly}
          </span>
        </div>
      </div>

      {/* Plan summary line */}
      <div className="px-6 py-4 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between flex-wrap gap-2">
        <div className="text-xs text-white/55">
          via{" "}
          <span className="text-white/80 font-semibold">{planInfo.payment}</span>
          {planInfo.fee ? (
            <span className="text-white/40"> · {planInfo.fee}</span>
          ) : null}
        </div>
      </div>

      {/* Body — variant per plan */}
      <div className="p-6 space-y-5">
        {/* ── Basic: EFT bank details ── */}
        {isBasic && (
          <>
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
              <div className="px-5 py-3 border-b border-white/[0.06] bg-[#B8FF00]/[0.04]">
                <p className="text-sm font-bold text-[#B8FF00]">
                  EFT Bank Details
                </p>
                <p className="text-[11px] text-white/40 mt-0.5">
                  Transfer R1,000 to the account below on the 1st of each month
                </p>
              </div>
              <div className="px-5 py-4 space-y-3">
                {[
                  { label: "Bank", value: BANK_DETAILS.bank },
                  { label: "Account Name", value: BANK_DETAILS.accountName },
                  {
                    label: "Account Number",
                    value: BANK_DETAILS.accountNumber,
                  },
                  { label: "Branch Code", value: BANK_DETAILS.branchCode },
                  { label: "Account Type", value: BANK_DETAILS.accountType },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-[10px] text-white/35 font-medium uppercase tracking-wide">
                        {row.label}
                      </p>
                      <p className="text-sm text-white font-semibold">
                        {row.value}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(row.value, row.label)}
                      className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
                      aria-label={`Copy ${row.label}`}
                    >
                      {copiedField === row.label ? (
                        <Check className="w-4 h-4 text-[#B8FF00]" />
                      ) : (
                        <Copy className="w-4 h-4 text-white/30" />
                      )}
                    </button>
                  </div>
                ))}

                {/* EFT reference — surface it loudly because it's the
                    only mechanism admins have to reconcile your transfer
                    against your member record. */}
                <div className="mt-2 pt-3 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#B8FF00]/70 font-bold uppercase tracking-wide">
                        Your Payment Reference
                      </p>
                      <p className="text-base text-[#B8FF00] font-extrabold tracking-wide">
                        {eftReference}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(eftReference, "reference")
                      }
                      className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
                      aria-label="Copy reference"
                    >
                      {copiedField === "reference" ? (
                        <Check className="w-4 h-4 text-[#B8FF00]" />
                      ) : (
                        <Copy className="w-4 h-4 text-white/30" />
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-white/35 mt-1">
                    Always use this reference so we can match your payment
                    to your account. Without it, reconciliation can take
                    several days.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs text-white/45 leading-relaxed">
              Once your transfer reflects, an admin will mark it received
              within 24 hours and your member status flips to{" "}
              <span className="text-white/70 font-semibold">Active</span>.
            </p>
          </>
        )}

        {/* ── Standard: Paystack debit order setup ── */}
        {isStandard && (
          <>
            <div className="rounded-xl bg-white/[0.04] border border-[#46CDCF]/20 overflow-hidden">
              <div className="px-5 py-3 border-b border-white/[0.06] bg-[#46CDCF]/[0.05]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#46CDCF]/15 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-[#46CDCF]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#46CDCF]">
                      Paystack debit order
                    </p>
                    <p className="text-[11px] text-white/40 mt-0.5">
                      Set it once — auto-debit R1,020 every month
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-white/70 leading-relaxed">
                  Click below to set up your debit order on Paystack&apos;s
                  secure checkout. Your first R1,020 contribution is
                  charged today, and Paystack auto-debits the same amount on
                  the same date every month after that.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-start gap-2.5 text-xs text-white/55">
                    <Check
                      className="w-3.5 h-3.5 text-[#46CDCF] shrink-0 mt-0.5"
                      strokeWidth={2.5}
                    />
                    <span>
                      Paystack-secured — Lime Pages never sees your card
                      details
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-white/55">
                    <Check
                      className="w-3.5 h-3.5 text-[#46CDCF] shrink-0 mt-0.5"
                      strokeWidth={2.5}
                    />
                    <span>Cancel or change cards anytime from this portal</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-white/55">
                    <Check
                      className="w-3.5 h-3.5 text-[#46CDCF] shrink-0 mt-0.5"
                      strokeWidth={2.5}
                    />
                    <span>
                      R1,000 invested + 2% service fee — fully
                      transparent
                    </span>
                  </li>
                </ul>
              </div>
            </div>
            {paystackError && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {paystackError}
              </div>
            )}
            <button
              type="button"
              onClick={handleStandardSubscribe}
              disabled={isStartingPaystack}
              className="w-full sm:w-auto bg-[#B8FF00] text-[#0B1933] font-bold rounded-full px-8 py-3.5 text-sm transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(184,255,0,0.3)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2"
            >
              {isStartingPaystack ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Redirecting to Paystack…
                </>
              ) : (
                <>Subscribe — R1,020/month</>
              )}
            </button>
          </>
        )}

        {/* ── VIP: coming soon placeholder ── */}
        {isVip && (
          <div className="rounded-xl bg-white/[0.04] border border-[#A855F7]/25 overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.06] bg-[#A855F7]/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#A855F7]/15 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[#A855F7]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#A855F7]">
                    VIP plan — coming soon
                  </p>
                  <p className="text-[11px] text-white/40 mt-0.5">
                    Inner-circle launch in a few weeks
                  </p>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 text-sm text-white/65 leading-relaxed">
              Your VIP spot is reserved. We&apos;re finalising the inner-circle
              benefits (private WhatsApp group, Lime Connect listing,
              leadership access) and we&apos;ll email you the moment VIP
              enrolment is live — typically within 2–3 weeks. Want to
              start contributing now? Use the &ldquo;Switch plan&rdquo;
              option below to drop down to Standard or Basic for
              immediate setup.
            </div>
          </div>
        )}

        {/* ── Plan switcher footer ────────────────────────────────────
            Available pre-first-payment so members can change their
            mind — e.g. picked Standard during onboarding, sees the
            2% service fee, decides Basic EFT is more their
            speed. Hides the option for the current plan. The server
            blocks switches once the first contribution lands and
            surfaces an email-the-admin path. */}
        <div className="pt-2 border-t border-white/[0.06] flex flex-col gap-2">
          <p className="text-[11px] uppercase tracking-wider text-white/40 font-semibold flex items-center gap-1.5">
            <ArrowRightLeft className="w-3 h-3" />
            Changed your mind?
          </p>
          <div className="flex flex-wrap gap-2">
            {!isBasic && (
              <button
                type="button"
                onClick={() => handleSwitchPlan("basic")}
                disabled={isSwitchingPlan}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] px-3.5 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/[0.08] hover:text-white disabled:opacity-50 transition-colors"
              >
                Switch to Basic · R1,000 EFT
              </button>
            )}
            {!isStandard && (
              <button
                type="button"
                onClick={() => handleSwitchPlan("standard")}
                disabled={isSwitchingPlan}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#46CDCF]/20 bg-[#46CDCF]/[0.05] px-3.5 py-1.5 text-xs font-semibold text-[#46CDCF] hover:bg-[#46CDCF]/[0.12] disabled:opacity-50 transition-colors"
              >
                Switch to Standard · R1,020 debit
              </button>
            )}
          </div>
          {switchError && (
            <p className="text-xs text-red-400 mt-1">{switchError}</p>
          )}
          <p className="text-[10px] text-white/35 leading-relaxed">
            You can switch tiers any time before your first
            contribution. After that, plan changes go through admin
            (email{" "}
            <a
              href="mailto:lehumo@limepages.co.za"
              className="text-[#46CDCF] hover:underline"
            >
              lehumo@limepages.co.za
            </a>
            ) so we can coordinate any active debit order.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
