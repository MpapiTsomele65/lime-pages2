"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const bars = [
  { label: "Year 1", value: "360", height: 40, color: "bg-teal/40", delay: 0.1 },
  { label: "Year 2", value: "720", height: 80, color: "bg-teal/60", delay: 0.2 },
  { label: "Year 3", value: "1,080", height: 118, color: "bg-teal/80", delay: 0.3 },
  { label: "Year 4", value: "1,400", height: 154, color: "bg-teal", delay: 0.4 },
  { label: "Year 5", value: "1,800", height: 200, color: "bg-lime", delay: 0.5, highlight: true },
];

export function WhatIsLehumo() {
  return (
    <section id="what" className="py-16 bg-navy">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Text */}
          <motion.div {...fadeUp}>
            <span className="text-[11px] font-bold tracking-[1.4px] uppercase text-lime mb-3.5 block">
              What is Lehumo?
            </span>
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white leading-[1.08] tracking-tight mb-5">
              A community-owned
              <br />
              <span className="text-teal">investment machine.</span>
            </h2>
            <p className="text-base text-white/60 leading-[1.8] mb-6">
              Lehumo is a Collective Investment Trust — 30 Founding Members working towards a shared vision of establishing an investment pool of <strong className="text-white">~R2 Million</strong> after a 5-Year Lock-in Period.
            </p>
            <p className="text-base text-white/60 leading-[1.8] mb-8">
              Each member contributes just <strong className="text-lime">R1,000 per month</strong>. That&apos;s it. The community then pools these contributions, builds collective wealth, and at maturity — converts into a Special Purpose Vehicle that acquires cash-generating assets.
            </p>
            <div className="bg-lime/[0.07] border border-lime/20 rounded-[14px] px-6 py-5">
              <p className="text-sm text-white/70 leading-[1.7]">
                <strong className="text-lime">Not just a savings account.</strong> Lehumo is structured to own assets — property, shares, and other income-generating vehicles — that pay dividends to every member.
              </p>
            </div>
          </motion.div>

          {/* Bar chart */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, ease: "easeOut" as const, delay: 0.2 }}
            className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-9"
          >
            <p className="text-xs font-bold text-white/32 tracking-[1px] uppercase mb-8">
              Cumulative Pool Growth · R&apos;000
            </p>
            <div className="flex items-end gap-3 h-[200px]">
              {bars.map((b) => (
                <div key={b.label} className="flex flex-col items-center flex-1 gap-2">
                  <span className={`text-[13px] font-extrabold ${b.highlight ? "text-lime" : "text-white"}`}>
                    {b.value}
                  </span>
                  <motion.div
                    className={`w-full rounded-t-lg ${b.color}`}
                    initial={{ height: 0 }}
                    whileInView={{ height: b.height }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: b.delay, ease: "easeOut" as const }}
                    style={{ minHeight: 8 }}
                  />
                  <span className={`text-[11px] font-semibold ${b.highlight ? "text-lime font-bold" : "text-white/32"}`}>
                    {b.label}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-5 pt-4 border-t border-white/[0.08] text-xs text-white/32">
              30 members × R1,000/month × 60 months. Before investment returns.
            </p>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
