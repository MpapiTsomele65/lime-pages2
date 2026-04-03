"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Rocket, Briefcase, Sprout, Handshake } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, amount: 0.2 } as const,
  transition: { duration: 0.6, ease: "easeOut" as const } as const,
};

const pillars = [
  {
    icon: Rocket,
    title: "For Entrepreneurs & SMMEs",
    desc: "Translating your vision into a language investors understand. Helping you navigate the funding process and build a sustainable business.",
    bg: "bg-teal-light",
    hoverBorder: "hover:border-teal",
  },
  {
    icon: Briefcase,
    title: "For Young Professionals",
    desc: "A trusted, clear-headed alternative to aggressive, sales-driven financial advice. Education and empowerment first.",
    bg: "bg-navy/[0.07]",
    hoverBorder: "hover:border-navy",
  },
  {
    icon: Sprout,
    title: "Community First",
    desc: "Capital is powerful when used to empower and grow our communities. We partner with trusted, regulated Black-owned investment managers.",
    bg: "bg-teal-light",
    hoverBorder: "hover:border-teal",
  },
];

export function BrandPurpose() {
  return (
    <section className="py-[100px] px-[clamp(1.25rem,4vw,3.5rem)] bg-white relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="absolute -top-[120px] -right-[120px] w-[480px] h-[480px] rounded-full bg-[radial-gradient(circle,#E6FAF9,transparent_70%)] pointer-events-none" />
      <div className="absolute -bottom-[100px] -left-[100px] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(11,25,51,0.06),transparent_70%)] pointer-events-none" />

      <Container>
        {/* Hero image */}
        <motion.div {...fadeUp} className="relative h-[340px] rounded-[20px] overflow-hidden mb-16">
          <Image src="/images/clodagh-da-paixao-xvJVDUoGpoU-unsplash.jpg" alt="Johannesburg skyline" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-[1]">
          {/* Left */}
          <motion.div {...fadeUp}>
            <p className="text-xs font-bold tracking-[1.5px] uppercase text-navy mb-3.5">
              Our Brand Purpose
            </p>
            <h2 className="text-[clamp(2.2rem,5vw,4rem)] font-extrabold text-ink leading-[1.05] tracking-tight mb-7">
              Hello,
              <br />
              <span className="text-navy">Africa.</span>
            </h2>
            <p className="text-muted text-base leading-[1.85] mb-9">
              We are providing access to Advisory & Fintech solutions to fuel
              Africa&apos;s entrepreneurial revolution — equipping motivated builders,
              from grassroots SMMEs to groundbreaking startups, with the tools to
              build thriving businesses, create jobs, reduce inequality, and propel
              the continent to global prominence.
            </p>
            <div className="flex items-start gap-3.5 bg-teal-light border border-teal/30 rounded-[14px] px-5 py-[18px]">
              <Handshake className="w-[22px] h-[22px] text-teal flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-[15px] block mb-1">
                  Our Brand Promise
                </strong>
                <p className="text-muted text-sm leading-relaxed m-0">
                  If you find the consultation not helpful, you can request a full
                  refund and we will settle within 24 hours.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right — Pillars */}
          <div className="flex flex-col gap-4">
            {pillars.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className={`flex gap-[18px] p-[22px] bg-white rounded-2xl border border-border shadow-sm hover:translate-x-1 transition-all ${p.hoverBorder}`}
              >
                <div className={`w-11 h-11 rounded-xl ${p.bg} flex items-center justify-center flex-shrink-0`}>
                  <p.icon className="w-[22px] h-[22px]" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-ink mb-1.5 leading-tight">
                    {p.title}
                  </h4>
                  <p className="text-muted text-sm leading-[1.7] m-0">
                    {p.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
