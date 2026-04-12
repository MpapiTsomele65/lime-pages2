"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { TrendingUp, Shield, Landmark, Sprout, ArrowRight } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

/* Pie chart segments — order matters for conic-gradient */
const segments = [
  { label: "Sum1 Investments", pct: 40, color: "#B8FF00", startDeg: 0 },
  { label: "Cash", pct: 40, color: "#46cdcf", startDeg: 144 },
  { label: "Bonds", pct: 10, color: "#6366f1", startDeg: 288 },
  { label: "Alternative Investments*", pct: 10, color: "#a855f7", startDeg: 324 },
];

const allocations = [
  {
    pct: "40%",
    pctColor: "text-lime",
    amount: "R400/month",
    icon: TrendingUp,
    title: "Sum1 Investments",
    desc: "Growth through local business asset financing. Community-based investment in logistics, agriculture, food & beverages, and manufacturing.",
    statLabel: "5-Year Avg Return",
    statValue: "~17.6%",
    statColor: "text-lime",
    statBg: "bg-lime/[0.08]",
    statBorder: "border-lime/15",
    cardBorder: "border-lime/20",
    dotColor: "bg-[#B8FF00]",
    details: ["FSP Licence: 53629", "NCRCP: 21759"],
  },
  {
    pct: "40%",
    pctColor: "text-teal",
    amount: "R400/month",
    icon: Shield,
    title: "Cash Reserves",
    desc: "Liquidity pool for interest-free emergency loans. Ensures every member can access up to 20% of their contributions when needed.",
    statLabel: "Purpose",
    statValue: "Emergency Access",
    statColor: "text-teal",
    statBg: "bg-teal/[0.08]",
    statBorder: "border-teal/15",
    cardBorder: "border-teal/20",
    dotColor: "bg-teal",
    details: ["0% Interest Loans", "Community Support Fund"],
  },
  {
    pct: "10%",
    pctColor: "text-indigo-400",
    amount: "R100/month",
    icon: Landmark,
    title: "SA Bonds",
    desc: "Stability and consistent income from government-backed securities. Provides portfolio stability and predictable returns.",
    statLabel: "Profile",
    statValue: "Low Risk",
    statColor: "text-indigo-400",
    statBg: "bg-indigo-500/[0.08]",
    statBorder: "border-indigo-500/15",
    cardBorder: "border-indigo-500/20",
    dotColor: "bg-indigo-500",
    details: ["Fixed Income", "Portfolio Stabilizer"],
  },
  {
    pct: "10%",
    pctColor: "text-purple-400",
    amount: "R100/month",
    icon: Sprout,
    title: "SV Capital",
    desc: "Alternative assets portfolio. Exposure to high-growth opportunities including cattle farming and solar energy initiatives.",
    statLabel: "Avg Annual Return",
    statValue: "~14.8%",
    statColor: "text-purple-400",
    statBg: "bg-purple-500/[0.08]",
    statBorder: "border-purple-500/15",
    cardBorder: "border-purple-500/20",
    dotColor: "bg-purple-500",
    details: ["FSP No: 52449", "Regulated Entity"],
  },
];

/* Sum1 track record */
const sum1Returns = [
  { year: "2021", pct: "18.23%" },
  { year: "2022", pct: "19.18%" },
  { year: "2023", pct: "16.79%" },
  { year: "2024", pct: "17.81%" },
  { year: "2025", pct: "16.13%" },
];

