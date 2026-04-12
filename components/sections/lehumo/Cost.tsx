"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import {
  Wallet,
  CreditCard,
  Crown,
  ArrowRight,
  Check,
  Clock,
  Shield,
  Zap,
} from "lucide-react";
import { PaymentMethods } from "./PaymentMethods";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const plans = [
  {
    id: "basic",
    icon: Wallet,
    name: "Basic",
    price: "R1,000",
    priceSuffix: "/month",
    priceNote: "No collection fees — you transfer manually.",
    planFee: null,
    planFeeAmount: null,
    tagline: "Start building wealth at zero cost",
    color: "lime",
    borderColor: "border-lime/20",
    bgColor: "bg-lime/[0.04]",
    accentColor: "text-lime",
    accentBg: "bg-lime/15",
    highlight: false,
    badge: null,
    payment: "Manual EFT",
    paymentDesc:
      "You transfer your R1,000 contribution manually via EFT or banking app each month.",
    paymentHighlight: false,
    loanAccess: "After 12 months",
    loanAmount: "Up to R2,400",
    loanDetail: "20% of your R12,000 total contributions at month 12",
    features: [
      "100% of contribution invested",
      "Full investment pool access",
      "Emergency loans from R2,400 (at 12mo)",
      "Dividend income at SPV maturity",
      "Member profile on LimePages",
    ],
    notIncluded: [
      "Automated debit order",
      "Early loan access (6 months)",
      "WhatsApp VIP group",
      "Lime Connect service listing",
    ],
    cta: "Join Basic",
    ctaStyle:
      "border-2 border-lime/30 text-lime hover:bg-lime/10",
  },
  {
    id: "standard",
    icon: CreditCard,
    name: "Standard",
    price: "R1,000",
    priceSuffix: "/month",
    priceNote: "R1,019.90 total monthly debit",
    planFee: "+ R19.90 collection fee",
    planFeeAmount: "R19.90",
    tagline: "Set it and forget it",
    color: "teal",
    borderColor: "border-teal/30",
    bgColor: "bg-teal/[0.06]",
    accentColor: "text-teal",
    accentBg: "bg-teal/15",
    highlight: true,
    badge: "Recommended",
    payment: "Automated Debit Order",
    paymentDesc:
      "We collect via Paystack automatically every month — your contribution is always on time, no effort required.",
    paymentHighlight: true,
    loanAccess: "After 6 months",
    loanAmount: "Up to R1,200",
    loanDetail: "20% of your R6,000 total contributions at month 6",
    features: [
      "100% of contribution invested",
      "Automated debit order via Paystack",
      "Full investment pool access",
      "Emergency loans from R1,200 (at 6mo)",
      "Dividend income at SPV maturity",
      "Member profile on LimePages",
    ],
    notIncluded: [
      "WhatsApp VIP group",
      "Lime Connect service listing",
    ],
    cta: "Join Standard",
    ctaStyle: "bg-teal text-navy hover:shadow-[0_8px_28px_rgba(70,205,207,0.3)]",
  },
  {
    id: "vip",
    icon: Crown,
    name: "VIP",
    price: "R1,000",
    priceSuffix: "/month",
    priceNote: "R1,099 total monthly debit",
    planFee: "+ R99 platform fee",
    planFeeAmount: "R99",
    tagline: "All of Standard + inner circle access",
    color: "purple",
    borderColor: "border-[#A855F7]/30",
    bgColor: "bg-[#A855F7]/[0.04]",
    accentColor: "text-[#A855F7]",
    accentBg: "bg-[#A855F7]/15",
    highlight: false,
    badge: "Inner Circle",
    payment: "Automated Debit Order",
    paymentDesc:
      "Same seamless Paystack automation as Standard — plus exclusive community access.",
    paymentHighlight: true,
    loanAccess: "After 6 months",
    loanAmount: "Up to R1,200",
    loanDetail: "20% of your R6,000 total contributions at month 6",
    features: [
      "Everything in Standard, plus:",
      "Private WhatsApp group for VIP members",
      "Direct engagement with Lehumo leadership",
      "List your services on Lime Connect",
      "Access a network of trusted professionals",
      "Priority support & exclusive updates",
    ],
    notIncluded: [],
    cta: "Join VIP",
    ctaStyle:
      "bg-[#A855F7] text-white hover:shadow-[0_8px_28px_rgba(168,85,247,0.3)]",
  },
];

