"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import {
  Smartphone,
  CreditCard,
  Banknote,
  ArrowRight,
  Heart,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const tiers = [
  {
    icon: Smartphone,
    title: "Manual Payment",
    topUp: "R10",
    youSend: "R1,010",
    desc: "You transfer your contribution via EFT or bank app. Add a voluntary R10 to help cover platform costs.",
    details: [
      "R1,000 goes straight into the pool",
      "R10 voluntary admin top-up",
      "100% of your contribution is invested",
    ],
    color: "lime",
    borderColor: "border-lime/25",
    bgColor: "bg-lime/[0.06]",
    highlight: false,
  },
  {
    icon: CreditCard,
    title: "Debit Order",
    topUp: "R30",
    youSend: "R1,030",
    desc: "Set it and forget it. We deduct automatically each month. The R30 top-up covers platform admin and payment processing.",
    details: [
      "R1,000 goes straight into the pool",
      "R30 covers admin + processing fees",
      "100% of your contribution is invested",
    ],
    color: "teal",
    borderColor: "border-teal/25",
    bgColor: "bg-teal/[0.06]",
    highlight: true,
  },
  {
    icon: Banknote,
    title: "Lump Sum",
    topUp: "R50",
    youSend: "e.g. R3,050",
    desc: "Pay 3, 6, or 12 months upfront in one transfer. Add a flat R50 to support the platform — that\u2019s it.",
    details: [
      "Full amount goes into the pool",
      "R50 flat voluntary top-up",
      "100% of your contribution is invested",
    ],
    color: "white",
    borderColor: "border-white/15",
    bgColor: "bg-white/[0.04]",
    highlight: false,
  },
];

export function Cost() {
  return (
    <section id="cost" className="py-16 bg-navy">
      <Container>
        {/* ── Header ── */}
        <motion.div
          {...fadeUp}
          className="text-center max-w-[700px] mx-auto mb-10"
        >
          <span className="text-[11px] font-bold tracking-[1.4px] uppercase text-lime mb-3.5 block">
            Cost
          </span>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white leading-[1.08] tracking-tight mb-2">
            100% of your R1,000
            <br />
            <span className="text-lime">is invested.</span>
          </h2>
          <p className="text-[clamp(1rem,2.5vw,1.3rem)] font-semibold text-white/40 mb-6">
            We don&apos;t take fees. We ask for a voluntary top-up.
          </p>
          <p className="text-base text-white/55 leading-[1.8] max-w-[580px] mx-auto">
            Your full R1,000 goes into the investment pool — untouched. To keep
            the platform running, we ask members to voluntarily add a small
            top-up to their payment. Given, not taken.
          </p>
        </motion.div>

        {/* ── The 3 Tiers ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: 0.1 * i,
                ease: "easeOut" as const,
              }}
              className={`relative rounded-2xl border p-7 flex flex-col ${tier.borderColor} ${tier.bgColor} ${
                tier.highlight ? "ring-1 ring-teal/30" : ""
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal rounded-full px-4 py-1">
                  <span className="text-[10px] font-bold text-navy uppercase tracking-wide">
                    Set &amp; Forget
                  </span>
                </div>
              )}

              {/* Icon + title */}
              <div className="flex items-center gap-3 mb-5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    tier.color === "lime"
                      ? "bg-lime/15"
                      : tier.color === "teal"
                        ? "bg-teal/15"
                        : "bg-white/10"
                  }`}
                >
                  <tier.icon
                    className={`w-5 h-5 ${
                      tier.color === "lime"
                        ? "text-lime"
                        : tier.color === "teal"
                          ? "text-teal"
                          : "text-white"
                    }`}
                  />
                </div>
                <h3 className="text-lg font-bold text-white">{tier.title}</h3>
              </div>

              {/* Top-up amount */}
              <div className="mb-1">
                <span className="text-[10px] font-bold text-white/35 uppercase tracking-wide">
                  Voluntary top-up
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mb-4">
                <span
                  className={`text-[clamp(2.2rem,5vw,3rem)] font-extrabold leading-none ${
                    tier.color === "lime"
                      ? "text-lime"
                      : tier.color === "teal"
                        ? "text-teal"
                        : "text-white"
                  }`}
                >
                  {tier.topUp}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-white/55 leading-relaxed mb-5">
                {tier.desc}
              </p>

              {/* Details */}
              <ul className="space-y-2.5 mb-6 flex-1">
                {tier.details.map((d) => (
                  <li key={d} className="flex items-start gap-2">
                    <Heart
                      className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                        tier.color === "lime"
                          ? "text-lime/50"
                          : tier.color === "teal"
                            ? "text-teal/50"
                            : "text-white/30"
                      }`}
                    />
                    <span className="text-[13px] text-white/60">{d}</span>
                  </li>
                ))}
              </ul>

              {/* You send */}
              <div
                className={`border rounded-xl px-4 py-3.5 text-center ${tier.borderColor}`}
              >
                <p className="text-[10px] text-white/35 uppercase tracking-wide mb-0.5">
                  You send
                </p>
                <span
                  className={`text-xl font-extrabold ${
                    tier.color === "lime"
                      ? "text-lime"
                      : tier.color === "teal"
                        ? "text-teal"
                        : "text-white"
                  }`}
                >
                  {tier.youSend}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── How it works ── */}
        <motion.div
          {...fadeUp}
          className="bg-white/[0.03] border border-white/[0.08] rounded-2xl px-7 py-6 mb-10 max-w-[700px] mx-auto"
        >
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-wide mb-4">
            How a lump sum works
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <p className="text-sm text-white/55 leading-relaxed flex-1">
              Want to pay <strong className="text-white">3 months</strong>{" "}
              upfront? Just send R3,000 + R50 top-up.
            </p>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-center px-3">
                <p className="text-xs text-white/40">Contribution</p>
                <p className="text-sm font-bold text-white">R3,000</p>
              </div>
              <span className="text-white/20 text-lg">+</span>
              <div className="text-center px-3">
                <p className="text-xs text-white/40">Top-up</p>
                <p className="text-sm font-bold text-lime">R50</p>
              </div>
              <span className="text-white/20 text-lg">=</span>
              <div className="text-center px-3">
                <p className="text-xs text-white/40">You send</p>
                <p className="text-lg font-extrabold text-white">R3,050</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-white/35 mt-3">
            The full R3,000 is invested.{" "}
            <strong className="text-lime/70">
              The R50 keeps the lights on.
            </strong>
          </p>
        </motion.div>

        {/* ── Trust note ── */}
        <motion.div
          {...fadeUp}
          className="text-center max-w-[520px] mx-auto mb-10"
        >
          <p className="text-sm text-white/40 leading-relaxed">
            No hidden charges. No management fees deducted from your investment.
            For context, most SA unit trusts take{" "}
            <strong className="text-white/55">1–2% off your returns</strong>.
            With Lehumo, your full contribution works for you —{" "}
            <strong className="text-lime/80">always</strong>.
          </p>
        </motion.div>

        {/* ── CTA ── */}
        <motion.div {...fadeUp} className="text-center">
          <Link
            href="#join"
            className="inline-flex items-center gap-2 bg-lime text-navy px-9 py-[15px] rounded-full font-extrabold text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(184,255,0,0.3)] transition-all"
          >
            Get on the Waitlist
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </Container>
    </section>
  );
}
