"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";

const nodes = [
  { value: "30", label: "Founding Members", sub: "The original cohort", style: "bg-lime-dim border-lime text-lime", size: "w-[90px] h-[90px] text-[26px]" },
  { value: "+2 each", label: "Each founder extends", sub: "2 personal invitations", style: "bg-teal-dim border-teal text-teal", size: "w-[100px] h-[100px] text-[18px]" },
  { value: "90 max", label: "At Maturity", sub: "Maximum connected members", style: "bg-lime/20 border-lime text-lime", size: "w-[110px] h-[110px] text-[22px]" },
];

export function CommunityGrowth() {
  return (
    <section className="py-16 bg-navy-mid">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" as const }}
          className="text-center"
        >
          <span className="text-[11px] font-bold tracking-[1.4px] uppercase text-teal mb-3.5 block">What Else?</span>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white leading-[1.08] tracking-tight mb-2">
            How will the
            <br />
            <span className="text-lime">community grow?</span>
          </h2>
          <p className="text-white/55 text-[15px] max-w-[500px] mx-auto mb-10">
            Organic growth through trusted peer referrals — the way community is built.
          </p>
        </motion.div>

        {/* Growth visual */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-0">
          {nodes.map((n, i) => (
            <motion.div
              key={n.value}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 * i, ease: "easeOut" as const }}
              className="flex flex-col sm:flex-row items-center"
            >
              <div className="text-center px-5">
                <div className={`${n.size} rounded-full flex items-center justify-center font-extrabold border-[2.5px] mx-auto mb-3.5 ${n.style}`}>
                  {n.value}
                </div>
                <div className="text-[13px] font-bold text-white mb-1">{n.label}</div>
                <div className="text-xs text-white/55">{n.sub}</div>
              </div>
              {i < nodes.length - 1 && (
                <span className="text-[28px] text-white/32 px-2 hidden sm:block mb-10">→</span>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" as const }}
          className="text-center mt-12"
        >
          <div className="inline-block bg-lime/[0.07] border border-lime/20 rounded-[14px] px-8 py-5">
            <p className="text-[15px] text-white/60 leading-[1.7]">
              The community grows through trust, not advertising. <strong className="text-lime">Founding 30 → 90 connected members</strong> at full maturity.
            </p>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
