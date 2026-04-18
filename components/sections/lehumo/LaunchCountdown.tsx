"use client";

import { useEffect, useState } from "react";

// Target: 1 June 2026, 00:00 SAST (UTC+2)
const TARGET = new Date("2026-06-01T00:00:00+02:00").getTime();

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getTimeLeft(): TimeLeft {
  const diff = Math.max(0, TARGET - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

type LaunchCountdownProps = {
  /** Override the eyebrow label shown above the clock. Defaults to "Launching 1 June 2026" / "Lehumo Has Launched". */
  eyebrow?: string;
  /** Controls horizontal alignment of the eyebrow + clock wrapper. */
  align?: "left" | "center";
  className?: string;
};

export function LaunchCountdown({
  eyebrow,
  align = "center",
  className = "",
}: LaunchCountdownProps = {}) {
  // null on first render (server + pre-hydration) to avoid hydration mismatch
  const [time, setTime] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setTime(getTimeLeft());
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  const segments = [
    {
      key: "days",
      value: time ? pad(time.days) : "--",
      label: "Days",
      highlight: true,
    },
    {
      key: "hours",
      value: time ? pad(time.hours) : "--",
      label: "Hours",
      highlight: true,
    },
    {
      key: "minutes",
      value: time ? pad(time.minutes) : "--",
      label: "Minutes",
      highlight: false,
    },
    {
      key: "seconds",
      value: time ? pad(time.seconds) : "--",
      label: "Seconds",
      highlight: false,
    },
  ];

  const launched = time !== null && TARGET - Date.now() <= 0;
  const eyebrowText =
    eyebrow ?? (launched ? "Lehumo Has Launched" : "Launching 1 June 2026");
  const alignClass = align === "left" ? "text-left" : "text-center";
  const clockJustify = align === "left" ? "justify-start" : "justify-center";

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

      {/* Digital clock */}
      <div
        role="timer"
        aria-live="polite"
        aria-atomic="true"
        aria-label={
          time
            ? `${time.days} days, ${time.hours} hours, ${time.minutes} minutes, and ${time.seconds} seconds until Lehumo launch`
            : "Countdown loading"
        }
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
    </div>
  );
}
