"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, ArrowUpRight } from "lucide-react";

import type { LehumoMember } from "@/lib/definitions";
import {
  computeStakeProjection,
  PROJECTION_MONTHLY_ZAR,
  LEVERED_MONTHLY_ZAR,
  VOTE_STEP_ZAR,
  MAX_VOTES,
  FLOOR_ZAR,
} from "@/lib/lehumo-projection";

function formatZAR(n: number): string {
  return `R${n.toLocaleString("en-ZA")}`;
}

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

  // One segment per share & vote (R20k each, to R100k = 5). Each segment
  // carries two fills: a solid fill from what's banked so far (real earned
  // progress) and a fainter fill to the projected year-5 total at this pace.
  const segments = Array.from({ length: MAX_VOTES }, (_, i) => {
    const low = i * VOTE_STEP_ZAR;
    const threshold = (i + 1) * VOTE_STEP_ZAR;
    const frac = (v: number) =>
      Math.max(0, Math.min(1, (v - low) / VOTE_STEP_ZAR));
    return {
      voteNum: i + 1,
      threshold,
      solid: frac(p.contributedToDate),
      ghost: frac(p.projectedContributions),
      earnedFull: p.contributedToDate >= threshold,
    };
  });

  const thresholdLabel = (t: number) =>
    t === FLOOR_ZAR ? "floor" : t === MAX_VOTES * VOTE_STEP_ZAR ? "max" : "";

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      aria-label="Your shares, votes and projected stake"
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
              Shares, votes &amp; value
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

      {/* Shares & votes earned — the segmented bar. Solid = earned from what's
          banked, faint = projected by 2031 at this pace. */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="flex items-end justify-between gap-3 mb-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/60">
              Shares &amp; votes earned
            </p>
            <p className="mt-1 text-[26px] font-extrabold tracking-tight text-white tabular-nums leading-none">
              {p.earnedVotes}{" "}
              <span className="text-[15px] font-semibold text-white/60">
                of {MAX_VOTES}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-white/60">On this pace by 2031</p>
            <p className="mt-0.5 text-[15px] font-bold tabular-nums text-[#B8FF00]">
              {p.projectedVotes > 0
                ? `${p.projectedVotes} vote${p.projectedVotes > 1 ? "s" : ""}`
                : "Below floor"}
            </p>
          </div>
        </div>

        {/* Segmented bar */}
        <div className="flex items-stretch gap-1.5">
          {segments.map((s) => (
            <div key={s.voteNum} className="flex-1">
              <div className="relative h-3.5 rounded-md bg-white/[0.06] overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-[#B8FF00]/20 transition-all"
                  style={{ width: `${s.ghost * 100}%` }}
                />
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#46CDCF] to-[#B8FF00] transition-all"
                  style={{ width: `${s.solid * 100}%` }}
                />
              </div>
              <p
                className={`mt-1.5 text-center text-[10px] font-semibold leading-none ${
                  s.earnedFull ? "text-[#B8FF00]" : "text-white/60"
                }`}
              >
                R{s.threshold / 1000}k
              </p>
              <p className="mt-0.5 text-center text-[9px] leading-none text-white/25">
                {thresholdLabel(s.threshold) || " "}
              </p>
            </div>
          ))}
        </div>

        {/* Legend + progress hint */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] text-white/60">
              <span className="h-2 w-3.5 rounded-sm bg-gradient-to-r from-[#46CDCF] to-[#B8FF00]" />
              earned
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] text-white/60">
              <span className="h-2 w-3.5 rounded-sm bg-[#B8FF00]/20" />
              on track by 2031
            </span>
          </div>
          {p.toNextVote > 0 && (
            <p className="text-[10.5px] text-white/60">
              <span className="font-semibold text-white/70">
                {formatZAR(p.toNextVote)}
              </span>{" "}
              to your next
            </p>
          )}
        </div>
        <p className="mt-2 text-[11px] text-white/60">
          Every {formatZAR(VOTE_STEP_ZAR)} earns 1 share &amp; 1 vote · reach{" "}
          {formatZAR(FLOOR_ZAR)} by year 5 to convert · {MAX_VOTES} max
        </p>
      </div>

      {/* Total contributed by 2031 */}
      <div className="mt-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/60">
          Total contributed by 2031
        </p>
        <p className="mt-1.5 text-[26px] font-extrabold tracking-tight text-white tabular-nums">
          {formatZAR(p.projectedContributions)}
        </p>
        <p className="mt-1 text-[12px] text-white/60">
          {formatZAR(p.contributedToDate)} banked so far · {formatZAR(p.pace)}/mo
        </p>
      </div>

      {/* Illustrative value at year 5 */}
      <div className="mt-3 rounded-2xl border border-[#46CDCF]/15 bg-gradient-to-br from-[#46CDCF]/[0.06] to-transparent p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/60">
          Illustrative value at year 5
        </p>
        <p className="mt-1.5 text-[28px] font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#46CDCF] to-[#B8FF00] tabular-nums">
          {p.illustrativeLow === p.illustrativeHigh
            ? formatZAR(p.illustrativeLow)
            : `${formatZAR(p.illustrativeLow)} – ${formatZAR(p.illustrativeHigh)}`}
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-white/60">
          Illustration at the strategy&rsquo;s 15–17% target net return — a
          projection of the plan, <span className="text-white/60">not a
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
