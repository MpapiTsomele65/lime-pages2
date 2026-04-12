"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { TrendingUp } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

/* ── 6-month tranches ── */
const milestones = [
  { months: 6, contributed: 6000, loan: 1200 },
  { months: 12, contributed: 12000, loan: 2400 },
  { months: 18, contributed: 18000, loan: 3600 },
  { months: 24, contributed: 24000, loan: 4800 },
  { months: 30, contributed: 30000, loan: 6000 },
  { months: 36, contributed: 36000, loan: 7200 },
  { months: 42, contributed: 42000, loan: 8400 },
  { months: 48, contributed: 48000, loan: 9600 },
  { months: 54, contributed: 54000, loan: 10800 },
  { months: 60, contributed: 60000, loan: 12000 },
];

const maxLoan = 20000;
const maxContributed = 100000;

function formatRand(n: number) {
  return `R${n.toLocaleString("en-ZA")}`;
}

export function LoanGrowthTimeline() {
  return (
    <section className="py-16 bg-navy">
      <Container>
    <motion.div
      {...fadeUp}
      className="bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-7 py-7 max-w-[800px] mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-2">
        <TrendingUp size={18} className="text-teal" />
        <span className="text-sm font-bold text-white">
          Emergency Loan Growth
        </span>
      </div>
      <p className="text-xs text-white/40 leading-relaxed mb-6">
        Your loan limit equals{" "}
        <strong className="text-white/70">20% of what you&apos;ve contributed</strong>{" "}
        at any point in time — and it grows every month as your contributions
        accumulate.
      </p>

      {/* Visual timeline */}
      <div className="space-y-2.5 mb-6">
        {milestones.map((m, i) => {
          const barPercent = (m.loan / maxLoan) * 100;
          const isFiveYear = m.months === 60;
          const isFirstEligible = m.months === 6;

          return (
            <motion.div
              key={m.months}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.35,
                delay: 0.04 * i,
                ease: "easeOut",
              }}
              className="group"
            >
              <div className="flex items-center gap-3">
                {/* Month label */}
                <div className="w-[52px] shrink-0 text-right">
                  <span
                    className={`text-xs font-bold ${
                      isFiveYear
                        ? "text-lime"
                        : isFirstEligible
                        ? "text-teal"
                        : "text-white/50"
                    }`}
                  >
                    {m.months}mo
                  </span>
                </div>

                {/* Bar */}
                <div className="flex-1 h-7 rounded-lg bg-white/[0.04] relative overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${barPercent}%` }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.6,
                      delay: 0.06 * i,
                      ease: "easeOut",
                    }}
                    className={`h-full rounded-lg ${
                      isFiveYear
                        ? "bg-lime/30"
                        : isFirstEligible
                        ? "bg-teal/30"
                        : "bg-teal/15"
                    }`}
                  />
                  {/* Inner labels */}
                  <div className="absolute inset-0 flex items-center justify-between px-3">
                    <span className="text-[10px] text-white/35">
                      {formatRand(m.contributed)} contributed
                    </span>
                    <span
                      className={`text-[11px] font-bold ${
                        isFiveYear
                          ? "text-lime"
                          : isFirstEligible
                          ? "text-teal"
                          : "text-white/70"
                      }`}
                    >
                      {formatRand(m.loan)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Annotation */}
              {isFirstEligible && (
                <div className="ml-[64px] mt-1">
                  <span className="text-[10px] font-semibold text-teal/70">
                    Standard &amp; VIP loan access starts here
                  </span>
                </div>
              )}
              {m.months === 12 && (
                <div className="ml-[64px] mt-1">
                  <span className="text-[10px] font-semibold text-white/30">
                    Basic plan loan access starts here
                  </span>
                </div>
              )}
              {isFiveYear && (
                <div className="ml-[64px] mt-1">
                  <span className="text-[10px] font-semibold text-lime/70">
                    5-year lock-in ends &middot; {formatRand(m.loan)}{" "}
                    max loan
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}

        {/* R20,000 target */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.44, ease: "easeOut" }}
        >
          <div className="flex items-center gap-3 mt-1">
            <div className="w-[52px] shrink-0 text-right">
              <span className="text-xs font-extrabold text-white">
                100mo
              </span>
            </div>
            <div className="flex-1 h-7 rounded-lg bg-white/[0.04] relative overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                className="h-full rounded-lg bg-gradient-to-r from-teal/25 to-lime/35"
              />
              <div className="absolute inset-0 flex items-center justify-between px-3">
                <span className="text-[10px] text-white/35">
                  {formatRand(maxContributed)} contributed
                </span>
                <span className="text-[11px] font-extrabold text-white">
                  {formatRand(maxLoan)}
                </span>
              </div>
            </div>
          </div>
          <div className="ml-[64px] mt-1">
            <span className="text-[10px] font-semibold text-white/50">
              Maximum emergency loan reached
            </span>
          </div>
        </motion.div>
      </div>

      {/* Bottom explainer */}
      <div className="flex items-start gap-3 bg-white/[0.03] rounded-xl border border-white/[0.06] px-4 py-3">
        <span className="text-teal text-sm mt-px">*</span>
        <p className="text-[11px] text-white/40 leading-relaxed">
          Your maximum emergency loan is always{" "}
          <strong className="text-white/60">
            20% of what you&apos;ve contributed so far
          </strong>
          . For example, after 12 months of R1,000 contributions you&apos;ll
          have R12,000 in the pool — qualifying you for up to R2,400. The
          more you contribute over time, the more you can access.
        </p>
      </div>
    </motion.div>
      </Container>
    </section>
  );
}
