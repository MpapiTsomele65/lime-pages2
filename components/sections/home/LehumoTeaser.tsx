"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Star } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, amount: 0.2 } as const,
  transition: { duration: 0.6, ease: "easeOut" as const } as const,
};

const bars = [
  { label: "Year 1", value: "360", height: 40, color: "bg-teal/40", delay: 0.1 },
  { label: "Year 2", value: "720", height: 80, color: "bg-teal/60", delay: 0.2 },
  { label: "Year 3", value: "1,080", height: 118, color: "bg-teal/80", delay: 0.3 },
  { label: "Year 4", value: "1,400", height: 154, color: "bg-teal", delay: 0.4 },
  { label: "Year 5", value: "1,800", height: 200, color: "bg-lime", delay: 0.5, highlight: true },
];

const stats = [
  { value: "30", color: "text-lime", label: "Founding Members", sub: "Building the first Lehumo cohort", borderColor: "border-lime/15" },
  { value: "~R2M", color: "text-teal", label: "Target Pool", sub: "After 5-year lock-in period", borderColor: "border-teal/20" },
  { value: "R1K", color: "text-lime", label: "Monthly Contribution", sub: "Per member, pooled collectively", borderColor: "border-lime/15" },
];

export function LehumoTeaser() {
  return (
    <section className="bg-navy py-16 sm:py-[90px] relative overflow-hidden">
      <div className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(184,255,0,0.07),transparent_70%)] blur-[60px] pointer-events-none" />
      <div className="absolute -bottom-[20%] -right-[5%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(70,205,207,0.08),transparent_70%)] blur-[60px] pointer-events-none" />

      <Container className="relative z-[1]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-[60px] items-center">
          {/* Left — Text + Bar Chart */}
          <motion.div {...fadeUp}>
            <div className="inline-flex items-center gap-2.5 bg-lime/10 border border-lime/25 rounded-full px-4 py-1.5 mb-5">
              <Star className="w-4 h-4 text-lime" />
              <span className="text-[11px] font-bold text-lime tracking-[1.2px] uppercase">
                New Initiative
              </span>
            </div>

            <p className="text-xs font-bold tracking-[1.5px] uppercase text-teal mb-3">
              Lehumo Collective Investment Trust
            </p>

            <h2 className="text-[clamp(2rem,5vw,3.4rem)] font-extrabold text-white leading-[1.05] tracking-tight mb-5">
              Building{" "}
              <span className="text-lime">generational wealth</span>
              <br />
              together.
            </h2>

            <p className="text-base text-white/60 leading-[1.8] mb-5">
              Lehumo is a Collective Investment Trust — 30 Founding Members
              working towards a shared vision of establishing an investment pool
              of <strong className="text-white">~R2 Million</strong> after a
              5-Year Lock-in Period.
            </p>

            <p className="text-base text-white/60 leading-[1.8] mb-8">
              Each member contributes just{" "}
              <strong className="text-lime">R1,000 per month</strong>.
              That&apos;s it. The community then pools these contributions,
              builds collective wealth, and at maturity — converts into a
              Special Purpose Vehicle that acquires cash-generating assets.
            </p>

            {/* Bar chart */}
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.6, ease: "easeOut" as const, delay: 0.2 }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-7 mb-8"
            >
              <p className="text-[10px] font-bold text-white/25 tracking-[1px] uppercase mb-6">
                Cumulative Pool Growth · R&apos;000
              </p>
              <div className="flex items-end gap-3 h-[160px]">
                {bars.map((b) => (
                  <div key={b.label} className="flex flex-col items-center flex-1 gap-1.5">
                    <span className={`text-[12px] font-extrabold ${b.highlight ? "text-lime" : "text-white"}`}>
                      {b.value}
                    </span>
                    <motion.div
                      className={`w-full rounded-t-lg ${b.color}`}
                      initial={{ height: 0 }}
                      whileInView={{ height: b.height * 0.8 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: b.delay, ease: "easeOut" as const }}
                      style={{ minHeight: 6 }}
                    />
                    <span className={`text-[10px] font-semibold ${b.highlight ? "text-lime" : "text-white/30"}`}>
                      {b.label}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-4 pt-3 border-t border-white/[0.06] text-[10px] text-white/25">
                30 members × R1,000/month × 60 months. Before investment returns.
              </p>
            </motion.div>

            <div className="flex gap-3.5 flex-wrap">
              <Link
                href="/lehumo#join"
                className="bg-lime text-navy px-7 py-[13px] rounded-full font-bold text-sm inline-flex items-center gap-2 hover:shadow-[0_8px_28px_rgba(184,255,0,0.35)] hover:-translate-y-0.5 transition-all"
              >
                Sign Up →
              </Link>
              <Link
                href="/lehumo"
                className="text-teal px-5 py-[13px] rounded-full font-semibold text-sm border border-teal/30 inline-flex items-center gap-2 hover:bg-teal/10 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </motion.div>

          {/* Right — Photo + Stats */}
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
                className={`bg-white/[0.04] border ${s.borderColor} rounded-[20px] px-4 sm:px-6 py-5 sm:py-7 flex items-center gap-4 sm:gap-5`}
              >
                <div className={`text-[32px] sm:text-[42px] font-extrabold ${s.color} leading-none`}>
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
