"use client";

import { motion } from "framer-motion";
import { Flame, Trophy, Sparkles } from "lucide-react";

import type { LehumoMember } from "@/lib/definitions";
import { computeMilestoneProgress } from "@/lib/lehumo-milestones";

function formatZAR(n: number): string {
  return `R${n.toLocaleString("en-ZA")}`;
}

interface MilestonesCardProps {
  member: LehumoMember;
  /** Current SAST collection period (YYYY-MM) — anchors the streak. */
  currentPeriod: string;
}

export function MilestonesCard({ member, currentPeriod }: MilestonesCardProps) {
  const p = computeMilestoneProgress(member.contributionRows, currentPeriod);
  const nextPct =
    p.next && p.next.threshold > 0
      ? Math.min(100, (p.totalContributed / p.next.threshold) * 100)
      : 100;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      aria-label="Your contribution milestones"
      className="rounded-[24px] border border-white/[0.05] bg-gradient-to-b from-[#10224a] to-[#0F2040] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_8px_32px_-8px_rgba(0,0,0,0.35)] p-5 sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <p className="text-[11px] font-semibold tracking-[1.2px] uppercase text-[#46CDCF]">
            Your progress
          </p>
          <h2 className="mt-1 text-xl md:text-2xl font-bold text-white">
            Milestones
          </h2>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#F59E0B]/25 bg-[#F59E0B]/[0.08] px-3 py-1.5">
          <Flame className="w-4 h-4 text-[#F59E0B]" />
          <span className="text-[13px] font-bold text-white tabular-nums">
            {p.streak > 0 ? `${p.streak}-month streak` : "Start your streak"}
          </span>
        </div>
      </div>

      {/* Current badge */}
      <div className="flex items-center gap-3.5 rounded-2xl border border-[#B8FF00]/20 bg-[#B8FF00]/[0.05] p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#B8FF00]/15 text-[#B8FF00]">
          <Trophy className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-white">
            {p.current ? p.current.label : "Just getting started"}
          </p>
          <p className="text-[12.5px] text-white/55">
            {p.current
              ? p.current.sub
              : "Your first R1,000 unlocks the Founding badge"}
          </p>
        </div>
        {p.levered && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#C1FF72]/15 px-2.5 py-1 text-[11px] font-bold text-[#C1FF72] shrink-0">
            <Sparkles className="w-3 h-3" /> Levered up
          </span>
        )}
      </div>

      {/* Next milestone progress */}
      {p.next ? (
        <div className="mt-4">
          <div className="flex items-end justify-between gap-3 mb-1.5">
            <p className="text-[13px] text-white/60">
              Next: <span className="text-white font-semibold">{p.next.label}</span>
            </p>
            <p className="text-[13px] font-bold tabular-nums text-[#B8FF00]">
              {formatZAR(p.toNext)} to go
            </p>
          </div>
          <div className="relative h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#46CDCF] to-[#B8FF00] transition-all"
              style={{ width: `${nextPct}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="mt-4 text-[13px] text-white/65">
          You&rsquo;ve cleared every milestone — full standard. 🎉
        </p>
      )}

      <p className="mt-5 text-[11px] text-white/60">
        {formatZAR(p.totalContributed)} contributed to the pool so far.
      </p>
    </motion.section>
  );
}
