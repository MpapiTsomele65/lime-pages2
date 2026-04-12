"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import {
  ShieldCheck,
  Scale,
  Rocket,
  FileText,
  MessageCircle,
  Users,
  ArrowDown,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, amount: 0.15 } as const,
  transition: { duration: 0.6, ease: "easeOut" as const } as const,
};

const tracks = [
  {
    icon: Scale,
    color: "text-teal",
    bg: "bg-teal-light",
    label: "For Individuals",
    items: ["Consumer rights", "Financial literacy", "Debt guidance"],
  },
  {
    icon: Rocket,
    color: "text-navy",
    bg: "bg-navy/[0.06]",
    label: "For SMMEs",
    items: ["Funding access", "Growth strategy", "Digitisation"],
  },
  {
    icon: FileText,
    color: "text-teal",
    bg: "bg-teal-light",
    label: "For Founders",
    items: ["Pitch decks", "Fundraising", "Investor readiness"],
  },
];

const steps = [
  {
    num: "01",
    title: "Start a conversation",
    body: "Book a free 15-minute intro call. No prep required \u2014 just tell us what\u2019s going on.",
    icon: MessageCircle,
  },
  {
    num: "02",
    title: "We scope it together",
    body: "We\u2019ll suggest the right session for your situation \u2014 or tell you honestly if we\u2019re not the right fit.",
    icon: Users,
  },
  {
    num: "03",
    title: "You decide what\u2019s next",
    body: "No upsell. No pressure. If a paid session makes sense, great. If not, you still leave with something useful.",
    icon: Rocket,
  },
];

export function AdvisoryHero() {
  return (
    <section className="py-[100px] bg-white">
      <Container>
        {/* Label + Heading */}
        <motion.div {...fadeUp} className="max-w-[740px] mx-auto text-center mb-14">
          <span className="text-[18px] font-bold tracking-[3px] uppercase text-teal mb-5 block">
            Lime Advisory
          </span>
          <h1 className="text-[clamp(2.2rem,5vw,3.5rem)] font-extrabold text-ink leading-[1.08] tracking-tight mb-6">
            Real conversations.
            <br />
            Real outcomes.
          </h1>
          <p className="text-muted text-[17px] leading-[1.8] max-w-[600px] mx-auto">
            Practical, plain-language advisory for people who want straight answers
            &mdash; not jargon. Whether you&apos;re protecting your rights,
            building a business, or raising capital, we meet you where you are.
          </p>
        </motion.div>

        {/* Three tracks */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.08 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16"
        >
          {tracks.map((track) => (
            <div
              key={track.label}
              className="bg-snow rounded-[16px] border border-border p-6"
            >
              <div className={`w-10 h-10 rounded-[12px] ${track.bg} flex items-center justify-center mb-4`}>
                <track.icon className={`w-5 h-5 ${track.color}`} />
              </div>
              <h3 className="text-[15px] font-extrabold text-ink mb-3">
                {track.label}
              </h3>
              <ul className="flex flex-col gap-1.5">
                {track.items.map((item) => (
                  <li
                    key={item}
                    className="text-sm text-muted leading-[1.6] flex items-center gap-2"
                  >
                    <span className="w-1 h-1 rounded-full bg-teal shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>

        {/* Steps: horizontal card layout */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.14 }}
          className="mb-16"
        >
          <p className="text-[11px] font-bold tracking-[1.4px] uppercase text-navy text-center mb-8">
            How it works
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: 0.1 * i,
                  ease: "easeOut" as const,
                }}
                className="bg-white rounded-[16px] border border-border p-7 relative"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-teal/10 flex items-center justify-center">
                    <span className="text-[13px] font-extrabold text-teal">
                      {s.num}
                    </span>
                  </div>
                  <h4 className="text-[16px] font-bold text-ink leading-tight">
                    {s.title}
                  </h4>
                </div>
                <p className="text-sm text-muted leading-[1.7]">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-12"
        >
          <a
            href="mailto:hello@limepages.co.za?subject=Intro Call Request"
            className="bg-teal text-white px-9 py-4 rounded-full font-bold text-sm hover:opacity-90 hover:-translate-y-0.5 transition-all inline-flex items-center gap-2"
          >
            Book a free intro call
            <span aria-hidden="true">&rarr;</span>
          </a>
          <a
            href="#chatbot"
            className="border-[1.5px] border-navy text-navy px-8 py-[14px] rounded-full font-bold text-sm hover:bg-navy hover:text-lime transition-colors inline-flex items-center gap-2"
          >
            Try the free AI advisor
            <ArrowDown className="w-3.5 h-3.5" />
          </a>
        </motion.div>

        {/* 24-hour guarantee note */}
        <motion.p
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.24 }}
          className="text-center text-xs text-subtle leading-relaxed mb-10"
        >
          All paid sessions include a 24-hour money-back guarantee, no questions
          asked.
        </motion.p>

        {/* Refund guarantee banner */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.28 }}
          className="bg-navy/[0.04] border border-navy/[0.1] rounded-[20px] p-7 flex flex-col sm:flex-row items-start sm:items-center gap-5"
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
      </Container>
    </section>
  );
}
