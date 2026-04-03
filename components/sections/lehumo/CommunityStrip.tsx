"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export function CommunityStrip() {
  return (
    <div className="relative overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[380px]">
        {/* Photo */}
        <div className="relative overflow-hidden min-h-[320px] bg-navy-mid">
          <div className="relative aspect-[4/3] rounded-[20px] overflow-hidden">
            <Image src="/images/ali-mkumbwa-e_RUhF1cwvM-unsplash.jpg" alt="Community members together" fill className="object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-navy-mid/95 hidden md:block" />
        </div>
        {/* Text */}
        <div className="bg-navy-mid flex items-center px-[clamp(1.5rem,5vw,4rem)] py-[60px]">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
          >
            <p className="text-[11px] font-bold text-teal tracking-[1.5px] uppercase mb-[18px]">
              Community First
            </p>
            <h3 className="text-[clamp(1.6rem,3vw,2.4rem)] font-extrabold text-white leading-[1.2] tracking-tight mb-5">
              The conversation is already happening.
              <br />
              <span className="text-lime">Now it&apos;s formal.</span>
            </h3>
            <p className="text-[15px] text-white/60 leading-[1.8] mb-7">
              For generations, Black South Africans have built wealth informally — through stokvels, extended family networks, and community trust. Lehumo takes that spirit and gives it a structure that creates lasting, tangible assets.
            </p>
            <Link href="#join" className="inline-flex items-center gap-2 bg-lime text-navy px-7 py-[13px] rounded-full font-bold text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(184,255,0,0.3)] transition-all">
              Join the Waitlist →
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
