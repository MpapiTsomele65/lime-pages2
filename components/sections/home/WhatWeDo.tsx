"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  Users,
  Shield,
  TrendingUp,
  Network,
  Rocket,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

type Offering = {
  icon: typeof Users;
  iconBg: string;
  iconColor: string;
  accentBar: string;
  accentGlow: string;
  tag: string;
  title: string;
  description: string;
  highlight: string;
  href: string;
  ctaLabel: string;
};

const offerings: Offering[] = [
  {
    icon: Users,
    iconBg: "bg-lime/15",
    iconColor: "text-lime-dark",
    accentBar: "bg-lime",
    accentGlow: "group-hover:shadow-[0_0_0_6px_rgba(184,255,0,0.12)]",
    tag: "Lehumo Trust",
    title: "Build wealth together.",
    description:
      "30 founding members pooling R1,000/month to build a R2M collective investment in 5 years. Community-owned, community-led.",
    highlight: "Founding cohort open",
    href: "/lehumo",
    ctaLabel: "Join Lehumo",
  },
  {
    icon: Shield,
    iconBg: "bg-teal-light",
    iconColor: "text-teal",
    accentBar: "bg-teal",
    accentGlow: "group-hover:shadow-[0_0_0_6px_rgba(70,205,207,0.12)]",
    tag: "Lime Advisory",
    title: "Your financial coach.",
    description:
      "AI-powered coaching on your loans, insurance, investment fees, and consumer rights — honest advice, no jargon, no gatekeeping.",
    highlight: "Free for all users",
    href: "/advisory",
    ctaLabel: "Ask Advisory",
  },
  {
    icon: TrendingUp,
    iconBg: "bg-navy/[0.07]",
    iconColor: "text-navy",
    accentBar: "bg-navy",
    accentGlow: "group-hover:shadow-[0_0_0_6px_rgba(11,25,51,0.08)]",
    tag: "Lime Capital",
    title: "Let compounding take over.",
    description:
      "Understand investing, explore funds, and see what your money could have grown into. No jargon, no gatekeeping — just clarity.",
    highlight: "Early access",
    href: "/capital",
    ctaLabel: "Explore Capital",
  },
  {
    icon: Network,
    iconBg: "bg-teal-light",
    iconColor: "text-teal",
    accentBar: "bg-teal",
    accentGlow: "group-hover:shadow-[0_0_0_6px_rgba(70,205,207,0.12)]",
    tag: "Lime Connect",
    title: "Find your network.",
    description:
      "A community directory of Black-owned businesses, legal services, and professionals. The network you always deserved.",
    highlight: "Coming soon",
    href: "/connect",
    ctaLabel: "Browse Directory",
  },
  {
    icon: Rocket,
    iconBg: "bg-[#FFE600]/15",
    iconColor: "text-[#A08800]",
    accentBar: "bg-[#FFE600]",
    accentGlow: "group-hover:shadow-[0_0_0_6px_rgba(255,230,0,0.15)]",
    tag: "Lemonade Station",
    title: "Raise capital. Scale smart.",
    description:
      "The founder's playbook. Term sheets, fundraising guides, and VC insights — download and use, for free.",
    highlight: "Free resources for founders",
    href: "/lemonade-station",
    ctaLabel: "Open Station",
  },
];

