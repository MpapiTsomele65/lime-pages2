"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { TrendingUp, ExternalLink, Info } from "lucide-react";

/* ─── Fund data (illustrative, based on approximate 10-year returns through Dec 2024) ─── */
/* Ordered lowest → highest 10-year growth */
const funds = [
  {
    name: "Allan Gray Money Market Fund",
    shortName: "AG Money Mkt",
    color: "bg-[#F59E0B]",
    barColor: "#FBBF24",
    textColor: "text-[#92400E]",
    accentBg: "bg-[#FEF3C7]",
    borderColor: "border-[#FDE68A]",
    brandInitials: "AG",
    brandColor: "#4A4A4A",
    brandName: "Allan Gray",
    logo: "/images/logos/allan-gray.svg",
    returns: { yr1: 8.4, yr3: 7.0, yr5: 6.3, yr10: 6.2 },
    growth: 18200,
    ter: "~0.30%",
    minInvest: "R100,000 lump sum / R2,500 debit order",
    riskLevel: "Low",
    type: "Money Market",
    inception: "July 2001",
    description:
      "SA\u2019s most recognised money market fund. Capital preservation with returns that track interest rates. Near-zero risk of losing money \u2014 the benchmark for \u201Cdo nothing\u201D investing.",
    link: "https://www.allangray.co.za/fund-pages/money-market-fund/",
  },
  {
    name: "FTSE/JSE Top 40",
    shortName: "JSE Top 40",
    color: "bg-[#71717A]",
    barColor: "#A1A1AA",
    textColor: "text-[#52525B]",
    accentBg: "bg-[#F4F4F5]",
    borderColor: "border-[#E4E4E7]",
    brandInitials: "JSE",
    brandColor: "#003366",
    brandName: "JSE",
    logo: "/images/logos/jse.svg",
    returns: { yr1: 9.8, yr3: 9.5, yr5: 10.1, yr10: 8.5 },
    growth: 22600,
    ter: "~0.10% (via ETF)",
    minInvest: "From ~R500 via Satrix Top 40 ETF",
    riskLevel: "High",
    type: "Equity Index",
    inception: "N/A (Index)",
    description:
      "The 40 largest companies on the Johannesburg Stock Exchange by market cap. Accessible through low-cost ETFs like the Satrix Top 40.",
    link: "https://www.jse.co.za/",
  },
  {
    name: "Coronation Balanced Plus",
    shortName: "Coronation Balanced Plus",
    color: "bg-teal",
    barColor: "#46CDCF",
    textColor: "text-teal",
    accentBg: "bg-teal/10",
    borderColor: "border-teal/20",
    brandInitials: "C",
    brandColor: "#1B3A5C",
    brandName: "Coronation",
    logo: "/images/logos/coronation-crown.svg",
    returns: { yr1: 15.1, yr3: 11.2, yr5: 9.8, yr10: 8.8 },
    growth: 23200,
    ter: "~1.58%",
    minInvest: "R5,000 lump sum / R500 debit order",
    riskLevel: "Medium-High",
    type: "Multi-Asset High Equity",
    inception: "April 1996",
    description:
      "A flagship South African balanced fund with one of the longest track records. Widely held in retirement funds and retail portfolios alike.",
    link: "https://www.coronation.com/personal/funds/balanced-plus/",
  },
  {
    name: "Allan Gray Balanced Fund",
    shortName: "Allan Gray Balanced",
    color: "bg-navy",
    barColor: "#0B1933",
    textColor: "text-navy",
    accentBg: "bg-navy/[0.06]",
    borderColor: "border-navy/15",
    brandInitials: "AG",
    brandColor: "#4A4A4A",
    brandName: "Allan Gray",
    logo: "/images/logos/allan-gray.svg",
    returns: { yr1: 14.2, yr3: 11.8, yr5: 9.6, yr10: 9.2 },
    growth: 24100,
    ter: "~1.62%",
    minInvest: "R50,000 lump sum / R2,500 debit order",
    riskLevel: "Medium-High",
    type: "Multi-Asset High Equity",
    inception: "October 1999",
    description:
      "One of SA\u2019s largest and most trusted balanced funds. Known for a contrarian, value-oriented investment style and long-term consistency.",
    link: "https://www.allangray.co.za/fund-pages/balanced-fund/",
  },
  {
    name: "S&P 500 (in ZAR)",
    shortName: "S&P 500",
    color: "bg-capital",
    barColor: "#C1FF72",
    textColor: "text-[#3d6b00]",
    accentBg: "bg-capital/10",
    borderColor: "border-capital/20",
    brandInitials: "S&P",
    brandColor: "#EF3E42",
    brandName: "S&P Global",
    logo: "/images/logos/sp-global.png",
    returns: { yr1: 32.4, yr3: 16.8, yr5: 17.2, yr10: 18.4 },
    growth: 54000,
    ter: "~0.07% (via ETF)",
    minInvest: "From ~R500 via Satrix S&P 500 ETF",
    riskLevel: "High",
    type: "Equity Index (USD\u2192ZAR)",
    inception: "N/A (Index)",
    description:
      "The 500 largest US-listed companies. In Rand terms, returns include both index growth and currency movement \u2014 the Rand weakened significantly over 10 years.",
    link: "https://www.spglobal.com/spdji/en/indices/equity/sp-500/",
  },
];

