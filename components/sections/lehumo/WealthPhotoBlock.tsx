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
          className="relative rounded-2xl overflow-hidden h-[260px] sm:h-[300px]"
        >
          {/* Image — left side */}
          <Image
            src="/images/morgan-housel-PcDGGex9-jA-unsplash.jpg"
            alt="Wealth growing over time"
            fill
            className="object-cover object-left"
            sizes="100vw"
          />

          {/* Gradient fade from image into navy on the right */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-navy/60 to-navy" />

          {/* Text content — right aligned */}
          <div className="absolute inset-0 flex items-center justify-end px-8 sm:px-14">
            <div className="max-w-[340px] text-right">
              <p className="text-[11px] font-bold tracking-[1.4px] uppercase text-lime mb-3">
                The Long Game
              </p>
              <h3 className="text-[clamp(1.4rem,3vw,2rem)] font-extrabold text-white leading-[1.15] tracking-tight mb-3">
                Wealth is built
                <br />
                over <span className="text-teal">time.</span>
              </h3>
              <p className="text-sm text-white/55 leading-relaxed">
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
