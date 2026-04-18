"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

export default function HomeHero() {
  return (
    <section className="bg-navy relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <Image
        src="/images/tobias-reich-1GgWbP74phY-unsplash.jpg"
        alt="Cape Town aerial view"
        fill
        className="object-cover"
        priority
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-navy/70 z-[1]" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow orbs */}
      <div
        className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full pointer-events-none z-[2]"
        style={{
          background:
            "radial-gradient(circle, rgba(70,205,207,0.25) 0%, transparent 70%)",
          filter: "blur(70px)",
        }}
      />
      <div
        className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full pointer-events-none z-[2]"
        style={{
          background:
            "radial-gradient(circle, rgba(184,255,0,0.2) 0%, transparent 70%)",
          filter: "blur(70px)",
        }}
      />

      {/* Content */}
      <Container className="relative z-[3] text-center py-32">
        <motion.div {...fadeUp}>
          <Badge variant="teal" pulse className="mb-8">
            Wealth &amp; Business Growth Solutions for Africa
          </Badge>
        </motion.div>

        <motion.h1
          {...fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" as const, delay: 0.1 }}
          className="text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-[1.05] tracking-tight text-white mb-6"
        >
          Building Wealth{" "}
          <span className="bg-gradient-to-br from-teal to-lime bg-clip-text text-transparent">
            Together
          </span>
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" as const, delay: 0.2 }}
          className="max-w-[640px] mx-auto text-[clamp(1rem,1.8vw,1.2rem)] leading-relaxed text-white/70"
        >
          Equipping entrepreneurs and young professionals with the strategies
          and solutions to build thriving businesses and generational wealth.
        </motion.p>

        {/* Scroll hint */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" as const, delay: 0.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <svg
            width="24"
            height="38"
            viewBox="0 0 24 38"
            fill="none"
            className="opacity-50"
          >
            <rect
              x="1"
              y="1"
              width="22"
              height="36"
              rx="11"
              stroke="white"
              strokeWidth="2"
            />
            <circle
              cx="12"
              cy="10"
              r="3"
              fill="white"
              style={{ animation: "scrollDot 2s ease infinite" }}
            />
          </svg>
        </motion.div>
      </Container>
    </section>
  );
}
