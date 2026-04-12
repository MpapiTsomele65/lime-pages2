"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";

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

export default function GettingStarted() {
  return (
    <section className="py-16 sm:py-20 bg-white">
      <Container>
        <motion.div {...fadeUp} className="mb-8">
          <h3 className="text-[clamp(1.4rem,3vw,2rem)] font-extrabold tracking-tight text-navy">
            Getting Started
          </h3>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              {...fadeUp}
              transition={{
                duration: 0.6,
                ease: "easeOut" as const,
                delay: 0.08 * i,
              }}
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
      </Container>
    </section>
  );
}
