"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import {
  ArrowRight,
  Calculator,
  GraduationCap,
  LineChart,
  Rocket,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

interface Pillar {
  icon: LucideIcon;
  title: string;
  desc: string;
  /** When set, the card is a link (e.g. to a Lime Services profile). */
  href?: string;
}

const fadeUp = {
  initial: { opacity: 0, y: 24 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, amount: 0.2 } as const,
  transition: { duration: 0.6, ease: "easeOut" as const } as const,
};

/**
 * LimeCapitalTeaser — the second core pillar on the home page (after
 * Lehumo). Positions Lime Capital as the free, education-first hub for a
 * long-term wealth-creation journey: Investing 101 (what ETFs are),
 * comparing popular ETFs/funds, the home-loan accelerator tool, and how
 * to begin. Mirrors LehumoTeaser's navy two-column layout for a matched
 * pair, in the capital brand colour.
 */
const pillars: Pillar[] = [
  {
    icon: GraduationCap,
    title: "Investing 101",
    desc: "What an ETF, RA, and TFSA actually are — in plain language.",
    href: "/capital#investing-101",
  },
  {
    icon: LineChart,
    title: "Popular ETFs, compared",
    desc: "Real 10-year performance across SA's most-watched funds.",
    href: "/capital#fund-performance",
  },
  {
    icon: Calculator,
    title: "Home-loan accelerator",
    desc: "See how extra payments knock years — and interest — off your bond.",
    href: "/capital#home-loan-accelerator-section",
  },
  {
    icon: Rocket,
    title: "How to begin",
    desc: "Your first steps into the market — platform, FICA, first R500.",
    href: "/capital#getting-started",
  },
];

export function LimeCapitalTeaser() {
  return (
    <section className="bg-navy py-16 sm:py-[90px] relative overflow-hidden border-t border-white/[0.05]">
      <div className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(193,255,114,0.08),transparent_70%)] blur-[60px] pointer-events-none" />
      <div className="absolute -bottom-[20%] -left-[5%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(70,205,207,0.06),transparent_70%)] blur-[60px] pointer-events-none" />

      <Container className="relative z-[1]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-x-[60px] items-center">
          {/* Left — copy + CTAs */}
          <motion.div {...fadeUp}>
            <div className="inline-flex items-center gap-2.5 bg-capital/10 border border-capital/25 rounded-full px-4 py-1.5 mb-5">
              <TrendingUp className="w-4 h-4 text-capital" />
              <span className="text-[11px] font-bold text-capital tracking-[1.2px] uppercase">
                Lime Capital
              </span>
            </div>

            <h2 className="text-[clamp(2rem,5vw,3.4rem)] font-extrabold text-white leading-[1.05] tracking-tight mb-5">
              Your wealth-creation
              <br />
              journey, <span className="text-capital">decoded.</span>
            </h2>

            <p className="text-base text-white/60 leading-[1.8] mb-5">
              Lime Capital is the free, education-first side of Lime Pages —
              built to teach you long-term investing from the ground up: what{" "}
              <strong className="text-white">ETFs</strong> actually are, which
              ones matter, and how to take your first step.
            </p>

            <p className="text-base text-white/60 leading-[1.8] mb-8">
              Plus practical tools — like the{" "}
              <strong className="text-capital">home-loan accelerator</strong>{" "}
              that shows how a little extra each month can knock years off your
              bond and free up cash to invest.
            </p>

            <div className="flex gap-3.5 flex-wrap">
              <Link
                href="/capital"
                className="bg-capital text-navy px-7 py-[13px] rounded-full font-bold text-sm inline-flex items-center gap-2 hover:shadow-[0_8px_28px_rgba(193,255,114,0.35)] hover:-translate-y-0.5 transition-all"
              >
                Explore Lime Capital <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/capital#investing-101"
                className="text-capital px-5 py-[13px] rounded-full font-semibold text-sm border border-capital/30 inline-flex items-center gap-2 hover:bg-capital/10 transition-colors"
              >
                Start with Investing 101
              </Link>
            </div>
          </motion.div>

          {/* Right — pillar cards (2×2) */}
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {pillars.map((p, i) => {
              const Icon = p.icon;
              const motionProps = {
                initial: { opacity: 0, y: 16 },
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: true },
                transition: { duration: 0.5, delay: 0.08 * i },
              } as const;
              const inner = (
                <>
                  <div className="w-10 h-10 rounded-xl bg-capital/15 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-capital" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-white leading-tight mb-1.5 flex items-center gap-1.5">
                      {p.title}
                      {p.href && (
                        <ArrowRight className="w-3.5 h-3.5 text-capital opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      )}
                    </h3>
                    <p className="text-[13px] text-white/45 leading-relaxed">
                      {p.desc}
                    </p>
                  </div>
                </>
              );
              const baseClass =
                "bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-5 sm:p-6 flex flex-col gap-3 transition-colors h-full";

              return p.href ? (
                <Link key={p.title} href={p.href} className="group block">
                  <motion.div
                    {...motionProps}
                    className={`${baseClass} cursor-pointer group-hover:border-capital/40`}
                  >
                    {inner}
                  </motion.div>
                </Link>
              ) : (
                <motion.div
                  key={p.title}
                  {...motionProps}
                  className={`${baseClass} hover:border-capital/25`}
                >
                  {inner}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
