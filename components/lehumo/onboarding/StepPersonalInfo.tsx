"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface PersonalInfoData {
  fullName: string;
  email: string;
  phone: string;
  source: string;
  intent: string;
}

interface StepPersonalInfoProps {
  onNext: (data: PersonalInfoData) => void;
  defaultValues?: Partial<PersonalInfoData>;
}

const SOURCE_OPTIONS = [
  { value: "", label: "Select an option..." },
  { value: "Google", label: "Google" },
  { value: "Instagram", label: "Instagram" },
  { value: "Referral", label: "Referral" },
  { value: "WhatsApp", label: "WhatsApp" },
  { value: "Direct", label: "Direct" },
];

const INTENT_OPTIONS = [
  { value: "", label: "Select your level of interest..." },
  { value: "Ready to join", label: "I\u2019m ready to join Lehumo" },
  { value: "Interested, need more info", label: "Interested, but I need more information" },
  { value: "Still deciding", label: "I haven\u2019t decided yet" },
  { value: "Exploring", label: "Just exploring for now" },
];

const inputClasses =
  "w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-lime/40 focus:ring-1 focus:ring-lime/20 outline-none transition-colors";

const labelClasses = "text-sm font-semibold text-white/70 mb-2 block";

export function StepPersonalInfo({ onNext, defaultValues }: StepPersonalInfoProps) {
  const [fullName, setFullName] = useState(defaultValues?.fullName ?? "");
  const [email, setEmail] = useState(defaultValues?.email ?? "");
  const [phone, setPhone] = useState(defaultValues?.phone ?? "");
  const [source, setSource] = useState(defaultValues?.source ?? "");
  const [intent, setIntent] = useState(defaultValues?.intent ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[+]?[\d\s()-]{7,}$/.test(phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!source) {
      newErrors.source = "Please select how you heard about us";
    }

    if (!intent) {
      newErrors.intent = "Please let us know where you stand";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) {
      onNext({ fullName: fullName.trim(), email: email.trim(), phone: phone.trim(), source, intent });
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
          placeholder="thabo@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${inputClasses} ${errors.email ? "border-red-500/50" : ""}`}
        />
        {errors.email && (
          <p className="text-red-400 text-xs mt-1.5">{errors.email}</p>
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

      {/* Source */}
      <div>
        <label htmlFor="source" className={labelClasses}>
          How did you hear about us?
        </label>
        <select
          id="source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className={`${inputClasses} ${!source ? "text-white/30" : ""} ${errors.source ? "border-red-500/50" : ""}`}
        >
          {SOURCE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-navy text-white">
              {opt.label}
            </option>
          ))}
        </select>
        {errors.source && (
          <p className="text-red-400 text-xs mt-1.5">{errors.source}</p>
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
          className="bg-lime text-navy font-bold rounded-full px-8 py-3.5 text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(184,255,0,0.3)] transition-all w-full sm:w-auto cursor-pointer"
        >
          Continue
        </button>
      </div>
    </motion.form>
  );
}
