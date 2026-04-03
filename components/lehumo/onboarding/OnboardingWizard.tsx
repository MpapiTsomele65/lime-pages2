"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { StepPersonalInfo } from "./StepPersonalInfo";
import { StepKycDocs } from "./StepKycDocs";
import { StepPayment } from "./StepPayment";
import { StepConfirmation } from "./StepConfirmation";

const STEPS = [
  { number: 1, label: "Personal Info" },
  { number: 2, label: "KYC" },
  { number: 3, label: "Payment" },
  { number: 4, label: "Confirmation" },
] as const;

interface FormData {
  fullName?: string;
  email?: string;
  phone?: string;
  source?: string;
  reference?: string;
  memberNumber?: number;
}

export function OnboardingWizard() {
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-jump to confirmation step if URL has ?step=confirm&reference=xxx
  useEffect(() => {
    const step = searchParams.get("step");
    const reference = searchParams.get("reference");
    if (step === "confirm" && reference) {
      setFormData((prev) => ({ ...prev, reference }));
      setCurrentStep(4);
    }
  }, [searchParams]);

  const handleNext = useCallback(
    (data?: Partial<FormData>) => {
      if (data) {
        setFormData((prev) => ({ ...prev, ...data }));
      }
      setError(null);
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    },
    []
  );

  return (
    <div className="w-full max-w-[640px] mx-auto">
      {/* ── Progress Bar ── */}
      <div className="flex items-center justify-between mb-12 px-2">
        {STEPS.map((step, i) => (
          <div key={step.number} className="flex items-center flex-1 last:flex-none">
            {/* Dot + Label */}
            <div className="flex flex-col items-center gap-2 relative z-[1]">
              <div
                className={`w-[34px] h-[34px] rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
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
                className={`text-[11px] font-semibold tracking-wide transition-colors duration-300 whitespace-nowrap ${
                  currentStep >= step.number ? "text-lime" : "text-white/30"
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connecting Line */}
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-[2px] mx-2 mt-[-22px] relative">
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

      {/* ── Steps ── */}
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
              onNext={(data) => handleNext(data)}
              defaultValues={formData}
            />
          )}
          {currentStep === 2 && <StepKycDocs onNext={() => handleNext()} />}
          {currentStep === 3 && (
            <StepPayment
              formData={{
                fullName: formData.fullName ?? "",
                email: formData.email ?? "",
                phone: formData.phone ?? "",
                source: formData.source ?? "",
              }}
              onNext={(data) => handleNext(data)}
            />
          )}
          {currentStep === 4 && (
            <StepConfirmation
              formData={{
                fullName: formData.fullName ?? "",
                email: formData.email ?? "",
                reference: formData.reference,
              }}
              memberNumber={formData.memberNumber}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
