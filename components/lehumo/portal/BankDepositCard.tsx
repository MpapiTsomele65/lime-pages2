"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Check, Copy, Landmark, ShieldCheck } from "lucide-react";

import {
  formatEftReference,
  LEHUMO_BANK_DETAILS,
  type LehumoMember,
} from "@/lib/definitions";
import { PortalCard } from "./PortalCard";

/**
 * Bank deposit / EFT instructions for members who want to pay manually
 * (Basic plan = always manual; Standard members occasionally if their
 * card is having issues).
 *
 * Every member sees their own personalised reference (`Leh01 M.Tsomele`
 * style), generated client-side from their member number + name. Every
 * copyable field has a click-to-copy affordance with a brief "Copied"
 * confirmation so admins reconciling these payments by hand on the
 * bank statement get clean, exact references — no fat-fingered free-text.
 *
 * Bank fields are hard-coded constants because they're a single trust
 * account, not member-specific. If/when the trust ever changes bank,
 * one constant block change carries the whole portal.
 */

// Bank details now live in lib/definitions as LEHUMO_BANK_DETAILS so the
// Make-Payment method chooser shares one source of truth.
const BANK_DETAILS = LEHUMO_BANK_DETAILS;

interface BankDepositCardProps {
  member: LehumoMember;
}

export function BankDepositCard({ member }: BankDepositCardProps) {
  const reference = formatEftReference(member.memberNumber, member.fullName);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    });
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      id="bank-deposit"
      className="scroll-mt-24"
      aria-labelledby="bank-deposit-title"
    >
      <PortalCard className="p-6 md:p-7">
        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#46CDCF]/15 text-[#46CDCF]">
            <Landmark className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60 mb-1">
              Pay by bank deposit
            </p>
            <h2
              id="bank-deposit-title"
              className="text-[17px] font-semibold tracking-tight text-white leading-tight"
            >
              Manual EFT details
            </h2>
            <p className="mt-1 text-[12.5px] text-white/55 leading-relaxed">
              Use these details if you prefer to pay by EFT instead of an
              automatic debit order. R1,000 covers one month;{" "}
              multi-month deposits (e.g. R2,000) auto-allocate to the
              next due months once we reconcile.
            </p>
          </div>
        </div>

        {/* Reference — the highest-priority field on the card. Members
            who get this wrong cause admin recon pain, so it gets its
            own lime-tinted block with a prominent copy button + a
            warning line about using it exactly. */}
        <div className="rounded-[16px] border border-[#B8FF00]/25 bg-gradient-to-br from-[#B8FF00]/[0.07] to-[#46CDCF]/[0.03] p-5 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-4 w-4 text-[#B8FF00] shrink-0" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B8FF00]">
              Your reference (use EXACTLY)
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-[22px] md:text-[24px] font-semibold tracking-tight text-white font-mono leading-tight">
              {reference}
            </p>
            <CopyButton
              onClick={() => copy(reference, "reference")}
              copied={copiedKey === "reference"}
              size="lg"
            />
          </div>
          <p className="mt-3 text-[11.5px] text-white/55 leading-relaxed">
            This reference is how we match your deposit to your account.
            Without it we can&rsquo;t guarantee allocation to your record —
            payments without a reference go into a queue for manual
            investigation.
          </p>
        </div>

        {/* Bank details — laid out as a definition list so each label/
            value pair reads as a self-contained row. Copy buttons only
            on the fields admins/members typically fat-finger (account
            number, branch code, SWIFT). */}
        <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/[0.06]">
            <Building2 className="h-4 w-4 text-white/60 shrink-0" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
              Account details
            </span>
          </div>
          <dl className="space-y-3">
            <Row label="Account holder" value={BANK_DETAILS.accountHolder} />
            <Row label="Bank" value={BANK_DETAILS.bankName} />
            <Row
              label="Account number"
              value={BANK_DETAILS.accountNumber}
              monospace
              copyable
              copied={copiedKey === "account"}
              onCopy={() =>
                copy(BANK_DETAILS.accountNumber.replace(/\s/g, ""), "account")
              }
            />
            <Row
              label="Branch code"
              value={BANK_DETAILS.branchCode}
              monospace
              copyable
              copied={copiedKey === "branch"}
              onCopy={() => copy(BANK_DETAILS.branchCode, "branch")}
              hint="Universal — works from any SA bank"
            />
            <Row label="Account type" value={BANK_DETAILS.accountType} />
            <Row
              label="SWIFT / BIC"
              value={BANK_DETAILS.swift}
              monospace
              copyable
              copied={copiedKey === "swift"}
              onCopy={() => copy(BANK_DETAILS.swift, "swift")}
              hint="Only needed for international transfers"
            />
          </dl>
        </div>

        {/* Light footer — sets expectations on timing + how the row
            updates. Members get jittery when an EFT doesn't reflect
            instantly; this preempts the support email. */}
        <p className="mt-4 text-[11.5px] text-white/60 leading-relaxed">
          EFTs typically reflect within 1 business day. Once reconciled,
          your portal updates automatically and you&rsquo;ll see the
          month(s) light up below.
        </p>
      </PortalCard>
    </motion.section>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Internal — kept local so the card stays a single-file primitive.
// ──────────────────────────────────────────────────────────────────────

function Row({
  label,
  value,
  monospace,
  copyable,
  copied,
  onCopy,
  hint,
}: {
  label: string;
  value: string;
  monospace?: boolean;
  copyable?: boolean;
  copied?: boolean;
  onCopy?: () => void;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <dt className="text-[11px] uppercase tracking-wider text-white/60 mb-0.5">
          {label}
        </dt>
        <dd
          className={`text-[14px] text-white ${monospace ? "font-mono tracking-wide" : "font-medium"}`}
        >
          {value}
        </dd>
        {hint && (
          <p className="mt-0.5 text-[10.5px] text-white/60">{hint}</p>
        )}
      </div>
      {copyable && onCopy && (
        <CopyButton onClick={onCopy} copied={copied ?? false} size="sm" />
      )}
    </div>
  );
}

function CopyButton({
  onClick,
  copied,
  size,
}: {
  onClick: () => void;
  copied: boolean;
  size: "sm" | "lg";
}) {
  const dims =
    size === "lg"
      ? "px-3.5 py-2 text-[12px] gap-2"
      : "px-2.5 py-1 text-[11px] gap-1.5";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full border font-semibold transition-colors shrink-0 ${dims} ${
        copied
          ? "border-[#B8FF00]/40 bg-[#B8FF00]/[0.12] text-[#B8FF00]"
          : "border-white/[0.1] bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white"
      }`}
      aria-label={copied ? "Copied" : "Copy"}
    >
      {copied ? (
        <>
          <Check className={size === "lg" ? "h-4 w-4" : "h-3 w-3"} />
          Copied
        </>
      ) : (
        <>
          <Copy className={size === "lg" ? "h-4 w-4" : "h-3 w-3"} />
          Copy
        </>
      )}
    </button>
  );
}
