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
    <section id="chatbot" className="relative bg-[#0B1933] overflow-hidden">
      {/* Glow orbs */}
      <div className="absolute -top-[30%] -left-[10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(70,205,207,0.08),transparent_70%)] blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-[30%] -right-[10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(184,255,0,0.05),transparent_70%)] blur-[80px] pointer-events-none" />

      {/* Marquee */}
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

      {/* Stacked content */}
      <div className="relative z-[1] max-w-[720px] mx-auto px-[clamp(1.25rem,4vw,3rem)] py-16 lg:py-20">
        {/* Hero header */}
        <motion.div {...fadeUp} className="text-center mb-10">
          <div className="inline-flex items-center gap-2.5 bg-[rgba(184,255,0,0.1)] border border-[rgba(184,255,0,0.25)] rounded-full px-[18px] py-1.5 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B8FF00]" />
            <span className="text-[11px] font-bold text-[#B8FF00] tracking-[1.2px] uppercase">
              Free &middot; No login required
            </span>
          </div>
          <h2 className="text-[clamp(2rem,5vw,3rem)] font-extrabold text-white tracking-tight leading-[1.08] mb-4">
            Know your rights.{" "}
            <em className="text-teal not-italic">Use them.</em>
          </h2>
          <p className="text-white/50 text-[15px] leading-[1.8] max-w-[520px] mx-auto mb-6">
            South Africa&apos;s financial system is complicated on purpose.
            This tool cuts through the jargon in plain language, for free.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {topics.map((t) => (
              <span
                key={t.label}
                className="bg-white/[0.06] border border-white/[0.1] rounded-full px-3.5 py-1 text-white/70 text-[11px] font-semibold"
              >
                {t.emoji} {t.label}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Context photo strip */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.05 }}
          className="relative h-[200px] rounded-[18px] overflow-hidden mb-10"
        >
          <Image
            src="/images/iwaria-inc-M7ALc3UuX_g-unsplash.jpg"
            alt="South Africans navigating their financial rights together"
            fill
            className="object-cover object-[center_20%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1933]/90 via-[#0B1933]/30 to-transparent flex items-end p-6">
            <div>
              <p className="text-[10px] font-bold text-[#B8FF00] tracking-[1.2px] uppercase mb-1">
                Who this is for
              </p>
              <p className="text-[14px] font-semibold text-white leading-[1.5] max-w-[360px]">
                South Africans who deserve clear, honest answers — not more jargon.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Chatbot */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
          className="mb-10"
        >
          <AdvisoryChatbot />
        </motion.div>

        {/* Bottom: stats + links */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.15 }}
        >
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { value: "50+", label: "Topics covered" },
              { value: "100%", label: "Free forever" },
              { value: "0", label: "Login needed" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/[0.04] border border-white/[0.08] rounded-xl py-3.5 px-2 text-center"
              >
                <div className="text-xl font-extrabold text-[#B8FF00] mb-0.5">
                  {s.value}
                </div>
                <div className="text-[10px] text-white/45 font-medium">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center text-xs text-white/30">
            <a href="/" className="text-white/50 font-semibold no-underline hover:text-teal transition-colors">
              &larr; Back to Lime Pages
            </a>
            {" "}&middot;{" "}
            <a href="/about" className="text-white/50 font-semibold no-underline hover:text-teal transition-colors">
              About Mpapi
            </a>
            {" "}&middot;{" "}
            <a href="mailto:hello@limepages.co.za" className="text-white/50 font-semibold no-underline hover:text-teal transition-colors">
              Book a real session
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
