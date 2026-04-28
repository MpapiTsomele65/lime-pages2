"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import {
  detectIdType,
  validateIdInput,
  type IdType,
} from "@/lib/kyc";

interface StepKycDocsProps {
  onNext: (data: {
    sourceOfFunds: string;
    idType: IdType;
    idNumber: string;
    residentialAddress: string;
  }) => void;
  defaultSourceOfFunds?: string;
  defaultIdNumber?: string;
  defaultResidentialAddress?: string;
}

const KYC_DOCUMENTS = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
      </svg>
    ),
    title: "Copy of your SA ID or Passport",
    description:
      "A clear photo or scan of the same ID document you've entered above.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
    title: "Proof of Address",
    description:
      "A utility bill, bank statement, or municipal account that shows the address above (not older than 3 months).",
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

export function StepKycDocs({
  onNext,
  defaultSourceOfFunds,
  defaultIdNumber,
  defaultResidentialAddress,
}: StepKycDocsProps) {
  const [sourceOfFunds, setSourceOfFunds] = useState(defaultSourceOfFunds || "");
  const [idNumber, setIdNumber] = useState(defaultIdNumber || "");
  const [residentialAddress, setResidentialAddress] = useState(
    defaultResidentialAddress || "",
  );
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<{
    sourceOfFunds?: string;
    idNumber?: string;
    residentialAddress?: string;
  }>({});

  // Live ID-type detection drives the badge below the input. Detection
  // returns null until the user has typed enough to classify; once the
  // string is recognisably an SA ID or passport we surface that visually
  // so the user knows we understood their input correctly.
  const detectedType = useMemo(() => detectIdType(idNumber), [idNumber]);

  // Full validation — only used to gate Continue and show field-level
  // errors on submit, not on every keystroke (avoids "you typed 1
  // character so this is wrong" flicker).
  const idValidation = useMemo(() => validateIdInput(idNumber), [idNumber]);

  const addressValid = residentialAddress.trim().length >= 10;
  const canProceed =
    !!sourceOfFunds && idValidation.ok && addressValid && agreed;

  function handleContinue() {
    const next: typeof errors = {};
    if (!sourceOfFunds) next.sourceOfFunds = "Please select your source of funds.";
    if (!idValidation.ok) {
      next.idNumber = idValidation.reason || "Enter a valid ID or passport number.";
    }
    if (!addressValid) {
      next.residentialAddress =
        "Please enter your residential address (street, suburb, city).";
    }
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    if (!agreed) return;

    onNext({
      sourceOfFunds,
      idType: idValidation.type as IdType,
      idNumber: idNumber.trim(),
      residentialAddress: residentialAddress.trim(),
    });
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-white mb-2">
          Knowing you and your funds
        </h2>
        <p className="text-white/50 text-sm leading-relaxed">
          As part of regulatory requirements, we need to verify your identity
          and understand the source of your investment funds.
        </p>
      </div>

      {/* ── 1. Source of Funds ── */}
      <div>
        <label
          htmlFor="sourceOfFunds"
          className="text-sm font-semibold text-white/70 mb-2 block"
        >
          Source of Funds
        </label>
        <p className="text-xs text-white/40 mb-3 leading-relaxed">
          Where does the money for your monthly contribution come from?
        </p>
        <select
          id="sourceOfFunds"
          value={sourceOfFunds}
          onChange={(e) => {
            setSourceOfFunds(e.target.value);
            setErrors((prev) => ({ ...prev, sourceOfFunds: undefined }));
          }}
          className={`${inputClasses} ${!sourceOfFunds ? "text-white/30" : ""} ${
            errors.sourceOfFunds ? "border-red-500/50" : ""
          }`}
        >
          {SOURCE_OF_FUNDS_OPTIONS.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-navy text-white"
            >
              {opt.label}
            </option>
          ))}
        </select>
        {errors.sourceOfFunds && (
          <p className="text-red-400 text-xs mt-1.5">{errors.sourceOfFunds}</p>
        )}
      </div>

      {/* ── 2. ID / Passport Number ── */}
      <div>
        <label
          htmlFor="idNumber"
          className="text-sm font-semibold text-white/70 mb-2 block"
        >
          ID or Passport Number
        </label>
        <p className="text-xs text-white/40 mb-3 leading-relaxed">
          Enter your South African ID number (13 digits) or your passport
          number. We&rsquo;ll auto-detect which one it is.
        </p>
        <input
          id="idNumber"
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          value={idNumber}
          onChange={(e) => {
            setIdNumber(e.target.value);
            setErrors((prev) => ({ ...prev, idNumber: undefined }));
          }}
          placeholder="e.g. 9001015009086 or A12345678"
          className={`${inputClasses} ${
            errors.idNumber ? "border-red-500/50" : ""
          }`}
        />
        <div className="mt-2 flex items-center justify-between gap-3 min-h-[20px]">
          {detectedType && idValidation.ok ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-lime">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {detectedType === "sa_id" ? "SA ID detected" : "Passport format"}
            </span>
          ) : detectedType && !idValidation.ok ? (
            <span className="text-[11px] text-amber-300/80">
              {detectedType === "sa_id" ? "Looks like an SA ID — keep going" : "Looks like a passport"}
            </span>
          ) : (
            <span />
          )}
          {errors.idNumber && (
            <p className="text-red-400 text-xs">{errors.idNumber}</p>
          )}
        </div>
      </div>

      {/* ── 3. Residential Address ── */}
      <div>
        <label
          htmlFor="residentialAddress"
          className="text-sm font-semibold text-white/70 mb-2 block"
        >
          Residential Address
        </label>
        <p className="text-xs text-white/40 mb-3 leading-relaxed">
          The address shown on your proof of address document — street,
          suburb, city, and postal code.
        </p>
        <textarea
          id="residentialAddress"
          rows={3}
          autoComplete="street-address"
          value={residentialAddress}
          onChange={(e) => {
            setResidentialAddress(e.target.value);
            setErrors((prev) => ({ ...prev, residentialAddress: undefined }));
          }}
          placeholder="e.g. 123 Sandton Drive, Sandton, Johannesburg, 2196"
          className={`${inputClasses} resize-none ${
            errors.residentialAddress ? "border-red-500/50" : ""
          }`}
        />
        {errors.residentialAddress && (
          <p className="text-red-400 text-xs mt-1.5">
            {errors.residentialAddress}
          </p>
        )}
      </div>

      {/* ── 4. Document upload guidance ── */}
      <div className="pt-2">
        <p className="text-[11px] font-bold tracking-[1.4px] uppercase text-teal mb-3">
          Documents we&rsquo;ll need next
        </p>
        <div className="space-y-3">
          {KYC_DOCUMENTS.map((doc) => (
            <motion.div
              key={doc.title}
              className="flex gap-4 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]"
              whileHover={{ scale: 1.005 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center text-teal">
                {doc.icon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">
                  {doc.title}
                </h3>
                <p className="text-xs text-white/45 leading-relaxed">
                  {doc.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Note ── */}
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
          Once your account is activated, you can upload these via your{" "}
          <strong className="text-teal">member portal</strong> — or email them
          to <strong className="text-teal">lehumo@limepages.co.za</strong>.
          We&rsquo;ll verify and update your KYC status from there.
        </p>
      </div>

      {/* ── Checkbox ── */}
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
              <svg
                className="w-3.5 h-3.5 text-navy"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
        <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors leading-snug">
          I confirm the details above are accurate and I&rsquo;ll provide my
          KYC documents via the portal or email.
        </span>
      </label>

      {/* ── Submit ── */}
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
