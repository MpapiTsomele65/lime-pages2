"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { AdvisoryChatbot } from "@/components/advisory/AdvisoryChatbot";
import {
  ShieldCheck,
  Scale,
  Landmark,
  FileCheck,
  TrendingUp,
  Rocket,
  Banknote,
  BarChart3,
  ArrowRight,
  Check,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, amount: 0.15 } as const,
  transition: { duration: 0.6, ease: "easeOut" as const } as const,
};

const steps = [
  {
    num: "Step 01",
    title: "Start a conversation",
    body: "Book a free 15-minute intro call. Tell me what\u2019s going on \u2014 your business, your product, your goals. No prep required.",
  },
  {
    num: "Step 02",
    title: "We scope it together",
    body: "Based on what you share, I\u2019ll suggest which session actually fits \u2014 or tell you honestly if I\u2019m not the right person for what you need.",
  },
  {
    num: "Step 03",
    title: "You decide what\u2019s next",
    body: "No upsell. No follow-up pressure. If a paid session makes sense, great. If not, you still leave the intro call with something useful.",
  },
];

const professionalOutcomes = [
  {
    icon: Scale,
    title: "Know Your Credit Rights",
    desc: "Understand the National Credit Act \u2014 what lenders can and can\u2019t do, and what to do when you\u2019re refused credit.",
  },
  {
    icon: FileCheck,
    title: "Navigate Debt Relief",
    desc: "Practical guidance on debt review, debt counselling, and how to get back on track without losing everything.",
  },
  {
    icon: Landmark,
    title: "Consumer Protection",
    desc: "Your rights under the Consumer Protection Act \u2014 from unfair contracts to defective goods and services.",
  },
  {
    icon: TrendingUp,
    title: "Build Wealth With Confidence",
    desc: "Investing basics, retirement planning, and the Two-Pot system explained in plain language.",
  },
];


