"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import {
  ArrowRight,
  Rocket,
  FileText,
  BarChart3,
  TrendingUp,
  Lightbulb,
  Briefcase,
  Citrus,
} from "lucide-react";
import FundingJourney from "@/components/sections/capital/FundingJourney";
import FounderGuide from "@/components/sections/capital/FounderGuide";
import FounderToolkit from "@/components/sections/capital/FounderToolkit";
import VCInsights from "@/components/sections/capital/VCInsights";
import SectorBreakdown from "@/components/sections/capital/SectorBreakdown";
import DealStructuring from "@/components/sections/capital/DealStructuring";
import PortfolioShowcase from "@/components/sections/capital/PortfolioShowcase";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const pillars = [
  {
    icon: Rocket,
    title: "Fundraising Playbook",
    desc: "The 7-step journey from preparation to post-investment — demystified.",
    href: "#fundraising",
    color: "bg-[#FFE600]/10",
    iconColor: "text-[#B8A400]",
    hoverBorder: "hover:border-[#FFE600]/40",
  },
  {
    icon: FileText,
    title: "Founder's Toolkit",
    desc: "Term sheets, MoIs, shareholder agreements — download and use for free.",
    href: "#toolkit",
    color: "bg-teal/10",
    iconColor: "text-teal",
    hoverBorder: "hover:border-teal/40",
  },
  {
    icon: BarChart3,
    title: "VC & Market Intel",
    desc: "2024 SA venture data — which sectors are hot, where the money flows.",
    href: "#vc-insights",
    color: "bg-navy/[0.06]",
    iconColor: "text-navy",
    hoverBorder: "hover:border-navy/30",
  },
  {
    icon: Briefcase,
    title: "Deal Structuring",
    desc: "SAFE notes, convertibles, equity rounds — understand before you sign.",
    href: "#deal-structuring",
    color: "bg-[#EDE9FE]",
    iconColor: "text-[#7C3AED]",
    hoverBorder: "hover:border-[#A855F7]/30",
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
          <div className="w-8 h-8 rounded-lg bg-[#FFE600] flex items-center justify-center">
            <Icon className="w-4 h-4 text-white" />
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

export default function LemonadeStationPage() {
  return (
    <div className="pt-[70px]">
      {/* ═══ HERO ═══ */}
      <section className="bg-navy py-20 sm:py-28 relative overflow-hidden">
        <Image
          src="/images/ali-mkumbwa-VhYvF2XaRuI-unsplash.jpg"
          alt="South African entrepreneurs"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-navy/75 z-[1]" />
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(255,230,0,0.15),transparent_70%)] blur-[70px] pointer-events-none z-[2]" />
        <div className="absolute bottom-[5%] right-[10%] w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(70,205,207,0.1),transparent_70%)] blur-[70px] pointer-events-none z-[2]" />

        <Container className="relative z-[3] text-center">
          <motion.div {...fadeUp}>
            <div className="inline-flex items-center gap-2 bg-[#FFE600]/15 border border-[#FFE600]/35 rounded-full px-[18px] py-[7px] mb-8">
              <Citrus className="w-3.5 h-3.5 text-[#FFE600]" />
              <span className="text-[11px] font-semibold text-[#FFE600] tracking-[1.2px] uppercase">
                For Founders, Entrepreneurs & SMMEs
              </span>
            </div>
            <h1 className="text-[clamp(2.4rem,6vw,4.5rem)] font-extrabold text-white leading-[1.07] tracking-tight mb-6">
              Lemonade{" "}
              <span className="text-[#FFE600]">Station</span>
            </h1>
            <p className="text-lg text-white/55 leading-[1.8] max-w-[640px] mx-auto mb-10">
              When life gives you lemons, make lemonade. Everything you need to
              raise capital, structure deals, and build a fundable business
              &mdash; the playbooks, templates, and data that used to be behind
              closed doors.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="#fundraising"
                className="inline-flex items-center gap-2 bg-[#FFE600] text-navy px-9 py-4 rounded-full font-extrabold text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(255,230,0,0.3)] transition-all"
              >
                Start Here <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#toolkit"
                className="inline-flex items-center gap-2 text-white px-9 py-4 rounded-full font-semibold text-sm border-2 border-white/20 hover:bg-white/[0.07] hover:border-[#FFE600]/40 transition-all"
              >
                Free Templates
              </Link>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* ═══ PILLAR CARDS ═══ */}
      <section className="py-16 sm:py-20 bg-white">
        <Container>
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="text-[11px] font-bold tracking-[1.4px] uppercase text-[#B8A400] block mb-3">
              Your Founder Stack
            </span>
            <h2 className="text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold text-ink leading-[1.1] tracking-tight">
              From idea to{" "}
              <span className="text-navy">investment-ready.</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {pillars.map((p, i) => (
              <motion.a
                key={p.title}
                href={p.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: 0.08 * i,
                  ease: "easeOut" as const,
                }}
                className={`bg-white rounded-[20px] border border-border shadow-sm p-7 hover:-translate-y-1 hover:shadow-md ${p.hoverBorder} transition-all cursor-pointer group`}
              >
                <div
                  className={`w-11 h-11 rounded-[14px] ${p.color} flex items-center justify-center mb-4`}
                >
                  <p.icon className={`w-5 h-5 ${p.iconColor}`} />
                </div>
                <h3 className="text-base font-bold text-ink mb-2">
                  {p.title}
                </h3>
                <p className="text-sm text-[#3F3F46] leading-[1.7] mb-3">
                  {p.desc}
                </p>
                <span className="text-xs font-bold text-[#B8A400] flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                  Explore <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </motion.a>
            ))}
          </div>
        </Container>
      </section>

      {/* ═══ FUNDRAISING PLAYBOOK ═══ */}
      <SectionDivider
        label="Fundraising Playbook"
        id="fundraising"
        icon={Rocket}
      />

      <FundingJourney />
      <FounderGuide />

      {/* ═══ FOUNDER'S TOOLKIT ═══ */}
      <SectionDivider
        label="Founder's Toolkit"
        id="toolkit"
        icon={FileText}
      />

      <FounderToolkit />
      <PortfolioShowcase />

      {/* ═══ VC & MARKET INTEL ═══ */}
      <SectionDivider
        label="VC & Market Intelligence"
        id="vc-insights"
        icon={TrendingUp}
      />

      <VCInsights />
      <SectorBreakdown />

      {/* ═══ DEAL STRUCTURING ═══ */}
      <SectionDivider
        label="Deal Structuring"
        id="deal-structuring"
        icon={Briefcase}
      />

      <DealStructuring />

      {/* ═══ CTA ═══ */}
      <section className="py-16 sm:py-20 bg-white">
        <Container>
          <motion.div
            {...fadeUp}
            className="bg-navy rounded-[20px] p-8 sm:p-14 text-center relative overflow-hidden"
          >
            <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(255,230,0,0.15),transparent_70%)] blur-[60px] pointer-events-none" />
            <div className="relative z-[1]">
              <span className="text-[11px] font-bold tracking-[1.4px] uppercase text-[#FFE600] block mb-4">
                Ready to build?
              </span>
              <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold text-white leading-[1.1] tracking-tight mb-5">
                Stop guessing.
                <br />
                <span className="text-[#FFE600]">Start building.</span>
              </h2>
              <p className="text-white/50 text-base leading-[1.8] max-w-[520px] mx-auto mb-8">
                Whether you&apos;re pitching your first investor or structuring
                a shareholder agreement &mdash; you don&apos;t have to figure it
                out alone.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/advisory"
                  className="inline-flex items-center gap-2 bg-[#FFE600] text-navy px-9 py-4 rounded-full font-extrabold text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(255,230,0,0.3)] transition-all"
                >
                  Book a Session <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/capital"
                  className="inline-flex items-center gap-2 text-white px-9 py-4 rounded-full font-semibold text-sm border-2 border-white/20 hover:bg-white/[0.07] hover:border-[#FFE600]/40 transition-all"
                >
                  Lime Capital
                </Link>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>
    </div>
  );
}
