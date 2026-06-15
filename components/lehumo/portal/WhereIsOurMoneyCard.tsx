"use client";

/**
 * WhereIsOurMoneyCard — member-facing portfolio allocation, shown as
 * two side-by-side views:
 *
 *   • CURRENT — where the money actually sits today (admin-editable via
 *     the Fund Settings singleton). At launch this is ~100% cash while
 *     the collective investment portfolio is established. Shows each
 *     slice's % AND its Rand value of the live pool.
 *   • TARGET — the agreed steady-state strategy the fund is building
 *     toward (LEHUMO_TARGET_ALLOCATION, 40/40/10/10). Fixed north star,
 *     percentages only.
 *
 * Showing both together keeps members reminded that today's allocation
 * is a deliberate, temporary build-phase position — not the destination.
 * The admin-authored strategy note explains the progression.
 *
 * Dark navy card matching CommunityPoolCard; conic-gradient donuts
 * mirror the marketing InvestmentStrategy section.
 */

import { motion } from "framer-motion";
import { ArrowRight, PieChart } from "lucide-react";

import {
  LEHUMO_TARGET_ALLOCATION,
  type PortfolioSlice,
} from "@/lib/definitions";

interface WhereIsOurMoneyCardProps {
  /** CURRENT allocation — where the money is today. */
  allocation: PortfolioSlice[];
  strategyNote: string;
  /** YYYY-MM-DD, or null. */
  asAt: string | null;
  /** Current total pool in ZAR — drives the current view's Rand values. */
  totalPool: number;
}

function formatZAR(n: number): string {
  return `R${Math.round(n).toLocaleString("en-ZA")}`;
}