export function AdvisoryPreview() {
  return (
    <section className="py-16 sm:py-[100px] px-[clamp(1.25rem,4vw,3.5rem)] bg-snow">
      <Container>
        {/* Header */}
        <motion.div {...fadeUp} className="max-w-[680px] mb-16">
          <span className="text-[11px] font-bold tracking-[1.4px] uppercase text-navy mb-3.5 block">
            Lime Advisory
          </span>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-ink leading-[1.1] tracking-tight mb-5">
            Build it properly.
            <br />
            Then build it bigger.
          </h2>
          <p className="text-muted text-[17px] leading-[1.8]">
            Whether you&apos;re an individual navigating your financial rights or
            a business owner building something real &mdash; we give you the
            knowledge, tools, and access to move forward with confidence.
          </p>
        </motion.div>

        {/* Image strip */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.05 }}
          className="relative h-[200px] sm:h-[280px] rounded-[20px] overflow-hidden mb-14"
        >
          <Image
            src="/images/rachel-martin-yHOhVzVRFMc-unsplash.jpg"
            alt="South African city street"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy/60 to-transparent" />
          <div className="absolute bottom-6 left-5 sm:left-8 z-[1]">
            <p className="text-white text-lg font-bold">
              Real conversations. Real outcomes.
            </p>
            <p className="text-white/60 text-sm">
              No jargon. No judgment. No surprises.
            </p>
          </div>
        </motion.div>

        {/* Steps */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 bg-white rounded-[20px] border border-border overflow-hidden mb-16"
        >
          {steps.map((s, i) => (
            <div
              key={s.num}
              className={`p-7 ${
                i < steps.length - 1
                  ? "md:border-r border-b md:border-b-0 border-border"
                  : ""
              }`}
            >
              <div className="text-[11px] font-extrabold tracking-[2px] uppercase text-navy mb-4">
                {s.num}
              </div>
              <div className="text-[17px] font-bold text-ink mb-2 leading-tight">
                {s.title}
              </div>
              <p className="text-sm text-muted leading-[1.7]">{s.body}</p>
            </div>
          ))}
        </motion.div>

        {/* ═══ TWO-TRACK LAYOUT ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
          {/* For Professionals / Individuals */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
            className="bg-white rounded-[20px] border border-border shadow-sm overflow-hidden"
          >
            {/* Track header */}
            <div className="bg-teal-light px-7 py-5 border-b border-teal/15">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-[12px] bg-teal/15 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-teal" />
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-[1.2px] uppercase text-teal block">
                    For Professionals &amp; Individuals
                  </span>
                  <h3 className="text-lg font-extrabold text-ink leading-tight">
                    NCR &amp; Consumer Protection
                  </h3>
                </div>
              </div>
              <p className="text-sm text-muted leading-[1.7] mt-2">
                Understand your rights under the National Credit Act, Consumer
                Protection Act, and FAIS &mdash; and get practical guidance on
                what to actually do when things go wrong.
              </p>
            </div>

            {/* Outcomes */}
            <div className="p-7 flex flex-col gap-5">
              {professionalOutcomes.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.4,
                    delay: 0.08 * i,
                    ease: "easeOut" as const,
                  }}
                  className="flex gap-4"
                >
                  <div className="w-9 h-9 rounded-[10px] bg-teal-light flex items-center justify-center shrink-0 mt-0.5">
                    <item.icon className="w-[18px] h-[18px] text-teal" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-ink mb-1">
                      {item.title}
                    </h4>
                    <p className="text-sm text-muted leading-[1.65]">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-7 py-5 border-t border-border bg-snow/50 flex items-center gap-2">
              <Check
                className="w-3.5 h-3.5 text-teal shrink-0"
                strokeWidth={3}
              />
              <span className="text-xs text-muted font-medium">
                Free guidance via our AI advisor &middot; Paid sessions available
                for deeper support
              </span>
            </div>
          </motion.div>

          {/* Lemonade Station Teaser */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{
              duration: 0.6,
              delay: 0.1,
              ease: "easeOut" as const,
            }}
            className="bg-navy rounded-[20px] border border-navy/20 shadow-sm overflow-hidden relative"
          >
            <div className="absolute top-[-15%] right-[-10%] w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(255,230,0,0.12),transparent_70%)] blur-[60px] pointer-events-none" />

            {/* Track header */}
            <div className="px-7 py-5 border-b border-white/[0.08] relative z-[1]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-[12px] bg-[#FFE600]/15 flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-[#FFE600]" />
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-[1.2px] uppercase text-[#FFE600] block">
                    For SMMEs &amp; Founders
                  </span>
                  <h3 className="text-lg font-extrabold text-white leading-tight">
                    Lemonade Station
                  </h3>
                </div>
              </div>
              <p className="text-sm text-white/55 leading-[1.7] mt-2">
                Fundraising playbooks, pitch deck templates, deal structuring
                guides, and SA venture data &mdash; everything you need to raise
                capital and build a fundable business.
              </p>
            </div>

            {/* Quick highlights */}
            <div className="p-7 flex flex-col gap-4 relative z-[1]">
              {[
                { icon: Banknote, text: "Fundraising playbook &mdash; from grants to venture capital" },
                { icon: Rocket, text: "Investor-ready pitch decks &amp; term sheet templates" },
                { icon: BarChart3, text: "2024 SA venture data &amp; sector intelligence" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.4,
                    delay: 0.08 * i,
                    ease: "easeOut" as const,
                  }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#FFE600]/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-[#FFE600]" />
                  </div>
                  <p
                    className="text-sm text-white/70 leading-snug"
                    dangerouslySetInnerHTML={{ __html: item.text }}
                  />
                </motion.div>
              ))}
            </div>

            {/* CTA Footer */}
            <div className="px-7 py-5 border-t border-white/[0.08] relative z-[1]">
              <Link
                href="/lemonade-station"
                className="inline-flex items-center gap-2 bg-[#FFE600] text-navy px-7 py-3 rounded-full font-bold text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(255,230,0,0.25)] transition-all"
              >
                Explore Lemonade Station <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* ═══ CHATBOT ═══ */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
          className="mb-16"
        >
          <div className="text-center mb-8">
            <span className="text-[11px] font-bold tracking-[1.4px] uppercase text-teal mb-3 block">
              Try It Now
            </span>
            <h3 className="text-[clamp(1.4rem,3vw,2rem)] font-extrabold text-ink leading-tight mb-3">
              Free AI-powered guidance
            </h3>
            <p className="text-sm text-muted leading-[1.7] max-w-[520px] mx-auto">
              Get instant answers on consumer rights, debt relief, investing
              basics, SMME funding, and more. No sign-up needed.
            </p>
          </div>
          <AdvisoryChatbot />
        </motion.div>

        {/* Refund guarantee banner */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.15 }}
          className="bg-navy/[0.04] border border-navy/[0.1] rounded-[20px] p-7 flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-8"
        >
          <div className="w-12 h-12 rounded-full bg-teal-light flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-[#0a7a7b]" />
          </div>
          <div>
            <h4 className="text-[15px] font-extrabold text-ink mb-1">
              24-hour money-back guarantee
            </h4>
            <p className="text-sm text-muted leading-relaxed">
              If you don&apos;t find the session useful, request a refund within
              24 hours and get your money back. No questions asked. No forms. No
              friction.
            </p>
          </div>
        </motion.div>

        {/* Free intro CTA */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.2 }}
          className="bg-white border border-border rounded-[20px] p-6 sm:p-9 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 sm:gap-8"
        >
          <div>
            <h3 className="text-[22px] font-extrabold text-ink mb-1.5 leading-tight">
              Need more than the chatbot? Let&apos;s talk.
            </h3>
            <p className="text-sm text-muted leading-relaxed max-w-[480px]">
              Book a 15-minute intro call. No commitment, no agenda. Just a real
              conversation to figure out if and how I can actually help you. If I
              can&apos;t, I&apos;ll tell you that too.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:hello@limepages.co.za?subject=Intro Call Request"
              className="bg-teal text-white px-8 py-3.5 rounded-full font-bold text-sm whitespace-nowrap hover:opacity-90 hover:-translate-y-0.5 transition-all"
            >
              Book a free intro call &rarr;
            </a>
            <Link
              href="/advisory"
              className="border-[1.5px] border-navy text-navy px-7 py-3.5 rounded-full font-bold text-sm whitespace-nowrap hover:bg-navy hover:text-lime transition-colors inline-flex items-center gap-2"
            >
              View all services
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>

        <p className="text-center mt-5 text-xs text-subtle leading-relaxed">
          #ThisIsNotFinancialAdvice &middot; All sessions are fully online
          &middot; 24-hour money-back guarantee, no questions asked
        </p>
      </Container>
    </section>
  );
}
