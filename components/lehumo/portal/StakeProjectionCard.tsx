"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Vote, Sparkles, ArrowUpRight } from "lucide-react";

import type { LehumoMember } from "@/lib/definitions";
import {
  computeStakeProjection,
  PROJECTION_MONTHLY_ZAR,
  LEVERED_MONTHLY_ZAR,
  VOTE_TIERS,
  type StakeTier,
} from "@/lib/lehumo-projection";

function formatZAR(n: number): string {
  return `R${n.toLocaleString("en-ZA")}`;
}

const TIER_LABEL: Record<StakeTier, string> = {
  below: "Below the R40k floor",
  floor: "Floor cleared",
  standard: "Full standard",
  levered: "Levered up",
};

interface StakeProjectionCardProps {
  member: LehumoMember;
  /** Current SAST collection period (YYYY-MM) — anchors term months left. */
  currentPeriod: string;
}

export function StakeProjectionCard({
  member,
  currentPeriod,
}: StakeProjectionCardProps) {
  const [levered, setLevered] = useState(false);

  const base = useMemo(
    () =>
      computeStakeProjection(
        member.contributionRows,
        currentPeriod,
        PROJECTION_MONTHLY_ZAR,
      ),
    [member.contributionRows, currentPeriod],
  );
  const up = useMemo(
    () =>
      computeStakeProjection(
        member.contributionRows,
        currentPeriod,
        LEVERED_MONTHLY_ZAR,
      ),
    [member.contributionRows, currentPeriod],
  );

  const p = levered ? up : base;
  const extraVotes = up.projectedVotes - base.projectedVotes;
  const extraValue = up.illustrativeLow - base.illustrativeLow;
  const belowFloor = p.tier === "below";

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      aria-label="Your projected stake at year 5"
      className="rounded-[24px] border border-white/[0.05] bg-gradient-to-b from-[#10224a] to-[#0F2040] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_8px_32px_-8px_rgba(0,0,0,0.35)] p-5 sm:p-7"
    >
      {/* Header + pace toggle */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#46CDCF]/15 text-[#46CDCF]">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[1.2px] uppercase text-[#46CDCF]">
              Your stake
            </p>
            <h2 className="mt-0.5 text-xl md:text-2xl font-bold text-white">
              Projected at year 5
            </h2>
          </div>
        </div>
        <div
          className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1"
          role="group"
          aria-label="Contribution pace"
        >
          <button
            type="button"
            onClick={() => setLevered(false)}
            className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition-colors ${
              !levered ? "bg-[#B8FF00] text-[#0B1933]" : "text-white/55 hover:text-white"
            }`}
          >
            On track
          </button>
          <button
            type="button"
            onClick={() => setLevered(true)}
            className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition-colors ${
              levered ? "bg-[#B8FF00] text-[#0B1933]" : "text-white/55 hover:text-white"
            }`}
          >
            Levered
          </button>
        </div>
      </div>

      {/* Two projected stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">
            Total contributed by 2031
          </p>
          <p className="mt-1.5 text-[26px] font-extrabold tracking-tight text-white tabular-nums">
            {formatZAR(p.projectedContributions)}
          </p>
          <p className="mt-1 text-[12px] text-white/45">
            {formatZAR(p.contributedToDate)} banked so far · {formatZAR(p.pace)}/mo
          </p>
        </div>

        <div className="rounded-2xl border border-[#B8FF00]/15 bg-[#B8FF00]/[0.04] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">
            Shares &amp; votes at conversion
          </p>
          {belowFloor ? (
            <>
              <p className="mt-1.5 text-[26px] font-extrabold tracking-tight text-white/70 tabular-nums">
                —
              </p>
              <p className="mt-1 text-[12px] text-[#F59E0B]">
                {formatZAR(p.toFloor)} short of the R40k floor
              </p>
            </>
          ) : (
            <>
              <div className="mt-1.5 flex items-center gap-2">
                <Vote className="w-5 h-5 text-[#B8FF00]" />
                <p className="text-[26px] font-extrabold tracking-tight text-white tabular-nums">
                  {p.projectedVotes}
                </p>
                {p.tier === "levered" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#C1FF72]/15 px-2 py-0.5 text-[10px] font-bold text-[#C1FF72]">
                    <Sparkles className="w-3 h-3" /> Levered
                  </span>
                )}
              </div>
              <p className="mt-1 text-[12px] text-white/45">
                {p.projectedVotes} shares &amp; {p.projectedVotes} votes ·{" "}
                {TIER_LABEL[p.tier]}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Conversion scale — makes the R20k = 1 vote rule visible, with the
          member's projected tier highlighted. */}
      <div className="mt-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <p className="text-[11px] text-white/45">
          Every <span className="font-semibold text-white/75">R20,000</span> = 1
          share &amp; 1 vote — R40k floor, 5 max
        </p>
        <div className="mt-2.5 flex items-stretch gap-2">
          {VOTE_TIERS.map((t) => {
            const active = !belowFloor && p.projectedVotes === t.votes;
            return (
              <div
                key={t.votes}
                className={`flex-1 rounded-xl px-2 py-2 text-center transition-colors ${
                  active ? "bg-[#B8FF00] text-[#0B1933]" : "bg-white/[0.04] text-white/45"
                }`}
              >
                <p className="text-[14px] font-extrabold leading-none tabular-nums">
                  {t.votes}
                </p>
                <p
                  className={`mt-1 text-[10px] font-semibold leading-none ${
                    active ? "text-[#0B1933]/70" : "text-white/35"
                  }`}
                >
                  R{t.threshold / 1000}k{t.max ? " · max" : ""}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Illustrative value at year 5 */}
      <div className="mt-3 rounded-2xl border border-[#46CDCF]/15 bg-gradient-to-br from-[#46CDCF]/[0.06] to-transparent p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">
          Illustrative value at year 5
        </p>
        <p className="mt-1.5 text-[28px] font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#46CDCF] to-[#B8FF00] tabular-nums">
          {p.illustrativeLow === p.illustrativeHigh
            ? formatZAR(p.illustrativeLow)
            : `${formatZAR(p.illustrativeLow)} – ${formatZAR(p.illustrativeHigh)}`}
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-white/35">
          Illustration at the strategy&rsquo;s 15–17% target net return — a
          projection of the plan, <span className="text-white/50">not a
          guarantee or a promise of returns</span>. Past performance never
          guarantees future results. Lime Pages is not an FSP and this is not
          financial advice.
        </p>
      </div>

      {/* Lever-up nudge — only on the base view, when it actually adds votes */}
      {!levered && extraVotes > 0 && (
        <button
          type="button"
          onClick={() => setLevered(true)}
          className="group mt-3 flex w-full items-center justify-between gap-3 rounded-2xl border border-[#B8FF00]/15 bg-[#B8FF00]/[0.04] px-4 py-3 text-left transition-colors hover:bg-[#B8FF00]/[0.08]"
        >
          <span className="text-[12.5px] text-white/70">
            Levering up to {formatZAR(LEVERED_MONTHLY_ZAR)}/mo →{" "}
            <span className="font-semibold text-white">
              +{extraVotes} vote{extraVotes > 1 ? "s" : ""}
            </span>
            {extraValue > 0 && (
              <>
                {" "}
                and about{" "}
                <span className="font-semibold text-white">
                  {formatZAR(extraValue)}
                </span>{" "}
                more
              </>
            )}
          </span>
          <ArrowUpRight className="w-4 h-4 shrink-0 text-[#B8FF00] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )}
    </motion.section>
  );
}
