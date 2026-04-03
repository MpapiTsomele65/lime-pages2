"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Save, Home, ShieldCheck } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

export function StokvelComparison() {
  return (
    <section className="py-24 bg-navy-mid">
      <Container>
        <motion.div {...fadeUp}>
          <span className="text-[11px] font-bold tracking-[1.4px] uppercase text-teal mb-3.5 block">
            Okay Tell Me More
          </span>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white leading-[1.08] tracking-tight max-w-[560px] mb-12">
            Is it like a
            <br />
            <span className="text-lime">Stokvel?</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          <motion.div {...fadeUp} className="bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-8">
            <span className="inline-block text-[10px] font-bold tracking-[1.4px] uppercase px-3 py-[5px] rounded-full mb-4 bg-red-500/10 text-red-300 border border-red-500/20">
              Not a Stokvel
            </span>
            <h3 className="text-xl font-extrabold text-white mb-3.5 leading-tight">
              Short-term consumption model
            </h3>
            <p className="text-[15px] text-white/55 leading-[1.75]">
              A typical Stokvel pools money for short-term consumption — Christmas spending, group purchases. The money is distributed and spent.
            </p>
          </motion.div>

          <motion.div {...fadeUp} transition={{ duration: 0.6, ease: "easeOut" as const, delay: 0.1 }} className="bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-8">
            <span className="inline-block text-[10px] font-bold tracking-[1.4px] uppercase px-3 py-[5px] rounded-full mb-4 bg-lime-dim text-lime border border-lime/25">
              Lehumo Model
            </span>
            <h3 className="text-xl font-extrabold text-white mb-3.5 leading-tight">
              Collective ownership of assets
            </h3>
            <p className="text-[15px] text-white/55 leading-[1.75]">
              Lehumo takes inspiration from the Stokvel spirit — peer-to-peer referrals & accountability — but channels it into long-term asset ownership. The community builds something that lasts.
            </p>
          </motion.div>
        </div>

        <motion.p {...fadeUp} className="text-base text-white/60 leading-[1.8] max-w-[700px] mb-12">
          <strong className="text-teal">LEHUMO</strong> curates communities of like-minded individuals, supporting them towards a shared objective. Responding to years of systemic economic exclusion and marginalisation through collective action.
        </motion.p>

        {/* Save Buy Protect pillars */}
        <motion.div {...fadeUp} className="flex flex-col sm:flex-row gap-4 max-w-[480px]">
          {[
            { icon: Save, label: "SAVE" },
            { icon: Home, label: "BUY" },
            { icon: ShieldCheck, label: "PROTECT" },
          ].map((p) => (
            <div key={p.label} className="flex-1 text-center py-5 px-3 rounded-2xl border-[1.5px] border-lime/25 bg-lime-dim">
              <p.icon className="w-[22px] h-[22px] text-lime mx-auto mb-2" />
              <div className="text-base font-extrabold text-lime tracking-[1px]">{p.label}</div>
            </div>
          ))}
        </motion.div>
        <p className="text-sm text-white/40 mt-5 max-w-[480px] leading-[1.7]">
          Save up → Buy Cash Generating Assets → Protect the Assets for Future Generations.
        </p>
      </Container>
    </section>
  );
}
