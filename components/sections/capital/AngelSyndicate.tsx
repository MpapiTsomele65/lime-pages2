"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import Link from "next/link";
import {
  Users,
  Rocket,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Zap,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const syndicateSteps = [
  {
    step: "01",
    title: "Express Interest",
    desc: "Register your interest in joining an angel syndicate. No commitment required.",
  },
  {
    step: "02",
    title: "Get Matched",
    desc: "We match you with 4 other investors to form a 5-person syndicate.",
  },
  {
    step: "03",
    title: "Review Deals",
    desc: "Your syndicate reviews pre-vetted startup opportunities from our angel network.",
  },
  {
    step: "04",
    title: "Invest Together",
    desc: "Each member contributes R10,000 for a combined R50,000 angel round investment.",
  },
];

const benefits = [
  {
    icon: Rocket,
    title: "Access Angel Deals",
    desc: "Get into startup rounds typically reserved for investors with R50K+ minimums.",
  },
  {
    icon: Users,
    title: "Shared Due Diligence",
    desc: "Five perspectives are better than one. Evaluate deals as a group with diverse expertise.",
  },
  {
    icon: TrendingUp,
    title: "Portfolio Approach",
    desc: "Spread your risk across multiple startups instead of concentrating on a single bet.",
  },
  {
    icon: ShieldCheck,
    title: "Guided by Experience",
    desc: "Led by an active angel investor with direct access to SA\u2019s startup ecosystem.",
  },
];

export default function AngelSyndicate() {
  return (
    <section className="py-24 bg-navy relative overflow-hidden">
      {/* Glow orbs */}
      <div className="absolute top-[-5%] right-[10%] w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle,rgba(193,255,114,0.12),transparent_70%)] blur-[70px] pointer-events-none" />
      <div className="absolute bottom-[-8%] left-[5%] w-[380px] h-[380px] rounded-full bg-[radial-gradient(circle,rgba(70,205,207,0.1),transparent_70%)] blur-[70px] pointer-events-none" />

      <Container className="relative z-[1]">
        {/* Header */}
        <motion.div {...fadeUp} className="text-center mb-16">
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <div className="inline-flex items-center gap-2 bg-capital/15 border border-capital/30 rounded-full px-[18px] py-[7px]">
              <Zap className="w-3.5 h-3.5 text-capital" />
              <span className="text-[11px] font-bold text-capital tracking-[1.2px] uppercase">
                Angel Investment Syndicate
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-capital/10 border border-capital/20 rounded-full px-3 py-[5px]">
              <span className="w-1.5 h-1.5 rounded-full bg-capital animate-pulse" />
              <span className="text-[10px] font-bold text-capital tracking-wide uppercase">
                Higher Risk
              </span>
            </div>
          </div>
          <h2 className="text-[clamp(1.8rem,4.5vw,3.2rem)] font-extrabold text-white leading-[1.08] tracking-tight mb-5">
            Invest in Startups.{" "}
            <span className="text-capital">Together.</span>
          </h2>
          <p className="text-white/50 text-base leading-[1.8] max-w-[600px] mx-auto">
            For young professionals with a higher risk appetite — pool your
            capital with 4 others and invest in early-stage startups through our
            angel network.
          </p>
        </motion.div>

        {/* The Math — visual breakdown */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" as const, delay: 0.1 }}
          className="bg-white/[0.04] border border-white/10 rounded-[20px] p-8 md:p-10 mb-16"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center">
            {/* 5 people */}
            <div>
              <div className="flex justify-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.3,
                      delay: 0.08 * i,
                      ease: "easeOut" as const,
                    }}
                    className="w-11 h-11 rounded-full bg-capital/20 border border-capital/30 flex items-center justify-center"
                  >
                    <Users className="w-4.5 h-4.5 text-capital" />
                  </motion.div>
                ))}
              </div>
              <p className="text-2xl font-extrabold text-white mb-1">
                5 Investors
              </p>
              <p className="text-sm text-white/40">
                R10,000 each
              </p>
            </div>

            {/* Equals sign */}
            <div className="hidden md:flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-capital flex items-center justify-center">
                <span className="text-navy text-2xl font-extrabold">=</span>
              </div>
            </div>
            <div className="md:hidden flex justify-center">
              <div className="w-12 h-12 rounded-full bg-capital flex items-center justify-center">
                <span className="text-navy text-xl font-extrabold">=</span>
              </div>
            </div>

            {/* Total */}
            <div>
              <p className="text-[clamp(2.5rem,5vw,3.5rem)] font-extrabold text-capital leading-none mb-2">
                R50,000
              </p>
              <p className="text-sm text-white/40">
                Combined angel round investment
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 bg-capital/10 border border-capital/25 rounded-full px-3.5 py-1.5">
                <span className="text-[11px] font-semibold text-capital">
                  Meets minimum check size
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* How it works — 4 steps */}
        <motion.div {...fadeUp} className="mb-16">
          <h3 className="text-xs font-bold tracking-[1.5px] uppercase text-capital mb-8 text-center">
            How It Works
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {syndicateSteps.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: 0.1 * i,
                  ease: "easeOut" as const,
                }}
                className="relative bg-white/[0.04] border border-white/10 rounded-[16px] p-6 hover:border-capital/30 transition-all group"
              >
                <span className="text-[40px] font-extrabold text-capital/20 leading-none block mb-3 group-hover:text-capital/30 transition-colors">
                  {s.step}
                </span>
                <h4 className="text-base font-bold text-white mb-2">
                  {s.title}
                </h4>
                <p className="text-sm text-white/45 leading-relaxed">
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Benefits grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: 0.08 * i,
                ease: "easeOut" as const,
              }}
              className="flex gap-4 bg-white/[0.03] border border-white/[0.07] rounded-[16px] p-6 hover:border-capital/30 hover:bg-white/[0.05] transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-capital/15 flex items-center justify-center shrink-0">
                <b.icon className="w-5 h-5 text-capital" />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-white mb-1">
                  {b.title}
                </h4>
                <p className="text-sm text-white/40 leading-relaxed">
                  {b.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" as const, delay: 0.15 }}
          className="bg-gradient-to-br from-capital/15 to-capital/5 border border-capital/25 rounded-[20px] p-8 md:p-12 text-center"
        >
          <p className="text-xs font-bold tracking-[1.5px] uppercase text-capital mb-4">
            Limited to 30 founding syndicate members
          </p>
          <h3 className="text-[clamp(1.4rem,3vw,2rem)] font-extrabold text-white leading-[1.15] mb-4">
            Ready to back the next generation <br className="hidden sm:block" />
            of African startups?
          </h3>
          <p className="text-sm text-white/45 leading-relaxed max-w-[480px] mx-auto mb-8">
            Express your interest below. No commitment — we&apos;ll reach out
            with details on upcoming deals and how syndicates are structured.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="mailto:info@limepages.co.za?subject=Angel%20Syndicate%20—%20Expression%20of%20Interest"
              className="inline-flex items-center gap-2 bg-capital text-navy px-9 py-4 rounded-full font-extrabold text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(193,255,114,0.3)] transition-all"
            >
              Express Interest
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/advisory"
              className="inline-flex items-center gap-2 text-white px-9 py-4 rounded-full font-semibold text-sm border-2 border-white/20 hover:bg-white/[0.07] hover:border-capital/40 transition-all"
            >
              Speak to Mpapi First
            </Link>
          </div>
          <p className="text-[11px] text-white/25 mt-6">
            #ThisIsNotFinancialAdvice &middot; Angel investing carries
            significant risk including loss of capital.
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
