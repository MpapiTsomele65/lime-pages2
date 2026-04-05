"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const sectors = [
  { name: "Software", pct: 20.0, color: "bg-capital" },
  { name: "FinTech", pct: 15.9, color: "bg-capital/80" },
  { name: "Online Markets", pct: 7.6, color: "bg-capital/60" },
  { name: "Medical Devices", pct: 8.8, color: "bg-teal" },
  { name: "AgriTech", pct: 5.9, color: "bg-capital/50" },
  { name: "AI & ML", pct: 4.7, color: "bg-teal/70" },
  { name: "HealthCare (other)", pct: 7.6, color: "bg-teal/60" },
  { name: "Food & Beverage", pct: 4.1, color: "bg-capital/40" },
];

const stages = [
  { label: "Pre-Seed / Seed", pct: 40.7, color: "bg-white/25" },
  { label: "Series A", pct: 42.5, color: "bg-capital" },
  { label: "Late VC (B/C)", pct: 13.2, color: "bg-teal" },
];

export default function SectorBreakdown() {
  return (
    <section className="py-24 bg-navy relative overflow-hidden">
      {/* Glow orbs — now capital tinted */}
      <div className="absolute top-[10%] right-[5%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(193,255,114,0.1),transparent_70%)] blur-[60px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[5%] w-[350px] h-[350px] rounded-full bg-[radial-gradient(circle,rgba(193,255,114,0.06),transparent_70%)] blur-[60px] pointer-events-none" />

      <Container className="relative z-[1]">
        <motion.div {...fadeUp} className="text-center mb-16">
          <div className="inline-block bg-capital rounded-full px-4 py-1.5 mb-5">
            <span className="text-[11px] font-bold tracking-[1.2px] uppercase text-navy">
              Deep Dive
            </span>
          </div>
          <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-extrabold leading-[1.1] tracking-tight text-white mb-4">
            Sector allocation &amp;{" "}
            <span className="text-capital">funding stages</span>
          </h2>
          <p className="text-white/50 leading-relaxed max-w-[540px] mx-auto">
            Where SA venture capital was deployed in 2024, by sector and
            investment stage.
          </p>
        </motion.div>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Sector bars */}
          <motion.div
            {...fadeUp}
            className="bg-white/[0.05] backdrop-blur-sm rounded-[20px] border border-white/10 p-8"
          >
            <h3 className="text-base font-bold text-white mb-6">
              Top Sectors by Deal Share (2024)
            </h3>
            <div className="space-y-4">
              {sectors.map((sector, i) => (
                <motion.div
                  key={sector.name}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.06 * i }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-white/80 font-medium">
                      {sector.name}
                    </span>
                    <span className="text-sm font-bold text-capital">
                      {sector.pct}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-white/[0.08] rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${sector.color}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(sector.pct / 20) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.8,
                        delay: 0.1 * i,
                        ease: "easeOut",
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Funding stages */}
          <div className="space-y-6">
            <motion.div
              {...fadeUp}
              transition={{
                duration: 0.6,
                ease: "easeOut" as const,
                delay: 0.1,
              }}
              className="bg-white/[0.05] backdrop-blur-sm rounded-[20px] border border-white/10 p-8"
            >
              <h3 className="text-base font-bold text-white mb-6">
                Investment by Stage (2024)
              </h3>
              <div className="space-y-5">
                {stages.map((stage, i) => (
                  <motion.div
                    key={stage.label}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.1 * i }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-white/80 font-medium">
                        {stage.label}
                      </span>
                      <span className="text-sm font-bold text-capital">
                        {stage.pct}%
                      </span>
                    </div>
                    <div className="h-3 bg-white/[0.08] rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${stage.color}`}
                        initial={{ width: 0 }}
                        whileInView={{
                          width: `${(stage.pct / 50) * 100}%`,
                        }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.9,
                          delay: 0.15 * i,
                          ease: "easeOut",
                        }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Key callout */}
            <motion.div
              {...fadeUp}
              transition={{
                duration: 0.6,
                ease: "easeOut" as const,
                delay: 0.2,
              }}
              className="bg-capital/10 border border-capital/25 rounded-[16px] p-6"
            >
              <p className="text-sm font-bold text-capital mb-2">
                The Series A Shift
              </p>
              <p className="text-xs text-white/60 leading-relaxed">
                Series A funding surged from 19.6% in 2023 to 42.5% in 2024 — a
                historic high. This signals a maturing ecosystem where VCs are
                backing startups that have already validated their business
                models, rather than early-stage experiments.
              </p>
            </motion.div>

            {/* Regional split */}
            <motion.div
              {...fadeUp}
              transition={{
                duration: 0.6,
                ease: "easeOut" as const,
                delay: 0.25,
              }}
              className="bg-capital rounded-[20px] p-8"
            >
              <h3 className="text-base font-bold text-navy mb-5">
                Where Deals Happen
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { region: "Western Cape", pct: "52.0%" },
                  { region: "Gauteng", pct: "26.9%" },
                  { region: "International", pct: "14.6%" },
                ].map((r) => (
                  <div key={r.region}>
                    <p className="text-2xl font-extrabold text-navy mb-1">
                      {r.pct}
                    </p>
                    <p className="text-[10px] text-navy/60 font-semibold">
                      {r.region}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
}
