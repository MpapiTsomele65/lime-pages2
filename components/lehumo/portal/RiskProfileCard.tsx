"use client";

/**
 * Investor risk-profile card for the Lehumo member portal.
 *
 * A scenario-based mini-quiz (6 questions, R10k figures scaled to Lehumo
 * cashflows — see lib/lehumo-risk.ts) that maps the member to one of the
 * five risk tiers. Output is intentionally limited to the profile
 * outcome + description (no ETF matching). The member is asked to confirm
 * the result ("yes, that's me") before it's saved to their Airtable
 * record; if it doesn't resonate they can retake. The saved profile also
 * surfaces in the admin member table.
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
} from "lucide-react";

import type { LehumoMember } from "@/lib/definitions";
import {
  PORTAL_QUESTIONS,
  portalProfileFor,
  profileByName,
  type RiskProfile,
} from "@/lib/lehumo-risk";
import { PortalCard } from "./PortalCard";

const iosEase = [0.32, 0.72, 0, 1] as const;

export function RiskProfileCard({ member }: { member: LehumoMember }) {
  const router = useRouter();
  const saved = member.riskProfile || "";
  const savedTier = saved ? profileByName(saved) : undefined;

  const [phase, setPhase] = useState<"idle" | "quiz" | "result">("idle");
  const [answers, setAnswers] = useState<number[]>(() =>
    Array(PORTAL_QUESTIONS.length).fill(-1),
  );
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const result: RiskProfile | null =
    phase === "result" ? portalProfileFor(answers) : null;
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
              Investor risk profile
            </p>
            <h2
              id="risk-profile-title"
              className="text-[17px] font-semibold tracking-tight text-white leading-tight"
            >
              {saved
                ? "Your investor risk profile"
                : "What kind of investor are you?"}
            </h2>
            <p className="mt-1 text-[12.5px] text-white/55 leading-relaxed">
              {saved
                ? "This helps us shape where the trust invests around the community's appetite. Retake any time your view changes."
                : "Six quick scenarios — no numbers or jargon — to find your risk profile. It helps us shape the trust's investment approach around the community."}
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
              {saved ? (
                <div className="rounded-[16px] border border-[#B8FF00]/20 bg-[#B8FF00]/[0.05] p-4">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B8FF00]">
                    Your profile
                  </span>
                  <p className="mt-1 text-[20px] font-semibold tracking-tight text-white">
                    {saved}
                  </p>
                  {savedTier && (
                    <p className="mt-1 text-[12.5px] text-white/60 leading-relaxed">
                      {savedTier.blurb}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
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
                      Retake the quiz
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
              <div className="rounded-[16px] border border-[#46CDCF]/25 bg-gradient-to-br from-[#46CDCF]/[0.08] to-[#B8FF00]/[0.03] p-5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#46CDCF]">
                  You look like a
                </span>
                <p className="mt-1 text-[24px] font-semibold tracking-tight text-white leading-tight">
                  {result.name}
                </p>
                <p className="text-[12.5px] font-semibold text-[#B8FF00]">
                  {result.tagline}
                </p>
                <p className="mt-2.5 text-[13px] text-white/70 leading-relaxed">
                  {result.blurb}
                </p>

                {/* Income ↔ growth lean */}
                <div className="mt-4">
                  <div className="flex justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35 mb-1.5">
                    <span>Income</span>
                    <span>Growth</span>
                  </div>
                  <div className="relative h-2 rounded-full bg-gradient-to-r from-[#46CDCF] via-white/15 to-[#B8FF00]">
                    <div
                      className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#0F2040]"
                      style={{ left: `${result.lean}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11.5px] text-white/45">
                    Typical horizon: {result.horizon} · {result.leanLabel}
                  </p>
                </div>
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
                trust understand the community&rsquo;s risk appetite.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </PortalCard>
    </motion.section>
  );
}
