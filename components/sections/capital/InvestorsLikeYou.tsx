"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import {
  Users,
  TrendingUp,
  PieChart,
  Crown,
  ArrowRight,
  Smartphone,
  Zap,
  Shield,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, amount: 0.15 } as const,
  transition: { duration: 0.6, ease: "easeOut" as const } as const,
};

/* ─── Top 10 holdings across SA + US markets ─── */
const topHoldings = [
  { rank: 1, name: "Nvidia", market: "US", weight: "3.00%", tag: "Tech", logo: "/images/logos/nvidia.png" },
  { rank: 2, name: "Tesla", market: "US", weight: "3.00%", tag: "Tech", logo: "/images/logos/tesla.png" },
  { rank: 3, name: "Sasol", market: "JSE", weight: "2.45%", tag: "Energy", logo: "/images/logos/sasol.png" },
  { rank: 4, name: "Purple Group", market: "JSE", weight: "1.88%", tag: "Fintech", logo: "/images/logos/easyequities.svg" },
  { rank: 5, name: "Capitec Bank", market: "JSE", weight: "1.65%", tag: "Banking", logo: "/images/logos/capitec.png" },
  { rank: 6, name: "Apple", market: "US", weight: "1.39%", tag: "Tech", logo: "/images/logos/apple.png" },
  { rank: 7, name: "Naspers", market: "JSE", weight: "1.23%", tag: "Tech", logo: "/images/logos/naspers.svg" },
  { rank: 8, name: "Microsoft", market: "US", weight: "1.22%", tag: "Tech", logo: "/images/logos/microsoft.png" },
  { rank: 9, name: "Alphabet", market: "US", weight: "0.74%", tag: "Tech", logo: "/images/logos/google.png" },
  { rank: 10, name: "Shoprite", market: "JSE", weight: "~0.7%", tag: "Retail", logo: "/images/logos/shoprite.png" },
];

/* ─── Top ETFs by value purchased ─── */
const topETFs = [
  { name: "Satrix S&P 500", value: "R1.12B", flag: "7yr People's Choice", logo: "/images/logos/satrix.png" },
  { name: "Satrix Nasdaq 100", value: "R471M", flag: null, logo: "/images/logos/satrix.png" },
  { name: "Satrix Top 40", value: "R352M", flag: "SA benchmark", logo: "/images/logos/satrix.png" },
];

/* ─── Portfolio allocation ─── */
const allocation = [
  { label: "Stocks", pct: 53, color: "#0B1933" },
  { label: "ETFs", pct: 42, color: "#46CDCF" },
  { label: "Crypto", pct: 5, color: "#FBBF24" },
];

/* ─── Alpha investor allocation (top 1%) ─── */
const alphaAllocation = [
  { label: "ETFs", pct: 59 },
  { label: "Equities", pct: 20 },
  { label: "Cash", pct: 7 },
  { label: "Crypto", pct: 6 },
  { label: "Unit Trusts", pct: 5.5 },
  { label: "Other", pct: 2.5 },
];

/* ─── Headline stats ─── */
const platformStats = [
  { value: "2.6M", label: "Registered investors", icon: Users },
  { value: "R80.7B", label: "Assets on platform", icon: TrendingUp },
  { value: "30", label: "Median age", icon: Smartphone },
  { value: "R5.2K", label: "Avg half-year inflow", icon: Zap },
];

/* ─── Key behavioral insights ─── */
const insights = [
  {
    stat: "~40%",
    label: "of holdings are in tech",
    detail: "Nvidia, Tesla, Apple, and Naspers dominate retail portfolios.",
  },
  {
    stat: "75%",
    label: "of top performers hold TFSAs",
    detail: "The best-performing 1% invest primarily via tax-free savings accounts.",
  },
  {
    stat: "42%",
    label: "female investors",
    detail: "Closing the gender gap — up from traditional industry averages of ~25%.",
  },
  {
    stat: "56%",
    label: "joined via referral",
    detail: "Word of mouth drives more signups than any marketing campaign.",
  },
];

