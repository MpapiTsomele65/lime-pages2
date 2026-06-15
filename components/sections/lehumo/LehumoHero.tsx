"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { LaunchCountdown } from "./LaunchCountdown";

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.8, ease: "easeOut" as const },
};

const heroStats = [
  { value: "30", color: "text-lime", label: "Founding Members" },
  { value: "R2M", color: "text-teal", label: "Pool Target" },
  { value: "5 Yrs", color: "text-lime", label: "Lock-in Period" },
  { value: "R1k", color: "text-teal", label: "Per Month" },
];

function formatZAR(n: number): string {
  return `R${Math.round(n).toLocaleString("en-ZA")}`;
}

interface LehumoHeroProps {
  /** Founding spots still open (totalFoundingSlots − membersOnboarded).
   *  null when the live stats couldn't be loaded — the scarcity chip is
   *  hidden in that case so the hero degrades gracefully. */
  spotsLeft?: number | null;
  totalFoundingSlots?: number;
  /** Distinct members who've made ≥1 contribution — social proof. */
  membersContributed?: number | null;
  /** Total ZAR contributed across the cohort — social proof. */
  totalContributed?: number | null;
}

export function LehumoHero({
  spotsLeft = null,
  totalFoundingSlots = 30,
  membersContributed = null,
  totalContributed = null,
}: LehumoHeroProps = {}) {
  return (
    <section className="min-h-[85vh] bg-navy flex flex-col items-center justify-center text-center px-[clamp(1.5rem,5vw,5rem)] py-[100px] relative overflow-hidden">
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(184,255,0,1) 1px, transparent 1px), linear-gradient(90deg, rgba(184,255,0,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Glows */}
      <div className="absolute top-0 left-[20%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(184,255,0,0.1),transparent_70%)] blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 right-[15%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(70,205,207,0.12),transparent_70%)] blur-[80px] pointer-events-none" />

      <motion.div {...fadeUp} className="relative z-[1] max-w-[900px]">
        {/* Lehumo brand */}
        <div className="flex items-center gap-3.5 justify-center mb-7">
          <svg viewBox="0 0 60 60" fill="none" className="w-[52px] h-[52px]">
            <polygon points="30,4 54,17 54,43 30,56 6,43 6,17" stroke="#46cdcf" strokeWidth="2.5" fill="rgba(70,205,207,0.08)" />
            <polygon points="30,12 47,21.5 47,40.5 30,50 13,40.5 13,21.5" stroke="#46cdcf" strokeWidth="1.5" fill="none" opacity=".4" />
          </svg>
          <div className="text-left">
            <div className="text-[26px] font-extrabold text-lime tracking-[1px] leading-none">LEHUMO</div>
            <div className="text-[13px] font-medium text-teal tracking-wide">Collective Investment Trust</div>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-[clamp(1.6rem,3.8vw,2.9rem)] font-extrabold text-white leading-[1.12] tracking-tight mb-6">
          Do you want to join a community
          <br />
          building an <span className="text-lime">Investment Trust</span>
          <br />
          to create <span className="text-teal">Generational Wealth?</span>
        </h1>

        <p className="text-[clamp(1rem,1.8vw,1.15rem)] text-white/55 leading-[1.8] max-w-[640px] mx-auto mb-10">
          30 Founding Members. 5 Years. R2 Million. One shared mission — Save, Buy, and Protect assets for the next generation.
        </p>

        {/* Countdown — urgency (first-contribution deadline) */}
        <LaunchCountdown className="mb-6" />

        {/* Scarcity — founding spots remaining. Stacks real scarcity on
            top of the deadline urgency. Hidden if stats didn't load. */}
        {spotsLeft !== null && (
          <div className="flex justify-center mb-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-lime/30 bg-lime/[0.07] px-4 py-1.5 text-[13px] font-semibold text-lime">
              <span className="relative flex w-1.5 h-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime opacity-70" />
                <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-lime" />
              </span>
              {spotsLeft > 0
                ? `Only ${spotsLeft} of ${totalFoundingSlots} founding spots left`
                : "All founding spots claimed — join the waitlist"}
            </span>
          </div>
        )}

        {/* CTAs — primary "claim spot" (the conversion action) +
            secondary "learn more". */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-4">
          <Link
            href="/lehumo/onboard"
            className="bg-lime text-navy px-9 py-[15px] rounded-full font-bold text-sm hover:shadow-[0_8px_28px_-6px_rgba(184,255,0,0.45)] transition-all inline-flex items-center gap-1.5"
          >
            {spotsLeft === 0 ? "Join the waitlist" : "Claim your founding spot"}
            <span aria-hidden="true">→</span>
          </Link>
          <Link href="#what" className="text-white px-9 py-[15px] rounded-full font-semibold text-sm border border-white/20 hover:border-lime/25 hover:bg-lime-dim transition-all">
            Learn How It Works
          </Link>
        </div>

        {/* Social proof — real members + Rand contributed. Hidden until
            there's something meaningful to show (avoids "0 members"). */}
        {membersContributed !== null &&
          membersContributed > 0 &&
          totalContributed !== null &&
          totalContributed > 0 && (
            <p className="text-[13px] text-white/55 mb-4 max-w-[520px] mx-auto">
              Join{" "}
              <span className="text-white font-semibold">
                {membersContributed}
              </span>{" "}
              founding member{membersContributed === 1 ? "" : "s"} who&rsquo;ve
              already contributed{" "}
              <span className="text-lime font-semibold">
                {formatZAR(totalContributed)}
              </span>{" "}
              toward the R2M goal.
            </p>
          )}

        {/* Member sign-in */}
        <div className="flex justify-center mb-14">
          <Link
            href="/lehumo/portal/login"
            className="text-teal/70 hover:text-teal text-sm font-semibold transition-colors inline-flex items-center gap-1.5"
          >
            Already a member? Sign in to your portal →
          </Link>
        </div>

        {/* Stats strip */}
        <div className="flex flex-col sm:flex-row border border-white/[0.08] rounded-2xl overflow-hidden max-w-[600px] mx-auto">
          {heroStats.map((s, i) => (
            <div key={s.label} className={`flex-1 py-5 px-4 text-center ${i < heroStats.length - 1 ? "border-b sm:border-b-0 sm:border-r border-white/[0.08]" : ""}`}>
              <div className={`text-2xl font-extrabold leading-none mb-1 ${s.color}`}>{s.value}</div>
              <div className="text-[11px] text-white/55 font-medium tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
