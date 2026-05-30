"use client";

import { CalendarClock, AlertCircle } from "lucide-react";

import { KYC_STATUS, getKycDeadlineInfo } from "@/lib/definitions";

interface KycStatusTrackerProps {
  status: string;
}

// Reframes the KYC card from "this is blocking your registration" to
// "you've got runway until 15 Aug". Renders nothing when KYC is
// Complete — no countdown noise for members who've already done it.
function KycDeadlineChip({ status }: { status: string }) {
  if (status === KYC_STATUS.complete) return null;
  const { daysRemaining, isPast, tier } = getKycDeadlineInfo();
  const palette = {
    ok: {
      classes: "bg-[#B8FF00]/[0.08] border-[#B8FF00]/25 text-[#B8FF00]",
      icon: <CalendarClock className="h-3 w-3" />,
    },
    warn: {
      classes: "bg-[#F59E0B]/12 border-[#F59E0B]/30 text-[#F59E0B]",
      icon: <CalendarClock className="h-3 w-3" />,
    },
    urgent: {
      classes: "bg-red-500/10 border-red-500/30 text-red-300",
      icon: <AlertCircle className="h-3 w-3" />,
    },
    past: {
      classes: "bg-red-500/15 border-red-500/40 text-red-200",
      icon: <AlertCircle className="h-3 w-3" />,
    },
  }[tier];
  const label = isPast
    ? "Overdue — please upload KYC docs"
    : `Due by 15 Aug · ${daysRemaining} ${daysRemaining === 1 ? "day" : "days"} to go`;
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${palette.classes}`}
      role="status"
    >
      {palette.icon}
      {label}
    </div>
  );
}

const STEPS = [
  {
    key: KYC_STATUS.notStarted,
    label: "Not Started",
    description: "KYC process has not begun",
  },
  {
    key: KYC_STATUS.docsRequested,
    label: "Docs Requested",
    description: "Required documents have been requested",
  },
  {
    key: KYC_STATUS.inProgress,
    label: "In Progress",
    description: "Documents are being verified",
  },
  {
    key: KYC_STATUS.complete,
    label: "Complete",
    description: "Identity fully verified",
  },
];

function getStepIndex(status: string): number {
  const idx = STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

export function KycStatusTracker({ status }: KycStatusTrackerProps) {
  const activeIndex = getStepIndex(status);

  return (
    <div className="rounded-[24px] border border-white/[0.05] bg-gradient-to-b from-[#10224a] to-[#0F2040] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_8px_32px_-8px_rgba(0,0,0,0.35)] p-6 h-full">
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <h2 className="text-lg font-semibold text-white">
          Verify your identity
        </h2>
        <KycDeadlineChip status={status} />
      </div>

      {/* Progress bar */}
      <div className="flex items-start gap-0">
        {STEPS.map((step, i) => {
          const isCompleted = i < activeIndex;
          const isCurrent = i === activeIndex;
          const isFuture = i > activeIndex;

          return (
            <div key={step.key} className="flex-1 flex flex-col items-center">
              {/* Dot + Line row */}
              <div className="flex items-center w-full">
                {/* Left connector line */}
                {i > 0 && (
                  <div
                    className={`h-0.5 flex-1 ${
                      isCompleted || isCurrent
                        ? "bg-[#B8FF00]"
                        : "bg-white/[0.1]"
                    }`}
                  />
                )}

                {/* Dot */}
                <div
                  className={`
                    relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full
                    ${
                      isCompleted
                        ? "bg-[#B8FF00]"
                        : isCurrent
                          ? "bg-[#46CDCF]"
                          : "bg-white/[0.1]"
                    }
                  `}
                >
                  {isCompleted && (
                    <svg
                      className="h-3 w-3 text-[#0B1933]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                  {isCurrent && (
                    <span className="absolute inset-0 animate-ping rounded-full bg-[#46CDCF]/40" />
                  )}
                  {isFuture && (
                    <div className="h-2 w-2 rounded-full bg-white/20" />
                  )}
                </div>

                {/* Right connector line */}
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 ${
                      isCompleted ? "bg-[#B8FF00]" : "bg-white/[0.1]"
                    }`}
                  />
                )}
              </div>

              {/* Label + Description */}
              <div className="mt-3 text-center px-1">
                <p
                  className={`text-xs font-medium ${
                    isCompleted
                      ? "text-[#B8FF00]"
                      : isCurrent
                        ? "text-[#46CDCF]"
                        : "text-white/30"
                  }`}
                >
                  {step.label}
                </p>
                <p className="mt-1 text-[10px] leading-tight text-white/30 hidden sm:block">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
