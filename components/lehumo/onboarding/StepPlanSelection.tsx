"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, CreditCard, Crown, Check, Zap } from "lucide-react";

interface StepPlanSelectionProps {
  onNext: (data: { plan: string }) => void;
  defaultPlan?: string;
}

const plans = [
  {
    id: "basic",
    icon: Wallet,
    name: "Basic",
    tagline: "Start building wealth at zero cost",
    price: "R1,000",
    fee: null,
    total: "R1,000/month",
    payment: "Manual EFT",
    loanAccess: "After 12 months",
    color: "lime",
    accentColor: "text-lime",
    accentBg: "bg-lime/10",
    borderColor: "border-lime/20",
    ringColor: "ring-lime/50",
    features: [
      "Manual EFT — you transfer on the 1st each month",
      "No collection or platform fees",
      "Emergency loan access after 12 months",
      "Loan eligibility from R2,400",
    ],
  },
  {
    id: "standard",
    icon: CreditCard,
    name: "Standard",
    tagline: "Set it and forget it",
    price: "R1,000",
    fee: "+ R19.90 collection fee",
    total: "R1,019.90/month",
    payment: "Automated Debit Order",
    loanAccess: "After 6 months",
    color: "teal",
    accentColor: "text-teal",
    accentBg: "bg-teal/10",
    borderColor: "border-teal/25",
    ringColor: "ring-teal/50",
    recommended: true,
    features: [
      "Automated debit order via Paystack — set & forget",
      "Emergency loan access after 6 months",
      "Loan eligibility from R1,200",
      "R19.90/mo collection fee — no hidden costs",
    ],
  },
  {
    id: "vip",
    icon: Crown,
    name: "VIP",
    tagline: "All of Standard + inner circle access",
    price: "R1,000",
    fee: "+ R99 platform fee",
    total: "R1,099/month",
    payment: "Automated Debit Order",
    loanAccess: "After 6 months",
    color: "purple",
    accentColor: "text-[#A855F7]",
    accentBg: "bg-[#A855F7]/10",
    borderColor: "border-[#A855F7]/25",
    ringColor: "ring-[#A855F7]/50",
    features: [
      "Everything in Standard, plus:",
      "Private WhatsApp group for VIP members",
      "Direct engagement with Lehumo leadership",
      "List your services on Lime Connect",
      "Priority support & exclusive updates",
    ],
  },
];

export function StepPlanSelection({ onNext, defaultPlan }: StepPlanSelectionProps) {
  const [selected, setSelected] = useState(defaultPlan || "");

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-white mb-2">
          Choose Your Plan
        </h2>
        <p className="text-white/50 text-sm leading-relaxed">
          Every plan invests R1,000/month — 100% goes into the pool. The only
          difference is how we collect and what extras you get.
        </p>
      </div>

      {/* Plan cards */}
      <div className="space-y-4">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isSelected = selected === plan.id;

          return (
            <motion.button
              key={plan.id}
              type="button"
              onClick={() => setSelected(plan.id)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.995 }}
              className={`w-full text-left rounded-[18px] border-2 p-5 transition-all duration-200 relative overflow-hidden ${
                isSelected
                  ? `${plan.borderColor} bg-white/[0.06] ring-2 ${plan.ringColor}`
                  : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"
              }`}
            >
              {/* Recommended badge */}
              {"recommended" in plan && plan.recommended && (
                <div className="absolute top-0 right-5">
                  <div className="bg-teal rounded-b-lg px-3 py-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-navy">
                      Recommended
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4">
                {/* Selection indicator */}
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                    isSelected
                      ? `${plan.borderColor} ${plan.accentBg}`
                      : "border-white/20"
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    >
                      <Check className={`w-3.5 h-3.5 ${plan.accentColor}`} strokeWidth={3} />
                    </motion.div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className={`w-8 h-8 rounded-lg ${plan.accentBg} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${plan.accentColor}`} />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white leading-tight">
                        {plan.name}
                      </h3>
                      <p className="text-[11px] text-white/40">{plan.tagline}</p>
                    </div>
                  </div>

                  {/* Price + payment */}
                  <div className="flex items-baseline gap-2 mt-3 mb-3">
                    <span className={`text-xl font-extrabold ${plan.accentColor}`}>
                      {plan.price}
                    </span>
                    {plan.fee && (
                      <span className="text-xs text-white/40">{plan.fee}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-white/45 mb-3">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3 h-3" />
                      <span>{plan.payment}</span>
                    </div>
                    <span>Loan: {plan.loanAccess}</span>
                  </div>

                  {/* Features (show when selected) */}
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.3 }}
                      className="pt-3 border-t border-white/[0.06]"
                    >
                      <ul className="space-y-1.5">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2">
                            <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${plan.accentColor}`} strokeWidth={2.5} />
                            <span className="text-xs text-white/55">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Note */}
      <div className="flex gap-3 p-4 rounded-xl bg-lime/[0.04] border border-lime/15">
        <svg
          className="w-5 h-5 text-lime flex-shrink-0 mt-0.5"
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
        <p className="text-xs text-lime/70 leading-relaxed">
          Your full <strong className="text-lime">R1,000 contribution</strong> is invested regardless of plan.
          Plan fees are separate and cover collection or platform services only.
        </p>
      </div>

      {/* Submit */}
      <div className="pt-4">
        <button
          type="button"
          disabled={!selected}
          onClick={() => onNext({ plan: selected })}
          className={`font-bold rounded-full px-8 py-3.5 text-sm transition-all w-full sm:w-auto cursor-pointer ${
            selected
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