function formatAsAt(iso: string | null): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${d} ${months[m - 1] ?? ""} ${y}`;
}

export function WhereIsOurMoneyCard({
  allocation,
  strategyNote,
  asAt,
  totalPool,
}: WhereIsOurMoneyCardProps) {
  const asAtLabel = formatAsAt(asAt);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      aria-label="Where is our money now"
      className="rounded-[24px] border border-white/[0.05] bg-gradient-to-b from-[#10224a] to-[#0F2040] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_8px_32px_-8px_rgba(0,0,0,0.35)] p-5 sm:p-7"
    >
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="text-[11px] font-semibold tracking-[1.2px] uppercase text-[#46CDCF] flex items-center gap-1.5">
            <PieChart className="w-3.5 h-3.5" />
            Where is our money now?
          </p>
          <h2 className="mt-1 text-xl md:text-2xl font-bold text-white">
            Current allocation &amp; where we&rsquo;re heading
          </h2>
        </div>
        {asAtLabel && (
          <div className="text-right">
            <p className="text-[10px] font-semibold tracking-[1px] uppercase text-white/40">
              Current as at
            </p>
            <p className="text-sm font-semibold text-white/80 tabular-nums mt-0.5">
              {asAtLabel}
            </p>
          </div>
        )}
      </div>

      {/* Two views: current (live) + target (steady state). The arrow
          between them reads "today → destination". */}
      <div className="flex flex-col lg:flex-row items-stretch gap-4">
        {/* CURRENT */}
        <AllocationView
          allocation={allocation}
          totalPool={totalPool}
          showRand
          eyebrow="Current"
          eyebrowTint="text-[#46CDCF]"
          note="Held in cash during the build phase"
          centerLabel="Total pool"
          centerValue={formatZAR(totalPool)}
        />

        {/* Arrow / progression marker */}
        <div className="flex lg:flex-col items-center justify-center gap-1 text-white/30 shrink-0">
          <ArrowRight className="h-5 w-5 lg:rotate-0 rotate-90 hidden lg:block" />
          <ArrowRight className="h-5 w-5 rotate-90 lg:hidden" />
          <span className="text-[9px] font-semibold uppercase tracking-[1px]">
            Building toward
          </span>
        </div>

        {/* TARGET */}
        <AllocationView
          allocation={LEHUMO_TARGET_ALLOCATION}
          totalPool={0}
          showRand={false}
          eyebrow="Target · steady state"
          eyebrowTint="text-[#B8FF00]"
          note="Our agreed long-term strategy"
          centerLabel="Steady"
          centerValue="state"
          muted
        />
      </div>

      {/* Strategy narrative */}
      {strategyNote.trim() && (
        <div className="mt-6 pt-5 border-t border-white/[0.06]">
          <p className="text-[10px] font-semibold tracking-[1px] uppercase text-white/40 mb-2">
            Investment strategy
          </p>
          <p className="text-[13px] text-white/65 leading-relaxed whitespace-pre-line">
            {strategyNote}
          </p>
        </div>
      )}

      <p className="mt-4 text-[10px] text-white/30 leading-relaxed">
        The current allocation is a deliberate build-phase position and is
        reviewed regularly — we deploy toward the target as collective
        investment mandates are signed. Rand values are each slice&rsquo;s
        share of the total pool today.
      </p>
    </motion.section>
  );
}

// ── Internal: one allocation view (donut + legend) ──────────────────

function AllocationView({
  allocation,
  totalPool,
  showRand,
  eyebrow,
  eyebrowTint,
  note,
  centerLabel,
  centerValue,
  muted = false,
}: {
  allocation: PortfolioSlice[];
  totalPool: number;
  showRand: boolean;
  eyebrow: string;
  eyebrowTint: string;
  note: string;
  centerLabel: string;
  centerValue: string;
  muted?: boolean;
}) {
  const totalPct = allocation.reduce((s, r) => s + r.pct, 0) || 1;
  let cursor = 0;
  const stops: string[] = [];
  const slices = allocation.map((slice) => {
    const start = (cursor / totalPct) * 100;
    cursor += slice.pct;
    const end = (cursor / totalPct) * 100;
    stops.push(`${slice.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`);
    return { ...slice, randValue: (slice.pct / 100) * totalPool };
  });
  const conic = `conic-gradient(${stops.join(", ")})`;

  return (
    <div
      className={`flex-1 rounded-[18px] border p-4 sm:p-5 ${
        muted
          ? "border-white/[0.06] bg-white/[0.015]"
          : "border-white/[0.08] bg-white/[0.025]"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <p
          className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${eyebrowTint}`}
        >
          {eyebrow}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Donut */}
        <div className="relative shrink-0">
          <div
            className="h-28 w-28 rounded-full"
            style={{ background: conic }}
            role="img"
            aria-label={`${eyebrow} allocation donut`}
          />
          <div className="absolute inset-0 m-[20px] rounded-full bg-[#0F2040] border border-white/[0.06] flex flex-col items-center justify-center text-center px-1">
            <span className="text-[8px] font-semibold uppercase tracking-[0.5px] text-white/40 leading-tight">
              {centerLabel}
            </span>
            <span
              className={`text-[12px] font-extrabold tabular-nums leading-tight ${
                muted ? "text-white/70" : "text-[#B8FF00]"
              }`}
            >
              {centerValue}
            </span>
          </div>
        </div>

        {/* Legend */}
        <ul className="flex-1 min-w-0 space-y-2">
          {slices.map((slice) => (
            <li key={slice.label} className="min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: slice.color }}
                    aria-hidden
                  />
                  <span className="text-[12.5px] text-white/80 truncate">
                    {slice.label}
                  </span>
                </div>
                <span className="text-[12.5px] font-bold text-white tabular-nums shrink-0">
                  {slice.pct}%
                </span>
              </div>
              {showRand && totalPool > 0 && (
                <p className="ml-[18px] text-[11px] text-white/40 tabular-nums">
                  {formatZAR(slice.randValue)}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-[11px] text-white/40 leading-snug">{note}</p>
    </div>
  );
}
