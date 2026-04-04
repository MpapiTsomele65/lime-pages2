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

      {/* Content */}
      <div className="relative z-[1] max-w-[1320px] mx-auto px-[clamp(1.25rem,4vw,3rem)] pt-14 pb-10 lg:pt-20 lg:pb-14">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          {/* ─── LEFT COLUMN ─── */}
          <motion.div
            {...fadeUp}
            className="lg:w-[38%] shrink-0 flex flex-col gap-5"
          >
            {/* Context photo — main visual */}
            <div className="relative h-[280px] lg:h-[320px] rounded-[18px] overflow-hidden">
              <Image
                src="/images/iwaria-inc-M7ALc3UuX_g-unsplash.jpg"
                alt="South Africans navigating their financial rights together"
                fill
                className="object-cover object-[center_20%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1933] via-[#0B1933]/40 to-transparent flex items-end p-6">
                <div>
                  <div className="inline-flex items-center gap-2 bg-[rgba(184,255,0,0.15)] border border-[rgba(184,255,0,0.3)] rounded-full px-3.5 py-1 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B8FF00]" />
                    <span className="text-[10px] font-bold text-[#B8FF00] tracking-[1px] uppercase">
                      Free &middot; No login required
                    </span>
                  </div>
                  <h2 className="text-[clamp(1.4rem,2.5vw,1.8rem)] font-extrabold text-white leading-[1.15] mb-1.5">
                    Know your rights.{" "}
                    <em className="text-teal not-italic">Use them.</em>
                  </h2>
                  <p className="text-white/60 text-[13px] leading-[1.5] max-w-[320px]">
                    Plain-language guidance on your financial rights as a South African consumer.
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { value: "50+", label: "Topics" },
                { value: "100%", label: "Free forever" },
                { value: "0", label: "Login needed" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-xl py-3 px-2 text-center"
                >
                  <div className="text-lg font-extrabold text-[#B8FF00] mb-0.5">
                    {s.value}
                  </div>
                  <div className="text-[10px] text-white/45 font-medium">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Topic pills */}
            <div className="flex flex-wrap gap-1.5">
              {[
                "\u2696\ufe0f Consumer Rights",
                "\ud83e\udea3 Two-Pot",
                "\ud83d\udcb3 Debt Relief",
                "\ud83c\udf31 Investing",
                "\ud83c\udfe2 SMME Funding",
                "\ud83c\udfdb\ufe0f NCA / FAIS",
              ].map((label) => (
                <span
                  key={label}
                  className="bg-white/[0.06] border border-white/[0.08] rounded-full px-3 py-1 text-white/55 text-[10px] font-medium"
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Links */}
            <div className="text-[11px] text-white/30 mt-auto pt-1">
              <a href="/" className="text-white/45 font-semibold no-underline hover:text-teal transition-colors">
                &larr; Lime Pages
              </a>
              {" "}&middot;{" "}
              <a href="/about" className="text-white/45 font-semibold no-underline hover:text-teal transition-colors">
                About
              </a>
              {" "}&middot;{" "}
              <a href="mailto:hello@limepages.co.za" className="text-white/45 font-semibold no-underline hover:text-teal transition-colors">
                Book a session
              </a>
            </div>
          </motion.div>

          {/* ─── RIGHT COLUMN: Chatbot ─── */}
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
            className="lg:w-[62%] w-full"
          >
            <AdvisoryChatbot />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
