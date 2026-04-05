"use client";

import { motion } from "framer-motion";
import Image from "next/image";
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
    <section className="py-16 bg-navy-mid">
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

        {/* Image-backed panel with Save Buy Protect */}
        <motion.div
          {...fadeUp}
          className="relative rounded-2xl overflow-hidden mt-2"
        >
          <div className="relative min-h-[280px] sm:min-h-[260px]">
            <Image
              src="/images/matt-aylward-Nmh-pEBRt2Y-unsplash.jpg"
              alt="Golf at sunset"
              fill
              className="object-cover object-[center_30%]"
              sizes="100vw"
            />
            {/* Gradient: transparent left → navy-mid right */}
            <div className="absolute inset-0 bg-gradient-to-r from-navy-mid/80 via-navy-mid/60 to-navy-mid/90" />
            <div className="absolute inset-0 backdrop-blur-[1px]" />

            {/* Content overlay */}
            <div className="relative z-[1] flex flex-col md:flex-row items-start md:items-center gap-8 px-8 py-10">
              <div className="flex-1 max-w-[420px]">
                <p className="text-base text-white/80 leading-[1.8] mb-1">
                  <strong className="text-teal">LEHUMO</strong> curates communities of like-minded individuals, supporting them towards a shared objective. Responding to years of systemic economic exclusion and marginalisation through collective action.
                </p>
                <p className="text-sm text-white/40 leading-[1.7]">
                  Save up → Buy Cash Generating Assets → Protect for Future Generations.
                </p>
              </div>
              <div className="flex gap-3 shrink-0">
                {[
                  { icon: Save, label: "SAVE" },
                  { icon: Home, label: "BUY" },
                  { icon: ShieldCheck, label: "PROTECT" },
                ].map((p) => (
                  <div key={p.label} className="text-center py-4 px-5 rounded-2xl border-[1.5px] border-lime/30 bg-navy/60 backdrop-blur-sm">
                    <p.icon className="w-[22px] h-[22px] text-lime mx-auto mb-2" />
                    <div className="text-sm font-extrabold text-lime tracking-[1px]">{p.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
