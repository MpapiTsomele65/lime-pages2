"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { StepPersonalInfo } from "./StepPersonalInfo";
import { StepPlanSelection } from "./StepPlanSelection";
import { StepKycDocs } from "./StepKycDocs";
import { StepPayment } from "./StepPayment";
import { StepConfirmation } from "./StepConfirmation";

const STEPS = [
  { number: 1, label: "Personal Info" },
  { number: 2, label: "Select Plan" },
  { number: 3, label: "KYC" },
  { number: 4, label: "Payment" },
  { number: 5, label: "Confirmation" },
] as const;

interface FormData {
  fullName?: string;
  email?: string;
  phone?: string;
  source?: string;
  intent?: string;
  commitment?: string;
  plan?: string;
  sourceOfFunds?: string;
  memberId?: string;
  memberNumber?: number;
  reference?: string;
}

export function OnboardingWizard() {
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({});
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-jump to confirmation step if URL has ?step=confirm&reference=xxx
  useEffect(() => {
    const step = searchParams.get("step");
    const reference = searchParams.get("reference");
    if (step === "confirm" && reference) {
      setFormData((prev) => ({ ...prev, reference }));
      setCurrentStep(5);
    }
  }, [searchParams]);

  const handleNext = useCallback(
    (data?: Partial<FormData>) => {
      if (data) {
        setFormData((prev) => ({ ...prev, ...data }));
      }
      setError(null);
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    },
    []
  );

  // Fire-and-forget: capture the visitor as a lead the moment they finish
  // Step 1. If they drop off before the KYC step creates a real member
  // record, we still have their name/email in the Lehumo Leads table so
  // Papi can follow up. Never awaited — must not block the wizard.
  const handleStep1Next = useCallback(
    (data: Partial<FormData>) => {
      if (data.fullName && data.email) {
        const notes = data.commitment
          ? `Commitment: ${data.commitment}${data.intent ? ` | Intent: ${data.intent}` : ""}`
          : data.intent
            ? `Intent: ${data.intent}`
            : undefined;
        fetch("/api/lehumo/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            source: "Onboarding — Step 1",
            notes,
          }),
        }).catch(() => {
          // Silent — leads capture is best-effort, not critical.
        });
      }
      handleNext(data);
    },
    [handleNext]
  );

  // Create account after KYC (step 3) — before moving to Payment (step 4).
  // This ensures the member record exists even if they drop off at payment.
  const handleKycComplete = useCallback(
    async (data: { sourceOfFunds: string }) => {
      const updatedData = { ...formData, ...data };
      setFormData(updatedData);
      setError(null);
      setIsCreatingAccount(true);

      try {
        const res = await fetch("/api/lehumo/onboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: updatedData.fullName,
            email: updatedData.email,
            phone: updatedData.phone,
            source: updatedData.source,
            intent: updatedData.intent,
            commitment: updatedData.commitment,
            plan: updatedData.plan,
            sourceOfFunds: data.sourceOfFunds,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to create your account.");
        }

        const result = await res.json();
        setFormData((prev) => ({
          ...prev,
          ...data,
          memberId: result.memberId,
          memberNumber: result.memberNumber,
        }));
        setCurrentStep(4);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong. Please try again."
        );
      } finally {
        setIsCreatingAccount(false);
      }
    },
    [formData]
  );

  return (
    <div className="w-full max-w-[640px] mx-auto">
      {/* ── Progress Bar ── */}
      <div className="flex items-center justify-between mb-12 px-1">
        {STEPS.map((step, i) => (
          <div key={step.number} className="flex items-center flex-1 last:flex-none">
            {/* Dot + Label */}
            <div className="flex flex-col items-center gap-2 relative z-[1]">
              <div
                className={`w-[32px] h-[32px] sm:w-[34px] sm:h-[34px] rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                  currentStep >= step.number
                    ? "bg-lime text-navy shadow-[0_0_20px_rgba(184,255,0,0.35)]"
                    : "bg-white/[0.07] text-white/30 border border-white/[0.1]"
                }`}
              >
                {currentStep > step.number ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <span
                className={`text-[9px] sm:text-[11px] font-semibold tracking-wide transition-colors duration-300 whitespace-nowrap ${
                  currentStep >= step.number ? "text-lime" : "text-white/30"
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connecting Line */}
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-[2px] mx-1 sm:mx-2 mt-[-22px] relative">
                <div className="absolute inset-0 bg-white/[0.08] rounded-full" />
                <motion.div
                  className="absolute inset-y-0 left-0 bg-lime rounded-full"
                  initial={{ width: "0%" }}
                  animate={{
                    width: currentStep > step.number ? "100%" : "0%",
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Error Banner ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 px-5 py-3.5 text-sm text-red-400"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Account Creation Loading ── */}
      {isCreatingAccount && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16"
        >
          <svg className="w-10 h-10 text-lime animate-spin mb-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-white/70 text-sm font-semibold">Creating your account...</p>
          <p className="text-white/40 text-xs mt-1">This only takes a moment</p>
        </motion.div>
      )}

      {/* ── Steps ── */}
      {!isCreatingAccount && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            {currentStep === 1 && (
              <StepPersonalInfo
                onNext={(data) => handleStep1Next(data)}
                defaultValues={formData}
              />
            )}
            {currentStep === 2 && (
              <StepPlanSelection
                onNext={(data) => handleNext(data)}
                defaultPlan={formData.plan}
              />
            )}
            {currentStep === 3 && (
              <StepKycDocs
                onNext={handleKycComplete}
                defaultSourceOfFunds={formData.sourceOfFunds}
              />
            )}
            {currentStep === 4 && (
              <StepPayment
                memberId={formData.memberId ?? ""}
                memberNumber={formData.memberNumber}
                plan={formData.plan ?? "standard"}
                fullName={formData.fullName ?? ""}
                onNext={(data) => handleNext(data)}
                onSkip={() => handleNext()}
              />
            )}
            {currentStep === 5 && (
              <StepConfirmation
                formData={{
                  fullName: formData.fullName ?? "",
                  email: formData.email ?? "",
                  reference: formData.reference,
                }}
                memberNumber={formData.memberNumber}
                plan={formData.plan}
                skippedPayment={!formData.reference}
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
