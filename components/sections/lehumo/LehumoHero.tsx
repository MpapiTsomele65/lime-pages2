"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.8, ease: "easeOut" as const },
};

const heroStats = [
  { value: "30", color: "text-lime", label: "Founding Members" },
  { value: "R2M", color: "text-teal", label: "Pool Target" },
  { value: "5 Yrs", color: "text-lime", label: "Lock-in Period" },
  { value: "R1k", color: "text-teal", label: "Per Month" },
];

export function LehumoHero() {
  return (
    <section className="min-h-screen bg-navy flex flex-col items-center justify-center text-center px-[clamp(1.5rem,5vw,5rem)] py-[120px] relative overflow-hidden">
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(184,255,0,1) 1px, transparent 1px), linear-gradient(90deg, rgba(184,255,0,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Glows */}
      <div className="absolute top-0 left-[20%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(184,255,0,0.1),transparent_70%)] blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 right-[15%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(70,205,207,0.12),transparent_70%)] blur-[80px] pointer-events-none" />

      <motion.div {...fadeUp} className="relative z-[1] max-w-[900px]">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-lime-dim border border-lime/25 rounded-full px-[18px] py-[7px] mb-8">
          <span className="w-[7px] h-[7px] rounded-full bg-lime animate-[pulse_2s_ease_infinite]" />
          <span className="text-[11px] font-bold text-lime tracking-[1.4px] uppercase">
            Collective Investment Trust · South Africa
          </span>
        </div>

        {/* Lehumo brand */}
        <div className="flex items-center gap-3.5 justify-center mb-7">
          <svg viewBox="0 0 60 60" fill="none" className="w-[52px] h-[52px]">
            <polygon points="30,4 54,17 54,43 30,56 6,43 6,17" stroke="#46cdcf" strokeWidth="2.5" fill="rgba(70,205,207,0.08)" />
            <polygon points="30,12 47,21.5 47,40.5 30,50 13,40.5 13,21.5" stroke="#46cdcf" strokeWidth="1.5" fill="none" opacity=".4" />
          </svg>
          <div className="text-left">
            <div className="text-[26px] font-extrabold text-lime tracking-[1px] leading-none">LEHUMO</div>
            <div className="text-[13px] font-medium text-teal tracking-wide">Collective Investment Trust</div>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-[clamp(2.4rem,7vw,5.2rem)] font-extrabold text-white leading-[1.07] tracking-tight mb-6">
          Do you want to join a community
          <br />
          building an <span className="text-lime">Investment Trust</span>
          <br />
          to create <span className="text-teal">Generational Wealth?</span>
        </h1>

        <p className="text-[clamp(1rem,1.8vw,1.15rem)] text-white/55 leading-[1.8] max-w-[640px] mx-auto mb-12">
          30 Founding Members. 5 Years. R2 Million. One shared mission — Save, Buy, and Protect assets for the next generation.
        </p>

        {/* CTAs */}
        <div className="flex gap-3.5 justify-center flex-wrap mb-14">
          <Link href="#join" className="bg-lime text-navy px-9 py-[15px] rounded-full font-extrabold text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(184,255,0,0.3)] transition-all">
            Join the Waitlist →
          </Link>
          <Link href="#what" className="text-white px-9 py-[15px] rounded-full font-semibold text-sm border border-white/20 hover:border-lime/25 hover:bg-lime-dim transition-all">
            Learn How It Works
          </Link>
        </div>

        {/* Stats strip */}
        <div className="flex flex-col sm:flex-row border border-white/[0.08] rounded-2xl overflow-hidden max-w-[600px] mx-auto">
          {heroStats.map((s, i) => (
            <div key={s.label} className={`flex-1 py-5 px-4 text-center ${i < heroStats.length - 1 ? "border-b sm:border-b-0 sm:border-r border-white/[0.08]" : ""}`}>
              <div className={`text-2xl font-extrabold leading-none mb-1 ${s.color}`}>{s.value}</div>
              <div className="text-[11px] text-white/55 font-medium tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
