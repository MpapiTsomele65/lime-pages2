"use client";

import { motion } from "framer-motion";

export function PhotoQuote() {
  return (
    <div className="relative h-[420px] overflow-hidden bg-navy">
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy/55 to-navy/80 flex items-center justify-center px-[clamp(1.5rem,5vw,4rem)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: "easeOut" as const }}
          className="text-center max-w-[760px]"
        >
          <p className="text-[clamp(1.3rem,3vw,2rem)] font-extrabold text-white leading-[1.35] tracking-tight mb-5">
            &ldquo;The people walking these streets deserve the same financial
            knowledge that has been hoarded in boardrooms for decades.&rdquo;
          </p>
          <p className="text-[13px] text-lime font-bold tracking-[1px] uppercase">
            — Mpapi Tsomele, Founder, Lime Pages
          </p>
        </motion.div>
      </div>
    </div>
  );
}
