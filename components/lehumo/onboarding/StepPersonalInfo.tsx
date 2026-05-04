"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import { validateEmail } from "@/lib/email-validation";

interface PersonalInfoData {
  fullName: string;
  email: string;
  phone: string;
  source: string;
  intent: string;
  commitment: string;
}

interface StepPersonalInfoProps {
  onNext: (data: PersonalInfoData) => void;
  defaultValues?: Partial<PersonalInfoData>;
  /** Set to true while the parent is awaiting the async resume check so
   *  the submit button is disabled and a loading spinner prevents
   *  double-clicks from advancing the wizard multiple steps. */
  isLoading?: boolean;
}

const COMMITMENT_OPTIONS = [
  { value: "", label: "Select your comfortable commitment..." },
  { value: "Less than R500", label: "Less than R500" },
  { value: "R1 000", label: "R1 000" },
  { value: "More than R1 000", label: "More than R1 000" },
  { value: "Up to R50 000", label: "Up to R50 000" },
];

const INTENT_OPTIONS = [
  { value: "", label: "Select your level of interest..." },
  { value: "Ready to join", label: "I\u2019m ready to join Lehumo" },
  { value: "Interested, need time", label: "Interested \u2014 but I need some time before I can start contributing" },
  { value: "Interested, need more info", label: "Interested, but I need more information" },
  { value: "Still deciding", label: "I haven\u2019t decided yet" },
  { value: "Exploring", label: "Just exploring for now" },
];

const inputClasses =
  "w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-lime/40 focus:ring-1 focus:ring-lime/20 outline-none transition-colors";

const labelClasses = "text-sm font-semibold text-white/70 mb-2 block";

