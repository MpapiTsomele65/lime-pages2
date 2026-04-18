"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Clock } from "lucide-react";

interface StepPaymentProps {
  memberId: string;
  memberNumber?: number;
  plan: string;
  fullName: string;
  onNext: (data: { reference: string }) => void;
  onSkip: () => void;
}

const PLAN_DETAILS: Record<
  string,
  { name: string; total: string; fee: string | null; payment: string; color: string }
> = {
  basic: {
    name: "Basic",
    total: "R1,000/month",
    fee: null,
    payment: "Manual EFT",
    color: "lime",
  },
  standard: {
    name: "Standard",
    total: "R1,019.90/month",
    fee: "R19.90 collection fee",
    payment: "Automated Debit Order",
    color: "teal",
  },
  vip: {
    name: "VIP",
    total: "R1,099/month",
    fee: "R99 platform fee",
    payment: "Automated Debit Order",
    color: "purple",
  },
};

const ALLOCATION = [
  { label: "Sum1 Investments", pct: "40%", color: "bg-lime" },
  { label: "Cash Reserve", pct: "40%", color: "bg-teal" },
  { label: "SA Bonds", pct: "10%", color: "bg-white/40" },
  { label: "SV Capital", pct: "10%", color: "bg-pink" },
];

const BANK_DETAILS = {
  bank: "Capitec Business",
  accountName: "Lime Pages (Pty) Ltd",
  accountNumber: "1054737347",
  branchCode: "470010",
  accountType: "Current / Cheque",
  swift: "CABLZAJJ",
};

