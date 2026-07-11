"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Landmark, Target, TrendingUp, UserCheck, Users, Wallet } from "lucide-react";
import type { CommunityPoolStats } from "@/lib/definitions";

interface CommunityPoolCardProps {
  stats: CommunityPoolStats;
  /** The signed-in member's own total contributed (R). */
  myContributed: number;
  /** True until 1 Jun 2026 SAST. Pre-launch the "Members Contributing"
   *  sub-text reframes from `0 paid in May` to `2 prepaid Jun 2026` —
   *  more useful framing for the actual situation (collections haven't
   *  started, but eager members have already paid into the launch
   *  period). Falls back to false (post-launch behaviour) when omitted. */
  beforeLaunch?: boolean;
}

function formatZAR(n: number): string {
  if (n >= 1_000_000) return `R${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 10_000) return `R${Math.round(n / 1000)}K`;
  return `R${Math.round(n).toLocaleString()}`;
}

export function CommunityPoolCard({
  stats,
  myContributed,
  beforeLaunch = false,
}: CommunityPoolCardProps) {
  const { timeline, currentMonth } = stats;

  // Build SVG path for the cumulative balance line + area fill.
  const chart = useMemo(() => {
    const W = 600;
    const H = 140;
    const padX = 8;
    const padY = 8;
    const n = timeline.length;
    const maxBalance = Math.max(1, ...timeline.map((p) => p.cumulativeBalance));

    const pts = timeline.map((p, i) => {
      const x = padX + (i * (W - padX * 2)) / (n - 1);
      const y = H - padY - ((p.cumulativeBalance / maxBalance) * (H - padY * 2));
      return { x, y, ...p };
    });

    const linePath = pts
      .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
      .join(" ");

    const areaPath =
      `M ${pts[0].x.toFixed(1)} ${H - padY} ` +
      pts.map((pt) => `L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(" ") +
      ` L ${pts[n - 1].x.toFixed(1)} ${H - padY} Z`;

    return { W, H, pts, linePath, areaPath };
  }, [timeline]);

  const currentPoint = timeline.find((p) => p.month === currentMonth);
  // "TOTAL POOL TODAY" should reflect every Rand that's already been
  // banked, regardless of which calendar month the payment lands
  // against. The timeline's currentMonth point reads zero pre-launch
  // even though members may have prepaid June — taking the max here
  // means prepayments surface immediately without breaking the
  // post-launch case (where currentPoint.cumulativeBalance and
  // stats.totalPool grow together).
  const currentBalance = Math.max(
    currentPoint?.cumulativeBalance ?? 0,
    stats.totalPool,
  );

  // Pre-launch sub-text reframes the "current month" view that's
  // technically correct (0 members paid in May 2026) but emotionally
  // negative — the truth is X members have prepaid the launch period.
  // The Jun 2026 anchor is the canonical first collection month so
  // matches the rest of the launch-policy copy across the portal.
  const membersContributingSub = beforeLaunch
    ? `${stats.membersContributedEver} prepaid Jun 2026`
    : `${stats.membersContributingThisMonth} paid in ${currentMonth}`;

  const statTiles = [
    {
      icon: Users,
      label: "Members Contributing",
      value: `${stats.membersContributedEver} / ${stats.totalFoundingSlots}`,
      sub: membersContributingSub,
      color: "text-[#B8FF00]",
      tint: "bg-[#B8FF00]/[0.08] border-[#B8FF00]/20",
    },
    {
      icon: Landmark,
      label: "Pool Contributed",
      value: formatZAR(stats.totalContributed),
      sub: "All members, all months",
      color: "text-[#46CDCF]",
      tint: "bg-[#46CDCF]/[0.08] border-[#46CDCF]/20",
    },
    {
      icon: TrendingUp,
      label: "Interest Earned",
      value: formatZAR(stats.totalInterest),
      sub: "Cumulative to date",
      color: "text-[#B8FF00]",
      tint: "bg-[#B8FF00]/[0.08] border-[#B8FF00]/20",
    },
    {
      icon: Wallet,
      label: "Your Contribution",
      value: formatZAR(myContributed),
      sub: `Of ${formatZAR(stats.totalContributed)} pool`,
      color: "text-white",
      tint: "bg-white/[0.04] border-white/10",
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      aria-label="Community pool overview"
      className="rounded-[24px] border border-white/[0.05] bg-gradient-to-b from-[#10224a] to-[#0F2040] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_8px_32px_-8px_rgba(0,0,0,0.35)] p-5 sm:p-7"
    >
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <p className="text-[11px] font-semibold tracking-[1.2px] uppercase text-[#46CDCF]">
            Community Pool
          </p>
          <h2 className="mt-1 text-xl md:text-2xl font-bold text-white">
            Cumulative Balance
          </h2>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold tracking-[1px] uppercase text-white/60">
            Total pool today
          </p>
          <p className="text-2xl md:text-3xl font-extrabold text-[#B8FF00] tabular-nums leading-none mt-1">
            {formatZAR(currentBalance)}
          </p>
        </div>
      </div>

      {/* Cumulative chart */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:p-4 mb-5 overflow-hidden">
        <svg
          viewBox={`0 0 ${chart.W} ${chart.H}`}
          className="w-full h-[120px] sm:h-[160px]"
          role="img"
          aria-label="Cumulative pool balance over the past 12 months"
        >
          <defs>
            <linearGradient id="poolAreaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B8FF00" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#B8FF00" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Gridline (midline) */}
          <line
            x1="8"
            x2={chart.W - 8}
            y1={chart.H / 2}
            y2={chart.H / 2}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="3 4"
          />

          {/* Area fill */}
          <path d={chart.areaPath} fill="url(#poolAreaFill)" />

          {/* Line */}
          <path
            d={chart.linePath}
            fill="none"
            stroke="#B8FF00"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Point markers — highlight the current month */}
          {chart.pts.map((pt) => {
            const isCurrent = pt.month === currentMonth;
            const hasData = pt.cumulativeBalance > 0;
            if (!hasData && !isCurrent) return null;
            return (
              <circle
                key={pt.month}
                cx={pt.x}
                cy={pt.y}
                r={isCurrent ? 4 : 2.5}
                fill={isCurrent ? "#B8FF00" : "rgba(184,255,0,0.6)"}
                stroke={isCurrent ? "#0F2040" : "none"}
                strokeWidth={isCurrent ? 2 : 0}
              />
            );
          })}
        </svg>

        {/* Month axis */}
        <div className="mt-1 grid grid-cols-12 gap-1 px-1 text-[10px] font-medium text-white/60">
          {timeline.map((pt) => (
            <span
              key={pt.month}
              className={`text-center ${pt.month === currentMonth ? "text-[#B8FF00]" : ""}`}
            >
              {pt.month}
            </span>
          ))}
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statTiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <div
              key={tile.label}
              className={`flex flex-col gap-2 rounded-xl border p-3.5 ${tile.tint}`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${tile.color}`} />
                <span className="text-[10px] font-semibold tracking-[1px] uppercase text-white/60">
                  {tile.label}
                </span>
              </div>
              <div className={`text-xl font-extrabold tabular-nums ${tile.color}`}>
                {tile.value}
              </div>
              <div className="text-[11px] text-white/60">{tile.sub}</div>
            </div>
          );
        })}
      </div>

      {/* ── Rolling monthly goal bars ──────────────────────────────
          The current collection period plus the prior month(s), so the
          member sees the last few months side by side rather than just
          this one. Each bar: net received (Paid rows × R1,000) vs the
          cohort goal (onboarded × R1,000). Most-recent month on top. */}
      {stats.recentMonths.length > 0 && (
        <div className="mt-5 pt-5 border-t border-white/[0.06]">
          <p className="text-[10px] font-semibold tracking-[1px] uppercase text-white/60 flex items-center gap-1.5 mb-3">
            <Target className="w-3 h-3" />
            Monthly contributions
          </p>
          <div className="space-y-3">
            {[...stats.recentMonths].reverse().map((m, i) => {
              const pct =
                m.goal > 0 ? Math.min(100, (m.received / m.goal) * 100) : 0;
              const isCurrent = i === 0;
              const monthOnly = m.label.split(" ")[0];
              return (
                <div key={m.period}>
                  <div className="flex items-end justify-between gap-3 mb-1.5">
                    <p className="text-sm">
                      <span
                        className={`font-semibold ${isCurrent ? "text-white" : "text-white/70"}`}
                      >
                        {monthOnly}
                      </span>
                      <span className="text-white/60"> &middot; </span>
                      <span className="text-[#B8FF00] font-bold tabular-nums">
                        {formatZAR(m.received)}
                      </span>
                      <span className="text-white/60"> of </span>
                      <span className="text-white/70 tabular-nums">
                        {formatZAR(m.goal)}
                      </span>
                    </p>
                    <p
                      className={`text-sm font-extrabold tabular-nums leading-none ${isCurrent ? "text-[#B8FF00]" : "text-white/60"}`}
                    >
                      {Math.round(pct)}%
                    </p>
                  </div>
                  <div
                    className={`relative rounded-full bg-white/[0.06] overflow-hidden ${isCurrent ? "h-3" : "h-2"}`}
                  >
                    <div
                      className="absolute top-0 left-0 h-full transition-all bg-gradient-to-r from-[#46CDCF] to-[#B8FF00]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-white/60">
            {stats.membersOnboarded} onboarded members &times; R1,000 = full
            cohort target each month.
          </p>
        </div>
      )}

      {/* ── Cohort progress trackers ──────────────────────────────
          Sit below the money tiles as a separate row. Different
          concept ("how far along is the founding circle?" vs "where
          is the money?") so visually demarcated with a divider +
          eyebrow label. Two tiles wide on mobile, side by side on
          desktop. */}
      <div className="mt-5 pt-5 border-t border-white/[0.06]">
        <p className="text-[10px] font-semibold tracking-[1px] uppercase text-white/60 mb-3">
          Cohort progress
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-2 rounded-xl border border-[#46CDCF]/20 bg-[#46CDCF]/[0.06] p-3.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#46CDCF]" />
              <span className="text-[10px] font-semibold tracking-[1px] uppercase text-white/60">
                Onboarded
              </span>
            </div>
            <div className="text-xl font-extrabold tabular-nums text-[#46CDCF]">
              {stats.membersOnboarded} / {stats.totalFoundingSlots}
            </div>
            <div className="text-[11px] text-white/60">
              Completed registration end-to-end
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-[#B8FF00]/20 bg-[#B8FF00]/[0.06] p-3.5">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#B8FF00]" />
              <span className="text-[10px] font-semibold tracking-[1px] uppercase text-white/60">
                Profile updated
              </span>
            </div>
            <div className="text-xl font-extrabold tabular-nums text-[#B8FF00]">
              {stats.membersProfileUpdated} / {stats.totalFoundingSlots}
            </div>
            <div className="text-[11px] text-white/60">
              Address or beneficiary set
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-[10px] text-white/30 leading-relaxed">
        Pool figures are aggregate across all founding members and update as
        contributions and interest are recorded. Your individual tile reflects
        only your verified payments.
      </p>
    </motion.section>
  );
}
