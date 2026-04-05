"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { TrendingUp, Shield, Landmark, Sprout } from "lucide-react";

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
    <section id="strategy" className="py-24 bg-navy-mid">
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
          <p className="text-base text-white/60 leading-[1.8] mb-14 max-w-[680px]">
            Each R1,000 monthly contribution is strategically allocated across
            four diversified investment vehicles. This balanced approach ensures
            growth, liquidity, stability, and exposure to alternative assets.
          </p>
        </motion.div>

        {/* ── Pie Chart + Legend ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: "easeOut" as const }}
          className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 mb-16"
        >
          {/* Pie chart */}
          <div className="relative shrink-0">
            <div
              className="w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] rounded-full shadow-[0_0_60px_rgba(184,255,0,0.08)]"
              style={{
                background: `conic-gradient(
                  #B8FF00 0deg 144deg,
                  #46cdcf 144deg 288deg,
                  #6366f1 288deg 324deg,
                  #a855f7 324deg 360deg
                )`,
              }}
            />
            {/* Centre label */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] rounded-full bg-navy-mid flex flex-col items-center justify-center">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-wide">
                  Portfolio
                </p>
                <p className="text-xl font-extrabold text-white">100%</p>
              </div>
            </div>
          </div>

          {/* Legend + subtitle */}
          <div className="flex-1">
            <h3 className="text-xl font-extrabold text-white mb-6">
              Portfolio Allocation
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {segments.map((seg) => (
                <div
                  key={seg.label}
                  className="flex items-start gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5"
                >
                  <div
                    className="w-4 h-4 rounded-full shrink-0 mt-0.5"
                    style={{ backgroundColor: seg.color }}
                  />
                  <div>
                    <p className="text-[15px] font-bold text-white leading-tight">
                      {seg.pct}%
                    </p>
                    <p className="text-xs text-white/55">{seg.label}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-white/30 mt-4">
              *Alternative investments include cattle farming, solar energy, and
              other high-growth asset classes.
            </p>
          </div>
        </motion.div>

        {/* ── Sum1 Partner Spotlight ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" as const }}
          className="bg-lime/[0.06] border border-lime/20 rounded-2xl p-8 mb-14"
        >
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left — Partner info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-lime/15 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-lime" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-lime/60 uppercase tracking-wide">
                    Asset Manager Partner
                  </p>
                  <h4 className="text-lg font-bold text-white">
                    Sum1 Investments
                  </h4>
                </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
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