export default function WhatWeDo() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      const atStart = el.scrollLeft <= 4;
      const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 4;
      setCanScrollLeft(!atStart);
      setCanScrollRight(!atEnd);

      const cards = Array.from(el.children) as HTMLElement[];
      if (cards.length === 0) return;

      if (atStart) {
        setActiveIndex(0);
        return;
      }
      if (atEnd) {
        setActiveIndex(cards.length - 1);
        return;
      }

      const center = el.scrollLeft + el.clientWidth / 2;
      let closest = 0;
      let closestDist = Infinity;
      cards.forEach((card, i) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const dist = Math.abs(cardCenter - center);
        if (dist < closestDist) {
          closestDist = dist;
          closest = i;
        }
      });
      setActiveIndex(closest);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scrollToIndex = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.children[index] as HTMLElement | undefined;
    if (!card) return;
    el.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
  };

  const scrollBy = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const nextIndex =
      dir === "left"
        ? Math.max(0, activeIndex - 1)
        : Math.min(offerings.length - 1, activeIndex + 1);
    scrollToIndex(nextIndex);
  };

  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-br from-white via-white to-[#E6FAF9]">
      {/* Soft teal glow — top right */}
      <div
        className="absolute -top-32 -right-40 w-[640px] h-[640px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(70,205,207,0.18) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      {/* Soft teal glow — bottom left */}
      <div
        className="absolute -bottom-40 -left-32 w-[560px] h-[560px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(70,205,207,0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <Container className="relative z-10">
        {/* Header */}
        <motion.div
          {...fadeUp}
          className="flex flex-wrap items-end justify-between gap-6 mb-12"
        >
          <SectionHeader label="What We Do" labelColor="text-teal">
            Five solutions, one mission.
          </SectionHeader>

          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollBy("left")}
              disabled={!canScrollLeft}
              aria-label="Previous solution"
              className="w-11 h-11 rounded-full border border-navy/20 flex items-center justify-center text-navy transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:enabled:bg-navy hover:enabled:text-white hover:enabled:border-navy"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scrollBy("right")}
              disabled={!canScrollRight}
              aria-label="Next solution"
              className="w-11 h-11 rounded-full border border-navy/20 flex items-center justify-center text-navy transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:enabled:bg-navy hover:enabled:text-white hover:enabled:border-navy"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </motion.div>
      </Container>

      {/* Horizontal flick carousel — bleeds to screen edge with peek */}
      <motion.div
        {...fadeUp}
        ref={scrollRef}
        className="relative z-10 flex gap-6 overflow-x-auto snap-x snap-mandatory pb-2 px-[max(1.5rem,calc((100vw-1280px)/2+1.5rem))] [&::-webkit-scrollbar]:hidden"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {offerings.map((service, i) => {
          const Icon = service.icon;
          const num = String(i + 1).padStart(2, "0");
          const isActive = activeIndex === i;
          return (
            <div
              key={service.title}
              className="flex-shrink-0 snap-start w-[88%] sm:w-[80%] md:w-[68%] lg:w-[58%] xl:w-[52%]"
            >
              <Link
                href={service.href}
                className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8 h-full p-6 sm:p-8 md:p-10 rounded-[24px] border border-border bg-white transition-all duration-500 hover:border-navy/20 hover:shadow-[0_20px_60px_-15px_rgba(11,25,51,0.12)]"
              >
                {/* Always-visible accent bar — brightens on hover/active */}
                <span
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-500 ${service.accentBar} ${
                    isActive
                      ? "h-[70%] opacity-100"
                      : "h-[40%] opacity-50 group-hover:h-[70%] group-hover:opacity-100"
                  }`}
                />

                {/* Number */}
                <span className="hidden sm:block absolute top-6 right-8 text-[11px] font-semibold tracking-[2px] text-muted/40">
                  {num} / 05
                </span>

                {/* Icon */}
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${service.iconBg} ${service.accentGlow} flex-shrink-0 transition-all duration-500`}
                >
                  <Icon
                    size={26}
                    className={`${service.iconColor} transition-transform duration-500 group-hover:scale-110`}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <p className="text-[11px] font-semibold tracking-[1.2px] uppercase text-muted">
                      {service.tag}
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted/80 before:content-[''] before:w-1 before:h-1 before:rounded-full before:bg-muted/40">
                      {service.highlight}
                    </span>
                  </div>
                  <h3 className="text-[clamp(1.5rem,2.4vw,2rem)] font-bold text-navy leading-tight mb-3">
                    {service.title}
                  </h3>
                  <p className="text-sm sm:text-[15px] text-muted leading-relaxed max-w-[56ch] mb-5">
                    {service.description}
                  </p>

                  {/* CTA pill */}
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-navy/70 group-hover:text-navy transition-colors">
                    <span>{service.ctaLabel}</span>
                    <ArrowUpRight
                      size={14}
                      className="transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </div>
                </div>

                {/* CTA arrow circle (desktop) */}
                <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-full border border-navy/10 text-navy/60 transition-all duration-500 flex-shrink-0 group-hover:bg-navy group-hover:text-white group-hover:border-navy group-hover:translate-x-1">
                  <ArrowUpRight
                    size={18}
                    className="transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </div>
              </Link>
            </div>
          );
        })}
      </motion.div>

      {/* Dots indicator */}
      <Container className="relative z-10">
        <div className="flex items-center justify-center gap-2 mt-8">
          {offerings.map((offering, i) => (
            <button
              key={offering.title}
              type="button"
              onClick={() => scrollToIndex(i)}
              aria-label={`Go to ${offering.tag}`}
              className={`h-1.5 rounded-full transition-all ${
                i === activeIndex
                  ? "w-8 bg-navy"
                  : "w-1.5 bg-navy/20 hover:bg-navy/40"
              }`}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
