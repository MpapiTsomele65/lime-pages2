import type { Metadata } from "next";
import { Suspense } from "react";
import { OnboardingWizard } from "@/components/lehumo/onboarding/OnboardingWizard";

export const metadata: Metadata = {
  title: "Join Lehumo — Onboarding | Lime Pages",
  description:
    "Complete your onboarding to become a Lehumo Founding Member. Contribute R1,000/month and build generational wealth.",
};

function WizardFallback() {
  return (
    <div className="w-full max-w-[640px] mx-auto animate-pulse">
      {/* Progress bar skeleton */}
      <div className="flex items-center justify-between mb-12 px-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div className="w-[34px] h-[34px] rounded-full bg-white/[0.07]" />
              <div className="w-16 h-3 rounded bg-white/[0.05]" />
            </div>
            {i < 4 && <div className="flex-1 h-[2px] mx-2 mt-[-22px] bg-white/[0.08] rounded-full" />}
          </div>
        ))}
      </div>
      {/* Form skeleton */}
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white/[0.05] rounded-lg" />
        <div className="h-4 w-72 bg-white/[0.03] rounded-lg" />
        <div className="h-12 w-full bg-white/[0.04] rounded-xl" />
        <div className="h-12 w-full bg-white/[0.04] rounded-xl" />
        <div className="h-12 w-full bg-white/[0.04] rounded-xl" />
      </div>
    </div>
  );
}

export default function OnboardPage() {
  return (
    <div className="min-h-screen bg-navy text-white relative overflow-hidden">
      {/* Background Grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(184,255,0,1) 1px, transparent 1px), linear-gradient(90deg, rgba(184,255,0,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow Orbs */}
      <div className="absolute top-0 left-[15%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(184,255,0,0.08),transparent_70%)] blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(70,205,207,0.1),transparent_70%)] blur-[80px] pointer-events-none" />

      {/* Content */}
      <div className="relative z-[1] px-[clamp(1.5rem,5vw,5rem)] py-[100px]">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-lime-dim border border-lime/25 rounded-full px-[18px] py-[7px] mb-6">
            <span className="w-[7px] h-[7px] rounded-full bg-lime animate-[pulse_2s_ease_infinite]" />
            <span className="text-[11px] font-bold text-lime tracking-[1.4px] uppercase">
              Founding Member Onboarding
            </span>
          </div>
          <h1 className="text-[clamp(1.6rem,4vw,2.8rem)] font-extrabold text-white leading-tight tracking-tight">
            Join <span className="text-lime">Lehumo</span>
          </h1>
          <p className="text-white/45 text-sm mt-3 max-w-md mx-auto leading-relaxed">
            Complete the steps below to become a Founding Member and start building generational wealth.
          </p>
        </div>

        {/* Wizard */}
        <Suspense fallback={<WizardFallback />}>
          <OnboardingWizard />
        </Suspense>
      </div>
    </div>
  );
}
