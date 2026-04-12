"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";

const fadeUp = {
  initial: { opacity: 0, y: 20 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, amount: 0.2 } as const,
  transition: { duration: 0.7, ease: "easeOut" as const } as const,
};

const beliefs = [
  {
    heading: "Invest & save.",
    body: "Community trusts, angel syndicates, and the knowledge to make your money work \u2014 whether it\u2019s your first R1K or your hundredth.",
  },
  {
    heading: "Build & scale.",
    body: "Advisory, funding access, and growth strategy for side hustlers, content creators, SMMEs, and startup founders turning ambition into revenue.",
  },
  {
    heading: "Compound everything.",
    body: "Money compounds. But so does knowledge, networks, and confidence. We build systems where all three grow together.",
  },
];

export function BrandPurpose() {
  return (
    <section className="relative overflow-hidden">
      {/* ═══ HERO IMAGE ═══ */}
      <div className="relative h-[55vh] sm:h-[75vh] min-h-[360px] sm:min-h-[500px] max-h-[720px] flex items-center justify-center">
        <Image
          src="/images/hu-chen-60XLoOgwkfA-unsplash.jpg"
          alt="African savanna at sunset"
          fill
          className="object-cover object-[center_70%]"
          priority
        />
        <div className="absolute inset-0 bg-[#0B1933]/40" />
        <Container className="relative z-[1] text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h2 className="text-[clamp(3rem,7vw,5.5rem)] font-extrabold text-white leading-[0.95] tracking-tight">
              Hello,{" "}
              <span className="text-lime">Africa.</span>
            </h2>
          </motion.div>
        </Container>
      </div>

      {/* ═══ MANIFESTO ═══ */}
      <div className="py-16 sm:py-[100px] px-[clamp(1.25rem,4vw,3.5rem)] bg-white">
        <Container className="max-w-[860px]">
          <motion.p
            {...fadeUp}
            className="text-[18px] font-bold tracking-[1.5px] uppercase text-teal text-center mb-10"
          >
            Our Mission
          </motion.p>
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.05 }}
            className="text-center max-w-[680px] mx-auto mb-12 sm:mb-20"
          >
            <p className="text-[clamp(1.05rem,2vw,1.2rem)] text-[#52525B] leading-[1.85]">
              Wealth isn&apos;t built one way. You might be saving your first
              R1,000 a month, scaling a side hustle into a real business, or
              raising capital for a startup that could change an industry. Often
              you&apos;re doing more than one at the same time. We built Lime
              Pages for that reality &mdash; one place where you can invest,
              grow, and build, wherever you are in the journey.
            </p>
          </motion.div>

          {/* Divider */}
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
            className="flex items-center justify-center gap-3 mb-12 sm:mb-20"
          >
            <div className="h-px w-12 bg-[#E4E4E7]" />
            <div className="w-1.5 h-1.5 rounded-full bg-teal" />
            <div className="h-px w-12 bg-[#E4E4E7]" />
          </motion.div>

          {/* Beliefs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-10">
            {beliefs.map((b, i) => (
              <motion.div
                key={b.heading}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.6,
                  delay: 0.08 * i,
                  ease: "easeOut" as const,
                }}
                className="text-center md:text-left"
              >
                <h3 className="text-[17px] font-extrabold text-[#18181B] mb-3 leading-tight">
                  {b.heading}
                </h3>
                <p className="text-[14.5px] text-[#71717A] leading-[1.75]">
                  {b.body}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Closing */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-center text-[15px] text-[#A1A1AA] mt-12 sm:mt-20 leading-relaxed max-w-[520px] mx-auto"
          >
            Built in Johannesburg. For the continent. By the people the industry
            assumed weren&apos;t worth the effort.
          </motion.p>
        </Container>
      </div>
    </section>
  );
}
