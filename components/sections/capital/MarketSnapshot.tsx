"use client";

import { motion } from "framer-motion";

const stats = [
  { value: "R13.35bn", label: "Active VC Investments", change: "+24.4% YoY" },
  { value: "1,325", label: "Active Deals", change: "Record high" },
  { value: "R206bn", label: "PE Under Management", change: "6% CAGR" },
  { value: "R3.75bn+", label: "Dry Powder", change: "Uncommitted" },
];

export default function MarketSnapshot() {
  return (
    <section className="bg-navy border-t border-white/[0.06]">
      <div className="max-w-[1200px] mx-auto px-[clamp(1.25rem,4vw,3.5rem)]">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/[0.08]">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.35,
                delay: 0.06 * i,
                ease: "easeOut" as const,
              }}
              className="py-6 lg:py-7 px-4 lg:px-6 text-center"
            >
              <p className="text-[clamp(1.1rem,2vw,1.5rem)] font-extrabold text-capital leading-none mb-1">
                {stat.value}
              </p>
              <p className="text-[10px] font-medium text-white/40 tracking-wide mb-0.5">
                {stat.label}
              </p>
              <p className="text-[10px] font-semibold text-white/25">
                {stat.change}
              </p>
            </motion.div>
          ))}
        </div>
        <p className="text-center text-[9px] text-white/20 pb-4 font-medium">
          Source: SAVCA 2025 VC Survey &amp; Intellidex Institutional Research
        </p>
      </div>
    </section>
  );
}
