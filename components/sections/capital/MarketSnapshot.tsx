"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const stats = [
  { value: "R13.35bn", label: "Active VC Investments", change: "+24.4% YoY" },
  { value: "1,325", label: "Active Deals", change: "Record high" },
  { value: "R206bn", label: "PE Under Management", change: "6% CAGR" },
  { value: "R3.75bn+", label: "Dry Powder", change: "Uncommitted" },
];

export default function MarketSnapshot() {
  return (
    <section className="bg-capital py-10">
      <Container>
        <motion.div
          {...fadeUp}
          className="flex flex-col sm:flex-row items-center gap-2 sm:gap-0 mb-6 sm:mb-0"
        >
          <p className="text-xs font-bold tracking-[1.5px] uppercase text-navy/60 sm:hidden">
            SA Private Capital — 2024
          </p>
        </motion.div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.4,
                delay: 0.06 * i,
                ease: "easeOut" as const,
              }}
              className="bg-navy rounded-[16px] p-5 text-center"
            >
              <p className="text-[clamp(1.3rem,2.5vw,1.8rem)] font-extrabold text-white leading-none mb-1">
                {stat.value}
              </p>
              <p className="text-[10px] font-medium text-white/45 tracking-wide mb-1.5">
                {stat.label}
              </p>
              <p className="text-[10px] font-semibold text-capital">
                {stat.change}
              </p>
            </motion.div>
          ))}
        </div>
        <motion.p
          {...fadeUp}
          className="text-center text-[10px] text-navy/40 mt-4 font-medium"
        >
          Source: SAVCA 2025 VC Survey &amp; Intellidex Institutional Research
        </motion.p>
      </Container>
    </section>
  );
}
