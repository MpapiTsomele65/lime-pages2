"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const stats = [
  { value: "7+", label: "Years in Financial Services" },
  { value: "R2M", label: "Lehumo Capital Target" },
  { value: "30", label: "Lehumo Member Target" },
  { value: "24hr", label: "Refund Guarantee" },
  { value: "5", label: "Advisory Services" },
];

export default function StatsBar() {
  return (
    <section className="bg-white border-b border-border py-12">
      <Container>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              {...fadeUp}
              transition={{
                duration: 0.6,
                ease: "easeOut" as const,
                delay: i * 0.1,
              }}
              className="text-center"
            >
              <p className="text-[clamp(1.8rem,3vw,2.5rem)] font-extrabold text-navy leading-none">
                {stat.value}
              </p>
              <p className="mt-2 text-xs font-medium text-muted tracking-wide">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
