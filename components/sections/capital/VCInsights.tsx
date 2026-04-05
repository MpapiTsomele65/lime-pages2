"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import {
  Cpu,
  HeartPulse,
  Rocket,
  Globe,
  Users,
  DoorOpen,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const stagger = {
  whileInView: { transition: { staggerChildren: 0.06 } },
  viewport: { once: true, amount: 0.1 },
};

const staggerChild = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" as const },
};

const insights = [
  {
    icon: Cpu,
    stat: "65.9%",
    title: "Tech Dominates",
    short: "Software, FinTech & Online Markets lead SA deal flow.",
    dark: true,
  },
  {
    icon: HeartPulse,
    stat: "20%",
    title: "Health Rising",
    short: "HealthTech at its highest share since 2015.",
    dark: false,
  },
  {
    icon: Rocket,
    stat: "42.5%",
    title: "Series A Surge",
    short: "VCs backing validated models over early bets.",
    dark: true,
  },
  {
    icon: Globe,
    stat: "14.6%",
    title: "Going Global",
    short: "Record share of funded startups expanding beyond SA.",
    dark: false,
  },
  {
    icon: Users,
    stat: "80.8%",
    title: "Diverse Founders",
    short: "Funded companies with at least one black founder.",
    dark: true,
  },
  {
    icon: DoorOpen,
    stat: "3 exits",
    title: "Exit Challenge",
    short: "Lowest exit activity on record — plan early.",
    dark: false,
  },
];

export default function VCInsights() {
  return (
    <section className="py-16 bg-white">
      <Container>
        <motion.div
          {...fadeUp}
          className="flex flex-wrap items-end justify-between gap-4 mb-8"
        >
          <div>
            <div className="inline-block bg-capital rounded-full px-3.5 py-1 mb-3">
              <span className="text-[10px] font-bold tracking-[1.2px] uppercase text-navy">
                2024 Trends
              </span>
            </div>
            <h2 className="text-[clamp(1.4rem,3vw,2rem)] font-extrabold leading-[1.15] tracking-tight text-navy">
              Where the money is going
            </h2>
          </div>
          <p className="text-xs text-muted max-w-[320px]">
            Key trends from the latest SAVCA data for founders raising in SA.
          </p>
        </motion.div>

        <motion.div
          {...stagger}
          className="grid grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {insights.map((item) => (
            <motion.div
              key={item.title}
              {...staggerChild}
              className={`relative rounded-[16px] border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                item.dark
                  ? "bg-navy border-navy hover:border-capital/50"
                  : "bg-white border-border hover:border-capital/40"
              }`}
            >
              {/* Top accent */}
              <div
                className={`absolute top-0 left-5 right-5 h-[2px] rounded-b-full ${
                  item.dark ? "bg-capital" : "bg-capital/50"
                }`}
              />

              <div className="flex items-center justify-between gap-2 mb-2">
                <item.icon
                  size={16}
                  className={item.dark ? "text-capital" : "text-navy"}
                />
                <span
                  className={`text-lg font-extrabold leading-none ${
                    item.dark ? "text-capital" : "text-navy"
                  }`}
                >
                  {item.stat}
                </span>
              </div>

              <h3
                className={`text-sm font-bold mb-1 ${
                  item.dark ? "text-white" : "text-navy"
                }`}
              >
                {item.title}
              </h3>

              <p
                className={`text-[11px] leading-snug ${
                  item.dark ? "text-white/50" : "text-muted"
                }`}
              >
                {item.short}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
