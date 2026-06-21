"use client";

/**
 * Risk + wealth profile card for the Lehumo member portal.
 *
 * A scenario quiz framed around Lehumo's pooled-savings context (see
 * lib/lehumo-risk.ts) that produces two reads: a five-tier risk profile
 * (protect ↔ grow the pool) and a wealth preference for the post-5-year
 * decision (passive income ↔ keep growing), plus the asset class that
 * most appeals to them. The member confirms before it saves to their
 * Airtable record; both reads also surface in the admin member table.
 *
 * Dark portal theme via PortalCard. POST → /api/lehumo/portal/member/risk
 * then router.refresh() so the saved state re-renders from fresh data.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gauge,
  ArrowRight,
  ArrowLeft,
  Check,
  RotateCcw,
  Loader2,
  Info,
  Coins,
} from "lucide-react";

import type { LehumoMember } from "@/lib/definitions";
import {
  PORTAL_QUESTIONS,
  scoreLehumoSurvey,
  riskTierByName,
  wealthPrefByName,
  WEALTH_PREFERENCES,
  type LehumoSurveyResult,
} from "@/lib/lehumo-risk";
import { PortalCard } from "./PortalCard";

const iosEase = [0.32, 0.72, 0, 1] as const;

export function RiskProfileCard({ member }: { member: LehumoMember }) {
  const router = useRouter();
  const savedRiskName = member.riskProfile || "";
  const savedRisk = savedRiskName ? riskTierByName(savedRiskName) : undefined;
  const savedWealth = member.wealthPreference
    ? wealthPrefByName(member.wealthPreference)
    : undefined;

  const [phase, setPhase] = useState<"idle" | "quiz" | "result">("idle");
  const [answers, setAnswers] = useState<number[]>(() =>
    Array(PORTAL_QUESTIONS.length).fill(-1),
  );
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const result: LehumoSurveyResult | null =
    phase === "result" ? scoreLehumoSurvey(answers) : null;
  const progress =
    phase === "result" ? 100 : (step / PORTAL_QUESTIONS.length) * 100;

  function start() {
    setAnswers(Array(PORTAL_QUESTIONS.length).fill(-1));
    setStep(0);
    setError(null);
    setPhase("quiz");
  }
  function choose(i: number) {
    const next = [...answers];
    next[step] = i;
    setAnswers(next);
    if (step < PORTAL_QUESTIONS.length - 1) setStep(step + 1);
    else setPhase("result");
  }
  function back() {
    if (phase === "result") {
      setPhase("quiz");
      setStep(PORTAL_QUESTIONS.length - 1);
    } else if (step > 0) {
      setStep(step - 1);
    }
  }
  async function confirm() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/lehumo/portal/member/risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(
          data.error || "Could not save your profile. Please try again.",
        );
      }
      setPhase("idle");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong saving your profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: iosEase }}
      id="risk-profile"
      className="scroll-mt-24"
      aria-labelledby="risk-profile-title"
    >
      <PortalCard className="p-6 md:p-7">
        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#46CDCF]/15 text-[#46CDCF]">
            <Gauge className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-1">
              Your investor profile
            </p>
            <h2
              id="risk-profile-title"
              className="text-[17px] font-semibold tracking-tight text-white leading-tight"
            >
              {savedRiskName
                ? "Your Lehumo investor profile"
                : "How should the pool work for you?"}
            </h2>
            <p className="mt-1 text-[12.5px] text-white/55 leading-relaxed">
              {savedRiskName
                ? "This helps us shape how the pooled savings are invested — and plan the payout phase — around the community's appetite. Retake any time."
                : "A few quick scenarios about the pooled savings and your own money style. It shapes how we invest the pool and plan life after the 5 years."}
            </p>
          </div>
        </div>

        {/* Progress bar — only during the quiz */}
        {phase === "quiz" && (
          <div className="h-1 rounded-full bg-white/[0.06] mb-5 overflow-hidden">
            <motion.div
              className="h-full bg-[#46CDCF]"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ── IDLE ── */}
          {phase === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {savedRiskName ? (
                <div className="rounded-[16px] border border-[#B8FF00]/20 bg-[#B8FF00]/[0.05] p-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#B8FF00]">
                        Risk profile
                      </span>
                      <p className="mt-0.5 text-[18px] font-semibold tracking-tight text-white">
                        {savedRiskName}
                      </p>
                      {savedRisk && (
                        <p className="mt-1 text-[12px] text-white/55 leading-relaxed">
                          {savedRisk.blurb}
                        </p>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#46CDCF]">
                        After 5 years
                      </span>
                      <p className="mt-0.5 text-[18px] font-semibold tracking-tight text-white">
                        {member.wealthPreference || "—"}
                      </p>
                      {savedWealth && (
                        <p className="mt-0.5 text-[11.5px] text-white/45">
                          {savedWealth.tagline}
                        </p>
                      )}
                      {member.preferredAssetClass && (
                        <p className="mt-1 inline-flex items-center gap-1.5 text-[11.5px] text-white/55">
                          <Coins className="h-3.5 w-3.5 text-white/40" />
                          Drawn to {member.preferredAssetClass}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 flex-wrap border-t border-white/[0.06] pt-3">
                    {member.riskAssessed && (
                      <span className="text-[11px] text-white/35">
                        Last assessed {member.riskAssessed}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={start}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.03] px-3.5 py-2 text-[12px] font-semibold text-white/70 hover:text-white hover:border-[#46CDCF]/40 transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Retake
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={start}
                  className="group inline-flex items-center gap-2 rounded-full bg-[#46CDCF] px-5 py-3 text-[13px] font-semibold text-[#06223a] hover:bg-[#5ad6d8] transition-colors"
                >
                  Start the 2-minute quiz
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </motion.div>
          )}

          {/* ── QUIZ ── */}
          {phase === "quiz" && (
            <motion.div
              key={`q-${step}`}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/40">
                  Question {step + 1} of {PORTAL_QUESTIONS.length}
                </span>
                {step > 0 && (
                  <button
                    type="button"
                    onClick={back}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium text-white/45 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                )}
              </div>
              <h3 className="text-[16px] sm:text-[18px] font-semibold tracking-tight text-white leading-snug">
                {PORTAL_QUESTIONS[step].prompt}
              </h3>
              {PORTAL_QUESTIONS[step].helper && (
                <p className="mt-1.5 text-[12.5px] text-white/45 leading-relaxed">
                  {PORTAL_QUESTIONS[step].helper}
                </p>
              )}
              <div className="mt-4 grid gap-2">
                {PORTAL_QUESTIONS[step].options.map((opt, i) => {
                  const active = answers[step] === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => choose(i)}
                      aria-pressed={active}
                      className={`group flex items-center gap-3 rounded-[14px] border px-4 py-3 text-left transition-all ${
                        active
                          ? "border-[#46CDCF]/50 bg-[#46CDCF]/[0.10]"
                          : "border-white/[0.08] bg-white/[0.02] hover:border-[#46CDCF]/30 hover:bg-[#46CDCF]/[0.05]"
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10.5px] font-bold transition-colors ${
                          active
                            ? "border-[#46CDCF] bg-[#46CDCF] text-[#06223a]"
                            : "border-white/20 text-white/45 group-hover:border-[#46CDCF]/50"
                        }`}
                      >
                        {active ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          String.fromCharCode(65 + i)
                        )}
                      </span>
                      <span className="text-[13.5px] text-white/85 leading-snug">
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── RESULT ── */}
          {phase === "result" && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: iosEase }}
            >
              {/* Risk profile */}
              <div className="rounded-[16px] border border-[#46CDCF]/25 bg-gradient-to-br from-[#46CDCF]/[0.08] to-[#B8FF00]/[0.03] p-5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#46CDCF]">
                  Your risk profile
                </span>
                <p className="mt-1 text-[22px] font-semibold tracking-tight text-white leading-tight">
                  {result.riskTier.name}
                </p>
                <p className="text-[12.5px] font-semibold text-[#B8FF00]">
                  {result.riskTier.tagline}
                </p>
                <p className="mt-2 text-[13px] text-white/70 leading-relaxed">
                  {result.riskTier.blurb}
                </p>
                <div className="mt-4">
                  <div className="flex justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35 mb-1.5">
                    <span>Protect the pool</span>
                    <span>Grow the pool</span>
                  </div>
                  <div className="relative h-2 rounded-full bg-gradient-to-r from-[#46CDCF] via-white/15 to-[#B8FF00]">
                    <div
                      className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#0F2040]"
                      style={{ left: `${result.riskTier.lean}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Wealth preference + asset class */}
              <div className="mt-3 rounded-[16px] border border-white/[0.08] bg-white/[0.02] p-5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#46CDCF]">
                  After the 5 years, you lean toward
                </span>
                <div className="mt-2 flex gap-2">
                  {WEALTH_PREFERENCES.map((w) => {
                    const on = w.id === result.wealthPref.id;
                    return (
                      <span
                        key={w.id}
                        className={`flex-1 text-center rounded-full border px-2 py-1.5 text-[12px] font-semibold transition-colors ${
                          on
                            ? "border-[#B8FF00]/40 bg-[#B8FF00]/[0.12] text-[#B8FF00]"
                            : "border-white/[0.08] text-white/40"
                        }`}
                      >
                        {w.name}
                      </span>
                    );
                  })}
                </div>
                <p className="mt-2.5 text-[13px] text-white/70 leading-relaxed">
                  {result.wealthPref.blurb}
                </p>
                {result.assetClass && (
                  <p className="mt-2.5 inline-flex items-center gap-2 rounded-full bg-white/[0.04] border border-white/[0.08] px-3 py-1.5 text-[12px] text-white/75">
                    <Coins className="h-3.5 w-3.5 text-[#46CDCF]" />
                    Most drawn to{" "}
                    <span className="font-semibold text-white">
                      {result.assetClass}
                    </span>
                  </p>
                )}
              </div>

              {/* Confirm / retake */}
              <p className="mt-4 text-[13px] font-medium text-white/75">
                Does this sound like you?
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={confirm}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-[#B8FF00] px-5 py-2.5 text-[13px] font-semibold text-[#0B1933] hover:bg-[#c8ff3d] disabled:opacity-60 transition-colors"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Yes, that&rsquo;s me
                </button>
                <button
                  type="button"
                  onClick={start}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] px-5 py-2.5 text-[13px] font-semibold text-white/70 hover:text-white hover:border-white/25 disabled:opacity-60 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  No, retake
                </button>
              </div>

              {error && (
                <div className="mt-3 rounded-xl border border-red-400/30 bg-red-500/[0.08] p-3 text-[12.5px] text-red-300">
                  {error}
                </div>
              )}

              <p className="mt-4 flex items-start gap-1.5 text-[11px] text-white/35 leading-relaxed">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                Educational only — this isn&rsquo;t financial advice. It helps the
                trust shape how the pool is invested around the community.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </PortalCard>
    </motion.section>
  );
}
