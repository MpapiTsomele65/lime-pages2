"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { formatMemberNumber } from "@/lib/definitions";

interface StepConfirmationProps {
  formData: {
    fullName: string;
    email: string;
    reference?: string;
  };
  memberNumber?: number;
  plan?: string;
  skippedPayment?: boolean;
}

export function StepConfirmation({
  formData,
  memberNumber: initialMemberNumber,
  plan,
  skippedPayment,
}: StepConfirmationProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [memberNumber, setMemberNumber] = useState<number | undefined>(initialMemberNumber);
  const [error, setError] = useState<string | null>(null);

  const isBasicPlan = plan === "basic";
  const isEftReference = formData.reference?.startsWith("EFT-");

  // Determine if we need to verify via Paystack — only when a real
  // Paystack reference is present (not an EFT pseudo-reference) and
  // payment wasn't skipped.
  const needsPaystackVerification =
    formData.reference && !isEftReference && !skippedPayment;

  useEffect(() => {
    if (!needsPaystackVerification) return;

    async function verifyPayment() {
      setIsVerifying(true);
      try {
        const res = await fetch(
          `/api/lehumo/paystack/verify?reference=${formData.reference}`
        );
        if (!res.ok) {
          throw new Error("Payment verification failed.");
        }
        const data = await res.json();
        setMemberNumber(data.memberNumber);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Verification failed. Please contact support."
        );
      } finally {
        setIsVerifying(false);
      }
    }

    verifyPayment();
  }, [formData.reference, needsPaystackVerification]);

  // Dynamic next-steps. Two flows land here:
  //
  //   1. Fresh onboarding completion (no `reference`): wizard finished
  //      Steps 1–3, member committed a plan + captured ID metadata.
  //      They have NOT uploaded KYC docs or set up payments yet — both
  //      happen on the portal. Steps walk them toward portal login.
  //
  //   2. First-payment Paystack callback (has `reference`): member
  //      already onboarded, then set up debit order from portal,
  //      Paystack redirected back here. Their first contribution has
  //      just been verified and the member is now Active. Steps focus
  //      on community onboarding.
  const isPostPayment = !!formData.reference;
  const NEXT_STEPS = isPostPayment
    ? [
        {
          number: 1,
          title: "Your First Contribution Is In",
          description:
            "We've credited your account. Your debit order will run on the same day each month going forward — change cards or pause anytime from your portal.",
        },
        {
          number: 2,
          title: "Track Progress In The Portal",
          description:
            "Your member portal shows monthly contribution status, emergency-access eligibility, and your beneficiary record.",
        },
        {
          number: 3,
          title: "Join The WhatsApp Group",
          description:
            "We'll add you to the Lehumo members WhatsApp group for updates, monthly meetings, and community.",
        },
      ]
    : [
        {
          number: 1,
          title: "Watch Your Inbox For The Welcome Email",
          description:
            "Confirmation of your application is on its way to your email. Check spam if you don't see it within an hour.",
        },
        {
          number: 2,
          title: "Log In To Upload KYC Documents",
          description:
            "Sign into your member portal to upload a copy of your ID and proof of address. Admin verifies within 24 hours.",
        },
        {
          number: 3,
          title: "Set Up Your Monthly Contribution",
          description: isBasicPlan
            ? "Once KYC is approved, the portal shows the EFT details + your unique reference for your first R1,000 transfer."
            : "Once KYC is approved, the portal lets you set up your Paystack debit order in two clicks — first contribution and recurring billing in one ceremony.",
        },
        {
          number: 4,
          title: "Join The WhatsApp Group + First Meeting",
          description:
            "After verification we'll add you to the Lehumo members WhatsApp group and invite you to the next monthly meeting.",
        },
      ];

  if (isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <svg
          className="w-10 h-10 text-lime animate-spin mb-4"
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
        <p className="text-white/50 text-sm">Verifying your payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-5">
          <svg
            className="w-8 h-8 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <p className="text-red-400 text-sm text-center max-w-sm">{error}</p>
        <Link
          href="/lehumo/portal/login"
          className="mt-6 text-sm text-teal hover:underline"
        >
          Try logging in to your portal instead
        </Link>
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
          transition={{
            delay: 0.2,
            type: "spring",
            stiffness: 200,
            damping: 12,
          }}
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
          {isPostPayment
            ? `Welcome${formData.fullName ? `, ${formData.fullName.split(" ")[0]}` : ""}!`
            : `Application In${formData.fullName ? `, ${formData.fullName.split(" ")[0]}` : ""}`}
        </motion.h2>

        {memberNumber && (
          <motion.p
            className="text-teal text-sm font-semibold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Member {formatMemberNumber(memberNumber)}
          </motion.p>
        )}

        <motion.p
          className="text-white/45 text-sm mt-3 max-w-sm leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          {isPostPayment
            ? "Your first contribution is credited and your membership is active. Your monthly debit order will run from now on."
            : "Your application is in. We'll review your submission within 24 hours. The next steps below happen on your member portal — sign in once your KYC is verified."}
        </motion.p>
      </div>

      {/* Member Number Card */}
      {memberNumber && (
        <motion.div
          className="rounded-2xl bg-white/[0.04] border border-lime/15 p-5 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95 }}
        >
          <p className="text-[11px] text-white/35 uppercase tracking-wider font-semibold mb-1">
            Your Member ID
          </p>
          <p className="text-3xl font-extrabold text-lime tracking-wider">
            {formatMemberNumber(memberNumber)}
          </p>
          <p className="text-xs text-white/35 mt-2">
            Use this number along with your email to log in to the member portal.
          </p>
        </motion.div>
      )}

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
            key={step.title}
            className="flex gap-4 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.1 + i * 0.15 }}
          >
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-lime/10 text-lime flex items-center justify-center text-sm font-bold">
              {step.number}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white mb-0.5">
                {step.title}
              </h3>
              <p className="text-xs text-white/45 leading-relaxed">
                {step.description}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        className="pt-4 flex flex-col sm:flex-row justify-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
      >
        <Link
          href="/lehumo/portal/login"
          className="bg-lime text-navy font-bold rounded-full px-8 py-3.5 text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(184,255,0,0.3)] transition-all inline-block text-center"
        >
          Go to Member Portal
        </Link>
        <a
          href="mailto:lehumo@limepages.co.za"
          className="text-sm text-white/40 hover:text-white/60 transition-colors py-3.5 px-4 text-center"
        >
          Questions? Email us
        </a>
      </motion.div>
    </motion.div>
  );
}
