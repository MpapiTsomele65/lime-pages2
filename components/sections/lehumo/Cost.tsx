"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import {
  Smartphone,
  CreditCard,
  Banknote,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const options = [
  {
    icon: Smartphone,
    title: "Manual Payment",
    fee: "R10",
    period: "/month",
    desc: "You transfer your R1,000 monthly contribution yourself via EFT or bank app. A small admin fee keeps the platform running.",
    invested: "99%",
    investedLabel: "of your contribution is invested",
    details: ["Pay via EFT or bank app", "R10 admin fee per month", "R990 goes to your portfolio"],
    color: "lime",
    borderColor: "border-lime/25",
    bgColor: "bg-lime/[0.06]",
    iconBg: "bg-lime/15",
    iconColor: "text-lime",
    highlight: false,
  },
  {
    icon: CreditCard,
    title: "Debit Order",
    fee: "R30",
    period: "/month",
    desc: "Set it and forget it. We deduct your contribution automatically each month. The higher fee covers payment processing costs.",
    invested: "97%",
    investedLabel: "of your contribution is invested",
    details: ["Automated monthly deduction", "Includes Paystack processing fees", "R970 goes to your portfolio"],
    color: "teal",
    borderColor: "border-teal/25",
    bgColor: "bg-teal/[0.06]",
    iconBg: "bg-teal/15",
    iconColor: "text-teal",
    highlight: true,
  },
  {
    icon: Banknote,
    title: "Lump Sum",
    fee: "R50",
    period: "/contribution",
    desc: "Pay multiple months upfront in a single transfer. A once-off processing fee applies, plus the standard R10/month admin for each month covered.",
    invested: "97%+",
    investedLabel: "of your contribution is invested",
    details: ["Pay 3, 6, or 12 months at once", "R50 processing + R10/month admin", "e.g. R3,000 = R80 total fees"],
    color: "white",
    borderColor: "border-white/15",
    bgColor: "bg-white/[0.04]",
    iconBg: "bg-white/10",
    iconColor: "text-white",
    highlight: false,
  },
];

export function Cost() {
  return (
    <section id="cost" className="py-24 bg-navy">
      <Container>
        {/* ── Header ── */}
        <motion.div {...fadeUp} className="text-center max-w-[700px] mx-auto mb-14">
          <span className="text-[11px] font-bold tracking-[1.4px] uppercase text-lime mb-3.5 block">
            Transparent Pricing
          </span>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white leading-[1.08] tracking-tight mb-2">
            Free to join.
          </h2>
          <p className="text-[clamp(1.2rem,3vw,1.8rem)] font-bold text-white/40 mb-6">
            Small admin fees keep the platform running.
          </p>
          <p className="text-base text-white/55 leading-[1.8] max-w-[560px] mx-auto">
            No membership fee. No sign-up cost. No advisory charge. Your only
            commitment is the R1,000 monthly contribution. A voluntary admin fee
            covers platform costs, reporting, and compliance.
          </p>
        </motion.div>

        {/* ── Pricing Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
          {options.map((opt, i) => (
            <motion.div
              key={opt.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: 0.1 * i,
                ease: "easeOut" as const,
              }}
              className={`relative rounded-2xl border p-7 flex flex-col ${opt.borderColor} ${opt.bgColor} ${
                opt.highlight ? "ring-1 ring-teal/30" : ""
              }`}
            >
              {opt.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal rounded-full px-4 py-1">
                  <span className="text-[10px] font-bold text-navy uppercase tracking-wide">
                    Most Convenient
                  </span>
                </div>
              )}

              {/* Icon + title */}
              <div className="flex items-center gap-3 mb-5">
                <div
                  className={`w-10 h-10 rounded-xl ${opt.iconBg} flex items-center justify-center`}
                >
                  <opt.icon className={`w-5 h-5 ${opt.iconColor}`} />
                </div>
                <h3 className="text-lg font-bold text-white">{opt.title}</h3>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-1 mb-4">
                <span
                  className={`text-[clamp(2rem,5vw,2.8rem)] font-extrabold leading-none ${
                    opt.color === "lime"
                      ? "text-lime"
                      : opt.color === "teal"
                        ? "text-teal"
                        : "text-white"
                  }`}
                >
                  {opt.fee}
                </span>
                <span className="text-sm text-white/40 font-semibold">
                  {opt.period}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-white/55 leading-relaxed mb-5">
                {opt.desc}
              </p>

              {/* Details */}
              <ul className="space-y-2 mb-6 flex-1">
                {opt.details.map((d) => (
                  <li key={d} className="flex items-start gap-2">
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        opt.color === "lime"
                          ? "text-lime/60"
                          : opt.color === "teal"
                            ? "text-teal/60"
                            : "text-white/40"
                      }`}
                    />
                    <span className="text-[13px] text-white/65">{d}</span>
                  </li>
                ))}
              </ul>

              {/* Invested percentage */}
              <div
                className={`border rounded-xl px-4 py-3 text-center ${opt.borderColor}`}
              >
                <span
                  className={`text-xl font-extrabold ${
                    opt.color === "lime"
                      ? "text-lime"
                      : opt.color === "teal"
                        ? "text-teal"
                        : "text-white"
                  }`}
                >
                  {opt.invested}
                </span>
                <p className="text-[11px] text-white/40 mt-0.5">
                  {opt.investedLabel}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Lump Sum Example ── */}
        <motion.div
          {...fadeUp}
          className="bg-white/[0.03] border border-white/[0.08] rounded-2xl px-7 py-6 mb-10 max-w-[700px] mx-auto"
        >
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-wide mb-3">
            Lump Sum Example
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
            <div className="flex-1">
              <p className="text-sm text-white/60 leading-relaxed">
                Paying <strong className="text-white">R3,000</strong> upfront
                covers 3 months of contributions. Your total fees:
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-center">
                <p className="text-xs text-white/40">Admin</p>
                <p className="text-sm font-bold text-white">
                  R10 &times; 3
                </p>
              </div>
              <span className="text-white/20 text-lg">+</span>
              <div className="text-center">
                <p className="text-xs text-white/40">Processing</p>
                <p className="text-sm font-bold text-white">R50</p>
              </div>
              <span className="text-white/20 text-lg">=</span>
              <div className="text-center">
                <p className="text-xs text-white/40">Total fees</p>
                <p className="text-lg font-extrabold text-lime">R80</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-white/35 mt-3">
            R2,920 goes directly into your portfolio — that&apos;s{" "}
            <strong className="text-white/50">97.3%</strong> invested.
          </p>
        </motion.div>

        {/* ── Industry Comparison ── */}
        <motion.div
          {...fadeUp}
          className="text-center max-w-[560px] mx-auto mb-10"
        >
          <p className="text-sm text-white/45 leading-relaxed">
            For context, most South African unit trusts charge{" "}
            <strong className="text-white/65">1–2% annually</strong> in
            management fees. Lehumo&apos;s R10 monthly admin on a R1,000
            contribution is{" "}
            <strong className="text-lime">1% — with no hidden charges</strong>.
          </p>
        </motion.div>

        {/* ── CTA ── */}
        <motion.div {...fadeUp} className="text-center">
          <Link
            href="#join"
            className="inline-flex items-center gap-2 bg-lime text-navy px-9 py-[15px] rounded-full font-extrabold text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(184,255,0,0.3)] transition-all"
          >
            Get on the Waitlist — It&apos;s Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </Container>
    </section>
  );
}
