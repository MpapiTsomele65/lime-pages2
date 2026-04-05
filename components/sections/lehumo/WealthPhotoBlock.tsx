"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Container } from "@/components/ui/Container";

export function WealthPhotoBlock() {
  return (
    <section className="py-10 bg-navy">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: "easeOut" as const }}
          className="relative rounded-2xl overflow-hidden h-[380px] sm:h-[440px] lg:h-[500px]"
        >
          {/* Image — full chart visible */}
          <Image
            src="/images/morgan-housel-PcDGGex9-jA-unsplash.jpg"
            alt="Wealth growing over time"
            fill
            className="object-cover"
            sizes="100vw"
          />

          {/* Gradient: dark top-left corner fading out to transparent */}
          <div className="absolute inset-0 bg-gradient-to-br from-navy/90 via-navy/40 to-transparent" />

          {/* Text content — top left */}
          <div className="absolute inset-0 flex items-start justify-start px-8 sm:px-10 pt-8 sm:pt-10">
            <div className="max-w-[320px]">
              <p className="text-[11px] font-bold tracking-[1.4px] uppercase text-lime mb-3">
                The Long Game
              </p>
              <h3 className="text-[clamp(1.4rem,3vw,2rem)] font-extrabold text-white leading-[1.15] tracking-tight mb-3">
                Wealth is built
                <br />
                over <span className="text-teal">time.</span>
              </h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Consistent contributions, compounding returns, and patient
                discipline — that&apos;s how generational wealth is created.
              </p>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
