"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Users, Globe, Briefcase, Rocket, Calendar, ArrowRight } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const features = [
  {
    icon: Users,
    title: "Community Profiles",
    desc: "Showcase your business, skills, and services. Get discovered by the community.",
  },
  {
    icon: Globe,
    title: "Business Directory",
    desc: "A curated directory of Black-owned businesses. Support each other, grow together.",
  },
  {
    icon: Briefcase,
    title: "Deal Flow & Opportunities",
    desc: "Angel investment opportunities, partnerships, and collaboration \u2014 all in one place.",
  },
];

const roadmap = [
  {
    num: "01",
    title: "Community profiles & directory",
    desc: "Find and connect with entrepreneurs, investors, and professionals in the Lime Pages ecosystem.",
    icon: Users,
  },
  {
    num: "02",
    title: "Deal flow for investors",
    desc: "Angel syndicate deal sharing, startup profiles, and investment opportunities.",
    icon: Rocket,
  },
  {
    num: "03",
    title: "SMME marketplace",
    desc: "A space for small businesses to list services, find suppliers, and win contracts.",
    icon: Globe,
  },
  {
    num: "04",
    title: "Events & meetups",
    desc: "Virtual and in-person gatherings to build the networks that build wealth.",
    icon: Calendar,
  },
];

export default function ConnectPage() {
  return (
    <div className="pt-[70px]">
      {/* ═══ HERO ═══ */}
      <section className="bg-navy py-28 relative overflow-hidden">
        <Image
          src="/images/ninthgrid-5tteWzfhMaA-unsplash.jpg"
          alt="Two women chatting — connection"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-navy/75 z-[1]" />
        <div className="absolute top-[10%] right-[15%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(70,205,207,0.15),transparent_70%)] blur-[70px] pointer-events-none z-[2]" />

        <Container className="relative z-[3] text-center">
          <motion.div {...fadeUp}>
            <div className="inline-flex items-center gap-2 bg-teal/12 border border-teal/35 rounded-full px-[18px] py-[7px] mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-teal" />
              <span className="text-[11px] font-semibold text-teal tracking-[1.2px] uppercase">
                Coming Soon
              </span>
            </div>
            <h1 className="text-[clamp(2.4rem,6vw,4.5rem)] font-extrabold text-white leading-[1.07] tracking-tight mb-6">
              Lime{" "}
              <span className="bg-gradient-to-br from-teal to-lime bg-clip-text text-transparent">
                Connect
              </span>
            </h1>
            <p className="text-lg text-white/55 leading-[1.8] max-w-[600px] mx-auto mb-10">
              A professional network where Africa&apos;s builders find each
              other. Entrepreneurs, investors, creators, and professionals
              &mdash; connected by a shared mission to build real wealth.
            </p>
            <Link
              href="/lehumo#join"
              className="inline-flex items-center gap-2 bg-lime text-navy px-9 py-4 rounded-full font-extrabold text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(184,255,0,0.3)] transition-all"
            >
              Join Lehumo for Early Access <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </Container>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="py-24 bg-white">
        <Container>
          <motion.div {...fadeUp} className="text-center mb-14">
            <p className="text-[18px] font-bold tracking-[1.5px] uppercase text-teal mb-4">
              What We&apos;re Building
            </p>
            <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold text-ink leading-[1.1] tracking-tight max-w-[560px] mx-auto">
              More than a directory. A living network.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: 0.1 * i,
                  ease: "easeOut" as const,
                }}
                className="bg-white rounded-[20px] border border-border shadow-sm p-9 hover:-translate-y-1 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-[14px] bg-teal-light flex items-center justify-center mb-5">
                  <f.icon className="w-6 h-6 text-teal" />
                </div>
                <h3 className="text-lg font-bold text-ink mb-3">{f.title}</h3>
                <p className="text-sm text-muted leading-[1.75]">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* ═══ WHAT'S COMING — Roadmap ═══ */}
      <section className="py-24 bg-snow">
        <Container>
          <motion.div {...fadeUp} className="text-center mb-16">
            <p className="text-[18px] font-bold tracking-[1.5px] uppercase text-teal mb-4">
              Roadmap
            </p>
            <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold text-ink leading-[1.1] tracking-tight">
              What&apos;s Coming
            </h2>
          </motion.div>

          <div className="max-w-[720px] mx-auto space-y-0">
            {roadmap.map((item, i) => (
              <motion.div
                key={item.num}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.5,
                  delay: 0.1 * i,
                  ease: "easeOut" as const,
                }}
                className="relative pl-10 pb-12 last:pb-0 border-l-2 border-teal/25 last:border-transparent"
              >
                {/* Dot on the line */}
                <div className="absolute left-[-7px] top-0 w-3 h-3 rounded-full bg-teal" />

                <div className="flex items-start gap-4">
                  <div>
                    <span className="text-[13px] font-extrabold tracking-[2px] text-teal uppercase">
                      {item.num}
                    </span>
                    <h3 className="text-[17px] font-extrabold text-ink mt-1.5 mb-2 leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-[14.5px] text-muted leading-[1.75]">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="py-24 bg-navy relative overflow-hidden">
        <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(70,205,207,0.1),transparent_70%)] blur-[60px] pointer-events-none" />

        <Container className="relative z-[1] text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-extrabold text-white leading-[1.1] tracking-tight mb-5">
              Be the first to know.
            </h2>
            <p className="text-base text-white/55 leading-[1.8] max-w-[480px] mx-auto mb-10">
              Join Lehumo to get early access when Lime Connect launches.
            </p>
            <Link
              href="/lehumo#join"
              className="inline-flex items-center gap-2 bg-lime text-navy px-9 py-4 rounded-full font-extrabold text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(184,255,0,0.3)] transition-all"
            >
              Join Lehumo for Early Access <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </Container>
      </section>

      {/* ═══ IMAGE STRIP ═══ */}
      <section className="relative h-[300px] overflow-hidden">
        <Image
          src="/images/ninthgrid-IUuEsUAtnJk-unsplash.jpg"
          alt="Professionals connecting"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-navy/60 z-[1]" />
        <div className="relative z-[2] h-full flex items-center justify-center">
          <p className="text-white/80 text-lg font-semibold tracking-wide text-center px-6">
            The network you needed but never had access to.
          </p>
        </div>
      </section>
    </div>
  );
}
