"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { AdvisoryChatbot } from "./AdvisoryChatbot";

const fadeUp = {
  initial: { opacity: 0, y: 24 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, amount: 0.15 } as const,
  transition: { duration: 0.6, ease: "easeOut" as const } as const,
};

const topics = [
  { emoji: "\u2696\ufe0f", label: "Consumer Rights" },
  { emoji: "\ud83e\udea3", label: "Two-Pot System" },
  { emoji: "\ud83d\udcb3", label: "Debt Relief" },
  { emoji: "\ud83c\udf31", label: "Investing Basics" },
  { emoji: "\ud83c\udfe2", label: "SMME Funding" },
];

const marqueeItems = [
  "KNOW YOUR RIGHTS",
  "TWO-POT EXPLAINED",
  "DEBT REVIEW GUIDE",
  "SMME GRANTS",
  "INVESTMENT BASICS",
  "NCA RIGHTS",
  "INSURANCE GUIDE",
  "RETIREMENT PLANNING",
];

export function AdvisoryChatbotSection() {
  return (
    <section className="relative bg-[#0B1933] overflow-hidden">
      {/* Glow orbs */}
      <div className="absolute -top-[30%] -left-[10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(70,205,207,0.08),transparent_70%)] blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-[30%] -right-[10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(184,255,0,0.05),transparent_70%)] blur-[80px] pointer-events-none" />

      {/* Marquee — full width */}
      <div className="overflow-hidden">
        <div className="bg-[#B8FF00] py-2.5 flex whitespace-nowrap">
          <div className="flex gap-6 animate-[marquee_25s_linear_infinite] text-[#0B1933]">
            {[...marqueeItems, ...marqueeItems].map((text, i) => (
              <span
                key={i}
                className="text-[11px] font-extrabold tracking-[2px] uppercase"
              >
                {text} &middot;
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="relative z-[1] max-w-[1320px] mx-auto px-[clamp(1.25rem,4vw,3rem)] py-14 lg:py-20">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-12 items-start">
          {/* ─── LEFT COLUMN: Content ─── */}
          <motion.div
            {...fadeUp}
            className="lg:w-[42%] shrink-0"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 bg-[rgba(184,255,0,0.1)] border border-[rgba(184,255,0,0.25)] rounded-full px-[18px] py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B8FF00]" />
              <span className="text-[11px] font-bold text-[#B8FF00] tracking-[1.2px] uppercase">
                Free &middot; No login required
              </span>
            </div>

            {/* Heading */}
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-[1.08] mb-4">
              Know your rights.
              <br />
              <em className="text-teal not-italic">Use them.</em>
            </h2>

            <p className="text-white/55 text-[15px] leading-[1.8] max-w-[480px] mb-7">
              South Africa&apos;s financial system is complicated on purpose.
              This tool cuts through the jargon — Two-Pot, NCA rights, debt
              review, grants, investments — in plain language, for free.
            </p>

            {/* Topic tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              {topics.map((t) => (
                <span
                  key={t.label}
                  className="bg-white/[0.06] border border-white/[0.1] rounded-full px-4 py-1.5 text-white/70 text-xs font-semibold"
                >
                  {t.emoji} {t.label}
                </span>
              ))}
            </div>

            {/* Context photo */}
            <div className="relative h-[240px] rounded-[20px] overflow-hidden mb-7">
              <Image
                src="/images/iwaria-inc-M7ALc3UuX_g-unsplash.jpg"
                alt="South Africans navigating their financial rights together"
                fill
                className="object-cover object-[center_20%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1933]/90 via-[#0B1933]/40 to-transparent flex items-end p-6">
                <div>
                  <p className="text-[11px] font-bold text-[#B8FF00] tracking-[1.2px] uppercase mb-1.5">
                    Who this is for
                  </p>
                  <p className="text-[15px] font-semibold text-white leading-[1.5] max-w-[320px]">
                    South Africans who deserve clear, honest answers — not more
                    jargon.
                  </p>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-7">
              {[
                { value: "50+", label: "Topics covered" },
                { value: "100%", label: "Free forever" },
                { value: "0", label: "Login required" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 text-center"
                >
                  <div className="text-2xl font-extrabold text-[#B8FF00] mb-1">
                    {s.value}
                  </div>
                  <div className="text-[11px] text-white/50 font-medium">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* How it works mini */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 mb-7">
              <p className="text-[11px] font-bold text-[#B8FF00] tracking-[1.2px] uppercase mb-3">
                How it works
              </p>
              <div className="flex flex-col gap-3">
                {[
                  { step: "1", text: "Pick a topic that matters to you" },
                  { step: "2", text: "Follow the guided conversation" },
                  { step: "3", text: "Get clear, practical answers" },
                ].map((s) => (
                  <div key={s.step} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-teal/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-teal">{s.step}</span>
                    </div>
                    <span className="text-[13px] text-white/70 font-medium">{s.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Attribution links */}
            <div className="text-xs text-white/30">
              <a
                href="/"
                className="text-white/50 font-semibold no-underline hover:text-teal transition-colors"
              >
                &larr; Back to Lime Pages
              </a>
              {" "}&middot;{" "}
              <a
                href="/about"
                className="text-white/50 font-semibold no-underline hover:text-teal transition-colors"
              >
                About Mpapi
              </a>
              {" "}&middot;{" "}
              <a
                href="mailto:hello@limepages.co.za"
                className="text-white/50 font-semibold no-underline hover:text-teal transition-colors"
              >
                Book a real session
              </a>
            </div>
          </motion.div>

          {/* ─── RIGHT COLUMN: Chatbot (sticky) ─── */}
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
            className="lg:w-[58%] w-full lg:sticky lg:top-[90px]"
          >
            <AdvisoryChatbot />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
