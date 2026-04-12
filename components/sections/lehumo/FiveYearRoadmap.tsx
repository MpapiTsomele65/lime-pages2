"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";

const steps = [
  { num: "Step 01 · Conversion", numColor: "text-teal", barColor: "bg-teal", title: "Savings → Special Purpose Vehicle", desc: "All accumulated savings are transferred into an SPV — a formal legal structure that enables the community to collectively own and operate assets under one entity.", cls: "s1" },
  { num: "Step 02 · Acquire", numColor: "text-lime", barColor: "bg-lime", title: "Buy Cash-Generating Assets", desc: "The SPV acquires appropriate cash-generating investment assets — property, equity stakes, or income-producing vehicles. Members receive their profit share through regular dividends.", cls: "s2" },
  { num: "Step 03 · Protect", numColor: "text-lime", barColor: "bg-lime", title: "Transfer into Lehumo Trust", desc: "The SPV is transferred into the Lehumo Trust — ensuring generational security of the assets. What you build today protects your children and their children.", cls: "s3" },
  { num: "Step 04 · At Maturity", numColor: "text-teal", barColor: "bg-gradient-to-r from-teal to-lime", title: "Passive Income for Every Member", desc: "At maturity with 90 members, Lehumo targets an asset portfolio of over R5 Million, generating passive income distributed to every member through dividend payments.", cls: "s4" },
];

export function FiveYearRoadmap() {
  return (
    <section id="plan" className="py-16 bg-navy">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" as const }}
        >
          <span className="text-[11px] font-bold tracking-[1.4px] uppercase text-lime mb-3.5 block">
            Target: Before 2030
          </span>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white leading-[1.08] tracking-tight mb-4">
            What happens after the
            <br />
            <span className="text-teal">5-Year Lock-in?</span>
          </h2>
          <p className="text-base text-white/55 leading-[1.8] max-w-[580px]">
            After 60 months of collective saving, Lehumo enters its transformation phase — turning community savings into real, generational assets.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {steps.map((s, i) => (
            <motion.div
              key={s.cls}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.12 * i, ease: "easeOut" as const }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-8 relative overflow-hidden hover:border-lime/25 transition-colors"
            >
              <div className={`absolute top-0 left-0 right-0 h-[3px] ${s.barColor}`} />
              <div className={`text-[11px] font-extrabold tracking-[2px] uppercase mb-4 ${s.numColor}`}>{s.num}</div>
              <h3 className="text-xl font-extrabold text-white mb-3 leading-tight">{s.title}</h3>
              <p className="text-sm text-white/55 leading-[1.75]">{s.desc}</p>
            </motion.div>
          ))}
        </div>

      </Container>
    </section>
  );
}
