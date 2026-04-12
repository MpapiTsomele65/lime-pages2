"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import {
  TrendingUp,
  BookOpen,
  ArrowRight,
  Briefcase,
  GraduationCap,
  BarChart3,
  Scale,
  Lightbulb,
} from "lucide-react";
import FundComparison from "@/components/sections/capital/FundComparison";
import InvestingGuide from "@/components/sections/capital/InvestingGuide";
import DealStructuring from "@/components/sections/capital/DealStructuring";
import AngelSyndicate from "@/components/sections/capital/AngelSyndicate";
import LehumoTeaser from "@/components/sections/capital/LehumoTeaser";
import InvestorsLikeYou from "@/components/sections/capital/InvestorsLikeYou";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const tracks = [
  {
    icon: GraduationCap,
    title: "Learn to Invest",
    desc: "Understand unit trusts, ETFs, and how to build your first portfolio from as little as R500 a month.",
    href: "#investing-101",
    color: "teal",
    iconBg: "bg-teal/15",
    hoverBorder: "hover:border-teal/40",
  },
  {
    icon: BarChart3,
    title: "Compare Funds",
    desc: "See how SA\u2019s top unit trusts perform against global benchmarks over 10 years \u2014 real data, real context.",
    href: "#fund-performance",
    color: "capital",
    iconBg: "bg-navy/[0.06]",
    hoverBorder: "hover:border-navy/30",
  },
  {
    icon: Scale,
    title: "Structure Deals",
    desc: "SAFE notes, convertible loans, equity rounds \u2014 learn how startup investments are structured before you sign anything.",
    href: "#deal-structuring",
    color: "navy",
    iconBg: "bg-navy/[0.08]",
    hoverBorder: "hover:border-navy/30",
  },
];

function SectionDivider({
  label,
  id,
  icon: Icon,
}: {
  label: string;
  id: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div id={id} className="bg-snow border-y border-border">
      <Container>
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: "easeOut" as const }}
          className="flex items-center gap-3 py-5"
        >
          <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center">
            <Icon className="w-4 h-4 text-capital" />
          </div>
          <span className="text-xs font-bold tracking-[1.5px] uppercase text-navy">
            {label}
          </span>
          <div className="flex-1 h-px bg-border" />
        </motion.div>
      </Container>
    </div>
  );
}

