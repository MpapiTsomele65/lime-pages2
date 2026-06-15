"use client";

/**
 * WhereIsOurMoneyCard — member-facing portfolio allocation.
 *
 * Answers "where is our money now?" with a conic-gradient donut of the
 * current allocation, each slice's percentage AND its Rand value of the
 * live total pool, plus the admin-authored strategy narrative and an
 * "as at" date. Allocation + note come from the Lehumo Fund Settings
 * singleton (admin-editable on Settings); totalPool comes from the
 * community pool stats already loaded for the dashboard.
 *
 * Dark navy card matching CommunityPoolCard; donut pattern mirrors the
 * marketing InvestmentStrategy section.
 */

import { motion } from "framer-motion";
import { PieChart } from "lucide-react";

import type { PortfolioSlice } from "@/lib/definitions";

interface WhereIsOurMoneyCardProps {
  allocation: PortfolioSlice[];
  strategyNote: string;
  /** YYYY-MM-DD, or null. */
  asAt: string | null;
  /** Current total pool in ZAR — drives each slice's Rand value. */
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
  // Normalise so the donut always closes a full circle even if the
  // stored percentages drift slightly off 100.
  const totalPct = allocation.reduce((s, r) => s + r.pct, 0) || 1;

  // Build the conic-gradient stops + remember each slice's [start,end]
  // sweep so the legend can read identically to the ring.
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
            Current portfolio allocation
          </h2>
        </div>
        {asAtLabel && (
          <div className="text-right">
            <p className="text-[10px] font-semibold tracking-[1px] uppercase text-white/40">
              As at
            </p>
            <p className="text-sm font-semibold text-white/80 tabular-nums mt-0.5">
              {asAtLabel}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
        {/* Donut */}
        <div className="relative shrink-0 mx-auto sm:mx-0">
          <div
            className="h-40 w-40 rounded-full"
            style={{ background: conic }}
            role="img"
            aria-label="Portfolio allocation donut chart"
          />
          {/* Inner hole — punches the ring into a donut + shows the pool. */}
          <div className="absolute inset-0 m-[26px] rounded-full bg-[#0F2040] border border-white/[0.06] flex flex-col items-center justify-center">
            <span className="text-[9.5px] font-semibold uppercase tracking-[1px] text-white/40">
              Total pool
            </span>
            <span className="text-base font-extrabold text-[#B8FF00] tabular-nums leading-tight">
              {formatZAR(totalPool)}
            </span>
          </div>
        </div>

        {/* Legend */}
        <ul className="flex-1 space-y-2.5 min-w-0">
          {slices.map((slice) => (
            <li
              key={slice.label}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="h-3 w-3 rounded-sm shrink-0"
                  style={{ backgroundColor: slice.color }}
                  aria-hidden
                />
                <span className="text-sm text-white/85 truncate">
                  {slice.label}
                </span>
              </div>
              <div className="flex items-baseline gap-2 shrink-0 tabular-nums">
                <span className="text-sm font-bold text-white">
                  {slice.pct}%
                </span>
                {totalPool > 0 && (
                  <span className="text-xs text-white/45">
                    {formatZAR(slice.randValue)}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
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
        Allocation reflects the fund&rsquo;s current strategy and is reviewed
        regularly. Rand values are each slice&rsquo;s share of the total pool
        today.
      </p>
    </motion.section>
  );
}
