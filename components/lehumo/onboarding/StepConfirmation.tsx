"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface StepConfirmationProps {
  formData: {
    fullName: string;
    email: string;
    reference?: string;
  };
  memberNumber?: number;
}

export function StepConfirmation({ formData, memberNumber: initialMemberNumber }: StepConfirmationProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(!formData.reference);
  const [memberNumber, setMemberNumber] = useState<number | undefined>(initialMemberNumber);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!formData.reference) return;

    async function verifyPayment() {
      setIsVerifying(true);
      try {
        const res = await fetch(`/api/lehumo/paystack/verify?reference=${formData.reference}`);
        if (!res.ok) {
          throw new Error("Payment verification failed.");
        }
        const data = await res.json();
        setMemberNumber(data.memberNumber);
        setVerified(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Verification failed. Please contact support.");
      } finally {
        setIsVerifying(false);
      }
    }

    verifyPayment();
  }, [formData.reference]);

  const NEXT_STEPS = [
    {
      number: 1,
      title: "Submit KYC Documents",
      description: "Send your SA ID/passport and proof of address via WhatsApp or email.",
    },
    {
      number: 2,
      title: "Join the WhatsApp Group",
      description: "Get added to the Lehumo members WhatsApp group for updates and community.",
    },
    {
      number: 3,
      title: "Attend Your First Meeting",
      description: "Join the monthly member meeting to meet the team and fellow members.",
    },
  ];

  if (isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <svg className="w-10 h-10 text-lime animate-spin mb-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-white/50 text-sm">Verifying your payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-5">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-red-400 text-sm text-center max-w-sm">{error}</p>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Success Checkmark */}
      <div className="flex flex-col items-center text-center">
        <motion.div
          className="w-20 h-20 rounded-full bg-lime/10 flex items-center justify-center mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 12 }}
        >
          <motion.svg
            className="w-10 h-10 text-lime"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <motion.path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            />
          </motion.svg>
        </motion.div>

        <motion.h2
          className="text-2xl font-extrabold text-white mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          Welcome to Lehumo{formData.fullName ? `, ${formData.fullName.split(" ")[0]}` : ""}!
        </motion.h2>

        {memberNumber && (
          <motion.p
            className="text-teal text-sm font-semibold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Member #{String(memberNumber).padStart(3, "0")}
          </motion.p>
        )}

        <motion.p
          className="text-white/45 text-sm mt-3 max-w-sm leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          Your membership has been confirmed. Here is what happens next on your journey to
          building generational wealth.
        </motion.p>
      </div>

      {/* What Happens Next */}
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4 px-1">
          What Happens Next
        </p>

        {NEXT_STEPS.map((step, i) => (
          <motion.div
            key={step.number}
            className="flex gap-4 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.1 + i * 0.15 }}
          >
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-lime/10 text-lime flex items-center justify-center text-sm font-bold">
              {step.number}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white mb-0.5">{step.title}</h3>
              <p className="text-xs text-white/45 leading-relaxed">{step.description}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        className="pt-4 flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
      >
        <Link
          href="/lehumo/portal/login"
          className="bg-lime text-navy font-bold rounded-full px-8 py-3.5 text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(184,255,0,0.3)] transition-all inline-block"
        >
          Go to Portal
        </Link>
      </motion.div>
    </motion.div>
  );
}