export function StepPayment({
  memberNumber,
  plan,
  fullName,
  onNext,
  onSkip,
}: StepPaymentProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const planInfo = PLAN_DETAILS[plan] || PLAN_DETAILS.standard;
  const isBasic = plan === "basic";

  // Build EFT reference: e.g. "LHM-007-THABO"
  const eftReference = memberNumber
    ? `LHM-${String(memberNumber).padStart(3, "0")}-${fullName.split(" ")[0].toUpperCase()}`
    : `LHM-${fullName.split(" ")[0].toUpperCase()}`;

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  // Basic plan confirmed EFT — skip to confirmation
  function handleEftConfirm() {
    onNext({ reference: `EFT-${eftReference}` });
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-white mb-2">Payment</h2>
        <p className="text-white/50 text-sm leading-relaxed">
          Your account has been created!{" "}
          {isBasic
            ? "Use the bank details below to make your first R1,000 EFT contribution."
            : "Set up your automated debit order to activate your membership."}
        </p>
      </div>

      {/* Plan + Amount Summary */}
      <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.08]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/50 font-medium">{planInfo.name} Plan</span>
            <span className="text-xs bg-lime/10 text-lime px-2.5 py-0.5 rounded-full font-bold">
              {planInfo.total}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-white/50 font-medium">Monthly Contribution</span>
            <span className="text-3xl font-extrabold text-lime">R1,000</span>
          </div>
          {planInfo.fee && <p className="text-xs text-white/35 mt-1">+ {planInfo.fee}</p>}
          <p className="text-xs text-white/35 mt-1">via {planInfo.payment}</p>
        </div>

        {/* Allocation Breakdown */}
        <div className="px-6 py-5">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">
            Investment Allocation
          </p>
          <div className="flex rounded-full overflow-hidden h-2.5 mb-5">
            <div className="bg-lime" style={{ width: "40%" }} />
            <div className="bg-teal" style={{ width: "40%" }} />
            <div className="bg-white/40" style={{ width: "10%" }} />
            <div className="bg-pink" style={{ width: "10%" }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {ALLOCATION.map((item) => (
              <div key={item.label} className="flex items-center gap-2.5">
                <div className={`w-2.5 h-2.5 rounded-full ${item.color} flex-shrink-0`} />
                <div>
                  <span className="text-xs text-white/70 font-medium">{item.label}</span>
                  <span className="text-xs text-white/35 ml-1.5">{item.pct}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Basic Plan: EFT Bank Details ── */}
      {isBasic && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white/[0.04] border border-lime/15 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/[0.08] bg-lime/[0.04]">
            <p className="text-sm font-bold text-lime">EFT Bank Details</p>
            <p className="text-xs text-white/40 mt-0.5">
              Transfer R1,000 to the account below on the 1st of each month
            </p>
          </div>

          <div className="px-6 py-4 space-y-3">
            {[
              { label: "Bank", value: BANK_DETAILS.bank },
              { label: "Account Name", value: BANK_DETAILS.accountName },
              { label: "Account Number", value: BANK_DETAILS.accountNumber },
              { label: "Branch Code", value: BANK_DETAILS.branchCode },
              { label: "Account Type", value: BANK_DETAILS.accountType },
              { label: "SWIFT / BIC", value: BANK_DETAILS.swift },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-white/35 font-medium uppercase tracking-wide">
                    {row.label}
                  </p>
                  <p className="text-sm text-white font-semibold">{row.value}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(row.value, row.label)}
                  className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
                  aria-label={`Copy ${row.label}`}
                >
                  {copied === row.label ? (
                    <Check className="w-4 h-4 text-lime" />
                  ) : (
                    <Copy className="w-4 h-4 text-white/30" />
                  )}
                </button>
              </div>
            ))}

            {/* EFT Reference */}
            <div className="mt-2 pt-3 border-t border-white/[0.08]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-lime/70 font-bold uppercase tracking-wide">
                    Your Payment Reference
                  </p>
                  <p className="text-base text-lime font-extrabold tracking-wide">{eftReference}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(eftReference, "reference")}
                  className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
                  aria-label="Copy reference"
                >
                  {copied === "reference" ? (
                    <Check className="w-4 h-4 text-lime" />
                  ) : (
                    <Copy className="w-4 h-4 text-white/30" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-white/35 mt-1">
                Always use this reference so we can match your payment to your account.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Standard / VIP: Coming Soon ── */}
      {!isBasic && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white/[0.04] border border-teal/20 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/[0.08] bg-teal/[0.05]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal/15 flex items-center justify-center">
                <Clock className="w-4 h-4 text-teal" />
              </div>
              <div>
                <p className="text-sm font-bold text-teal">
                  Automated Debit Order — Coming Soon
                </p>
                <p className="text-[11px] text-white/40 mt-0.5">
                  Launching in the next few weeks
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 space-y-3">
            <p className="text-sm text-white/70 leading-relaxed">
              Your {planInfo.name} plan is reserved. We&apos;re finalising our
              payment provider verification and will email you as soon as
              debit order setup is live — usually within 2&ndash;3 weeks.
            </p>

            <ul className="space-y-2 pt-1">
              <li className="flex items-start gap-2.5 text-xs text-white/55">
                <Check className="w-3.5 h-3.5 text-teal shrink-0 mt-0.5" strokeWidth={2.5} />
                <span>Your founding-member spot is secured</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-white/55">
                <Check className="w-3.5 h-3.5 text-teal shrink-0 mt-0.5" strokeWidth={2.5} />
                <span>We&apos;ll reach out within 48 hours to confirm details</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-white/55">
                <Check className="w-3.5 h-3.5 text-teal shrink-0 mt-0.5" strokeWidth={2.5} />
                <span>
                  Or switch to <strong className="text-lime">Basic</strong> to start
                  immediately via manual EFT
                </span>
              </li>
            </ul>
          </div>
        </motion.div>
      )}

      {/* ── Buttons ── */}
      <div className="pt-4 flex flex-col sm:flex-row gap-3">
        {isBasic ? (
          /* Basic: Confirm EFT has been / will be done */
          <button
            type="button"
            onClick={handleEftConfirm}
            className="bg-lime text-navy font-bold rounded-full px-8 py-3.5 text-sm transition-all w-full sm:w-auto cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(184,255,0,0.3)]"
          >
            I&apos;ve Noted the Details — Continue
          </button>
        ) : (
          /* Standard / VIP: Acknowledge coming-soon and proceed */
          <button
            type="button"
            onClick={onSkip}
            className="bg-lime text-navy font-bold rounded-full px-8 py-3.5 text-sm transition-all w-full sm:w-auto cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(184,255,0,0.3)]"
          >
            Continue — keep me posted
          </button>
        )}
      </div>
    </motion.div>
  );
}
