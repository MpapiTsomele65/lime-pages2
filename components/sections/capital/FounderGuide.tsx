"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import Link from "next/link";
import {
  CheckCircle,
  Lightbulb,
  Shield,
  Target,
  Handshake,
  ArrowRight,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const stagger = {
  whileInView: { transition: { staggerChildren: 0.08 } },
  viewport: { once: true, amount: 0.1 },
};

const staggerChild = {
  initial: { opacity: 0, x: -16 },
  whileInView: { opacity: 1, x: 0 },
  transition: { duration: 0.45, ease: "easeOut" as const },
};

const takeaways = [
  {
    icon: Target,
    title: "Validate Before You Raise",
    description:
      "42.5% of 2024 deals went to Series A. VCs are shifting from early bets to companies with proven traction. Get your unit economics right and show consistent growth before approaching investors.",
  },
  {
    icon: Lightbulb,
    title: "Build in the Flow",
    description:
      "Tech (65.9%) and Health (20%) capture the majority of VC capital. If your startup intersects with FinTech, SaaS, or HealthTech, you are in the sectors where capital is most actively deployed.",
  },
  {
    icon: Handshake,
    title: "Governance Wins Deals",
    description:
      "83.3% of VCs prioritise strategic guidance for portfolio companies, with board management as the #2 value-add. Build your governance structures early — it signals investability.",
  },
  {
    icon: Shield,
    title: "Plan Your Exit from Day One",
    description:
      "With only 3 exits recorded in 2024, the SA exit environment is constrained. Think about your exit strategy from the start — whether trade sale, secondary, or international expansion.",
  },
  {
    icon: CheckCircle,
    title: "Explore Venture Debt",
    description:
      "Only 28% of SA VCs have used venture debt, but it is growing globally. If you have existing VC backing, venture debt can extend your runway between equity rounds without dilution.",
  },
];

const fundingFacts = [
  { stat: "2.6M", label: "SMMEs in South Africa" },
  { stat: "37%", label: "Are formalised" },
  { stat: "15%", label: "Max PE allocation for pension funds (Reg 28)" },
  { stat: "R631bn", label: "Total SMME lending in SA" },
];

export default function FounderGuide() {
  return (
    <section className="py-24 bg-snow">
      <Container>
        <div className="grid gap-16 lg:grid-cols-[1fr_380px] items-start">
          {/* Left — Takeaways */}
          <div>
            <motion.div {...fadeUp} className="mb-10">
              <div className="inline-block bg-capital rounded-full px-4 py-1.5 mb-5">
                <span className="text-[11px] font-bold tracking-[1.2px] uppercase text-navy">
                  For Founders
                </span>
              </div>
              <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-extrabold leading-[1.1] tracking-tight text-navy mb-4">
                What this means for you
              </h2>
              <p className="text-muted leading-relaxed max-w-[520px]">
                Practical takeaways from the data — whether you are raising your
                first round or scaling to Series A.
              </p>
            </motion.div>

            <motion.div {...stagger} className="space-y-5">
              {takeaways.map((item, i) => (
                <motion.div
                  key={item.title}
                  {...staggerChild}
                  className="flex gap-5 bg-white rounded-[16px] border border-border p-6 hover:border-capital/40 hover:shadow-sm transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-capital/20 flex items-center justify-center shrink-0 mt-0.5">
                    <item.icon className="w-5 h-5 text-navy" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-navy mb-1.5">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right — Sticky sidebar */}
          <div className="lg:sticky lg:top-[100px]">
            {/* Funding landscape card */}
            <motion.div
              {...fadeUp}
              transition={{
                duration: 0.6,
                ease: "easeOut" as const,
                delay: 0.15,
              }}
              className="bg-navy rounded-[20px] p-8 mb-6"
            >
              <p className="text-[11px] font-semibold tracking-[1.2px] uppercase text-capital mb-5">
                SA Funding Landscape
              </p>
              <div className="grid grid-cols-2 gap-5">
                {fundingFacts.map((fact) => (
                  <div key={fact.label}>
                    <p className="text-xl font-extrabold text-capital leading-none mb-1">
                      {fact.stat}
                    </p>
                    <p className="text-[11px] text-white/50 font-medium leading-snug">
                      {fact.label}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Source attribution */}
            <motion.div
              {...fadeUp}
              transition={{
                duration: 0.6,
                ease: "easeOut" as const,
                delay: 0.2,
              }}
              className="bg-white rounded-[16px] border border-border p-6 mb-6"
            >
              <p className="text-xs font-bold text-navy mb-2">Data Sources</p>
              <ul className="text-[11px] text-muted space-y-1.5 leading-relaxed">
                <li>SAVCA 2025 VC Industry Survey (2024 data)</li>
                <li>Intellidex-SAVCA Institutional Investors Report</li>
                <li>Intellidex-SAVCA Public Policy Report</li>
                <li>SAVCA Private Capital Magazine 2026</li>
              </ul>
            </motion.div>

            {/* CTA card */}
            <motion.div
              {...fadeUp}
              transition={{
                duration: 0.6,
                ease: "easeOut" as const,
                delay: 0.25,
              }}
              className="bg-capital rounded-[20px] p-7 text-center"
            >
              <p className="text-base font-bold text-navy mb-2">
                Need help navigating the funding landscape?
              </p>
              <p className="text-xs text-navy/60 mb-5 leading-relaxed">
                Our Fundraising Advisory helps first-time founders prepare for
                investor conversations.
              </p>
              <Link
                href="/advisory"
                className="inline-flex items-center gap-2 bg-navy text-white px-6 py-2.5 rounded-full text-sm font-bold hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(11,25,51,0.3)] transition-all"
              >
                Explore Advisory
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
}