export default function CapitalPage() {
  return (
    <div className="pt-[70px]">
      {/* ═══ HERO ═══ */}
      <section className="bg-navy py-20 sm:py-28 relative overflow-hidden">
        <Image
          src="/images/capital-hero-hands.jpg"
          alt="Partnership and trust"
          fill
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-navy/70 z-[1]" />
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(193,255,114,0.12),transparent_70%)] blur-[70px] pointer-events-none z-[2]" />
        <div className="absolute bottom-[5%] right-[10%] w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(70,205,207,0.1),transparent_70%)] blur-[70px] pointer-events-none z-[2]" />

        <Container className="relative z-[3] text-center">
          <motion.div {...fadeUp}>
            <div className="inline-flex items-center gap-2 bg-capital/15 border border-capital/35 rounded-full px-[18px] py-[7px] mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-capital" />
              <span className="text-[11px] font-semibold text-capital tracking-[1.2px] uppercase">
                Capital Markets Education
              </span>
            </div>
            <h1 className="text-[clamp(2.4rem,6vw,4.5rem)] font-extrabold text-white leading-[1.07] tracking-tight mb-6">
              Lime <span className="text-capital">Capital</span>
            </h1>
            <p className="text-lg text-white/55 leading-[1.8] max-w-[620px] mx-auto mb-10">
              Learn how capital markets work. Understand unit trusts, compare
              fund performance, and learn how to structure deals &mdash; from
              your first ETF to angel investments and private capital.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="#investing-101"
                className="inline-flex items-center gap-2 bg-capital text-navy px-9 py-4 rounded-full font-extrabold text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(193,255,114,0.3)] transition-all"
              >
                Start Learning <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#fund-performance"
                className="inline-flex items-center gap-2 text-white px-9 py-4 rounded-full font-semibold text-sm border-2 border-white/20 hover:bg-white/[0.07] hover:border-capital/40 transition-all"
              >
                Compare Funds
              </Link>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* ═══ LEARNING TRACKS ═══ */}
      <section className="py-16 sm:py-20 bg-white">
        <Container>
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="text-[11px] font-bold tracking-[1.4px] uppercase text-navy block mb-3">
              What You&apos;ll Learn
            </span>
            <h2 className="text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold text-ink leading-[1.1] tracking-tight">
              From first investment to{" "}
              <span className="text-navy">deal structuring.</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tracks.map((t, i) => (
              <motion.a
                key={t.title}
                href={t.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: 0.1 * i,
                  ease: "easeOut" as const,
                }}
                className={`bg-white rounded-[20px] border border-border shadow-sm p-8 hover:-translate-y-1 hover:shadow-md ${t.hoverBorder} transition-all cursor-pointer group`}
              >
                <div
                  className={`w-12 h-12 rounded-[14px] ${t.iconBg} flex items-center justify-center mb-5`}
                >
                  <t.icon className="w-6 h-6 text-navy" />
                </div>
                <h3 className="text-lg font-bold text-ink mb-3">{t.title}</h3>
                <p className="text-sm text-[#3F3F46] leading-[1.75] mb-4">
                  {t.desc}
                </p>
                <span
                  className={`text-xs font-bold ${
                    t.color === "teal"
                      ? "text-teal"
                      : t.color === "capital"
                      ? "text-[#3d6b00]"
                      : "text-navy"
                  } flex items-center gap-1.5 group-hover:gap-2.5 transition-all`}
                >
                  Explore <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </motion.a>
            ))}
          </div>
        </Container>
      </section>

      {/* ═══ PUBLIC MARKETS ═══ */}
      <SectionDivider
        label="Public Market Investing"
        id="investing-101"
        icon={GraduationCap}
      />

      <InvestingGuide />

      <div id="fund-performance" />
      <FundComparison />

      {/* ═══ RETAIL INVESTOR BEHAVIOR ═══ */}
      <InvestorsLikeYou />

      {/* ═══ PRIVATE CAPITAL & DEAL STRUCTURING ═══ */}
      <SectionDivider
        label="Private Capital &amp; Deal Structuring"
        id="deal-structuring"
        icon={Scale}
      />

      <DealStructuring />

      {/* ═══ ALTERNATIVE INVESTMENTS ═══ */}
      <SectionDivider
        label="Alternative Investments"
        id="alternative-investments"
        icon={Lightbulb}
      />

      {/* Angel Syndicate */}
      <AngelSyndicate />

      {/* Lehumo as structured vehicle example */}
      <LehumoTeaser />

      {/* ═══ CTA ═══ */}
      <section className="py-16 sm:py-20 bg-white">
        <Container>
          <motion.div
            {...fadeUp}
            className="bg-navy rounded-[20px] p-8 sm:p-14 text-center relative overflow-hidden"
          >
            <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(193,255,114,0.15),transparent_70%)] blur-[60px] pointer-events-none" />
            <div className="relative z-[1]">
              <span className="text-[11px] font-bold tracking-[1.4px] uppercase text-capital block mb-4">
                Ready to Learn More?
              </span>
              <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold text-white leading-[1.1] tracking-tight mb-5">
                Knowledge is the first
                <br />
                <span className="text-capital">investment.</span>
              </h2>
              <p className="text-white/50 text-base leading-[1.8] max-w-[520px] mx-auto mb-8">
                Whether you&apos;re buying your first ETF or evaluating a term
                sheet for a startup deal &mdash; we help you understand what
                you&apos;re getting into before you commit your capital.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/advisory"
                  className="inline-flex items-center gap-2 bg-capital text-navy px-9 py-4 rounded-full font-extrabold text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(193,255,114,0.3)] transition-all"
                >
                  Book a Session <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/lehumo"
                  className="inline-flex items-center gap-2 text-white px-9 py-4 rounded-full font-semibold text-sm border-2 border-white/20 hover:bg-white/[0.07] hover:border-teal/40 transition-all"
                >
                  Explore Lehumo
                </Link>
              </div>
              <p className="text-[11px] text-white/25 mt-6">
                #ThisIsNotFinancialAdvice &middot; All content is for
                educational purposes only
              </p>
            </div>
          </motion.div>
        </Container>
      </section>
    </div>
  );
}
