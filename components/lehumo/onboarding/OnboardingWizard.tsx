"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { StepPersonalInfo } from "./StepPersonalInfo";
import { StepPlanSelection } from "./StepPlanSelection";
import { StepKycDocs } from "./StepKycDocs";
import { StepConfirmation } from "./StepConfirmation";
import { trackEvent } from "@/lib/analytics";

// 4-step onboarding (May 2026): payment ceremony was lifted out of the
// wizard and into the member portal. Members commit a plan tier here,
// upload KYC, and land on confirmation; the actual debit-order setup
// (or first EFT) happens later inside the portal once their KYC has
// been verified by an admin. Friendlier for SA users who are wary of
// handing card details to a brand-new entity at first contact.
const STEPS = [
  { number: 1, label: "Personal Info" },
  { number: 2, label: "Select Plan" },
  { number: 3, label: "About you & funds" },
  { number: 4, label: "Confirmation" },
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
  /** "sa_id" | "passport" — auto-detected from idNumber on Step 3. */
  idType?: "sa_id" | "passport";
  /** Raw ID/passport number entered on Step 3 (validated client-side). */
  idNumber?: string;
  /** Free-form residential address captured on Step 3. */
  residentialAddress?: string;
  memberId?: string;
  memberNumber?: number;
  reference?: string;
  /** True when the wizard fast-forwarded to Payment because the user is an
   *  existing Onboarding-status member finishing their first contribution. */
  resumed?: boolean;
}

/**
 * Wizard state integrity invariants.
 *
 * For every step the user can land on, define what data must be
 * present in formData for that step to be valid. The integrity
 * effect (below) runs this check on every (currentStep, formData)
 * change — if the invariant fails, we log the anomaly + auto-recover
 * to the highest step whose prerequisites ARE met. Catches the whole
 * class of bug Joan and Bontle hit: the wizard fast-forwarding past
 * steps the user hadn't actually completed.
 *
 * Returns `{ valid: true }` or `{ valid: false, reason: string,
 * recoverTo: number }`.
 */
type StepCheck =
  | { valid: true }
  | { valid: false; reason: string; recoverTo: number };

function checkStepIntegrity(step: number, data: FormData): StepCheck {
  // Step 1 has no prerequisites — landing here is always valid.
  if (step === 1) return { valid: true };

  // Step 2 (plan selection) needs Step 1's identity bits.
  if (step === 2) {
    if (!data.fullName || !data.email) {
      return { valid: false, reason: "missing_personal_info", recoverTo: 1 };
    }
    return { valid: true };
  }

  // Step 3 (KYC) needs Step 1 + Step 2.
  if (step === 3) {
    if (!data.fullName || !data.email) {
      return { valid: false, reason: "missing_personal_info", recoverTo: 1 };
    }
    if (!data.plan) {
      return { valid: false, reason: "missing_plan", recoverTo: 2 };
    }
    return { valid: true };
  }

  // Step 4 (confirmation) has three legitimate arrival paths:
  //   1. Normal: Step 3 created the member → memberId is set
  //   2. Resume: existing Onboarding member with KYC progress → resumed=true
  //   3. Paystack callback: returning from off-site checkout → reference set
  // Anything else means we fast-forwarded past steps that didn't complete.
  if (step === 4) {
    const hasMember = Boolean(data.memberId || data.memberNumber);
    const hasResume = Boolean(data.resumed);
    const hasReference = Boolean(data.reference);
    if (!hasMember && !hasResume && !hasReference) {
      // Recover to the highest step we DO have data for.
      // Most common skipped-ahead state: has email/name but no plan.
      if (data.fullName && data.email) {
        return { valid: false, reason: "skipped_to_confirm", recoverTo: 2 };
      }
      return { valid: false, reason: "skipped_to_confirm", recoverTo: 1 };
    }
    return { valid: true };
  }

  return { valid: true };
}

