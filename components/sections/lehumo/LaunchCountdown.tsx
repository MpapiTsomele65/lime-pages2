"use client";

import { useEffect, useState } from "react";

// Launch: 1 June 2026, 00:00 SAST (UTC+2). Before this the clock counts
// down to launch; on/after it the clock flips to the live "make your
// contribution this month" deadline (end of the current SAST month) so
// the hero never shows a dead 00:00:00:00 again post-launch.
const LAUNCH = new Date("2026-06-01T00:00:00+02:00").getTime();
const LAUNCH_PERIOD = "2026-06"; // the founding "first contribution" month

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

type CountdownData = {
  time: TimeLeft;
  /** Still counting down to the 1 June launch. */
  isPreLaunch: boolean;
  /** We're inside the founding launch month (June 2026) — the
   *  "first contribution" framing applies. */
  isLaunchMonth: boolean;
  /** "30 June 2026" — the deadline being counted to (contribution phase). */
  deadlineLabel: string;
  /** "June" — month the contribution is for (contribution phase). */
  monthName: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Current SAST calendar date as { year, month (1-12), period "YYYY-MM" }. */
function sastToday(): { year: number; month: number; period: string } {
  // en-CA → "YYYY-MM-DD"; timeZone pins it to SAST regardless of host TZ.
  const iso = new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Johannesburg",
  });
  const [y, m] = iso.split("-").map(Number);
  return { year: y, month: m, period: iso.slice(0, 7) };
}

/** Last moment (23:59:59 SAST) of the current SAST month — the
 *  contribution deadline for the current period. */
function endOfSastMonth(): { ts: number; lastDay: number; year: number; month: number } {
  const { year, month } = sastToday();
  // Date.UTC(year, month, 0) → day 0 of next month = last day of `month`.
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const ts = new Date(
    `${year}-${pad(month)}-${pad(lastDay)}T23:59:59+02:00`,
  ).getTime();
  return { ts, lastDay, year, month };
}

