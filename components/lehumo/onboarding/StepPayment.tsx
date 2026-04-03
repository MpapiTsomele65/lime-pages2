"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface StepPaymentProps {
  formData: {
    fullName: string;
    email: string;
    phone: string;
    source: string;
  };
  onNext: (data: { reference: string }) => void;
}

const ALLOCATION = [
  { label: "Sum1 Investments", pct: "40%", color: "bg-lime" },
  { label: "Cash Reserve", pct: "40%", color: "bg-teal" },
  { label: "SA Bonds", pct: "10%", color: "bg-white/40" },
  { label: "SV Capital", pct: "10%", color: "bg-pink" },
];

export function StepPayment({ formData, onNext }: StepPaymentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleProceed() {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Create the Airtable record
      const onboardRes = await fetch("/api/lehumo/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!onboardRes.ok) {
        const errData = await onboardRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create your membership record.");
      }

      const { memberId } = await onboardRes.json();

      // Step 2: Initialize Paystack payment
      const paystackRes = await fetch("/api/lehumo/paystack/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });

      if (!paystackRes.ok) {
        const errData = await paystackRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to initialize payment.");
      }

      const { authorization_url } = await paystackRes.json();

      // Step 3: Redirect to Paystack
      window.location.href = authorization_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsLoading(false);
    }
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
          Review your monthly contribution breakdown and proceed to payment.
        </p>
      </div>

      {/* Payment Summary Card */}
      <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.08]">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-white/50 font-medium">Monthly Contribution</span>
            <span className="text-3xl font-extrabold text-lime">R1,000</span>
          </div>
          <p className="text-xs text-white/35 mt-1">per month, debited on the 1st</p>
        </div>

        {/* Allocation Breakdown */}
        <div className="px-6 py-5">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">
            Investment Allocation
          </p>

          {/* Visual Bar */}
          <div className="flex rounded-full overflow-hidden h-2.5 mb-5">
            <div className="bg-lime" style={{ width: "40%" }} />
            <div className="bg-teal" style={{ width: "40%" }} />
            <div className="bg-white/40" style={{ width: "10%" }} />
            <div className="bg-pink" style={{ width: "10%" }} />
          </div>

          {/* Legend */}
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

      {/* Secure Payment Note */}
      <div className="flex items-center gap-2.5 px-1">
        <svg
          className="w-4 h-4 text-teal flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
        <span className="text-xs text-white/40">
          Secure payment processed by Paystack. Your card details are never stored on our servers.
        </span>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400"
        >
          {error}
        </motion.div>
      )}

      {/* Submit */}
      <div className="pt-4">
        <button
          type="button"
          disabled={isLoading}
          onClick={handleProceed}
          className={`font-bold rounded-full px-8 py-3.5 text-sm transition-all w-full sm:w-auto cursor-pointer ${
            isLoading
              ? "bg-lime/50 text-navy/70 cursor-wait"
              : "bg-lime text-navy hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(184,255,0,0.3)]"
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Processing...
            </span>
          ) : (
            "Proceed to Payment"
          )}
        </button>
      </div>
    </motion.div>
  );
}