const maxGrowth = 54000;
const maxBarHeight = 280;

/* Inflation reference: SA avg CPI ~5.2% p.a. over 10 years */
const inflationRate = 0.052;
const inflationGrowth = Math.round(10000 * Math.pow(1 + inflationRate, 10)); // ≈ R16,500
const effectiveBarMax = (maxBarHeight - 40) * 0.8; // 192px — matches bar calc
const labelSpace = 28; // px reserved for fund name labels at bottom

function formatRand(n: number) {
  return `R${(n / 1000).toFixed(1)}K`;
}

const fadeUp = {
  initial: { opacity: 0, y: 24 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, amount: 0.15 } as const,
  transition: { duration: 0.6, ease: "easeOut" as const } as const,
};

export default function FundComparison() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <Container>
        {/* Header */}
        <motion.div {...fadeUp} className="max-w-[680px] mb-12 sm:mb-16">
          <span className="text-[11px] font-bold tracking-[1.4px] uppercase text-navy block mb-3.5">
            Fund Performance
          </span>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-ink leading-[1.1] tracking-tight mb-5">
            How SA&apos;s top funds{" "}
            <span className="text-navy">stack up.</span>
          </h2>
          <p className="text-[#3F3F46] text-[17px] leading-[1.8]">
            If you had invested R10,000 ten years ago, here&apos;s what it would
            be worth today across four of the most-watched investment vehicles in
            South Africa.
          </p>
        </motion.div>

        {/* ═══ BAR CHART ═══ */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
          className="bg-white rounded-[24px] border border-[#E4E4E7] shadow-sm p-6 sm:p-10 mb-10"
        >
          <div className="flex items-center justify-between mb-10">
            <div>
              <p className="text-[13px] font-bold tracking-[1.2px] uppercase text-[#18181B] mb-1">
                Growth of R10,000
              </p>
              <p className="text-[12px] text-[#71717A] font-medium">
                10-year period &middot; Illustrative data through Dec 2024
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 bg-[#F4F4F5] rounded-full px-3.5 py-2">
              <Info className="w-3 h-3 text-[#71717A]" />
              <span className="text-[10px] text-[#71717A] font-medium">
                Past performance ≠ future results
              </span>
            </div>
          </div>

          {/* Chart */}
          <div className="flex items-end justify-center gap-4 sm:gap-8 lg:gap-12 h-[280px] sm:h-[320px] mb-6 relative overflow-visible">
            {/* ── R10K starting line ── */}
            <div
              className="absolute left-0 right-0 border-b border-dashed border-[#D4D4D8] z-[1]"
              style={{ bottom: `${labelSpace + (10000 / maxGrowth) * effectiveBarMax}px` }}
            >
              <span className="absolute -top-3.5 left-1 sm:left-0 text-[9px] text-[#A1A1AA] font-semibold">
                R10K start
              </span>
            </div>

            {/* ── Inflation erosion zone ── */}
            <div
              className="absolute left-0 right-0 bg-[#FEF2F2]/50 pointer-events-none z-[0] rounded-sm"
              style={{
                bottom: `${labelSpace + (10000 / maxGrowth) * effectiveBarMax}px`,
                height: `${((inflationGrowth - 10000) / maxGrowth) * effectiveBarMax}px`,
              }}
            />

            {/* ── Inflation line ── */}
            <div
              className="absolute left-0 right-0 border-b-[2px] border-dashed border-[#EF4444]/40 z-[1]"
              style={{ bottom: `${labelSpace + (inflationGrowth / maxGrowth) * effectiveBarMax}px` }}
            >
              <span className="absolute -top-[18px] right-0 text-[10px] text-[#DC2626] font-bold bg-[#FEF2F2] border border-[#FECACA] px-2 py-0.5 rounded-md whitespace-nowrap">
                Inflation &middot; R{(inflationGrowth / 1000).toFixed(1)}K
              </span>
              <span className="absolute -top-[18px] left-1 sm:left-0 text-[9px] text-[#EF4444]/60 font-medium whitespace-nowrap">
                5.2% avg CPI
              </span>
            </div>

            {funds.map((fund, i) => {
              const barHeight =
                (fund.growth / maxGrowth) *
                (maxBarHeight - 40);
              const pctGain = (
                ((fund.growth - 10000) / 10000) *
                100
              ).toFixed(0);

              return (
                <div
                  key={fund.shortName}
                  className="flex flex-col items-center flex-1 max-w-[130px] gap-2.5"
                >
                  {/* Value label */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.5,
                      delay: 0.4 + 0.12 * i,
                    }}
                    className="text-center"
                  >
                    <span
                      className={`text-lg sm:text-xl font-extrabold block leading-none ${fund.textColor}`}
                    >
                      {formatRand(fund.growth)}
                    </span>
                    <span className="text-[11px] font-bold mt-0.5 block text-[#A1A1AA]">
                      +{pctGain}%
                    </span>
                  </motion.div>

                  {/* Bar */}
                  <motion.div
                    className="w-full rounded-t-xl"
                    style={{
                      backgroundColor: fund.barColor,
                      minHeight: 8,
                    }}
                    initial={{ height: 0 }}
                    whileInView={{ height: barHeight * 0.8 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 1.2,
                      delay: 0.15 + 0.12 * i,
                      ease: "easeOut" as const,
                    }}
                  />

                  {/* Fund logo + name */}
                  <div className="flex flex-col items-center gap-1.5 min-h-[58px] justify-start">
                    <div className="w-7 h-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-sm">
                      <Image src={fund.logo} alt={fund.brandName} width={18} height={18} className="object-contain" />
                    </div>
                    <span
                      className={`text-[10px] sm:text-[11px] font-bold text-center leading-tight max-w-[90px] ${fund.textColor}`}
                    >
                      {fund.shortName}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 border-t border-[#E4E4E7] pt-4 mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-[2px] border-b border-dashed border-[#D4D4D8]" />
              <span className="text-[10px] text-[#A1A1AA] font-medium">Starting investment</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-[2px] border-b-[2px] border-dashed border-[#EF4444]/40" />
              <span className="text-[10px] text-[#DC2626] font-medium">Inflation (purchasing power loss)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-2.5 bg-[#FEF2F2]/80 rounded-sm border border-[#FECACA]/40" />
              <span className="text-[10px] text-[#A1A1AA] font-medium">Erosion zone</span>
            </div>
          </div>
          <p className="text-[10px] text-[#A1A1AA] text-center leading-relaxed">
            Returns are approximate annualized figures. S&amp;P 500 in ZAR includes
            currency movement. Inflation based on ~5.2% avg SA CPI over 10 years.
          </p>
        </motion.div>

        {/* ═══ TIME VALUE OF MONEY ═══ */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.12 }}
          className="bg-[#FAFAFA] rounded-[24px] border border-[#E4E4E7] p-6 sm:p-10 mb-10"
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 lg:gap-12 items-start">
            {/* Left — explainer */}
            <div>
              <span className="text-[11px] font-bold tracking-[1.4px] uppercase text-[#DC2626] block mb-3">
                Why This Matters
              </span>
              <h3 className="text-[clamp(1.4rem,3vw,1.8rem)] font-extrabold text-[#18181B] leading-[1.15] tracking-tight mb-4">
                The Time Value of Money
              </h3>
              <div className="space-y-3.5 text-[14px] text-[#3F3F46] leading-[1.8]">
                <p>
                  A Rand today is worth more than a Rand tomorrow. That&apos;s not a
                  saying &mdash; it&apos;s a financial principle. Because of inflation,
                  money loses purchasing power over time. The R10,000 you hold today
                  will buy less next year, and significantly less in a decade.
                </p>
                <p>
                  In South Africa, inflation has averaged roughly{" "}
                  <strong className="text-[#18181B]">5.2% per year</strong> over the
                  past decade. That means your R10,000 would need to grow to at least{" "}
                  <strong className="text-[#DC2626]">~R16,500</strong> just to buy the
                  same basket of goods it buys today. Anything below that line and
                  you&apos;ve actually lost real wealth &mdash; even if the number in
                  your account went up.
                </p>
                <p>
                  This is why investment returns should always be measured against
                  inflation, not against zero. A savings account paying 4% sounds
                  positive &mdash; until you realise inflation is running at 5%. Your
                  money grew, but your purchasing power shrank. That&apos;s the
                  difference between a <strong className="text-[#18181B]">nominal
                  return</strong> (the number) and a{" "}
                  <strong className="text-[#18181B]">real return</strong> (what you can
                  actually buy).
                </p>
              </div>
            </div>

            {/* Right — visual summary */}
            <div className="bg-white rounded-[20px] border border-[#E4E4E7] overflow-hidden">
              {/* Header */}
              <div className="bg-[#FEF2F2] border-b border-[#FECACA]/40 px-5 py-4">
                <p className="text-[11px] font-bold tracking-[1.2px] uppercase text-[#DC2626] mb-1">
                  The Inflation Test
                </p>
                <p className="text-[12px] text-[#92400E] font-medium leading-snug">
                  Did your investment beat inflation?
                </p>
              </div>

              <div className="p-5 space-y-4">
                {/* The math */}
                <div className="flex items-center justify-between py-3 border-b border-[#F4F4F5]">
                  <span className="text-[13px] text-[#52525B]">You invested</span>
                  <span className="text-[15px] font-extrabold text-[#18181B]">R10,000</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-[#F4F4F5]">
                  <span className="text-[13px] text-[#52525B]">Inflation over 10 yrs</span>
                  <span className="text-[15px] font-extrabold text-[#DC2626]">+65%</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-[#F4F4F5]">
                  <span className="text-[13px] text-[#52525B]">Break-even target</span>
                  <span className="text-[15px] font-extrabold text-[#DC2626]">R16,500</span>
                </div>

                {/* Fund verdicts */}
                <div className="space-y-2.5 pt-2">
                  <p className="text-[10px] font-bold tracking-[1px] uppercase text-[#71717A] mb-1">
                    Real return verdict
                  </p>
                  {funds.map((fund) => {
                    const beatsInflation = fund.growth > inflationGrowth;
                    const nominalReturn = ((fund.growth - 10000) / 10000) * 100;
                    const inflationPct = ((inflationGrowth - 10000) / 10000) * 100;
                    const realReturn = (nominalReturn - inflationPct).toFixed(0);
                    return (
                      <div
                        key={fund.shortName}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-md bg-white border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden p-0.5">
                            <Image src={fund.logo} alt={fund.brandName} width={14} height={14} className="object-contain" />
                          </div>
                          <span className="text-[12px] font-semibold text-[#18181B]">
                            {fund.shortName}
                          </span>
                        </div>
                        <span
                          className={`text-[12px] font-bold ${
                            beatsInflation ? "text-[#16A34A]" : "text-[#DC2626]"
                          }`}
                        >
                          {beatsInflation ? "+" : ""}
                          {realReturn}% real
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Key takeaway */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" as const }}
            className="mt-8 pt-6 border-t border-[#E4E4E7]"
          >
            <div className="bg-white border border-[#E4E4E7] rounded-[16px] px-6 py-5 flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-navy/[0.06] flex items-center justify-center shrink-0 mt-0.5">
                <Info className="w-5 h-5 text-navy" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-[#18181B] mb-1">
                  The bottom line
                </p>
                <p className="text-[13px] text-[#52525B] leading-[1.75]">
                  If your investment isn&apos;t beating inflation, you&apos;re
                  not growing wealth &mdash; you&apos;re slowly losing it. The
                  red inflation line on the chart above is your real benchmark.
                  Everything below it is a loss in disguise. Everything above it
                  is genuine wealth creation.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* ═══ PERFORMANCE TABLE ═══ */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.15 }}
          className="bg-white rounded-[20px] border border-border overflow-hidden mb-10"
        >
          <div className="px-6 sm:px-8 py-5 border-b border-border bg-[#FAFAFA]">
            <h3 className="text-sm font-bold text-[#18181B] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal" />
              Annualized Returns Comparison
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-[#FAFAFA]">
                  <th className="text-left text-[11px] font-bold text-[#52525B] uppercase tracking-wider py-3.5 px-6 sm:px-8">
                    Fund / Index
                  </th>
                  <th className="text-right text-[11px] font-bold text-[#52525B] uppercase tracking-wider py-3.5 px-4">
                    1 Year
                  </th>
                  <th className="text-right text-[11px] font-bold text-[#52525B] uppercase tracking-wider py-3.5 px-4">
                    3 Year
                  </th>
                  <th className="text-right text-[11px] font-bold text-[#52525B] uppercase tracking-wider py-3.5 px-4">
                    5 Year
                  </th>
                  <th className="text-right text-[11px] font-bold text-[#52525B] uppercase tracking-wider py-3.5 px-4 sm:pr-8">
                    10 Year
                  </th>
                </tr>
              </thead>
              <tbody>
                {funds.map((fund, i) => (
                  <tr
                    key={fund.shortName}
                    className={`hover:bg-[#FAFAFA] transition-colors ${
                      i < funds.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <td className="py-4 px-6 sm:px-8">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden p-1">
                          <Image src={fund.logo} alt={fund.brandName} width={20} height={20} className="object-contain" />
                        </div>
                        <div>
                          <span className="font-bold text-[#18181B] text-[13px] block leading-tight">
                            {fund.shortName}
                          </span>
                          <span className="text-[10px] text-[#71717A]">
                            {fund.type}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td
                      className="text-right py-4 px-4 font-bold text-[13px] text-[#18181B]"
                    >
                      {fund.returns.yr1}%
                    </td>
                    <td
                      className="text-right py-4 px-4 font-bold text-[13px] text-[#18181B]"
                    >
                      {fund.returns.yr3}%
                    </td>
                    <td
                      className="text-right py-4 px-4 font-bold text-[13px] text-[#18181B]"
                    >
                      {fund.returns.yr5}%
                    </td>
                    <td
                      className={`text-right py-4 px-4 sm:pr-8 font-extrabold text-[14px] ${fund.textColor}`}
                    >
                      {fund.returns.yr10}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ═══ FUND DETAIL CARDS ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {funds.map((fund, i) => (
            <motion.div
              key={fund.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: 0.08 * i,
                ease: "easeOut" as const,
              }}
              className={`bg-white rounded-[20px] border ${fund.borderColor} shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all`}
            >
              {/* Card header */}
              <div className={`${fund.accentBg} px-6 py-5 border-b ${fund.borderColor}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[12px] bg-white border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden p-1.5">
                      <Image src={fund.logo} alt={fund.brandName} width={28} height={28} className="object-contain" />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-extrabold text-ink leading-tight">
                        {fund.name}
                      </h4>
                      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: fund.brandColor }}>
                        {fund.brandName}
                      </span>
                    </div>
                  </div>
                  <a
                    href={fund.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${fund.textColor} hover:opacity-70 transition-opacity`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-[12px] text-[#52525B] leading-[1.6]">
                  {fund.description}
                </p>
              </div>

              {/* Card metrics */}
              <div className="px-6 py-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider block mb-1">
                      10-Year Return
                    </span>
                    <span className={`text-xl font-extrabold ${fund.textColor}`}>
                      {fund.returns.yr10}% p.a.
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider block mb-1">
                      R10K Became
                    </span>
                    <span className={`text-xl font-extrabold ${fund.textColor}`}>
                      R{fund.growth.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider block mb-1">
                      TER / Cost
                    </span>
                    <span className="text-[13px] font-semibold text-ink">
                      {fund.ter}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider block mb-1">
                      Min Investment
                    </span>
                    <span className="text-[13px] font-semibold text-ink">
                      {fund.minInvest}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider block mb-1">
                      Risk Level
                    </span>
                    <span className="text-[13px] font-semibold text-ink">
                      {fund.riskLevel}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider block mb-1">
                      Inception
                    </span>
                    <span className="text-[13px] font-semibold text-ink">
                      {fund.inception}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Disclaimer */}
        <motion.div
          {...fadeUp}
          className="bg-[#FFFBEB] border border-[#FDE68A]/50 rounded-[16px] p-5 flex gap-3"
        >
          <Info className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
          <div>
            <p className="text-[12px] text-[#92400E] font-semibold mb-1">
              Important Disclaimer
            </p>
            <p className="text-[11px] text-[#A16207] leading-[1.7]">
              All performance data shown is illustrative and based on
              approximate historical returns. Past performance is not indicative
              of future results. These figures are for educational purposes only
              and do not constitute financial advice. Always consult an
              authorised financial adviser before making investment decisions.
              Verify current data on the official fund fact sheets linked above.
              #ThisIsNotFinancialAdvice
            </p>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
