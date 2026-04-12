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
        src="/images/52982939648_9e27736587_o.jpg"
        alt="Mpapi Tsomele"
        fill
        className="object-cover"
      />
      <div className="absolute inset-0 bg-navy/75" />
      <Container className="relative z-[1] text-center">
        <motion.div {...fadeUp}>
          <blockquote className="text-[clamp(1.4rem,3vw,2rem)] font-bold text-white leading-[1.5] max-w-[720px] mx-auto italic mb-6">
            &ldquo;We all deserve a chance at bumping into the right person,
            having the right network, taking a chance that works out to change
            the rest of our lives.&rdquo;
          </blockquote>
          <p className="text-sm text-white/60 font-semibold tracking-wide uppercase">
            Mpapi Tsomele, Founder, Lime Pages
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