function diffToTimeLeft(diffMs: number): TimeLeft {
  const diff = Math.max(0, diffMs);
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function getCountdown(): CountdownData {
  const now = Date.now();
  if (now < LAUNCH) {
    return {
      time: diffToTimeLeft(LAUNCH - now),
      isPreLaunch: true,
      isLaunchMonth: false,
      deadlineLabel: "1 June 2026",
      monthName: "June",
    };
  }
  const { ts, lastDay, year, month } = endOfSastMonth();
  const monthName = MONTH_NAMES[month - 1] ?? "";
  return {
    time: diffToTimeLeft(ts - now),
    isPreLaunch: false,
    isLaunchMonth: sastToday().period === LAUNCH_PERIOD,
    deadlineLabel: `${lastDay} ${monthName} ${year}`,
    monthName,
  };
}

type LaunchCountdownProps = {
  /** Override the eyebrow label shown above the clock. */
  eyebrow?: string;
  /** Controls horizontal alignment of the eyebrow + clock wrapper. */
  align?: "left" | "center";
  /** Hide the ticking Days/Hours/Mins/Secs clock, keeping just the
   *  eyebrow + deadline line. Used where a full second countdown would
   *  be redundant (e.g. the home hero, which sits above LehumoTeaser's
   *  own live clock). Defaults to true. */
  showClock?: boolean;
  className?: string;
};

export function LaunchCountdown({
  eyebrow,
  align = "center",
  showClock = true,
  className = "",
}: LaunchCountdownProps = {}) {
  // null on first render (server + pre-hydration) to avoid hydration
  // mismatch — the ticking values + the SAST-derived phase are settled
  // in the effect, never during render.
  const [data, setData] = useState<CountdownData | null>(null);

  useEffect(() => {
    setData(getCountdown());
    const id = setInterval(() => setData(getCountdown()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = data?.time ?? null;
  const segments = [
    { key: "days", value: time ? pad(time.days) : "--", label: "Days", highlight: true },
    { key: "hours", value: time ? pad(time.hours) : "--", label: "Hours", highlight: true },
    { key: "minutes", value: time ? pad(time.minutes) : "--", label: "Minutes", highlight: false },
    { key: "seconds", value: time ? pad(time.seconds) : "--", label: "Seconds", highlight: false },
  ];

  // Default eyebrow by phase. Pre-hydration (data null) we're already
  // post-launch in production, so default to the contribution framing —
  // matches what settles in, so there's no visible flip.
  const defaultEyebrow = !data
    ? "Make your first contribution"
    : data.isPreLaunch
      ? "Launching 1 June 2026"
      : data.isLaunchMonth
        ? "Make your first contribution"
        : `${data.monthName} contribution due`;
  const eyebrowText = eyebrow ?? defaultEyebrow;

  // Supporting deadline line — only in the contribution phase, once the
  // SAST-derived data has settled.
  const showDeadline = data !== null && !data.isPreLaunch;
  const deadlineLine =
    data && data.isLaunchMonth
      ? `Founding members: make your first R1,000 contribution by ${data.deadlineLabel}`
      : data
        ? `${data.monthName} contribution due by ${data.deadlineLabel}`
        : "";

  const alignClass = align === "left" ? "text-left" : "text-center";
  const clockJustify = align === "left" ? "justify-start" : "justify-center";

  const ariaLabel = !data
    ? "Countdown loading"
    : data.isPreLaunch
      ? `${data.time.days} days until Lehumo launch`
      : `${data.time.days} days, ${data.time.hours} hours, ${data.time.minutes} minutes, and ${data.time.seconds} seconds to make this month's contribution`;

  return (
    <div className={`${alignClass} ${className}`}>
      {/* Eyebrow */}
      <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[1.4px] uppercase text-teal mb-4">
        <span className="relative flex w-2 h-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime opacity-70" />
          <span className="relative inline-flex w-2 h-2 rounded-full bg-lime" />
        </span>
        {eyebrowText}
      </div>

      {/* Digital clock — omitted when showClock=false (e.g. home hero) */}
      {showClock && (
        <div
        role="timer"
        aria-live="polite"
        aria-atomic="true"
        aria-label={ariaLabel}
        className={`flex items-stretch ${clockJustify} gap-1.5 sm:gap-2.5`}
      >
        {segments.map((seg, i) => (
          <div key={seg.key} className="flex items-stretch">
            <div
              className={`flex flex-col items-center justify-center min-w-[62px] sm:min-w-[88px] px-2 sm:px-4 py-3 sm:py-4 rounded-xl border backdrop-blur-sm transition-colors ${
                seg.highlight
                  ? "border-lime/30 bg-lime/[0.07]"
                  : "border-white/10 bg-white/[0.035]"
              }`}
            >
              <div
                className={`text-[26px] sm:text-[36px] font-extrabold leading-none tabular-nums tracking-tight ${
                  seg.highlight ? "text-lime" : "text-white"
                }`}
              >
                {seg.value}
              </div>
              <div className="mt-1.5 text-[9px] sm:text-[10px] font-semibold tracking-[1.2px] uppercase text-white/45">
                {seg.label}
              </div>
            </div>
            {i < segments.length - 1 && (
              <div
                aria-hidden="true"
                className="flex items-center px-0.5 sm:px-1 text-white/20 text-[22px] sm:text-[28px] font-bold leading-none"
              >
                :
              </div>
            )}
          </div>
        ))}
        </div>
      )}

      {/* Supporting deadline line — drives the post-launch action. */}
      {showDeadline && (
        <p
          className={`mt-4 text-[13px] sm:text-sm text-white/55 ${
            align === "center" ? "mx-auto" : ""
          } max-w-[440px]`}
        >
          {deadlineLine}
        </p>
      )}
    </div>
  );
}
