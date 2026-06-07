"use client";

/**
 * PaymentMethodDialog — the "How would you like to pay?" chooser that
 * opens from the PaymentCard's Make Payment button. Presents the two
 * contribution routes side by side so the cost difference is explicit
 * at the moment of paying:
 *
 *   • Pay by card (Paystack) — R1,035. The R35 (3.5%) covers Paystack's
 *     collection fee so the member's full R1,000 reaches the trust.
 *     This card IS the "nudge before redirect" — the breakdown is shown
 *     before the member commits to the hosted checkout.
 *   • Manual EFT — R1,000, no processor fee. Shows the Capitec account
 *     details + the member's personalised reference (copy-to-clipboard),
 *     with a jump-link to the full Manual EFT card lower on the page.
 *
 * Dark modal matching the portal's navy palette; framer-motion
 * entrance; Esc / backdrop click to dismiss (locked while a Paystack
 * init is in flight so a stray click can't strand a half-started
 * redirect).
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Check,
  Copy,
  CreditCard,
  Landmark,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";

import { formatEftReference, LEHUMO_BANK_DETAILS } from "@/lib/definitions";

interface PaymentMethodDialogProps {
  open: boolean;
  onClose: () => void;
  memberNumber: number;
  fullName: string;
  /** Paystack init round-trip in flight (the card route). */
  loading: boolean;
  /** Error surfaced from the Paystack init attempt. */
  error: string;
  /** Fires the Paystack one-time charge incl. the R35 fee. */
  onPayByCard: () => void;
}

export function PaymentMethodDialog({
  open,
  onClose,
  memberNumber,
  fullName,
  loading,
  error,
  onPayByCard,
}: PaymentMethodDialogProps) {
  const reference = formatEftReference(memberNumber, fullName);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    });
  }

  // Esc to dismiss — but not mid-redirect.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, loading, onClose]);

  function jumpToFullEft() {
    onClose();
    // Defer so the modal unmount doesn't fight the scroll.
    requestAnimationFrame(() => {
      document
        .getElementById("bank-deposit")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-8 overflow-y-auto"
          onClick={() => !loading && onClose()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pay-method-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0F2040] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-start gap-3 p-6 border-b border-white/[0.06]">
              <div className="min-w-0 flex-1">
                <h2
                  id="pay-method-title"
                  className="text-lg font-semibold text-white"
                >
                  How would you like to pay?
                </h2>
                <p className="mt-1 text-[12.5px] text-white/55">
                  Your monthly contribution is{" "}
                  <span className="text-white font-medium">R1,000</span>. Card
                  payments add a small fee so the trust still nets the full
                  amount.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="text-white/40 hover:text-white disabled:opacity-40 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              {/* ── Card (Paystack) — R1,035 ───────────────────────── */}
              <div className="rounded-[16px] border border-[#B8FF00]/25 bg-gradient-to-br from-[#B8FF00]/[0.07] to-[#46CDCF]/[0.03] p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#B8FF00]/15 text-[#B8FF00]">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-white">
                        Pay by card
                      </p>
                      <span className="text-lg font-bold text-[#B8FF00]">
                        R1,035
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12px] text-white/55 leading-relaxed">
                      Instant via Paystack. R1,000 contribution + R35 (3.5%)
                      collection fee, so your full R1,000 reaches the trust.
                    </p>
                    <p className="mt-1.5 text-[11.5px] text-[#46CDCF]/90 leading-relaxed">
                      Rather not pay the fee? Use{" "}
                      <span className="font-semibold">Manual EFT</span> below —
                      R1,000 flat, no charge.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onPayByCard}
                  disabled={loading}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#B8FF00] py-2.5 px-5 text-sm font-bold text-[#0B1933] hover:bg-[#a8ef00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redirecting…
                    </>
                  ) : (
                    <>
                      Continue to Paystack
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>

              {/* ── Manual EFT — R1,000 ─────────────────────────────── */}
              <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.02] p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#46CDCF]/15 text-[#46CDCF]">
                    <Landmark className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-white">
                        Manual EFT
                      </p>
                      <span className="text-lg font-bold text-white">
                        R1,000
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12px] text-white/55 leading-relaxed">
                      No fee. Pay directly to the trust&rsquo;s Capitec account
                      using your reference below.
                    </p>
                  </div>
                </div>

                {/* Reference — the field members most often get wrong. */}
                <div className="mt-4 rounded-xl border border-[#B8FF00]/20 bg-[#B8FF00]/[0.05] px-3.5 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#B8FF00] shrink-0" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#B8FF00]">
                      Your reference (use exactly)
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[15px] font-semibold text-white font-mono">
                      {reference}
                    </span>
                    <CopyButton
                      onClick={() => copy(reference, "reference")}
                      copied={copiedKey === "reference"}
                    />
                  </div>
                </div>

                {/* Account essentials */}
                <dl className="mt-3 space-y-2">
                  <MiniRow
                    label="Account holder"
                    value={LEHUMO_BANK_DETAILS.accountHolder}
                  />
                  <MiniRow
                    label="Bank"
                    value={LEHUMO_BANK_DETAILS.bankName}
                  />
                  <MiniRow
                    label="Account number"
                    value={LEHUMO_BANK_DETAILS.accountNumber}
                    monospace
                    copied={copiedKey === "account"}
                    onCopy={() =>
                      copy(
                        LEHUMO_BANK_DETAILS.accountNumber.replace(/\s/g, ""),
                        "account",
                      )
                    }
                  />
                  <MiniRow
                    label="Branch code"
                    value={LEHUMO_BANK_DETAILS.branchCode}
                    monospace
                    copied={copiedKey === "branch"}
                    onCopy={() => copy(LEHUMO_BANK_DETAILS.branchCode, "branch")}
                  />
                </dl>

                <button
                  type="button"
                  onClick={jumpToFullEft}
                  className="mt-4 w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.03] py-2 px-4 text-[12.5px] font-semibold text-white/75 hover:bg-white/[0.07] hover:text-white transition-colors"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  Full details &amp; SWIFT
                </button>
              </div>

              {error && (
                <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-3.5 py-2.5">
                  <p className="text-[12.5px] text-red-300 leading-snug">
                    {error}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Internal primitives ─────────────────────────────────────────────

function MiniRow({
  label,
  value,
  monospace,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  monospace?: boolean;
  copied?: boolean;
  onCopy?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[11px] uppercase tracking-wider text-white/40">
        {label}
      </dt>
      <dd className="flex items-center gap-2 min-w-0">
        <span
          className={`text-[13px] text-white truncate ${monospace ? "font-mono tracking-wide" : "font-medium"}`}
        >
          {value}
        </span>
        {onCopy && (
          <CopyButton onClick={onCopy} copied={copied ?? false} />
        )}
      </dd>
    </div>
  );
}

function CopyButton({
  onClick,
  copied,
}: {
  onClick: () => void;
  copied: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold transition-colors shrink-0 ${
        copied
          ? "border-[#B8FF00]/40 bg-[#B8FF00]/[0.12] text-[#B8FF00]"
          : "border-white/[0.1] bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white"
      }`}
      aria-label={copied ? "Copied" : "Copy"}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          Copy
        </>
      )}
    </button>
  );
}
