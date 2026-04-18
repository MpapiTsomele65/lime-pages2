"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface StepKycDocsProps {
  onNext: (data: { sourceOfFunds: string }) => void;
  defaultSourceOfFunds?: string;
}

const KYC_DOCUMENTS = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
      </svg>
    ),
    title: "South African ID or Passport",
    description: "A certified copy or clear photo of your SA ID document or valid passport.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
    title: "Proof of Address",
    description: "A recent utility bill, bank statement, or municipal account (not older than 3 months).",
  },
];

const SOURCE_OF_FUNDS_OPTIONS = [
  { value: "", label: "Select source of funds..." },
  { value: "Employment/Salary", label: "Employment / Salary" },
  { value: "Self-Employment/Business", label: "Self-Employment / Business Income" },
  { value: "Savings", label: "Personal Savings" },
  { value: "Investments", label: "Investment Returns" },
  { value: "Pension/Retirement", label: "Pension / Retirement Fund" },
  { value: "Inheritance", label: "Inheritance" },
  { value: "Gift", label: "Gift / Family Support" },
  { value: "Rental Income", label: "Rental Income" },
  { value: "Government Grant", label: "Government Grant / Stipend" },
  { value: "Other", label: "Other" },
];

const inputClasses =
  "w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-teal/40 focus:ring-1 focus:ring-teal/20 outline-none transition-colors";

export function StepKycDocs({ onNext, defaultSourceOfFunds }: StepKycDocsProps) {
  const [agreed, setAgreed] = useState(false);
  const [sourceOfFunds, setSourceOfFunds] = useState(defaultSourceOfFunds || "");
  const [error, setError] = useState("");

  const canProceed = agreed && sourceOfFunds;

  function handleContinue() {
    if (!sourceOfFunds) {
      setError("Please select your source of funds.");
      return;
    }
    if (!agreed) return;
    onNext({ sourceOfFunds });
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-white mb-2">Know Your Customer (KYC)</h2>
        <p className="text-white/50 text-sm leading-relaxed">
          As part of regulatory requirements, we need to verify your identity and
          understand the source of your investment funds.
        </p>
      </div>

      {/* Document Cards */}
      <div className="space-y-4">
        {KYC_DOCUMENTS.map((doc) => (
          <motion.div
            key={doc.title}
            className="flex gap-4 p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-teal/20 transition-colors"
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-teal/10 flex items-center justify-center text-teal">
              {doc.icon}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white mb-1">{doc.title}</h3>
              <p className="text-xs text-white/45 leading-relaxed">{doc.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Source of Funds */}
      <div>
        <label htmlFor="sourceOfFunds" className="text-sm font-semibold text-white/70 mb-2 block">
          Source of Funds
        </label>
        <p className="text-xs text-white/40 mb-3 leading-relaxed">
          Where does the money for your monthly R1,000 contribution come from?
        </p>
        <select
          id="sourceOfFunds"
          value={sourceOfFunds}
          onChange={(e) => {
            setSourceOfFunds(e.target.value);
            setError("");
          }}
          className={`${inputClasses} ${!sourceOfFunds ? "text-white/30" : ""} ${error ? "border-red-500/50" : ""}`}
        >
          {SOURCE_OF_FUNDS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-navy text-white">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
      </div>

      {/* Note */}
      <div className="flex gap-3 p-4 rounded-xl bg-teal/[0.06] border border-teal/15">
        <svg
          className="w-5 h-5 text-teal flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
          />
        </svg>
        <p className="text-xs text-teal/80 leading-relaxed">
          You will submit these documents via <strong className="text-teal">WhatsApp</strong> or{" "}
          <strong className="text-teal">email</strong> after completing the onboarding process.
          No uploads required right now.
        </p>
      </div>

      {/* Checkbox */}
      <label className="flex items-start gap-3 cursor-pointer group pt-2">
        <div className="relative mt-0.5">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-5 h-5 rounded-md border border-white/20 bg-white/[0.05] peer-checked:bg-lime peer-checked:border-lime transition-all flex items-center justify-center">
            {agreed && (
              <svg className="w-3.5 h-3.5 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
        <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors leading-snug">
          I understand and agree to provide KYC documents after completing onboarding.
        </span>
      </label>

      {/* Submit */}
      <div className="pt-4">
        <button
          type="button"
          disabled={!canProceed}
          onClick={handleContinue}
          className={`font-bold rounded-full px-8 py-3.5 text-sm transition-all w-full sm:w-auto cursor-pointer ${
            canProceed
              ? "bg-lime text-navy hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(184,255,0,0.3)]"
              : "bg-white/[0.06] text-white/20 cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
}
