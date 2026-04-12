"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Building2, Wallet, Sparkles, ArrowRight } from "lucide-react";

const stagger = {
  whileInView: { transition: { staggerChildren: 0.1 } },
  viewport: { once: true, amount: 0.15 },
};

const staggerChild = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const services = [
  {
    icon: Building2,
    iconBg: "bg-teal-light",
    iconColor: "text-teal",
    barColor: "bg-teal",
    tag: "SMMEs & Founders",
    title: "Grow your business.",
    description:
      "From operational systems to fundraising strategy — we help you stop being the bottleneck and start building something that scales.",
    hoverBorder: "hover:border-teal/40",
  },
  {
    icon: Wallet,
    iconBg: "bg-navy/[0.07]",
    iconColor: "text-navy",
    barColor: "bg-navy",
    tag: "Young Professionals & Savers",
    title: "Make your money work.",
    description:
      "Budgeting, investing, retirement planning, and financial rights — everything you need to turn a salary into real, compounding wealth.",
    hoverBorder: "hover:border-navy/30",
  },
  {
    icon: Sparkles,
    iconBg: "bg-teal-light",
    iconColor: "text-teal",
    barColor: "bg-teal",
    tag: "Creators & Side Hustlers",
    title: "Turn income into assets.",
    description:
      "Manage irregular income, plan for lumpsum payouts, and build long-term wealth from short-term wins. Your hustle deserves a financial strategy.",
    hoverBorder: "hover:border-teal/40",
  },
];

export default function WhatWeDo() {
  return (
    <section className="py-24 bg-white">
      <Container>
        {/* Header row */}
        <motion.div
          {...fadeUp}
          className="flex flex-wrap items-end justify-between gap-6 mb-14"
        >
          <SectionHeader label="What We Do" labelColor="text-teal">
            Real solutions for real builders
          </SectionHeader>
          <Link
            href="/advisory"
            className="inline-flex items-center gap-2 rounded-full border border-navy/20 px-6 py-3 text-sm font-bold text-navy transition-colors hover:bg-navy hover:text-white"
          >
            All Services
            <ArrowRight size={16} />
          </Link>
        </motion.div>

        {/* Cards grid */}
        <motion.div
          {...stagger}
          className="grid gap-6"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
          }}
        >
          {services.map((service) => (
            <motion.div
              key={service.title}
              {...staggerChild}
              className={`relative bg-white rounded-[20px] border border-border shadow-sm p-8 pt-11 transition-all duration-300 hover:-translate-y-[5px] hover:shadow-md ${service.hoverBorder}`}
            >
              {/* Top bar */}
              <div
                className={`absolute top-0 left-8 right-8 h-[3px] rounded-b-full ${service.barColor}`}
              />

              {/* Icon */}
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${service.iconBg} mb-5`}
              >
                <service.icon size={22} className={service.iconColor} />
              </div>

              {/* Tag */}
              <p className="text-[11px] font-semibold tracking-[1.2px] uppercase text-muted mb-3">
                {service.tag}
              </p>

              {/* Title */}
              <h3 className="text-lg font-bold text-navy mb-3">
                {service.title}
              </h3>

              {/* Description */}
              <p className="text-sm leading-relaxed text-muted">
                {service.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
