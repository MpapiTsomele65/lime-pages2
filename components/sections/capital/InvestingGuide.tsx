"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import {
  Layers,
  BarChart3,
  CheckCircle,
  TrendingUp,
  ShieldCheck,
  Clock,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, amount: 0.15 } as const,
  transition: { duration: 0.6, ease: "easeOut" as const } as const,
};

const steps = [
  {
    number: "01",
    title: "Choose a platform",
    description:
      "Easy Equities, Satrix, Allan Gray, Coronation. Most let you start with as little as R500.",
  },
  {
    number: "02",
    title: "FICA & verify",
    description:
      "Complete KYC/FICA with your ID and proof of address. Usually done online in minutes.",
  },
  {
    number: "03",
    title: "Pick your vehicle",
    description:
      "Unit trust for managed investing, ETF for low-cost index tracking. Start with what matches your risk appetite.",
  },
  {
    number: "04",
    title: "Set up a debit order",
    description:
      "Consistency beats timing. Set up a monthly debit order and let compound interest do the work.",
  },
];

const keyConcepts = [
  {
    icon: TrendingUp,
    title: "Compound Interest",
    description:
      "Earning returns on your returns. The earlier you start, the more powerful it becomes.",
  },
  {
    icon: ShieldCheck,
    title: "Diversification",
    description:
      "Don\u2019t put all your eggs in one basket. Spread across asset classes, sectors, and geographies.",
  },
  {
    icon: Clock,
    title: "Time in Market",
    description:
      "Staying invested through ups and downs beats trying to time the market. Think decades, not days.",
  },
];

const unitTrustBullets = [
  "Professionally managed",
  "Diversified across assets",
  "Regulated by FSCA",
];

const etfBullets = [
  "Low fees (TER often under 0.15%)",
  "Trades like a share on the JSE",
  "Instant diversification",
];

export default function InvestingGuide() {
  return (
    <section className="py-24 bg-snow">
      <Container>
        {/* ── Header ── */}
        <motion.div {...fadeUp} className="text-center max-w-[640px] mx-auto mb-16">
          <div className="inline-block bg-capital rounded-full px-4 py-1.5 mb-5">
            <span className="text-[11px] font-bold tracking-[1.2px] uppercase text-navy">
              Investing 101
            </span>
          </div>
          <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-extrabold leading-[1.1] tracking-tight text-navy mb-4">
            How to start investing.
          </h2>
          <p className="text-[#3F3F46] leading-relaxed">
            A beginner&apos;s guide to building wealth through unit trusts and
            ETFs — the two most accessible investment vehicles in South Africa.
          </p>
        </motion.div>

        {/* ── Two-column explainer cards ── */}
        <div className="grid gap-8 lg:grid-cols-2 mb-20">
          {/* Unit Trust card */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, ease: "easeOut" as const, delay: 0.08 * 0 }}
            className="bg-white rounded-[20px] border border-border p-8 hover:border-teal/40 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-4 mb-5">
              <div className="w-11 h-11 rounded-[14px] bg-teal/15 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5 text-navy" />
              </div>
              <h3 className="text-lg font-bold text-navy">
                What is a Unit Trust?
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-[#3F3F46] mb-5">
              A unit trust pools money from many investors to buy a diversified
              portfolio of assets. Professional fund managers make the investment
              decisions. You buy &ldquo;units&rdquo; which represent your share of the fund.
              Minimum investments can be as low as R500/month.
            </p>
            <ul className="space-y-2.5">
              {unitTrustBullets.map((bullet) => (
                <li key={bullet} className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-teal shrink-0" />
                  <span className="text-sm font-medium text-[#18181B]">{bullet}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* ETF card */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, ease: "easeOut" as const, delay: 0.08 * 1 }}
            className="bg-white rounded-[20px] border border-border p-8 hover:border-teal/40 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-4 mb-5">
              <div className="w-11 h-11 rounded-[14px] bg-teal/15 flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5 text-navy" />
              </div>
              <h3 className="text-lg font-bold text-navy">What is an ETF?</h3>
            </div>
            <p className="text-sm leading-relaxed text-[#3F3F46] mb-5">
              An Exchange-Traded Fund trades on the stock exchange like a share.
              It tracks an index (like the JSE Top 40 or S&amp;P 500) and offers
              instant diversification at very low cost. You can buy ETFs through
              any stockbroker or investment platform.
            </p>
            <ul className="space-y-2.5">
              {etfBullets.map((bullet) => (
                <li key={bullet} className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-teal shrink-0" />
                  <span className="text-sm font-medium text-[#18181B]">{bullet}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* ── Getting Started steps ── */}
        <motion.div {...fadeUp} className="mb-8">
          <h3 className="text-[clamp(1.4rem,3vw,2rem)] font-extrabold tracking-tight text-navy">
            Getting Started
          </h3>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-4 mb-20">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              {...fadeUp}
              transition={{ duration: 0.6, ease: "easeOut" as const, delay: 0.08 * i }}
              className="relative bg-white rounded-[20px] border border-border p-6 hover:border-navy/30 hover:shadow-sm transition-all overflow-hidden"
            >
              <span className="absolute -top-2 -right-1 text-[72px] font-extrabold leading-none text-navy/[0.04] select-none pointer-events-none">
                {step.number}
              </span>
              <p className="text-[11px] font-bold tracking-[1.2px] uppercase text-navy mb-3">
                Step {step.number}
              </p>
              <h4 className="text-base font-bold text-navy mb-2">
                {step.title}
              </h4>
              <p className="text-sm leading-relaxed text-[#3F3F46]">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* ── Key Concepts banner ── */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" as const, delay: 0.1 }}
          className="bg-white rounded-[20px] border border-border p-8"
        >
          <p className="text-[11px] font-bold tracking-[1.2px] uppercase text-navy mb-6">
            Key Concepts
          </p>
          <div className="grid gap-8 md:grid-cols-3">
            {keyConcepts.map((concept, i) => (
              <motion.div
                key={concept.title}
                {...fadeUp}
                transition={{ duration: 0.6, ease: "easeOut" as const, delay: 0.08 * i }}
              >
                <div className="w-10 h-10 rounded-[14px] bg-navy/[0.08] flex items-center justify-center mb-4">
                  <concept.icon className="w-5 h-5 text-navy" />
                </div>
                <h4 className="text-base font-bold text-navy mb-1.5">
                  {concept.title}
                </h4>
                <p className="text-sm leading-relaxed text-[#3F3F46]">
                  {concept.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
