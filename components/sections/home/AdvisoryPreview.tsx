"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Lightbulb, Wrench, TrendingUp, Check } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, amount: 0.15 } as const,
  transition: { duration: 0.6, ease: "easeOut" as const } as const,
};

const steps = [
  { num: "Step 01", title: "Start a conversation", body: "Book a free 15-minute intro call. Tell me what\u2019s going on \u2014 your business, your money, your goals. No prep required." },
  { num: "Step 02", title: "We scope it together", body: "Based on what you share, I\u2019ll suggest what type of session actually fits \u2014 or let you know honestly if I\u2019m not the right fit for what you need." },
  { num: "Step 03", title: "You decide what\u2019s next", body: "No upsell. No follow-up pressure. If a paid session makes sense, great. If not, you still leave the intro call with something useful." },
];

const pathways = [
  {
    icon: Lightbulb,
    iconBg: "bg-teal-light",
    tagBg: "bg-teal-light",
    tagColor: "text-[#0a7a7b]",
    who: "Individuals & Young Professionals",
    title: "\u201cI need to get my money right.\u201d",
    problem: "Your finances feel messy, unclear, or like you\u2019re making it up as you go. You want a trusted sounding board \u2014 someone who\u2019ll give you a straight answer, not a sales pitch.",
    outcomes: [
      "A clear picture of where you actually stand",
      "A realistic starting point \u2014 not a fantasy plan",
      "Practical next steps you can act on this week",
      "No jargon. No judgment. No surprises.",
    ],
    price: "R500",
  },
  {
    icon: Wrench,
    iconBg: "bg-navy/[0.07]",
    tagBg: "bg-navy/[0.07]",
    tagColor: "text-navy",
    who: "Entrepreneurs & SMMEs",
    title: "\u201cI\u2019m building something real.\u201d",
    problem: "You\u2019ve got a business or an idea \u2014 but the financial side is either confusing, underprepared, or blocking your next move. Funding, investor-readiness, or integrating financial discipline into how you operate.",
    outcomes: [
      "Clarity on how to structure or fund your growth",
      "A credible narrative for investors or partners",
      "Financial systems that actually fit your business",
      "Strategic guidance from someone who\u2019s been there",
    ],
    price: "R699",
  },
  {
    icon: TrendingUp,
    iconBg: "bg-teal-light",
    tagBg: "bg-teal-light",
    tagColor: "text-[#0a7a7b]",
    who: "Professionals Ready to Invest",
    title: "\u201cI want to build lasting wealth.\u201d",
    problem: "You\u2019re past the basics. You\u2019ve got some stability and you want to build something long-term \u2014 an investment strategy, a wealth plan, or the kind of financial foundation that actually lasts.",
    outcomes: [
      "A long-term wealth strategy tailored to your life",
      "Alternatives the mainstream rarely talks about",
      "Protection and growth working at the same time",
      "A plan you own and understand \u2014 not just follow",
    ],
    price: "R790",
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
            Every conversation
            <br />
            starts the same way.
          </h2>
          <p className="text-muted text-[17px] leading-[1.8]">
            You talk. I listen. No agenda, no product pitch, no pressure. Just
            honest, practical thinking about your specific situation — and then we
            figure out together what, if anything, makes sense next.
          </p>
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
                <Link
                  href="/advisory"
                  className="inline-flex items-center gap-1.5 px-[22px] py-[11px] rounded-full text-[13px] font-bold border-[1.5px] border-navy text-navy hover:bg-navy hover:text-lime transition-colors whitespace-nowrap"
                >
                  Let&apos;s talk →
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

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
              Book a 15-minute intro call. No commitment, no agenda. Just a real
              conversation to figure out if and how I can actually help you. If I
              can&apos;t, I&apos;ll tell you that too.
            </p>
          </div>
          <a
            href="mailto:hello@limepages.co.za?subject=Intro Call Request"
            className="bg-teal text-white px-8 py-3.5 rounded-full font-bold text-sm whitespace-nowrap hover:opacity-90 hover:-translate-y-0.5 transition-all"
          >
            Book a free intro call →
          </a>
        </motion.div>

        <p className="text-center mt-5 text-xs text-subtle leading-relaxed">
          All sessions are fully online · 24-hour refund guarantee, no questions
          asked · <strong>#ThisIsNotFinancialAdvice</strong>
        </p>
      </Container>
    </section>
  );
}