export function OnboardingWizard() {
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({});
  // Integrity-recovery banner. Set when the wizard self-corrects after
  // detecting a step transition that arrived without the prerequisite
  // data — surfaces a transparent notice instead of silently bouncing
  // the user. Auto-clears once dismissed or after the user advances
  // normally.
  const [integrityRecovery, setIntegrityRecovery] = useState<
    { reason: string; from: number; to: number } | null
  >(null);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isStep1Loading, setIsStep1Loading] = useState(false);
  // Synchronous re-entry guard. `isStep1Loading` (above) drives the
  // button's disabled state for the UI, but React state updates are
  // BATCHED — two rapid clicks within the same event-loop tick both
  // read `false` before either flushes `true`. Refs update
  // immediately on assignment, no reconciliation tick required, so
  // they're the right primitive for "did another click already win
  // the race?". Joan's original Step 1 → Step 4 jump was caused by
  // exactly this — the state-based guard was insufficient. Now both
  // are checked: ref blocks concurrent calls; state still drives the
  // visible disabled+spinner so users get the right feedback.
  const isStep1LoadingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-jump to confirmation step if URL has ?step=confirm&reference=xxx
  // Used by the Paystack callback path — when a member completes their
  // first contribution from the portal's SetUpPaymentsCard, Paystack
  // redirects them back here with a reference so the confirmation step
  // can verify and render a success state. Confirmation is now step 4
  // (was step 5 before payment was lifted out of the wizard).
  useEffect(() => {
    const step = searchParams.get("step");
    const reference = searchParams.get("reference");
    if (step === "confirm" && reference) {
      setFormData((prev) => ({ ...prev, reference }));
      setCurrentStep(4);
    }
  }, [searchParams]);

  // Reset scroll to top whenever the user advances or jumps to a new step —
  // otherwise they land mid-form at the Y position where they hit "Continue".
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  // ── Wizard integrity guard ──────────────────────────────────────────
  // Validates that the current step's prerequisites are present in
  // formData on every (currentStep, formData) change. If not, this is
  // the same class of bug Joan and Bontle hit — the wizard arrived at
  // a step the user hadn't legitimately reached. Auto-recover by
  // jumping to the highest step whose data is intact, fire an
  // analytics event so the anomaly shows up in our funnel, and
  // surface a transparent banner to the user (not a silent bounce).
  //
  // Class of bugs this prevents:
  //   - Multi-click race past Step 1 (Joan, May 2026)
  //   - Resume API matching a stub record (Bontle, 19 May 2026)
  //   - Browser back-button + URL fiddling
  //   - Future race conditions we haven't thought of yet
  useEffect(() => {
    const check = checkStepIntegrity(currentStep, formData);
    if (check.valid) return;

    // Avoid feedback loop — only recover if we're not already on the
    // target step. (Defensive: should never happen since checkStepIntegrity
    // returns valid for the step it recovers TO, but cheap insurance.)
    if (check.recoverTo === currentStep) return;

    console.warn(
      `[wizard integrity] step ${currentStep} invalid (${check.reason}); recovering to ${check.recoverTo}`,
      { formData },
    );
    trackEvent("wizard_integrity_violation", {
      from_step: currentStep,
      recover_to: check.recoverTo,
      reason: check.reason,
      had_email: Boolean(formData.email),
      had_plan: Boolean(formData.plan),
      had_member_id: Boolean(formData.memberId),
      had_resumed: Boolean(formData.resumed),
      had_reference: Boolean(formData.reference),
    });
    setIntegrityRecovery({
      reason: check.reason,
      from: currentStep,
      to: check.recoverTo,
    });
    setCurrentStep(check.recoverTo);
  }, [currentStep, formData]);

  // Synchronous re-entry guard for handleNext. Same reasoning as
  // isStep1LoadingRef — rapid clicks on ANY step's Continue button
  // could fire handleNext multiple times before React re-renders the
  // disabled state. The functional setState (prev + 1) then increments
  // multiple times, fast-forwarding past steps. Ref-guard releases on
  // the next tick so users can still advance legitimately step-by-step.
  const isAdvancingRef = useRef(false);
  const handleNext = useCallback(
    (data?: Partial<FormData>) => {
      if (isAdvancingRef.current) return;
      isAdvancingRef.current = true;
      if (data) {
        setFormData((prev) => ({ ...prev, ...data }));
      }
      setError(null);
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      // Release on the next macrotask — gives React a render cycle to
      // mount the next step component (which has its own
      // not-yet-clicked button state). 80ms is roughly two animation
      // frames; well below human "rapid-click" cadence.
      setTimeout(() => {
        isAdvancingRef.current = false;
      }, 80);
    },
    []
  );

  // Fire-and-forget: capture the visitor as a lead the moment they finish
  // Step 1. If they drop off before the KYC step creates a real member
  // record, we still have their name/email in the Lehumo Leads table so
  // Papi can follow up. The leads call is never awaited.
  //
  // We DO await the resume lookup though: if this email already belongs to
  // an Onboarding-status member (KYC done, payment pending), we skip Steps
  // 2 + 3 entirely and drop the user straight onto Payment with their
  // existing memberId / memberNumber / plan. Returning members shouldn't
  // have to re-pick a plan or re-upload KYC just to finish their first
  // contribution.
  const handleStep1Next = useCallback(
    async (data: Partial<FormData>) => {
      // Synchronous re-entry guard. Ref check beats the state check
      // because refs don't wait for React's batched render cycle —
      // rapid clicks within the same tick all see `true` after the
      // first one sets it. Without this, three concurrent invocations
      // each call handleNext, each setCurrentStep(prev + 1), and the
      // wizard fast-forwards to Step 4. (Joan's bug, May 2026.)
      if (isStep1LoadingRef.current) return;
      isStep1LoadingRef.current = true;

      if (!data.fullName || !data.email) {
        handleNext(data);
        isStep1LoadingRef.current = false;
        return;
      }

      setIsStep1Loading(true);

      try {
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

        trackEvent("lead_submitted", {
          source: "Onboarding Step 1",
          commitment: data.commitment,
          intent: data.intent,
        });
        trackEvent("onboarding_started");

        // ── Resume detection ──
        // Treat any failure here as "not resumable" and fall through to the
        // normal flow — we never want a flaky lookup to block onboarding.
        try {
          const res = await fetch("/api/lehumo/resume", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: data.email }),
          });

          if (res.ok) {
            // Returning Onboarding-status member — they've already done
            // KYC + plan selection. Land them on confirmation directly so
            // they get a clear "your application is in, set up payments
            // from the portal" message rather than re-walking the wizard.
            const resume = await res.json();
            setFormData((prev) => ({
              ...prev,
              ...data,
              memberId: resume.memberId,
              memberNumber: resume.memberNumber,
              plan: resume.plan ?? prev.plan ?? "standard",
              resumed: true,
            }));
            setError(null);
            setCurrentStep(4);
            trackEvent("onboarding_resumed", { plan: resume.plan ?? null });
            return;
          }

          if (res.status === 409) {
            const errBody = await res.json().catch(() => ({}));
            if (errBody.code === "ALREADY_ACTIVE") {
              setError(
                "This email is already registered as an active Lehumo member. " +
                  "Please log in with your member number to access your account.",
              );
              return;
            }
            if (errBody.code === "NOT_RESUMABLE") {
              setError(
                "This account can't be resumed automatically. Please contact " +
                  "support@limepages.co.za and we'll get you back on track.",
              );
              return;
            }
            // Any other 409 → fall through to normal flow.
          }
          // 404 / non-200 → no resumable record, normal wizard flow.
        } catch {
          // Network blip on the resume check is non-blocking.
        }

        handleNext(data);
      } finally {
        // Clear both the visible (state) and synchronous (ref) gates
        // so a legitimate retry can fire. The ref MUST be cleared too
        // — otherwise a user who hit an error on attempt #1 would be
        // permanently blocked from attempt #2.
        setIsStep1Loading(false);
        isStep1LoadingRef.current = false;
      }
    },
    [handleNext],
  );

  // Create account after KYC (step 3) — before moving to Payment (step 4).
  // This ensures the member record exists even if they drop off at payment.
  const handleKycComplete = useCallback(
    async (data: {
      sourceOfFunds: string;
      idType: "sa_id" | "passport";
      idNumber: string;
      residentialAddress: string;
    }) => {
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
            idType: data.idType,
            idNumber: data.idNumber,
            residentialAddress: data.residentialAddress,
          }),
        });

        // Parse the body once — the response carries different shapes
        // for success ({ memberId, memberNumber, ... }) vs failure
        // ({ error, code, stage, requestId }), but we want the failure
        // metadata for analytics regardless of which branch we land on.
        const result: Record<string, unknown> = await res
          .json()
          .catch(() => ({}));

        if (!res.ok) {
          // Surface the failure to PostHog/GA4/Meta with the same
          // {stage, code, requestId} the API returned. Lets us see
          // which stage of /api/lehumo/onboard is actually breaking
          // in production, not just a global failure rate.
          trackEvent("onboarding_failed", {
            stage: typeof result.stage === "string" ? result.stage : "unknown",
            code: typeof result.code === "string" ? result.code : "UNKNOWN",
            requestId:
              typeof result.requestId === "string" ? result.requestId : "unknown",
            httpStatus: res.status,
          });
          throw new Error(
            (typeof result.error === "string" && result.error) ||
              "Failed to create your account.",
          );
        }

        setFormData((prev) => ({
          ...prev,
          ...data,
          memberId:
            typeof result.memberId === "string" ? result.memberId : undefined,
          memberNumber:
            typeof result.memberNumber === "number"
              ? result.memberNumber
              : undefined,
        }));
        setCurrentStep(4);
      } catch (err) {
        // Network failures (offline, CORS, fetch reject) end up here
        // without the stage/requestId metadata — fire a separate event
        // so we can distinguish "API returned 500" from "request never
        // reached the API". Both surface to the user as a banner.
        if (
          err instanceof TypeError ||
          (err instanceof Error && /fetch|network/i.test(err.message))
        ) {
          trackEvent("onboarding_failed", {
            stage: "client_network",
            code: "NETWORK_ERROR",
            requestId: "n/a",
          });
        }
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

      {/* ── Integrity-recovery banner ──
          Surfaces when the wizard self-corrects after detecting a
          step that arrived without prerequisite data (Joan / Bontle
          class of bug). Transparent + dismissable so users see the
          recovery as a "we caught it" moment, not as a silent retry. */}
      <AnimatePresence>
        {integrityRecovery && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-6 rounded-xl bg-[#46CDCF]/10 border border-[#46CDCF]/30 px-5 py-3.5 text-sm text-[#46CDCF]"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-semibold mb-0.5">Caught a hiccup — let&rsquo;s pick up here</p>
                <p className="text-[#46CDCF]/80 text-xs leading-relaxed">
                  Looks like the form jumped ahead before all your details were saved.
                  We&rsquo;ve put you back on the right step so nothing&rsquo;s missed.
                </p>
              </div>
              <button
                onClick={() => setIntegrityRecovery(null)}
                className="text-[#46CDCF]/60 hover:text-[#46CDCF] text-xs font-semibold shrink-0"
                aria-label="Dismiss"
              >
                Dismiss
              </button>
            </div>
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
                isLoading={isStep1Loading}
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
                defaultIdNumber={formData.idNumber}
                defaultResidentialAddress={formData.residentialAddress}
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
