"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Container } from "@/components/ui/Container";

const missionStats = [
  { value: "90", color: "text-lime", title: "Members at Maturity", desc: "Starting at 30 Founding Bosses, growing to a fully connected community of 90 trusted members." },
  { value: "R5M+", color: "text-teal", title: "Asset Portfolio Target", desc: "A diversified asset portfolio exceeding R5 Million, generating passive income for all members." },
  { value: "0%", color: "text-lime", title: "Interest on Emergency Loans", desc: "Free access to 20% of your contributions when you need it most — no banks, no interest, no judgment." },
  { value: "∞", color: "text-teal", title: "Generational Wealth", desc: "Assets held in the Lehumo Trust pass to the next generation — breaking the cycle, building a legacy." },
];

const maturityBenefits = [
  { label: "Funeral Benefit Cover", color: "text-lime", bg: "bg-lime/[0.08]", border: "border-lime/20" },
  { label: "Free Interest-Free Loans", color: "text-teal", bg: "bg-teal/[0.08]", border: "border-teal/20" },
  { label: "Customised Investment Solutions", color: "text-lime", bg: "bg-lime/[0.08]", border: "border-lime/20" },
  { label: "LimePages Business Profile", color: "text-teal", bg: "bg-teal/[0.08]", border: "border-teal/20" },
];

export function BiggerMission() {
  return (
    <section className="relative overflow-hidden py-24 bg-navy-mid">
      <Image src="/images/ninthgrid--f8T1PHM0L4-unsplash.jpg" alt="" fill className="object-cover opacity-[0.06]" />
      <div className="absolute inset-0 bg-navy/90 z-[1]" />
      <Container className="relative z-[2]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" as const }}
        >
          <span className="text-[11px] font-bold tracking-[1.4px] uppercase text-teal mb-3.5 block">Is That It?</span>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white leading-[1.08] tracking-tight mb-12">
            What is the <span className="text-lime">bigger mission</span>
            <br />
            for this initiative?
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {missionStats.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * i, ease: "easeOut" as const }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-[18px] p-7 hover:border-lime/25 transition-colors"
            >
              <div className={`text-[40px] font-extrabold leading-none mb-2.5 ${s.color}`}>{s.value}</div>
              <h4 className="text-[15px] font-bold text-white mb-1.5 leading-tight">{s.title}</h4>
              <p className="text-[13px] text-white/55 leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" as const }}
          className="bg-white/[0.03] border border-white/[0.08] rounded-2xl px-8 py-7"
        >
          <p className="text-[15px] text-white/55 leading-[1.8] mb-3">
            At full maturity, each of the 90 Lehumo members will also receive:
          </p>
          <div className="flex flex-wrap gap-3">
            {maturityBenefits.map((b) => (
              <span key={b.label} className={`${b.bg} border ${b.border} rounded-full px-4 py-[7px] text-[13px] font-semibold ${b.color}`}>
                {b.label}
              </span>
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