export function StepPersonalInfo({ onNext, defaultValues, isLoading = false }: StepPersonalInfoProps) {
  const [fullName, setFullName] = useState(defaultValues?.fullName ?? "");
  const [email, setEmail] = useState(defaultValues?.email ?? "");
  const [phone, setPhone] = useState(defaultValues?.phone ?? "");
  const [intent, setIntent] = useState(defaultValues?.intent ?? "");
  const [commitment, setCommitment] = useState(defaultValues?.commitment ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  /**
   * Live "Did you mean …?" suggestion. Set on blur from validateEmail()
   * when the typed domain matches our typo dictionary (`.con`,
   * `gmial.com`, `mwed.co.za`, etc). One-click apply via the button
   * below the email field. Shown alongside an inline error so the user
   * still sees that the form won't submit until they fix it.
   */
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);

  /**
   * Run the typo check on blur. Keystroke validation is too noisy
   * (errors appear before the user has finished typing). On blur the
   * user has paused — perfect moment to surface a suggestion.
   */
  function handleEmailBlur() {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailSuggestion(null);
      return;
    }
    const result = validateEmail(trimmed);
    if (!result.ok && result.suggestion) {
      setEmailSuggestion(result.suggestion);
      setErrors((prev) => ({
        ...prev,
        email: result.reason ?? "Please check your email address",
      }));
    } else if (!result.ok) {
      setEmailSuggestion(null);
      setErrors((prev) => ({
        ...prev,
        email: result.reason ?? "Please enter a valid email address",
      }));
    } else {
      setEmailSuggestion(null);
      setErrors((prev) => {
        if (!prev.email) return prev;
        const next = { ...prev };
        delete next.email;
        return next;
      });
    }
  }

  /** One-click "Use this" handler — accepts the suggested correction. */
  function applyEmailSuggestion() {
    if (!emailSuggestion) return;
    setEmail(emailSuggestion);
    setEmailSuggestion(null);
    setErrors((prev) => {
      const { email: _removed, ...rest } = prev;
      return rest;
    });
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else {
      // Single source of truth — same dictionary the server uses, so
      // client + server can never disagree on what's a typo.
      const result = validateEmail(email);
      if (!result.ok) {
        newErrors.email = result.reason ?? "Please enter a valid email address";
        if (result.suggestion) setEmailSuggestion(result.suggestion);
      }
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[+]?[\d\s()-]{7,}$/.test(phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!intent) {
      newErrors.intent = "Please let us know where you stand";
    }

    if (!commitment) {
      newErrors.commitment = "Please tell us what you can realistically commit";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) {
      onNext({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        // Source is no longer asked in the UI — default kept so downstream
        // (Airtable Source column, onboarding schema) stays untouched.
        source: "Direct",
        intent,
        commitment,
      });
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-white mb-2">Personal Information</h2>
        <p className="text-white/50 text-sm leading-relaxed">
          Tell us a bit about yourself to get started with your Lehumo membership.
        </p>
      </div>

      {/* Full Name */}
      <div>
        <label htmlFor="fullName" className={labelClasses}>
          Full Name
        </label>
        <input
          id="fullName"
          type="text"
          placeholder="e.g. Thabo Mokoena"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={`${inputClasses} ${errors.fullName ? "border-red-500/50" : ""}`}
        />
        {errors.fullName && (
          <p className="text-red-400 text-xs mt-1.5">{errors.fullName}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className={labelClasses}>
          Email Address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="thabo@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            // Stale suggestion clears as soon as the user resumes typing —
            // they may be fixing it themselves.
            if (emailSuggestion) setEmailSuggestion(null);
          }}
          onBlur={handleEmailBlur}
          className={`${inputClasses} ${errors.email ? "border-red-500/50" : ""}`}
        />
        {errors.email && (
          <p className="text-red-400 text-xs mt-1.5">{errors.email}</p>
        )}
        {emailSuggestion && (
          <button
            type="button"
            onClick={applyEmailSuggestion}
            className="mt-2 inline-flex items-center gap-2 rounded-full border border-lime/40 bg-lime/10 px-3.5 py-1.5 text-xs font-semibold text-lime hover:bg-lime/20 hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <span aria-hidden>↩</span>
            <span>
              Use <span className="font-bold">{emailSuggestion}</span>
            </span>
          </button>
        )}
      </div>

      {/* Phone / WhatsApp */}
      <div>
        <label htmlFor="phone" className={labelClasses}>
          Phone / WhatsApp
        </label>
        <input
          id="phone"
          type="tel"
          placeholder="+27 82 123 4567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={`${inputClasses} ${errors.phone ? "border-red-500/50" : ""}`}
        />
        {errors.phone && (
          <p className="text-red-400 text-xs mt-1.5">{errors.phone}</p>
        )}
      </div>

      {/* Commitment */}
      <div>
        <label htmlFor="commitment" className={labelClasses}>
          How much can you realistically commit to a long-term savings initiative like this?
        </label>
        <select
          id="commitment"
          value={commitment}
          onChange={(e) => setCommitment(e.target.value)}
          className={`${inputClasses} ${!commitment ? "text-white/30" : ""} ${errors.commitment ? "border-red-500/50" : ""}`}
        >
          {COMMITMENT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-navy text-white">
              {opt.label}
            </option>
          ))}
        </select>
        {errors.commitment && (
          <p className="text-red-400 text-xs mt-1.5">{errors.commitment}</p>
        )}
      </div>

      {/* Intent / Readiness */}
      <div>
        <label htmlFor="intent" className={labelClasses}>
          Where are you on your decision?
        </label>
        <select
          id="intent"
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          className={`${inputClasses} ${!intent ? "text-white/30" : ""} ${errors.intent ? "border-red-500/50" : ""}`}
        >
          {INTENT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-navy text-white">
              {opt.label}
            </option>
          ))}
        </select>
        {errors.intent && (
          <p className="text-red-400 text-xs mt-1.5">{errors.intent}</p>
        )}
      </div>

      {/* Submit */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 bg-lime text-navy font-bold rounded-full px-8 py-3.5 text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(184,255,0,0.3)] transition-all w-full sm:w-auto cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {isLoading ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Checking…
            </>
          ) : (
            "Continue"
          )}
        </button>
        <p className="text-[11px] text-white/35 leading-relaxed mt-4 max-w-[560px]">
          By continuing, you consent to Lime Pages processing your personal
          information under POPIA for the purpose of Lehumo membership,
          KYC verification, and related communication. See our{" "}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/55 underline hover:text-white/80"
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </motion.form>
  );
}
