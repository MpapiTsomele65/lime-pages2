"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, CheckCircle2 } from "lucide-react";
import { MONTH_NAMES } from "@/lib/definitions";

interface PaymentCardProps {
  contributions: Record<string, boolean>;
  email: string;
  memberId: string;
}

export function PaymentCard({
  contributions,
  email,
  memberId,
}: PaymentCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const paidCount = Object.values(contributions).filter(Boolean).length;
  const allPaid = paidCount === 12;

  // Find the next unpaid month
  const nextUnpaidMonth = MONTH_NAMES.find(
    (month) => contributions[month] !== true,
  );

  async function handlePayment() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/lehumo/paystack/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          memberRecordId: memberId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Could not initiate payment. Please try again.");
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        setError("Payment URL not received. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#0F2040] rounded-[20px] border border-white/[0.06] p-6 h-full flex flex-col">
      <h2 className="text-lg font-semibold text-white mb-6">
        Monthly Contribution
      </h2>

      {allPaid ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center text-center py-4"
        >
          <CheckCircle2 className="h-12 w-12 text-[#B8FF00] mb-3" />
          <h3 className="text-lg font-semibold text-white">All caught up!</h3>
          <p className="text-sm text-white/50 mt-1">
            All 12 monthly contributions have been paid. Thank you for your
            commitment.
          </p>
        </motion.div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Amount */}
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-3xl font-bold text-white">R1,000</span>
            <span className="text-white/40 text-sm">/month</span>
          </div>

          {/* Next due */}
          {nextUnpaidMonth && (
            <p className="text-sm text-white/50 mb-6">
              Next due:{" "}
              <span className="text-[#46CDCF] font-medium">
                {nextUnpaidMonth}
              </span>
            </p>
          )}

          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-white/40 mb-2">
              <span>Progress</span>
              <span>
                {paidCount}/12 months
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#B8FF00] transition-all"
                style={{ width: `${(paidCount / 12) * 100}%` }}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Pay button */}
          <div className="mt-auto">
            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-[#B8FF00] py-3 px-6 text-sm font-semibold text-[#0B1933] hover:bg-[#a8ef00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
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
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Make Payment
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
