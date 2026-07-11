"use client";

import { motion } from "framer-motion";
import { Medal, ArrowRight } from "lucide-react";

import type {
  ContributionLeaderboard,
  LeaderboardEntry,
} from "@/lib/definitions";

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "2026-07" → "July 2026" (built from the period string — no Date
 *  parsing, so no timezone drift). */
function periodLabel(period: string): string {
  const [y, m] = period.split("-").map(Number);
  const long = new Date(2000, (m ?? 1) - 1, 1).toLocaleString("en-ZA", {
    month: "long",
  });
  return `${long} ${y}`;
}

/** "2026-07" → "Jul 2026" — the month a member last paid for. */
function periodShort(period: string): string {
  const [y, m] = period.split("-").map(Number);
  return `${MONTH_SHORT[(m ?? 1) - 1]} ${y}`;
}

/** Gold / silver / bronze for the podium; quiet numbers below. */
function rankBadgeClass(rank: number): string {
  if (rank === 1) return "bg-[#F5C542]/20 text-[#F5C542] border-[#F5C542]/30";
  if (rank === 2) return "bg-[#C0C7D1]/15 text-[#C0C7D1] border-[#C0C7D1]/25";
  if (rank === 3) return "bg-[#CD7F32]/20 text-[#D9915B] border-[#CD7F32]/30";
  return "bg-white/[0.05] text-white/45 border-white/[0.08]";
}

/** Rows shown before the board truncates (the viewer's row is always
 *  appended if it falls below the fold). */
const TOP_N = 8;

function LeaderRow({
  entry,
  isViewer,
  monthsDue,
}: {
  entry: LeaderboardEntry;
  isViewer: boolean;
  monthsDue: number;
}) {
  const behind = monthsDue - entry.keptCount;
  return (
    <li
      className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 ${
        isViewer
          ? "border-[#B8FF00]/25 bg-[#B8FF00]/[0.05]"
          : "border-white/[0.05] bg-white/[0.02]"
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[12px] font-extrabold tabular-nums ${rankBadgeClass(entry.rank)}`}
      >
        {entry.rank}
      </span>
      <span className="flex-1 min-w-0 flex items-center gap-2">
        <span className="text-[14px] font-bold tracking-tight text-white">
          {entry.memberNumber}
        </span>
        {isViewer && (
          <span className="rounded-full bg-[#B8FF00]/15 px-2 py-0.5 text-[10px] font-bold text-[#B8FF00]">
            you
          </span>
        )}
      </span>
      <span className="text-right">
        <span className="block text-[12.5px] font-semibold tabular-nums text-white/75">
          <span className="font-medium text-white/40">Paid for </span>
          {periodShort(entry.lastPaidPeriod)}
        </span>
        <span
          className={`block text-[10.5px] font-semibold tabular-nums ${
            behind === 0 ? "text-[#B8FF00]" : "text-[#F5C542]"
          }`}
        >
          {entry.keptCount}/{monthsDue} {behind === 0 ? "kept up" : "behind"}
        </span>
      </span>
    </li>
  );
}

interface LeaderboardCardProps {
  leaderboard: ContributionLeaderboard;
  /** The logged-in member's formatted number ("Leh17") — used only to
   *  highlight their own row. */
  viewerNumber: string;
  /** Cohort size for the "X of Y in" footer. */
  activeMembers: number;
}

export function LeaderboardCard({
  leaderboard,
  viewerNumber,
  activeMembers,
}: LeaderboardCardProps) {
  const { entries, paidCount, period, monthsDue } = leaderboard;
  const label = periodLabel(period);
  const monthOnly = label.split(" ")[0];

  const viewerIdx = entries.findIndex((e) => e.memberNumber === viewerNumber);
  const viewerOnBoard = viewerIdx >= 0;
  const visible = entries.slice(0, TOP_N);
  const viewerBelowFold = viewerOnBoard && viewerIdx >= TOP_N;
  const hiddenCount = Math.max(0, entries.length - TOP_N - (viewerBelowFold ? 1 : 0));

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      aria-label="Anonymised contribution leaderboard"
      className="rounded-[24px] border border-white/[0.05] bg-gradient-to-b from-[#10224a] to-[#0F2040] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_8px_32px_-8px_rgba(0,0,0,0.35)] p-5 sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5C542]/15 text-[#F5C542]">
            <Medal className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[1.2px] uppercase text-[#46CDCF]">
              Community
            </p>
            <h2 className="mt-0.5 text-xl md:text-2xl font-bold text-white">
              Contribution leaderboard
            </h2>
          </div>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[12px] font-semibold text-white/70">
          {label}
        </span>
      </div>
      <p className="text-[12.5px] text-white/45 mb-5">
        First in for {monthOnly} — anonymised by member number. Same-day
        payments share a rank.
      </p>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">
          <p className="text-[13.5px] text-white/65">
            No contributions in for {monthOnly} yet — the top spot is wide
            open. 🥇
          </p>
          <a
            href="#payment"
            className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#B8FF00] hover:text-[#C1FF72] transition-colors"
          >
            Make your contribution
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      ) : (
        <>
          <ol className="space-y-1.5">
            {visible.map((e) => (
              <LeaderRow
                key={e.memberNumber}
                entry={e}
                isViewer={e.memberNumber === viewerNumber}
                monthsDue={monthsDue}
              />
            ))}

            {viewerBelowFold && (
              <>
                <li aria-hidden className="text-center text-[12px] text-white/30 py-0.5">
                  ⋯
                </li>
                <LeaderRow
                  entry={entries[viewerIdx]}
                  isViewer
                  monthsDue={monthsDue}
                />
              </>
            )}
          </ol>

          {hiddenCount > 0 && (
            <p className="mt-2 text-center text-[11px] text-white/30">
              + {hiddenCount} more on the board
            </p>
          )}

          {!viewerOnBoard && (
            <a
              href="#payment"
              className="group mt-3 flex items-center justify-between gap-3 rounded-2xl border border-[#B8FF00]/15 bg-[#B8FF00]/[0.04] px-4 py-3 transition-colors hover:bg-[#B8FF00]/[0.08]"
            >
              <span className="text-[12.5px] text-white/70">
                You&rsquo;re not on the {monthOnly} board yet —{" "}
                <span className="font-semibold text-white">
                  make your contribution to claim a spot
                </span>
              </span>
              <ArrowRight className="w-4 h-4 shrink-0 text-[#B8FF00] group-hover:translate-x-0.5 transition-transform" />
            </a>
          )}
        </>
      )}

      <p className="mt-4 text-[11px] text-white/35">
        {paidCount} of {activeMembers} members in for {monthOnly} · the{" "}
        <span className="text-white/55">{monthsDue > 1 ? `x/${monthsDue}` : "x/1"}</span>{" "}
        score is months kept up since launch.
      </p>
    </motion.section>
  );
}