/* ─── Loan rules (apply to all plans) ─── */
const loanRules = [
  { label: "Max loan", value: "20% of total contributions" },
  { label: "Interest", value: "0% — interest free" },
  { label: "Repayment", value: "Within 3 months" },
  { label: "Frequency", value: "1 active loan at a time" },
];

/* ─── Card gradient styles ─── */
const cardGradient: Record<string, React.CSSProperties> = {
  basic: {
    background:
      "linear-gradient(165deg, rgba(255,255,255,0.08) 0%, rgba(184,255,0,0.04) 40%, rgba(255,255,255,0.02) 100%)",
  },
  standard: {
    background:
      "linear-gradient(165deg, rgba(255,255,255,0.10) 0%, rgba(70,205,207,0.06) 40%, rgba(255,255,255,0.03) 100%)",
  },
  vip: {
    background:
      "linear-gradient(165deg, rgba(255,255,255,0.10) 0%, rgba(168,85,247,0.06) 40%, rgba(255,255,255,0.02) 100%)",
  },
};

export function Cost() {
  return (
    <section id="cost" className="py-20 md:py-28 bg-navy">
      <Container>
        {/* ── Header ── */}
        <motion.div
          {...fadeUp}
          className="text-center max-w-[700px] mx-auto mb-14"
        >
          <span className="text-[11px] font-bold tracking-[1.4px] uppercase text-lime mb-3.5 block">
            Membership Plans
          </span>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white leading-[1.08] tracking-tight mb-3">
            Choose how you
            <br />
            <span className="text-teal">participate.</span>
          </h2>
          <p className="text-base text-white/50 leading-[1.8] max-w-[560px] mx-auto">
            Every plan invests{" "}
            <strong className="text-white">R1,000/month</strong> — 100%
            goes into the pool, zero management fees. The only difference
            is <strong className="text-white">how we collect</strong>:
            manual EFT or automated debit order.
          </p>
        </motion.div>

        {/* ── 3 Plan Cards ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-14">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.55,
                  delay: 0.1 * i,
                  ease: "easeOut" as const,
                }}
                className={`relative rounded-[20px] border overflow-hidden flex flex-col ${plan.borderColor} ${
                  plan.highlight
                    ? "ring-1 ring-teal/30 lg:scale-[1.03] lg:-my-2"
                    : ""
                }`}
                style={cardGradient[plan.id]}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute top-0 left-0 right-0">
                    <div
                      className={`mx-auto w-fit -translate-y-0 rounded-b-lg px-4 py-1.5 ${
                        plan.color === "teal"
                          ? "bg-teal"
                          : "bg-[#A855F7]"
                      }`}
                    >
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          plan.color === "teal"
                            ? "text-navy"
                            : "text-white"
                        }`}
                      >
                        {plan.badge}
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-7 pt-8 flex flex-col flex-1">
                  {/* Icon + Name */}
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className={`w-11 h-11 rounded-[14px] flex items-center justify-center ${plan.accentBg}`}
                    >
                      <Icon className={`w-5 h-5 ${plan.accentColor}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-white">
                        {plan.name}
                      </h3>
                      <p className="text-[11px] text-white/40">
                        {plan.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-1">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span
                        className={`text-[clamp(2.4rem,5vw,3.2rem)] font-extrabold leading-none ${plan.accentColor}`}
                      >
                        {plan.price}
                      </span>
                      {plan.planFeeAmount && (
                        <>
                          <span className="text-lg font-bold text-white/25 leading-none">
                            +
                          </span>
                          <span className="text-lg font-extrabold text-white/70 leading-none">
                            {plan.planFeeAmount}
                          </span>
                        </>
                      )}
                      <span className="text-sm font-semibold text-white/35">
                        /month
                      </span>
                    </div>
                    {plan.planFee ? (
                      <p className="text-xs text-white/40 mt-1.5">
                        {plan.priceNote}
                      </p>
                    ) : (
                      <p className="text-xs text-lime/60 font-semibold mt-1.5">
                        {plan.priceNote}
                      </p>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-white/[0.08] my-5" />

                  {/* Payment method — highlighted on Standard/VIP */}
                  <div
                    className={`mb-5 rounded-xl px-4 py-3 ${
                      plan.paymentHighlight
                        ? `border ${plan.borderColor} ${plan.bgColor}`
                        : "bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {plan.paymentHighlight ? (
                        <Zap
                          size={13}
                          className={plan.accentColor}
                        />
                      ) : (
                        <Wallet size={13} className="text-white/40" />
                      )}
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wide ${
                          plan.paymentHighlight
                            ? plan.accentColor
                            : "text-white/40"
                        }`}
                      >
                        {plan.payment}
                      </span>
                    </div>
                    <p
                      className={`text-xs leading-relaxed ${
                        plan.paymentHighlight
                          ? "text-white/60 font-medium"
                          : "text-white/45"
                      }`}
                    >
                      {plan.paymentDesc}
                    </p>
                  </div>

                  {/* Loan access highlight */}
                  <div
                    className={`rounded-xl border px-4 py-3 mb-5 ${plan.borderColor} ${plan.bgColor}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Clock size={13} className={plan.accentColor} />
                        <span
                          className={`text-xs font-bold ${plan.accentColor}`}
                        >
                          Emergency Loan: {plan.loanAccess}
                        </span>
                      </div>
                      <span className="text-sm font-extrabold text-white">
                        {plan.loanAmount}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/40">
                      {plan.loanDetail}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check
                          size={14}
                          className={`shrink-0 mt-0.5 ${plan.accentColor}`}
                        />
                        <span className="text-[13px] text-white/65 leading-snug">
                          {f}
                        </span>
                      </li>
                    ))}
                    {plan.notIncluded.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2.5 opacity-40"
                      >
                        <span className="w-3.5 h-px bg-white/30 shrink-0 mt-2" />
                        <span className="text-[13px] text-white/35 leading-snug line-through">
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    href="/lehumo/onboard"
                    className={`w-full py-3.5 rounded-full text-center text-sm font-bold transition-all hover:-translate-y-0.5 ${plan.ctaStyle}`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Payment Methods ── */}
        <PaymentMethods />

        {/* ── Loan Rules (apply to all) ── */}
        <motion.div
          {...fadeUp}
          className="bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-7 py-6 mb-14 max-w-[800px] mx-auto"
        >
          <div className="flex items-center gap-2.5 mb-5">
            <Shield size={18} className="text-teal" />
            <span className="text-sm font-bold text-white">
              Emergency Loan Rules
            </span>
            <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider ml-auto">
              All plans
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loanRules.map((rule) => (
              <div key={rule.label}>
                <p className="text-[10px] font-bold text-white/35 uppercase tracking-wide mb-1">
                  {rule.label}
                </p>
                <p className="text-sm font-semibold text-white/80">
                  {rule.value}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Contribution clarity ── */}
        <motion.div
          {...fadeUp}
          className="text-center max-w-[580px] mx-auto mb-10"
        >
          <div className="inline-flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] rounded-full px-6 py-3 mb-6">
            <span className="text-sm text-white/50">R1,000 contribution</span>
            <span className="text-white/20">→</span>
            <span className="text-sm font-bold text-lime">
              100% invested
            </span>
          </div>
          <p className="text-sm text-white/40 leading-relaxed">
            Plan fees are separate from your investment. No management fees,
            no performance fees, no hidden charges. Your full R1,000 works
            for you every single month.
          </p>
        </motion.div>

        {/* ── CTA ── */}
        <motion.div {...fadeUp} className="text-center">
          <Link
            href="/lehumo/onboard"
            className="inline-flex items-center gap-2 bg-lime text-navy px-9 py-[15px] rounded-full font-extrabold text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(184,255,0,0.3)] transition-all"
          >
            Apply to Join <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-[11px] text-white/25 mt-4">
            Limited to 30 founding members &middot; Applications reviewed
            within 48 hours
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
