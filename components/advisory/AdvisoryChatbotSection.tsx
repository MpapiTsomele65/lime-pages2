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

export function AdvisoryChatbotSection() {
  return (
    <section className="relative bg-[#0B1933] py-24 overflow-hidden">
      {/* Glow orbs */}
      <div className="absolute -top-[30%] -left-[10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(70,205,207,0.08),transparent_70%)] blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-[30%] -right-[10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(184,255,0,0.05),transparent_70%)] blur-[80px] pointer-events-none" />

      <div className="relative z-[1] max-w-[900px] mx-auto px-[clamp(1.25rem,4vw,3rem)]">
        {/* Hero intro */}
        <motion.div {...fadeUp} className="text-center mb-10">
          <div className="inline-flex items-center gap-2.5 bg-[rgba(184,255,0,0.1)] border border-[rgba(184,255,0,0.25)] rounded-full px-[18px] py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B8FF00]" />
            <span className="text-[11px] font-bold text-[#B8FF00] tracking-[1.2px] uppercase">
              Free &middot; No login required
            </span>
          </div>

          <h2 className="text-[clamp(2rem,5vw,3.4rem)] font-extrabold text-white tracking-tight leading-[1.08] mb-4">
            Know your rights.
            <br />
            <em className="text-teal">Use them.</em>
          </h2>

          <p className="text-white/55 text-base leading-[1.8] max-w-[600px] mx-auto mb-8">
            South Africa&apos;s financial system is complicated on purpose. This
            tool cuts through the jargon — Two-Pot, NCA rights, debt review,
            grants, investments — in plain language, for free.
          </p>

          {/* Topic tags */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {[
              { emoji: "\u2696\ufe0f", label: "Consumer Rights" },
              { emoji: "\ud83e\udea3", label: "Two-Pot System" },
              { emoji: "\ud83d\udcb3", label: "Debt Relief" },
              { emoji: "\ud83c\udf31", label: "Investing Basics" },
              { emoji: "\ud83c\udfe2", label: "SMME Funding" },
            ].map((t) => (
              <span
                key={t.label}
                className="bg-white/[0.06] border border-white/[0.1] rounded-full px-4 py-1.5 text-white/70 text-xs font-semibold"
              >
                {t.emoji} {t.label}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Marquee */}
        <div className="overflow-hidden rounded-xl mb-10">
          <div className="bg-[#B8FF00] py-2.5 flex whitespace-nowrap">
            <div className="flex gap-6 animate-[marquee_25s_linear_infinite] text-[#0B1933]">
              {[
                "KNOW YOUR RIGHTS",
                "TWO-POT EXPLAINED",
                "DEBT REVIEW GUIDE",
                "SMME GRANTS",
                "INVESTMENT BASICS",
                "NCA RIGHTS",
                "INSURANCE GUIDE",
                "RETIREMENT PLANNING",
                "KNOW YOUR RIGHTS",
                "TWO-POT EXPLAINED",
                "DEBT REVIEW GUIDE",
                "SMME GRANTS",
                "INVESTMENT BASICS",
                "NCA RIGHTS",
                "INSURANCE GUIDE",
                "RETIREMENT PLANNING",
              ].map((text, i) => (
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

        {/* Context photo strip */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.05 }}
          className="relative h-[200px] rounded-[20px] overflow-hidden mb-10"
        >
          <Image
            src="/images/iwaria-inc-M7ALc3UuX_g-unsplash.jpg"
            alt="South Africans navigating their financial rights together"
            fill
            className="object-cover object-[center_20%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1933]/85 to-transparent flex items-center px-8">
            <div>
              <p className="text-[11px] font-bold text-[#B8FF00] tracking-[1.2px] uppercase mb-2">
                Who this is for
              </p>
              <p className="text-[15px] font-semibold text-white leading-[1.5] max-w-[320px]">
                South Africans who deserve clear, honest answers — not more
                jargon.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Chatbot */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
        >
          <AdvisoryChatbot />
        </motion.div>

        {/* Attribution links */}
        <div className="mt-8 text-center text-xs text-white/30">
          <a href="/" className="text-white/50 font-semibold no-underline hover:text-teal transition-colors">
            &larr; Back to Lime Pages
          </a>
          {" "}&middot;{" "}
          <a href="/about" className="text-white/50 font-semibold no-underline hover:text-teal transition-colors">
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
      </div>
    </section>
  );
}
