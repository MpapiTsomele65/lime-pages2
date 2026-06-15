"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { LaunchCountdown } from "@/components/sections/lehumo/LaunchCountdown";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

function formatZAR(n: number): string {
  return `R${Math.round(n).toLocaleString("en-ZA")}`;
}

interface HomeHeroProps {
  /** Founding spots still open. null = stats unavailable (block hides
   *  scarcity/social-proof but keeps the countdown + CTAs). */
  spotsLeft?: number | null;
  totalFoundingSlots?: number;
  membersContributed?: number | null;
  totalContributed?: number | null;
}

export default function HomeHero({
  spotsLeft = null,
  totalFoundingSlots = 30,
  membersContributed = null,
  totalContributed = null,
}: HomeHeroProps = {}) {
  return (
    <section className="bg-navy relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <Image
        src="/images/tobias-reich-1GgWbP74phY-unsplash.jpg"
        alt="Cape Town aerial view"
        fill
        className="object-cover"
        priority
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-navy/70 z-[1]" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow orbs */}
      <div
        className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full pointer-events-none z-[2]"
        style={{
          background:
            "radial-gradient(circle, rgba(70,205,207,0.25) 0%, transparent 70%)",
          filter: "blur(70px)",
        }}
      />
      <div
        className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full pointer-events-none z-[2]"
        style={{
          background:
            "radial-gradient(circle, rgba(184,255,0,0.2) 0%, transparent 70%)",
          filter: "blur(70px)",
        }}
      />

      {/* Content */}
      <Container className="relative z-[3] text-center py-20 sm:py-24">
        <motion.div {...fadeUp}>
          <Badge variant="teal" pulse className="mb-8">
            Wealth &amp; Business Growth Solutions for Africa
          </Badge>
        </motion.div>

        <motion.h1
          {...fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" as const, delay: 0.1 }}
          className="text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-[1.05] tracking-tight text-white mb-6"
        >
          Building Wealth{" "}
          <span className="bg-gradient-to-br from-teal to-lime bg-clip-text text-transparent">
            Together
          </span>
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" as const, delay: 0.2 }}
          className="max-w-[640px] mx-auto text-[clamp(1rem,1.8vw,1.2rem)] leading-relaxed text-white/70"
        >
          Equipping entrepreneurs and young professionals with the strategies
          and solutions to build thriving businesses and generational wealth.
        </motion.p>

        {/* ── Founding-member conversion block ─────────────────────────
            Leads the home page with the Lehumo founding push: deadline
            urgency (countdown) → spot scarcity → primary action →
            social proof → member sign-in. Live numbers from the cohort
            stats; degrades gracefully when stats are unavailable. */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" as const, delay: 0.3 }}
          className="mt-12"
        >
          {/* Clock hidden — LehumoTeaser below carries the one ticking
              countdown; here we keep just the deadline message. */}
          <LaunchCountdown showClock={false} />

          {spotsLeft !== null && (
            <div className="flex justify-center mt-7">
              <span className="inline-flex items-center gap-2 rounded-full border border-lime/30 bg-lime/[0.07] px-4 py-1.5 text-[13px] font-semibold text-lime backdrop-blur-sm">
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

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-7">
            <Link
              href="/lehumo/onboard"
              className="bg-lime text-navy px-9 py-[15px] rounded-full font-bold text-sm hover:shadow-[0_8px_28px_-6px_rgba(184,255,0,0.45)] hover:-translate-y-0.5 transition-all inline-flex items-center gap-1.5"
            >
              {spotsLeft === 0 ? "Join the waitlist" : "Claim your founding spot"}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/lehumo"
              className="text-white px-9 py-[15px] rounded-full font-semibold text-sm border border-white/20 hover:border-lime/25 hover:bg-lime-dim transition-all"
            >
              Learn How It Works
            </Link>
          </div>

          {membersContributed !== null &&
            membersContributed > 0 &&
            totalContributed !== null &&
            totalContributed > 0 && (
              <p className="text-[13px] text-white/60 mt-5 max-w-[520px] mx-auto">
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

          <div className="flex justify-center mt-5">
            <Link
              href="/lehumo/portal/login"
              className="text-teal/80 hover:text-teal text-sm font-semibold transition-colors inline-flex items-center gap-1.5"
            >
              Already a member? Sign in to your portal →
            </Link>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
