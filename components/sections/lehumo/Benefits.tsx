"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Banknote, TrendingUp, Heart, Globe } from "lucide-react";

const benefits = [
  {
    icon: Banknote, iconBg: "bg-lime-dim border-lime/25",
    title: "Interest-Free Emergency Loans",
    desc: "Get access to 20% of your contributions as an emergency interest-free loan — when life happens, the community has your back.",
    highlight: "Up to R20,000 · 0% Interest",
    highlightStyle: "bg-lime-dim border-lime/25 text-lime",
  },
  {
    icon: TrendingUp, iconBg: "bg-teal-dim border-teal/25",
    title: "Dividend Income at Maturity",
    desc: "When the trust converts to an SPV and acquires assets, members receive their profit share through regular dividends — passive income from collective ownership.",
    highlight: "Profit Share via SPV Dividends",
    highlightStyle: "bg-teal/10 border-teal/30 text-teal",
  },
  {
    icon: Heart, iconBg: "bg-lime-dim border-lime/25",
    title: "Funeral Benefit Cover",
    desc: "Coming soon. We are currently pricing this benefit to ensure it is sustainable and meaningful for every member.",
    highlight: "Coming Soon",
    highlightStyle: "bg-lime-dim border-lime/25 text-lime",
  },
  {
    icon: Globe, iconBg: "bg-teal-dim border-teal/25",
    title: "LimePages Member Profile",
    desc: "Each member gets a professional profile on the LimePages website to advertise their business or services — built-in exposure for your hustle.",
    highlight: "Free Business Visibility",
    highlightStyle: "bg-teal/10 border-teal/30 text-teal",
  },
];

export function Benefits() {
  return (
    <section id="benefits" className="py-16 bg-navy">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" as const }}
        >
          <span className="text-[11px] font-bold tracking-[1.4px] uppercase text-lime mb-3.5 block">Benefits?</span>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white leading-[1.08] tracking-tight mb-8">
            What do members
            <br />
            <span className="text-teal">actually get?</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * i, ease: "easeOut" as const }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-8 hover:border-lime/25 hover:-translate-y-1 transition-all"
            >
              <div className={`w-[52px] h-[52px] rounded-[14px] border flex items-center justify-center mb-5 ${b.iconBg}`}>
                <b.icon className="w-6 h-6 text-current" />
              </div>
              <h3 className="text-lg font-extrabold text-white mb-2.5 leading-tight">{b.title}</h3>
              <p className="text-sm text-white/55 leading-[1.7] mb-[18px]">{b.desc}</p>
              <div className={`border rounded-[10px] px-3.5 py-2.5 text-[13px] font-bold ${b.highlightStyle}`}>
                {b.highlight}
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
