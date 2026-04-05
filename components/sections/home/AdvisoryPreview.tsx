"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Compass, Rocket, Box, Check, ShieldCheck } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, amount: 0.15 } as const,
  transition: { duration: 0.6, ease: "easeOut" as const } as const,
};

const steps = [
  { num: "Step 01", title: "Start a conversation", body: "Book a free 15-minute intro call. Tell me what\u2019s going on \u2014 your business, your product, your goals. No prep required." },
  { num: "Step 02", title: "We scope it together", body: "Based on what you share, I\u2019ll suggest which session actually fits \u2014 or tell you honestly if I\u2019m not the right person for what you need." },
  { num: "Step 03", title: "You decide what\u2019s next", body: "No upsell. No follow-up pressure. If a paid session makes sense, great. If not, you still leave the intro call with something useful." },
];

const pathways = [
  {
    icon: Compass,
    iconBg: "bg-teal-light",
    tagBg: "bg-teal-light",
    tagColor: "text-[#0a7a7b]",
    who: "Founders & Early-Stage Teams",
    title: "\u201cI have an idea \u2014 but no plan.\u201d",
    problem: "You know what you want to build, but the business side is unclear \u2014 positioning, model, go-to-market, or how to actually structure the thing so it works.",
    outcomes: [
      "A clear business model that makes sense",
      "Market positioning you can actually defend",
      "An operational roadmap for the next 90 days",
      "Honest feedback \u2014 not cheerleading",
    ],
    price: "R1,500",
  },
  {
    icon: Rocket,
    iconBg: "bg-navy/[0.07]",
    tagBg: "bg-navy/[0.07]",
    tagColor: "text-navy",
    who: "First-Time Fundraisers",
    title: "\u201cI need capital \u2014 but I don\u2019t know where to start.\u201d",
    problem: "You\u2019re ready to raise but the process feels opaque \u2014 what investors actually want, how to structure a deck, what your numbers need to say, and how to tell a story that lands.",
    outcomes: [
      "An investor-ready pitch deck and narrative",
      "A financial model that holds up to scrutiny",
      "Clarity on how much to raise and on what terms",
      "Practical fundraising strategy \u2014 not theory",
    ],
    price: "R2,500",
  },
  {
    icon: Box,
    iconBg: "bg-teal-light",
    tagBg: "bg-teal-light",
    tagColor: "text-[#0a7a7b]",
    who: "Builders & Product Teams",
    title: "\u201cI have a product \u2014 but it\u2019s not working.\u201d",
    problem: "You\u2019re shipping features but nothing\u2019s moving the needle. You need someone to help you figure out what to build, what to cut, and how to get from idea to something people actually use.",
    outcomes: [
      "A prioritised roadmap that drives real outcomes",
      "Framework for deciding what to build next",
      "User-focused thinking, not feature bloat",
      "Actionable plan you can execute this quarter",
    ],
    price: "R1,800",
  },
];

export function AdvisoryPreview() {
  return (
    <section className="py-[100px] px-[clamp(1.25rem,4vw,3.5rem)] bg-snow">
      <Container>
        {/* Header */}
        <motion.div {...fadeUp} className="max-w-[680px] mb-16">
          <span className="text-[11px] font-bold tracking-[1.4px] uppercase text-navy mb-3.5 block">
            Lime Advisory
          </span>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-ink leading-[1.1] tracking-tight mb-5">
            From idea to business.
            <br />
            That&apos;s the work.
          </h2>
          <p className="text-muted text-[17px] leading-[1.8]">
            Strategy, fundraising, and product \u2014 the three things that
            determine whether your startup makes it or doesn&apos;t. I help
            founders get each one right.
          </p>
        </motion.div>

        {/* Image strip */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }} className="relative h-[280px] rounded-[20px] overflow-hidden mb-14">
          <Image src="/images/rachel-martin-yHOhVzVRFMc-unsplash.jpg" alt="South African city street" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy/60 to-transparent" />
          <div className="absolute bottom-6 left-8 z-[1]">
            <p className="text-white text-lg font-bold">Real conversations. Real outcomes.</p>
            <p className="text-white/60 text-sm">No jargon. No judgment. No surprises.</p>
          </div>
        </motion.div>

        {/* Steps */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 bg-white rounded-[20px] border border-border overflow-hidden mb-14"
        >
          {steps.map((s, i) => (
            <div
              key={s.num}
              className={`p-7 ${i < steps.length - 1 ? "md:border-r border-b md:border-b-0 border-border" : ""}`}
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

        {/* Pathway Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {pathways.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="bg-white rounded-[20px] border border-border shadow-sm flex flex-col overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all"
            >
              <div className="p-7 pb-0">
                <div className={`w-12 h-12 rounded-[14px] ${p.iconBg} flex items-center justify-center mb-5`}>
                  <p.icon className="w-[22px] h-[22px] text-inherit" />
                </div>
                <span className={`inline-block text-[11px] font-bold tracking-[1px] uppercase px-3 py-1 rounded-full mb-3.5 ${p.tagBg} ${p.tagColor}`}>
                  {p.who}
                </span>
                <h3 className="text-xl font-extrabold text-ink leading-tight mb-3">
                  {p.title}
                </h3>
                <p className="text-sm text-muted leading-[1.75]">{p.problem}</p>
              </div>

              <div className="px-7 py-5 flex-1">
                <ul className="flex flex-col gap-2.5">
                  {p.outcomes.map((o, j) => (
                    <li
                      key={j}
                      className="text-[13px] text-ink flex items-start gap-2.5 leading-snug"
                    >
                      <Check className="w-3 h-3 mt-0.5 flex-shrink-0 text-navy" strokeWidth={3} />
                      {o}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="px-7 py-5 border-t border-border flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-subtle">Sessions from</div>
                  <div className="text-[22px] font-extrabold text-navy leading-none">
                    {p.price}
                  </div>
                </div>
                <a
                  href="mailto:hello@limepages.co.za?subject=Advisory Session Request"
                  className="inline-flex items-center gap-1.5 px-[22px] py-[11px] rounded-full text-[13px] font-bold border-[1.5px] border-navy text-navy hover:bg-navy hover:text-lime transition-colors whitespace-nowrap"
                >
                  Let&apos;s talk &rarr;
                </a>
              </div>
            </motion.div>
          ))}
        </div>

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
              24 hours and get your money back. No questions asked. No forms.
              No friction.
            </p>
          </div>
        </motion.div>

        {/* Free intro CTA */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.2 }}
          className="bg-white border border-border rounded-[20px] p-9 flex flex-col md:flex-row items-start md:items-center justify-between gap-8"
        >
          <div>
            <h3 className="text-[22px] font-extrabold text-ink mb-1.5 leading-tight">
              Not sure which fits? Start here — it&apos;s free.
            </h3>
            <p className="text-sm text-muted leading-relaxed max-w-[480px]">
              Book a 15-minute intro call. No commitment, no agenda. Just a
              real conversation to figure out if and how I can actually help
              you. If I can&apos;t, I&apos;ll tell you that too.
            </p>
          </div>
          <a
            href="mailto:hello@limepages.co.za?subject=Intro Call Request"
            className="bg-teal text-white px-8 py-3.5 rounded-full font-bold text-sm whitespace-nowrap hover:opacity-90 hover:-translate-y-0.5 transition-all"
          >
            Book a free intro call &rarr;
          </a>
        </motion.div>

        <p className="text-center mt-5 text-xs text-subtle leading-relaxed">
          All sessions are fully online &middot; 24-hour money-back guarantee,
          no questions asked
        </p>
      </Container>
    </section>
  );
}
