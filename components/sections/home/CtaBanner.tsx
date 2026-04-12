"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export function CtaBanner() {
  return (
    <div className="bg-navy py-20 px-[clamp(1.25rem,4vw,3.5rem)] relative overflow-hidden">
      <Image
        src="/images/ashley-jurius-53tN_APs-50-unsplash.jpg"
        alt="Cape Town at dusk with city lights"
        fill
        className="object-cover"
        quality={80}
        priority={false}
      />
      <div className="absolute inset-0 bg-navy/80 z-[1]" />
      <div className="absolute -top-[30%] -right-[5%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(184,255,0,0.08),transparent_70%)] blur-[60px] pointer-events-none z-[2]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: "easeOut" as const }}
        className="max-w-[1200px] mx-auto relative z-[2] flex flex-col md:flex-row justify-between items-start md:items-center gap-8"
      >
        <div>
          <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-extrabold text-white leading-[1.05] tracking-tight mb-3">
            The table has room.
            <br />
            <span className="text-lime">Pull up a chair.</span>
          </h2>
          <p className="text-white/55 text-base">
            Whether you&apos;re investing your first R1,000, scaling a side hustle, or raising capital for a startup — we built this for you.
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
            href="/about"
            className="text-white px-8 py-3.5 rounded-full font-semibold text-sm border-2 border-white/20 hover:bg-white/[0.07] hover:border-lime/40 transition-all"
          >
            Behind the Pages
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
