"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function CtaBanner() {
  return (
    <div className="bg-navy py-20 px-[clamp(1.25rem,4vw,3.5rem)] relative overflow-hidden">
      <div className="absolute -top-[30%] -right-[5%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(184,255,0,0.08),transparent_70%)] blur-[60px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: "easeOut" as const }}
        className="max-w-[1200px] mx-auto relative z-[1] flex flex-col md:flex-row justify-between items-start md:items-center gap-8"
      >
        <div>
          <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-extrabold text-white leading-[1.05] tracking-tight mb-3">
            Ready to build
            <br />
            <span className="text-lime">real wealth?</span>
          </h2>
          <p className="text-white/55 text-base">
            Book a session or let&apos;s have a coffee and talk through your goals.
          </p>
        </div>
        <div className="flex gap-3.5 flex-wrap">
          <Link
            href="/advisory"
            className="bg-lime text-navy px-8 py-3.5 rounded-full font-bold text-sm hover:opacity-90 hover:-translate-y-0.5 transition-all"
          >
            Book Now →
          </Link>
          <Link
            href="/connect"
            className="text-white px-8 py-3.5 rounded-full font-semibold text-sm border-2 border-white/20 hover:bg-white/[0.07] hover:border-lime/40 transition-all"
          >
            Let&apos;s Connect
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
