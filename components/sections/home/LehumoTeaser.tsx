"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Star, Save, Home, ShieldCheck } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, amount: 0.2 } as const,
  transition: { duration: 0.6, ease: "easeOut" as const } as const,
};

const stats = [
  { value: "30", color: "text-lime", label: "Founding Members", sub: "Building the first Lehumo cohort", borderColor: "border-lime/15" },
  { value: "~15%", color: "text-teal", label: "Target Return", sub: "From Sum1 Investments allocation", borderColor: "border-teal/20" },
  { value: "4x", color: "text-lime", label: "Portfolio Diversification", sub: "Equities, Cash, Bonds, Alternatives", borderColor: "border-lime/15" },
];

const pillars = [
  { icon: Save, label: "SAVE", color: "text-lime", bg: "bg-lime/12" },
  { icon: Home, label: "BUY", color: "text-teal", bg: "bg-teal/12" },
  { icon: ShieldCheck, label: "PROTECT", color: "text-lime", bg: "bg-lime/12" },
];

export function LehumoTeaser() {
  return (
    <section className="bg-navy py-[90px] relative overflow-hidden">
      <div className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(184,255,0,0.07),transparent_70%)] blur-[60px] pointer-events-none" />
      <div className="absolute -bottom-[20%] -right-[5%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(70,205,207,0.08),transparent_70%)] blur-[60px] pointer-events-none" />

      <Container className="relative z-[1]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[60px] items-center">
          {/* Left */}
          <motion.div {...fadeUp}>
            <div className="inline-flex items-center gap-2.5 bg-lime/10 border border-lime/25 rounded-full px-4 py-1.5 mb-7">
              <Star className="w-4 h-4 text-lime" />
              <span className="text-[11px] font-bold text-lime tracking-[1.2px] uppercase">
                New Initiative
              </span>
            </div>

            <p className="text-[13px] font-bold text-teal tracking-[1px] uppercase mb-3">
              Lehumo Collective Investment Trust
            </p>

            <h2 className="text-[clamp(2rem,5vw,3.4rem)] font-extrabold text-white leading-[1.05] tracking-tight mb-5">
              Building <span className="text-lime">generational</span>
              <br />
              wealth together.
            </h2>

            <p className="text-base text-white/60 leading-[1.8] mb-8">
              A regulated Collective Investment Trust partnering with emerging
              Black-owned investment managers. Portfolio: 40% Sum1 Investments
              (targeting ~15% returns), 40% Cash, 10% SA Bonds, 10% Alternative
              Assets (SV Capital). Building sustainable generational wealth through
              disciplined, diversified investing.
            </p>

            <div className="flex gap-3.5 flex-wrap mb-10">
              <Link
                href="/lehumo"
                className="bg-lime text-navy px-7 py-[13px] rounded-full font-bold text-sm inline-flex items-center gap-2 hover:shadow-[0_8px_28px_rgba(184,255,0,0.35)] hover:-translate-y-0.5 transition-all"
              >
                Join the Waitlist →
              </Link>
              <Link
                href="/lehumo"
                className="text-teal px-5 py-[13px] rounded-full font-semibold text-sm border border-teal/30 inline-flex items-center gap-2 hover:bg-teal/10 transition-colors"
              >
                Learn More
              </Link>
            </div>

            <div className="flex gap-6 flex-wrap">
              {pillars.map((p) => (
                <div key={p.label} className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-[10px] ${p.bg} flex items-center justify-center`}>
                    <p.icon className={`w-4 h-4 ${p.color}`} />
                  </div>
                  <span className={`text-[13px] font-bold ${p.color} tracking-wide`}>
                    {p.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right */}
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.2 }}
            className="flex flex-col gap-4"
          >
            <div className="relative aspect-[4/3] rounded-[20px] overflow-hidden">
              <Image
                src="/images/iwaria-inc-M7ALc3UuX_g-unsplash.jpg"
                alt="Community members collaborating"
                fill
                className="object-cover"
              />
            </div>

            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className={`bg-white/[0.04] border ${s.borderColor} rounded-[20px] px-6 py-7 flex items-center gap-5`}
              >
                <div className={`text-[42px] font-extrabold ${s.color} leading-none`}>
                  {s.value}
                </div>
                <div>
                  <div className="text-[15px] font-bold text-white mb-1">
                    {s.label}
                  </div>
                  <div className="text-[13px] text-white/45">{s.sub}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