export default function InvestorsLikeYou() {
  return (
    <section className="py-24 md:py-32 bg-snow">
      <Container>
        {/* ── Header with EasyEquities trust badge ── */}
        <motion.div {...fadeUp} className="max-w-2xl mb-14">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-8 px-3 rounded-full bg-white border border-gray-200 flex items-center gap-2 shadow-sm">
              <Image src="/images/logos/easyequities.svg" alt="EasyEquities" width={90} height={18} className="object-contain" />
              <span className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider">Platform Data</span>
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-navy mb-4">
            Where people like you
            <br />
            <span className="text-teal">are investing.</span>
          </h2>
          <p className="text-base md:text-lg text-[#3F3F46] leading-relaxed">
            Real investment behaviour from 2.6 million South Africans on
            EasyEquities &mdash; what they buy, how they allocate, and what the
            top performers do differently. Data sourced from Purple Group (JSE: PPE)
            public filings and reports.
          </p>
        </motion.div>

        {/* ── Platform stats strip ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {platformStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.08 }}
                className="bg-white rounded-[16px] border border-gray-100 p-5 text-center"
              >
                <div className="w-9 h-9 rounded-xl bg-navy/[0.06] flex items-center justify-center mx-auto mb-3">
                  <Icon size={18} className="text-navy" />
                </div>
                <p className="text-2xl md:text-3xl font-extrabold text-navy leading-none">
                  {stat.value}
                </p>
                <p className="text-[11px] font-semibold text-[#3F3F46] mt-1.5 uppercase tracking-wide">
                  {stat.label}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* ── Main grid: Holdings + Allocation ── */}
        <div className="grid lg:grid-cols-5 gap-5 mb-12">
          {/* Top 10 holdings — takes 3 cols */}
          <motion.div
            {...fadeUp}
            className="lg:col-span-3 bg-white rounded-[20px] border border-gray-100 overflow-hidden"
          >
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-navy/[0.06] flex items-center justify-center">
                  <Crown size={18} className="text-navy" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy">
                    Top 10 Most-Held Investments
                  </h3>
                  <p className="text-[11px] text-[#3F3F46]">
                    By portfolio weight across all EasyEquities accounts
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {topHoldings.map((h, i) => (
                <motion.div
                  key={h.name}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                  className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50/60 transition-colors"
                >
                  <span className="text-[11px] font-bold text-[#9CA3AF] w-5 shrink-0">
                    {String(h.rank).padStart(2, "0")}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden p-1">
                    <Image src={h.logo} alt={h.name} width={22} height={22} className="object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-[#18181B]">
                      {h.name}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      h.market === "US"
                        ? "bg-teal/10 text-teal"
                        : "bg-navy/[0.06] text-navy"
                    }`}
                  >
                    {h.market}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      h.tag === "Tech"
                        ? "bg-[#EDE9FE] text-[#6D28D9]"
                        : h.tag === "Energy"
                          ? "bg-[#FEF3C7] text-[#92400E]"
                          : h.tag === "Banking"
                            ? "bg-[#DBEAFE] text-[#1E40AF]"
                            : h.tag === "Fintech"
                              ? "bg-[#D1FAE5] text-[#065F46]"
                              : "bg-gray-100 text-[#374151]"
                    }`}
                  >
                    {h.tag}
                  </span>
                  <span className="text-sm font-bold text-navy tabular-nums w-14 text-right">
                    {h.weight}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Allocation + Top ETFs — takes 2 cols */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Portfolio allocation */}
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
              className="bg-white rounded-[20px] border border-gray-100 p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-navy/[0.06] flex items-center justify-center">
                  <PieChart size={18} className="text-navy" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy">
                    How They Allocate
                  </h3>
                  <p className="text-[11px] text-[#3F3F46]">
                    Platform-wide asset split
                  </p>
                </div>
              </div>

              {/* Horizontal stacked bar */}
              <div className="flex rounded-full overflow-hidden h-8 mb-4">
                {allocation.map((a, i) => (
                  <motion.div
                    key={a.label}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.8,
                      ease: "easeOut",
                      delay: 0.3 + i * 0.15,
                    }}
                    className="flex items-center justify-center origin-left"
                    style={{
                      width: `${a.pct}%`,
                      backgroundColor: a.color,
                    }}
                  >
                    {a.pct >= 15 && (
                      <span className="text-[11px] font-bold text-white">
                        {a.pct}%
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {allocation.map((a) => (
                  <div key={a.label} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: a.color }}
                    />
                    <span className="text-xs font-medium text-[#3F3F46]">
                      {a.label}{" "}
                      <span className="font-bold text-[#18181B]">{a.pct}%</span>
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Top ETFs mini-list */}
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
              className="bg-white rounded-[20px] border border-gray-100 p-6"
            >
              <h3 className="text-base font-bold text-navy mb-1">
                Most-Bought ETFs
              </h3>
              <p className="text-[11px] text-[#3F3F46] mb-4">
                Jan–Jun 2024 by value purchased
              </p>

              <div className="space-y-3">
                {topETFs.map((etf, i) => (
                  <motion.div
                    key={etf.name}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-lg font-extrabold text-navy/15 w-5">
                      {i + 1}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden p-1">
                      <Image src={etf.logo} alt={etf.name} width={22} height={22} className="object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#18181B] truncate">
                        {etf.name}
                      </p>
                      {etf.flag && (
                        <span className="text-[10px] font-medium text-teal">
                          {etf.flag}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-navy tabular-nums">
                      {etf.value}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Alpha investor callout */}
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
              className="bg-navy rounded-[20px] p-6 relative overflow-hidden"
            >
              <div className="absolute top-[-30%] right-[-15%] w-[200px] h-[200px] rounded-full bg-[radial-gradient(circle,rgba(193,255,114,0.12),transparent_70%)] blur-[40px] pointer-events-none" />
              <div className="relative z-[1]">
                <div className="flex items-center gap-2 mb-3">
                  <Crown size={16} className="text-capital" />
                  <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-capital">
                    Top 1% of Investors
                  </span>
                </div>
                <p className="text-sm text-white/80 leading-relaxed mb-4">
                  The best-performing accounts allocate{" "}
                  <span className="text-white font-bold">59% to ETFs</span> and{" "}
                  <span className="text-white font-bold">
                    75% hold tax-free savings accounts
                  </span>
                  — primarily invested in S&amp;P 500 trackers.
                </p>

                <div className="flex flex-wrap gap-2">
                  {alphaAllocation.slice(0, 4).map((a) => (
                    <span
                      key={a.label}
                      className="text-[10px] font-semibold bg-white/10 text-white/70 px-2.5 py-1 rounded-full"
                    >
                      {a.label}{" "}
                      <span className="text-capital font-bold">{a.pct}%</span>
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Behavioral insights row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {insights.map((ins, i) => (
            <motion.div
              key={ins.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.08 }}
              className="bg-white rounded-[16px] border border-gray-100 p-5"
            >
              <p className="text-2xl font-extrabold text-navy mb-1">
                {ins.stat}
              </p>
              <p className="text-sm font-bold text-[#18181B] mb-2">
                {ins.label}
              </p>
              <p className="text-xs text-[#3F3F46] leading-relaxed">
                {ins.detail}
              </p>
            </motion.div>
          ))}
        </div>

        {/* ── Source attribution with trust strip ── */}
        <motion.div {...fadeUp} className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-4 opacity-60">
            <Image src="/images/logos/easyequities.svg" alt="EasyEquities" width={100} height={20} className="object-contain grayscale" />
            <span className="text-[10px] text-[#9CA3AF] font-bold">&middot;</span>
            <Image src="/images/logos/jse.svg" alt="JSE" width={50} height={16} className="object-contain grayscale" />
          </div>
          <p className="text-[11px] text-[#9CA3AF] text-center leading-relaxed">
            Source: Purple Group (JSE: PPE) FY2025 annual results, EasyEquities
            blog, Moneyweb, Daily Investor. Data reflects platform-wide trends
            and is for educational context only.
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
