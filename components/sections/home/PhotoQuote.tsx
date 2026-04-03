"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

export function PhotoQuote() {
  return (
    <section className="relative h-[480px] overflow-hidden flex items-center">
      <Image
        src="/images/istockphoto-2217186640-612x612.webp"
        alt="Mpapi Tsomele"
        fill
        className="object-cover"
      />
      <div className="absolute inset-0 bg-navy/75" />
      <Container className="relative z-[1] text-center">
        <motion.div {...fadeUp}>
          <blockquote className="text-[clamp(1.4rem,3vw,2rem)] font-bold text-white leading-[1.5] max-w-[720px] mx-auto italic mb-6">
            &ldquo;The people walking these streets deserve the same financial
            knowledge that has been hoarded in boardrooms for decades.&rdquo;
          </blockquote>
          <p className="text-sm text-white/60 font-semibold tracking-wide uppercase">
            Mpapi Tsomele, Founder, Lime Pages
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
