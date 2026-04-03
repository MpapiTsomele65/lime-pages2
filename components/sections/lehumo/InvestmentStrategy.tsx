"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";

const allocations = [
  {
    pct: "40%", pctColor: "text-lime", amount: "R400/month",
    title: "Sum1 Investments",
    desc: "Growth through local business asset financing. Emerging Black-owned investment manager empowering Black businesses across the continent.",
    statLabel: "Avg Annual Return", statValue: "~15%", statColor: "text-lime",
    statBg: "bg-lime/[0.08]", statBorder: "border-lime/15",
    cardBorder: "border-lime/20",
    details: ["FSP Licence: 53629", "NCRCP: 21759"],
  },
  {
    pct: "40%", pctColor: "text-teal", amount: "R400/month",
    title: "Cash Reserves",
    desc: "Liquidity pool for interest-free emergency loans. Ensures every member can access up to 20% of their contributions when needed.",
    statLabel: "Purpose", statValue: "Emergency Access", statColor: "text-teal",
    statBg: "bg-teal/[0.08]", statBorder: "border-teal/15",
    cardBorder: "border-teal/20",
    details: ["0% Interest Loans", "Community Support Fund"],
  },
  {
    pct: "10%", pctColor: "text-white", amount: "R100/month",
    title: "SA Bonds",
    desc: "Stability and consistent income from government-backed securities. Provides portfolio stability and predictable returns.",
    statLabel: "Profile", statValue: "Low Risk", statColor: "text-white",
    statBg: "bg-white/[0.05]", statBorder: "border-white/10",
    cardBorder: "border-white/10",
    details: ["Fixed Income", "Portfolio Stabilizer"],
  },
  {
    pct: "10%", pctColor: "text-pink", amount: "R100/month",
    title: "SV Capital",
    desc: "Alternative assets portfolio. Exposure to high-growth opportunities including cattle farming and solar energy initiatives.",
    statLabel: "Avg Annual Return", statValue: "~14.8%", statColor: "text-pink",
    statBg: "bg-pink/[0.08]", statBorder: "border-pink/15",
    cardBorder: "border-pink/20",
    details: ["FSP No: 52449", "Regulated Entity"],
  },
];

export function InvestmentStrategy() {
  return (
    <section id="strategy" className="py-24 bg-navy-mid">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" as const }}
        >
          <span className="text-[11px] font-bold tracking-[1.4px] uppercase text-lime mb-3.5 block">
            How Your Money Works
          </span>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white leading-[1.08] tracking-tight mb-5">
            Lehumo Investment
            <br />
            <span className="text-teal">Strategy</span>
          </h2>
          <p className="text-base text-white/60 leading-[1.8] mb-12 max-w-[680px]">
            Each R1,000 monthly contribution is strategically allocated across four diversified investment vehicles. This balanced approach ensures growth, liquidity, stability, and exposure to alternative assets.
          </p>
        </motion.div>

        {/* Allocation grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {allocations.map((a, i) => (
            <motion.div
              key={a.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * i, ease: "easeOut" as const }}
              className={`bg-white/[0.04] border ${a.cardBorder} rounded-2xl p-8`}
            >
              <div className="flex items-baseline gap-2 mb-4">
                <span className={`text-[28px] font-extrabold ${a.pctColor}`}>{a.pct}</span>
                <span className="text-[13px] text-white/50 font-semibold">{a.amount}</span>
              </div>
              <h4 className="text-lg font-bold text-white mb-3">{a.title}</h4>
              <p className="text-sm text-white/65 leading-relaxed mb-5">{a.desc}</p>
              <div className={`${a.statBg} border ${a.statBorder} rounded-xl px-4 py-3 mb-3`}>
                <div className="text-xs text-white/50 uppercase tracking-wide mb-1">{a.statLabel}</div>
                <div className={`text-base font-bold ${a.statColor}`}>{a.statValue}</div>
              </div>
              <div className="text-xs text-white/45 leading-relaxed space-y-0.5">
                {a.details.map((d) => <div key={d}>{d}</div>)}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Key message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" as const }}
          className="bg-teal/[0.07] border border-teal/20 rounded-2xl px-8 py-7"
        >
          <p className="text-[15px] text-white/65 leading-[1.8]">
            Lehumo is <strong className="text-white">partnering with emerging Black-owned investment managers</strong> to ensure our community&apos;s capital contributes to empowering Black businesses. Both Sum1 Investments and SV Capital are regulated financial services providers committed to sustainable, ethical growth.
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
