"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Container } from "@/components/ui/Container";

const steps = [
  { num: "Step 01 · Conversion", numColor: "text-teal", barColor: "bg-teal", title: "Savings → Special Purpose Vehicle", desc: "All accumulated savings are transferred into an SPV — a formal legal structure that enables the community to collectively own and operate assets under one entity.", cls: "s1" },
  { num: "Step 02 · Acquire", numColor: "text-lime", barColor: "bg-lime", title: "Buy Cash-Generating Assets", desc: "The SPV acquires appropriate cash-generating investment assets — property, equity stakes, or income-producing vehicles. Members receive their profit share through regular dividends.", cls: "s2" },
  { num: "Step 03 · Protect", numColor: "text-lime", barColor: "bg-lime", title: "Transfer into Lehumo Trust", desc: "The SPV is transferred into the Lehumo Trust — ensuring generational security of the assets. What you build today protects your children and their children.", cls: "s3" },
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
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

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" as const }}
          className="mt-10 grid grid-cols-1 lg:grid-cols-5 gap-5"
        >
          {/* Image accent */}
          <div className="lg:col-span-2 relative rounded-2xl overflow-hidden min-h-[200px]">
            <Image
              src="/images/sincerely-media-aVbHFu-Doo4-unsplash.jpg"
              alt="South African Rands — building wealth"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent" />
          </div>
          {/* Message */}
          <div className="lg:col-span-3 bg-teal/[0.07] border border-teal/20 rounded-2xl px-8 py-7 flex items-center">
            <p className="text-[15px] text-white/65 leading-[1.8]">
              <strong className="text-white">The bigger mission:</strong> At maturity with 90 members, Lehumo targets an asset portfolio of over <strong className="text-lime">R5 Million</strong>, generating passive income distributed to every member through dividend payments.
            </p>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
