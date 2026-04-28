"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

import { hasBeneficiary, type LehumoMember } from "@/lib/definitions";

interface CompletenessMeterProps {
  member: LehumoMember;
}

/**
 * Member-portal account-setup checklist.
 *
 * Surfaces three onboarding-completion checks at the top of the dashboard:
 *   1. KYC verified  (kycStatus === "Complete")
 *   2. Beneficiary on file  (hasBeneficiary)
 *   3. First contribution  (any contribution month checked)
 *
 * Behaviour:
 *   - When all three are complete, the meter hides itself entirely. It's
 *     served its purpose; the cards below remain available if the member
 *     wants to update anything.
 *   - Each pending task chip is an anchor link to the matching card lower
 *     on the same page (#kyc-docs, #beneficiary, #payment). The dashboard
 *     adds `scroll-mt-24` to those anchors so the sticky portal header
 *     doesn't cover the title on jump.
 *   - Lime accent on done; muted on pending; the bar animates in from 0%
 *     so the meter feels alive on first load.
 *
 * No persistence: the source of truth is the member's Airtable row, so
 * the meter recomputes from props on every render.
 */
export function CompletenessMeter({ member }: CompletenessMeterProps) {
  const tasks = [
    {
      key: "kyc",
      label: "Verify your identity",
      done: member.kycStatus === "Complete",
      href: "#kyc-docs",
    },
    {
      key: "beneficiary",
      label: "Add next of kin",
      done: hasBeneficiary(member),
      href: "#beneficiary",
    },
    {
      key: "contribution",
      label: "Make first contribution",
      done: Object.values(member.contributions).some(Boolean),
      href: "#payment",
    },
  ] as const;

  const completed = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const percent = Math.round((completed / total) * 100);

  // Once everything is ticked off, the meter has done its job. Hide it
  // rather than display "100% — you're done" forever; cards below stay
  // available for edits.
  if (completed === total) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="rounded-2xl border border-white/[0.06] bg-[#0F2040] p-5 md:p-6"
      aria-label="Account setup checklist"
    >
      {/* Header: label + counter + percent */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#B8FF00]/10 text-[#B8FF00]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40">
              Set up your account
            </p>
            <p className="mt-0.5 text-sm font-semibold text-white">
              {completed} of {total} complete
            </p>
          </div>
        </div>
        <p className="text-2xl md:text-3xl font-bold text-[#B8FF00] leading-none">
          {percent}%
        </p>
      </div>

      {/* Progress bar */}
      <div
        className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden mb-4"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="h-full rounded-full bg-gradient-to-r from-[#B8FF00] to-[#46CDCF]"
        />
      </div>

      {/* Task chips — done = static, pending = anchor link */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {tasks.map((task) =>
          task.done ? (
            <div
              key={task.key}
              className="flex items-center gap-2 rounded-lg border border-[#B8FF00]/20 bg-[#B8FF00]/[0.04] px-3 py-2 text-xs text-white"
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#B8FF00]" />
              <span className="truncate">{task.label}</span>
            </div>
          ) : (
            <a
              key={task.key}
              href={task.href}
              className="group flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white/70 transition-colors hover:border-[#46CDCF]/40 hover:bg-[#46CDCF]/[0.06] hover:text-white"
            >
              <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-white/30" />
              <span className="truncate">{task.label}</span>
              <ArrowRight className="h-3 w-3 shrink-0 ml-auto opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </a>
          ),
        )}
      </div>
    </motion.section>
  );
}