export function InvestmentStrategy() {
  return (
    <section id="strategy" className="py-16 bg-navy-mid">
      <Container>
        {/* ── Header ── */}
        <motion.div {...fadeUp}>
          <span className="text-[11px] font-bold tracking-[1.4px] uppercase text-lime mb-3.5 block">
            How Your Money Works
          </span>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white leading-[1.08] tracking-tight mb-5">
            Lehumo Investment
            <br />
            <span className="text-teal">Strategy</span>
          </h2>
          <p className="text-base text-white/60 leading-[1.8] mb-10 max-w-[680px]">
            Each R1,000 monthly contribution is strategically allocated across
            four diversified investment vehicles. This balanced approach ensures
            growth, liquidity, stability, and exposure to alternative assets.
          </p>
        </motion.div>

        {/* ── Pie Chart with Integrated Labels ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: "easeOut" as const }}
          className="mb-16"
        >
          <h3 className="text-xl font-extrabold text-white mb-8 text-center">
            Portfolio Allocation
          </h3>

          <div className="relative w-full max-w-[600px] mx-auto">
            {/* Pie chart — centred */}
            <div className="relative mx-auto w-[260px] h-[260px] sm:w-[320px] sm:h-[320px]">
              <div
                className="w-full h-full rounded-full shadow-[0_0_60px_rgba(184,255,0,0.08)]"
                style={{
                  background: `conic-gradient(
                    #B8FF00 0deg 144deg,
                    #46cdcf 144deg 288deg,
                    #6366f1 288deg 324deg,
                    #a855f7 324deg 360deg
                  )`,
                }}
              />
              {/* Centre donut hole */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[100px] h-[100px] sm:w-[130px] sm:h-[130px] rounded-full bg-navy-mid" />
              </div>
            </div>

            {/* Labels positioned around the chart */}
            {/* Sum1 Investments — top-right (lime segment) */}
            <div className="absolute top-[5%] right-[-10px] sm:right-[-40px] text-right">
              <p className="text-[15px] sm:text-lg font-extrabold text-white leading-tight">
                Sum1 Investments
              </p>
              <p className="text-[13px] sm:text-[15px] font-extrabold text-[#B8FF00]">
                40%
              </p>
            </div>

            {/* Cash — bottom-left (teal segment) */}
            <div className="absolute bottom-[8%] left-[-10px] sm:left-[-30px]">
              <p className="text-[15px] sm:text-lg font-extrabold text-white leading-tight">
                Cash
              </p>
              <p className="text-[13px] sm:text-[15px] font-extrabold text-teal">
                40%
              </p>
            </div>

            {/* Bonds — left (indigo segment) */}
            <div className="absolute top-[30%] left-[-10px] sm:left-[-50px]">
              <p className="text-[13px] sm:text-[15px] font-bold text-white leading-tight">
                Bonds
              </p>
              <p className="text-[12px] sm:text-[13px] font-extrabold text-indigo-400">
                10%
              </p>
            </div>

            {/* Alternative Investments — top-left (purple segment) */}
            <div className="absolute top-[-5px] left-[10px] sm:left-[-20px] max-w-[140px]">
              <p className="text-[13px] sm:text-[15px] font-bold text-white leading-tight">
                Alternative
                <br />
                investments*
              </p>
              <p className="text-[12px] sm:text-[13px] font-extrabold text-purple-400">
                10%
              </p>
            </div>
          </div>

          <p className="text-[11px] text-white/30 mt-6 text-center">
            *Alternative investments include cattle farming, solar energy, and
            other high-growth asset classes.
          </p>
        </motion.div>

        {/* ── Sum1 Partner Spotlight ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" as const }}
          className="bg-lime/[0.06] border border-lime/20 rounded-2xl p-8 mb-10"
        >
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left — Partner info */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-5">
                <Image
                  src="/images/sum1-logo-white.png"
                  alt="Sum1 Investments"
                  width={120}
                  height={48}
                  className="object-contain"
                />
                <div className="h-8 w-px bg-white/15" />
                <p className="text-[10px] font-bold text-lime/60 uppercase tracking-wide leading-tight">
                  Asset Manager
                  <br />
                  Partner
                </p>
              </div>
              <p className="text-sm text-white/60 leading-[1.8] mb-5">
                Sum1 Investments is a community-based investment platform that
                channels capital into local businesses through income-generating
                assets. As Lehumo&apos;s primary asset manager, they deploy 40%
                of the portfolio across four key sectors driving real economic
                activity.
              </p>

              {/* Where they invest */}
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wide mb-2.5">
                Where They Invest
              </p>
              <div className="flex flex-wrap gap-2 mb-5">
                {["Logistics", "Agriculture", "Food & Beverages", "Manufacturing"].map((s) => (
                  <span
                    key={s}
                    className="bg-lime/[0.08] border border-lime/15 rounded-full px-3 py-1 text-[11px] font-semibold text-lime/80"
                  >
                    {s}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-white/40">
                <span>FSP Licence: 53629</span>
                <span>NCRCP: 21759</span>
                <span>Regulated Financial Services Provider</span>
              </div>
            </div>

            {/* Right — Track record */}
            <div className="lg:w-[280px] shrink-0">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wide mb-3">
                Returns After Fees
              </p>
              <div className="space-y-2">
                {sum1Returns.map((r) => (
                  <div
                    key={r.year}
                    className="flex items-center justify-between bg-white/[0.04] border border-white/[0.06] rounded-lg px-4 py-2.5"
                  >
                    <span className="text-sm font-semibold text-white/70">
                      {r.year}
                    </span>
                    <span className="text-sm font-extrabold text-lime">
                      {r.pct}
                    </span>
                  </div>
                ))}
              </div>
              <div className="bg-lime/[0.1] border border-lime/20 rounded-lg px-4 py-2.5 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white/50">
                    5-Year Average
                  </span>
                  <span className="text-base font-extrabold text-lime">
                    17.6%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Allocation Detail Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {allocations.map((a, i) => (
            <motion.div
              key={a.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: 0.1 * i,
                ease: "easeOut" as const,
              }}
              className={`bg-white/[0.04] border ${a.cardBorder} rounded-2xl p-8`}
            >
              {/* Icon + percentage */}
              <div className="flex items-center justify-between mb-4">
                <div className={`w-9 h-9 rounded-xl ${a.statBg} border ${a.statBorder} flex items-center justify-center`}>
                  <a.icon className={`w-[18px] h-[18px] ${a.pctColor}`} />
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${a.dotColor}`} />
                  <span className={`text-[13px] font-semibold text-white/50`}>
                    {a.amount}
                  </span>
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-3">
                <span
                  className={`text-[28px] font-extrabold ${a.pctColor}`}
                >
                  {a.pct}
                </span>
              </div>

              <h4 className="text-lg font-bold text-white mb-3">{a.title}</h4>
              <p className="text-sm text-white/65 leading-relaxed mb-5">
                {a.desc}
              </p>

              <div
                className={`${a.statBg} border ${a.statBorder} rounded-xl px-4 py-3 mb-3`}
              >
                <div className="text-xs text-white/50 uppercase tracking-wide mb-1">
                  {a.statLabel}
                </div>
                <div className={`text-base font-bold ${a.statColor}`}>
                  {a.statValue}
                </div>
              </div>

              <div className="text-xs text-white/45 leading-relaxed space-y-0.5">
                {a.details.map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Where Your Capital Goes — Carousel ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" as const }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[11px] font-bold tracking-[1.4px] uppercase text-lime/70">
              Where 50% of Your Capital Goes
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-white mb-2">
            Real Assets. Real Impact.
          </h3>
          <p className="text-sm text-white/50 leading-relaxed mb-6 max-w-[600px]">
            Half of the Lehumo portfolio flows directly into South Africa&apos;s
            real economy — funding local SMMEs through Sum1 Investments and
            backing grassroots alternative assets through SV Capital.
          </p>
        </motion.div>
      </Container>

      {/* Horizontal scroll carousel — breaks out of Container for edge-to-edge scroll */}
      <div className="overflow-x-auto scrollbar-hide pb-4">
        <div className="flex gap-5 px-[clamp(1.25rem,4vw,3.5rem)] lg:px-[max(calc((100vw-1200px)/2+1.25rem),1.25rem)] min-w-max">
          {/* Card 1 — Sum1 Investments (40%) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0, ease: "easeOut" as const }}
            className="group w-[340px] shrink-0 rounded-[20px] overflow-hidden border border-lime/20 relative flex flex-col"
          >
            <div className="relative h-[220px] shrink-0">
              <Image
                src="/images/ali-mkumbwa-uk3ey_vhDKA-unsplash.jpg"
                alt="SMME business owner at food stall"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-mid via-navy-mid/40 to-transparent" />
              <div className="absolute top-4 left-4">
                <div className="inline-flex items-center gap-1.5 bg-lime/20 backdrop-blur-sm border border-lime/30 rounded-full px-3 py-1">
                  <div className="w-2 h-2 rounded-full bg-[#B8FF00]" />
                  <span className="text-[10px] font-bold text-lime tracking-wide uppercase">
                    40% · Sum1 Investments
                  </span>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-[11px] text-white/70 font-medium">
                  R400 of every R1,000 invested monthly
                </p>
              </div>
            </div>
            <div className="bg-white/[0.04] p-6 flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Image
                  src="/images/sum1-logo-white.png"
                  alt="Sum1 Investments"
                  width={80}
                  height={32}
                  className="object-contain"
                />
                <div className="h-5 w-px bg-white/15" />
                <span className="text-[10px] font-bold text-lime/60 uppercase tracking-wide">
                  FSP 53629 · NCRCP 21759
                </span>
              </div>
              <h4 className="text-lg font-bold text-white mb-2">
                SMME Asset Financing
              </h4>
              <p className="text-[13px] text-white/55 leading-relaxed mb-4">
                Capital deployed to fund asset purchases for local businesses —
                from the food vendor scaling his kitchen, to logistics fleets
                and manufacturing equipment. Creating jobs and driving township
                economic growth.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {["Logistics", "Agriculture", "Food & Bev", "Manufacturing"].map((s) => (
                  <span
                    key={s}
                    className="bg-lime/[0.08] border border-lime/15 rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-lime/70"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <div className="bg-lime/[0.06] border border-lime/15 rounded-xl px-4 py-3">
                <div className="text-[10px] text-white/40 uppercase tracking-wide mb-0.5">
                  5-Year Track Record
                </div>
                <div className="text-base font-extrabold text-lime">
                  ~17.6% Average Annual Return
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2 — SV Capital (10%) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" as const }}
            className="group w-[340px] shrink-0 rounded-[20px] overflow-hidden border border-purple-500/25 relative flex flex-col"
          >
            <div className="relative h-[220px] shrink-0">
              <Image
                src="/images/Sustainable-methods-of-cattle-farming.jpg"
                alt="Cattle farming — grassroots alternative investment"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-mid via-navy-mid/40 to-transparent" />
              <div className="absolute top-4 left-4">
                <div className="inline-flex items-center gap-1.5 bg-purple-500/20 backdrop-blur-sm border border-purple-400/30 rounded-full px-3 py-1">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                  <span className="text-[10px] font-bold text-purple-300 tracking-wide uppercase">
                    10% · SV Capital
                  </span>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-[11px] text-white/70 font-medium">
                  R100 of every R1,000 invested monthly
                </p>
              </div>
            </div>
            <div className="bg-white/[0.04] p-6 flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Image
                  src="/images/sv-capital-logo-dark.png"
                  alt="SV Capital — Venture Beyond the Ordinary"
                  width={130}
                  height={48}
                  className="object-contain rounded-lg"
                />
                <div className="h-5 w-px bg-white/15" />
                <span className="text-[10px] font-bold text-purple-400/60 uppercase tracking-wide">
                  FSP 52449
                </span>
              </div>
              <h4 className="text-lg font-bold text-white mb-2">
                Grassroots Alternative Assets
              </h4>
              <p className="text-[13px] text-white/55 leading-relaxed mb-4">
                Exposure to niche, high-return asset classes outside traditional
                markets — including cattle farming and solar energy initiatives.
                These grassroots investments support rural economic development
                while delivering strong returns.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {["Cattle Farming", "Solar Energy", "Agriculture"].map((s) => (
                  <span
                    key={s}
                    className="bg-purple-500/[0.1] border border-purple-500/20 rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-purple-300/80"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <div className="bg-purple-500/[0.08] border border-purple-500/15 rounded-xl px-4 py-3">
                <div className="text-[10px] text-white/40 uppercase tracking-wide mb-0.5">
                  Avg Annual Return
                </div>
                <div className="text-base font-extrabold text-purple-400">
                  ~14.8%
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 3 — Township Economy (50% combined) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" as const }}
            className="group w-[340px] shrink-0 rounded-[20px] overflow-hidden border border-teal/25 relative flex flex-col"
          >
            <div className="relative h-[220px] shrink-0">
              <Image
                src="/images/small-business-owner.jpg"
                alt="Small business owner — township economy"
                fill
                className="object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-mid via-navy-mid/40 to-transparent" />
              <div className="absolute top-4 left-4">
                <div className="inline-flex items-center gap-1.5 bg-teal/20 backdrop-blur-sm border border-teal/30 rounded-full px-3 py-1">
                  <div className="w-2 h-2 rounded-full bg-teal" />
                  <span className="text-[10px] font-bold text-teal tracking-wide uppercase">
                    50% Combined Impact
                  </span>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-[11px] text-white/70 font-medium">
                  R500 of every R1,000 flows into the real economy
                </p>
              </div>
            </div>
            <div className="bg-white/[0.04] p-6 flex-1">
              <h4 className="text-lg font-bold text-white mb-2">
                Township Economy Ecosystem
              </h4>
              <p className="text-[13px] text-white/55 leading-relaxed mb-4">
                40% Sum1 + 10% SV Capital = 50% of your investment circulating
                through local communities. From the store owner growing her
                business to the farmer scaling production — every Rand works
                twice: growing your wealth while growing the township.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#B8FF00] shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm font-bold text-white">R400</span>
                    <span className="text-xs text-white/40 ml-1.5">Sum1 SMMEs</span>
                  </div>
                  <span className="text-xs font-semibold text-lime/60">40%</span>
                </div>
                <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm font-bold text-white">R100</span>
                    <span className="text-xs text-white/40 ml-1.5">SV Capital</span>
                  </div>
                  <span className="text-xs font-semibold text-purple-400/60">10%</span>
                </div>
                <div className="flex items-center gap-3 bg-teal/[0.08] border border-teal/20 rounded-xl px-4 py-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm font-bold text-teal">R500</span>
                    <span className="text-xs text-white/40 ml-1.5">Total community impact</span>
                  </div>
                  <span className="text-xs font-bold text-teal">50%</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll hint (mobile) */}
      <motion.div
        {...fadeUp}
        className="flex items-center justify-center gap-2 mt-4 mb-10 text-white/40 lg:hidden"
      >
        <ArrowRight className="w-4 h-4" />
        <span className="text-xs font-medium">
          Scroll to see all impact areas
        </span>
      </motion.div>

      {/* Desktop spacer */}
      <div className="hidden lg:block mb-10" />

      <Container>
        {/* ── Key Message ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" as const }}
          className="bg-teal/[0.07] border border-teal/20 rounded-2xl px-8 py-7"
        >
          <p className="text-[15px] text-white/65 leading-[1.8]">
            Lehumo follows a{" "}
            <strong className="text-white">multi-manager strategy</strong>,
            partnering with emerging Black-owned investment managers to ensure
            our community&apos;s capital contributes to empowering Black
            businesses. Both Sum1 Investments and SV Capital are regulated
            financial services providers committed to sustainable, ethical
            growth.
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
