"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Droplets } from "lucide-react";

export function Cost() {
  return (
    <section id="cost" className="py-24 bg-navy">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" as const }}
          className="text-center max-w-[700px] mx-auto"
        >
          <span className="text-[11px] font-bold tracking-[1.4px] uppercase text-lime mb-3.5 block">Cost?</span>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white leading-[1.08] tracking-tight mb-6">
            How much will
            <br />
            it cost me?
          </h2>

          <div className="text-[clamp(5rem,15vw,10rem)] font-extrabold text-lime leading-none tracking-tighter my-6">
            FREE.
          </div>

          <p className="text-lg text-white/60 leading-[1.8] mb-10">
            There is no advisory fee. No sign-up cost. No platform charge. Your only commitment is the R1,000 monthly contribution into the collective pool.
          </p>

          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl px-7 py-6 text-left flex gap-4 items-start mb-8">
            <Droplets className="w-6 h-6 text-teal flex-shrink-0 mt-0.5" />
            <p className="text-[15px] text-white/55 leading-[1.7]">
              Community participants may <strong className="text-white">voluntarily</strong> top up their monthly contributions by an additional <strong className="text-lime">R6.00</strong> — buying the curator a bottle of water. Completely optional. If you want to contribute ahead, community members can buy us a coffee, and anything is possible.
            </p>
          </div>

          <Link href="#join" className="inline-flex items-center gap-2 bg-lime text-navy px-9 py-[15px] rounded-full font-extrabold text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(184,255,0,0.3)] transition-all">
            Get on the Waitlist — It&apos;s Free →
          </Link>
        </motion.div>
      </Container>
    </section>
  );
}
