"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  GraduationCap,
  Plus,
  Target,
  ChevronsUp,
  PieChart,
  Gauge,
  ArrowRight,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";

type Tone = "lime" | "teal";

interface Topic {
  icon: LucideIcon;
  tone: Tone;
  title: string;
  teaser: string;
  body: string;
  href: string;
  linkLabel: string;
}

/** Bite-sized explainers that make the portal teach, not just transact. Copy
 *  is distilled from the Lehumo FAQ so it stays consistent with the public
 *  page. Each links deeper into Lime Capital or the FAQ/strategy. */
const TOPICS: Topic[] = [
  {
    icon: Target,
    tone: "lime",
    title: "The R40,000 floor",
    teaser: "The minimum to convert into Phase 2.",
    body: "You need R40,000 in total contributions across the 60 months to convert into Phase 2 — the registered company — at year 5. That's the floor: below it you don't convert. On the standard R1,000/month you clear it comfortably (R60,000). Started on a lower tier? You can catch up by topping up before year 5.",
    href: "/lehumo#faq",
    linkLabel: "Read the FAQ",
  },
  {
    icon: ChevronsUp,
    tone: "teal",
    title: "What levering up means",
    teaser: "Contribute more, earn more shares & votes.",
    body: "Every R20,000 you contribute earns you 1 more share and 1 more vote at conversion — R40k = 2, R60k = 3, up to 5 votes at R100,000. “Levering up” simply means contributing above the standard so you hold a bigger share and more say when Lehumo becomes a company. It's voluntary, and you can move your tier up or down during the term.",
    href: "/lehumo/portal/contributions#stake",
    linkLabel: "See your projection",
  },
  {
    icon: PieChart,
    tone: "lime",
    title: "How the pool is invested",
    teaser: "Where your money actually sits.",
    body: "Contributions pool in a dedicated LimePages account, then deploy across three buckets: about 40% held as reserves and liquidity (for loans and emergencies), about 40% through Sum1 Investments (a registered FSP focused on SME lending), and 10–20% with a second manager. Around 10% is a member-influenced “sandbox” the group votes on. Every third-party manager is FSCA-regulated.",
    href: "/lehumo/portal/community#portfolio",
    linkLabel: "See the live allocation",
  },
  {
    icon: Gauge,
    tone: "teal",
    title: "What your risk profile means",
    teaser: "Protect the pool, or grow it.",
    body: "Your risk profile is where you sit between protecting the pool (safety first) and growing it (accepting some ups and downs for stronger long-term returns). It helps the group shape the strategy around what members actually want — it doesn't lock your money to anything. Take the fuller profiler on Lime Capital for a personal view.",
    href: "/capital#risk-profile-section",
    linkLabel: "Explore Lime Capital",
  },
];

const TONE_RING: Record<Tone, string> = {
  lime: "bg-[#B8FF00]/15 text-[#B8FF00]",
  teal: "bg-[#46CDCF]/15 text-[#46CDCF]",
};
const TONE_LINK: Record<Tone, string> = {
  lime: "text-[#B8FF00]",
  teal: "text-[#46CDCF]",
};

function LearnRow({
  topic,
  open,
  onToggle,
}: {
  topic: Topic;
  open: boolean;
  onToggle: () => void;
}) {
  const Icon = topic.icon;
  // Links into other portal sections (stake, allocation) navigate in the
  // same tab; external pages (Lime Capital, the public FAQ) open in a new
  // tab so the member's portal session stays put.
  const isPortalInternal = topic.href.startsWith("/lehumo/portal");
  const linkClass = `mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold ${TONE_LINK[topic.tone]} transition-all hover:gap-1.5`;

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="group flex w-full items-start gap-3 py-3.5 text-left"
      >
        <span
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${TONE_RING[topic.tone]}`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14.5px] font-bold text-white">
            {topic.title}
          </span>
          <span className="mt-0.5 block text-[12.5px] text-white/60">
            {topic.teaser}
          </span>
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
            open
              ? "border-white/20 text-white"
              : "border-white/10 text-white/60 group-hover:border-white/25 group-hover:text-white/70"
          }`}
        >
          <Plus className="h-4 w-4" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="pb-4 pl-11 pr-2">
              <p className="text-[13px] leading-relaxed text-white/65">
                {topic.body}
              </p>
              {isPortalInternal ? (
                <Link href={topic.href} className={linkClass}>
                  {topic.linkLabel}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <Link
                  href={topic.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  {topic.linkLabel}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function LearnCard() {
  // One row open at a time keeps the strip compact; the first explainer
  // (the R40k floor — the #1 member question) starts open so the card
  // demonstrates its affordance on first paint.
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      aria-label="Learn how Lehumo works"
      className="rounded-[24px] border border-white/[0.05] bg-gradient-to-b from-[#10224a] to-[#0F2040] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_8px_32px_-8px_rgba(0,0,0,0.35)] p-5 sm:p-7"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#46CDCF]/15 text-[#46CDCF]">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#46CDCF]">
            Learn
          </p>
          <h2 className="mt-0.5 text-xl font-bold text-white md:text-2xl">
            How Lehumo works
          </h2>
        </div>
      </div>

      <div className="mt-4 divide-y divide-white/[0.06] border-t border-white/[0.06]">
        {TOPICS.map((topic, i) => (
          <LearnRow
            key={topic.title}
            topic={topic}
            open={openIdx === i}
            onToggle={() => setOpenIdx(openIdx === i ? null : i)}
          />
        ))}
      </div>

      <p className="mt-5 text-[11px] text-white/30">
        Educational — not financial advice.
      </p>
    </motion.section>
  );
}
