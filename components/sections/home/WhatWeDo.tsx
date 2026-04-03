"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TrendingUp, Users, Shield, ArrowRight } from "lucide-react";

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
    icon: TrendingUp,
    iconBg: "bg-teal-light",
    iconColor: "text-teal",
    barColor: "bg-teal",
    tag: "Entrepreneurs",
    title: "Business Funding Advisory",
    description:
      "We help entrepreneurs find the right growth capital, prepare investor-ready materials, and navigate funding options from grants to equity.",
    hoverBorder: "hover:border-teal/40",
  },
  {
    icon: Users,
    iconBg: "bg-navy/[0.07]",
    iconColor: "text-navy",
    barColor: "bg-navy",
    tag: "All Stages",
    title: "Mentoring & Coaching",
    description:
      "Hands-on guidance for entrepreneurs and young professionals at every stage, from idea validation to scaling and personal financial growth.",
    hoverBorder: "hover:border-navy/30",
  },
  {
    icon: Shield,
    iconBg: "bg-teal-light",
    iconColor: "text-teal",
    barColor: "bg-teal",
    tag: "Young Professionals",
    title: "Long-term Financial Planning",
    description:
      "Alternative strategies that go beyond traditional retirement funds. We help you build a portfolio designed for your actual goals and timeline.",
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
