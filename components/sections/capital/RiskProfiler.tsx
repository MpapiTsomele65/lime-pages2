"use client";

/**
 * Risk Profiler — a scenario-based risk-tolerance assessment for the
 * Lime Capital page.
 *
 * What it does:
 *   • Walks the visitor through 6 plain-language scenario questions
 *     (no numbers/jargon) — time horizon, reaction to a real loss, the
 *     income-vs-growth trade-off, an outcome band, their goal, and how
 *     they see themselves as an investor.
 *   • Scores the answers and maps them to one of the five Satrix risk
 *     tiers (Conservative → Aggressive).
 *   • Surfaces a risk meter, the profile's horizon / return target /
 *     income↔growth lean, and a set of popular Satrix ETFs matched to
 *     that profile — with a chip row to explore the other tiers.
 *
 * Visual identity mirrors BondCalculator: snow section, white card with
 * the same soft shadow, teal for active controls, capital-green for the
 * celebratory result state, Plus Jakarta weights.
 *
 * Education only. Lime Pages is not an FSP and the ETF list is
 * illustrative — see lib/satrix-etfs.ts.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gauge,
  Info,
  ArrowLeft,
  RotateCcw,
  ArrowUpRight,
  Check,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import {
  QUESTIONS,
  RISK_PROFILES,
  scoreToProfile,
  etfsForProfile,
  profileById,
  SATRIX_PRODUCTS_URL,
  type ProfileId,
  type Accent,
  type EtfCategory,
} from "@/lib/satrix-etfs";

// ── Accent helpers ───────────────────────────────────────────────────
const ACCENT: Record<
  Accent,
  { text: string; fill: string; soft: string; border: string }
> = {
  teal: {
    text: "text-teal",
    fill: "bg-teal",
    soft: "bg-teal/10",
    border: "border-teal/35",
  },
  navy: {
    text: "text-navy",
    fill: "bg-navy",
    soft: "bg-navy/[0.06]",
    border: "border-navy/25",
  },
  capital: {
    text: "text-[#3d6b00]",
    fill: "bg-capital",
    soft: "bg-capital-light",
    border: "border-capital/45",
  },
};

const CATEGORY: Record<EtfCategory, string> = {
  Income: "bg-teal/10 text-teal border-teal/25",
  Balanced: "bg-navy/[0.06] text-navy border-navy/20",
  Growth: "bg-capital/20 text-[#3d6b00] border-capital/40",
};

// ── Component ────────────────────────────────────────────────────────
export default function RiskProfiler() {
  const [answers, setAnswers] = useState<number[]>(
    () => Array(QUESTIONS.length).fill(-1),
  );
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [viewTier, setViewTier] = useState<ProfileId | null>(null);

  const total = answers.reduce(
    (sum, choice, i) => sum + (choice >= 0 ? QUESTIONS[i].options[choice].score : 0),
    0,
  );

  function choose(optionIndex: number) {
    const next = [...answers];
    next[step] = optionIndex;
    setAnswers(next);
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setSubmitted(true);
    }
  }

  function back() {
    if (submitted) {
      setSubmitted(false);
      setStep(QUESTIONS.length - 1);
    } else if (step > 0) {
      setStep(step - 1);
    }
  }

  function retake() {
    setAnswers(Array(QUESTIONS.length).fill(-1));
    setStep(0);
    setSubmitted(false);
    setViewTier(null);
  }

  const progress = submitted ? 100 : (step / QUESTIONS.length) * 100;
  const result = submitted ? scoreToProfile(total) : null;
  const tier = viewTier ? profileById(viewTier) : result;

  return (
    <section className="bg-snow py-16 sm:py-20 lg:py-24" id="risk-profile">
      <Container>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="max-w-3xl mb-10 lg:mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal/10 border border-teal/25 mb-4">
            <Gauge className="w-3.5 h-3.5 text-teal" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal">
              Find Your Risk Profile
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-navy leading-[1.05]">
            What kind of investor are you?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-subtle leading-relaxed">
            Smart investing starts with knowing your own appetite for risk.
            Answer six quick scenarios &mdash; no numbers, no jargon &mdash; and
            we&rsquo;ll match you to a risk profile and the kinds of Satrix ETFs
            that tend to suit it.
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="rounded-2xl bg-white border border-border overflow-hidden"
          style={{
            boxShadow:
              "0 1px 0 rgba(0,0,0,0.04), 0 18px 40px -24px rgba(11,25,51,0.18)",
          }}
        >
          {/* Progress bar */}
          <div className="h-1.5 bg-snow">
            <motion.div
              className="h-full bg-teal"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <AnimatePresence mode="wait">
              {!submitted ? (
                // ─── QUIZ ───
                <motion.div
                  key={`q-${step}`}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                >
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-subtle">
                      Question {step + 1} of {QUESTIONS.length}
                    </span>
                    {step > 0 && (
                      <button
                        type="button"
                        onClick={back}
                        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-subtle hover:text-navy transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                      </button>
                    )}
                  </div>

                  <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-navy leading-[1.2] max-w-2xl">
                    {QUESTIONS[step].prompt}
                  </h3>
                  {QUESTIONS[step].helper && (
                    <p className="mt-2 text-sm text-subtle leading-relaxed max-w-2xl">
                      {QUESTIONS[step].helper}
                    </p>
                  )}

                  <div className="mt-6 grid gap-2.5">
                    {QUESTIONS[step].options.map((opt, i) => {
                      const active = answers[step] === i;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => choose(i)}
                          aria-pressed={active}
                          className={`group flex items-center gap-3.5 text-left rounded-xl border px-4 py-3.5 transition-all ${
                            active
                              ? "border-teal bg-teal/5 ring-2 ring-teal/20"
                              : "border-border bg-white hover:border-teal/50 hover:bg-snow"
                          }`}
                        >
                          <span
                            className={`shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-[11px] font-bold transition-colors ${
                              active
                                ? "border-teal bg-teal text-white"
                                : "border-border text-subtle group-hover:border-teal/50"
                            }`}
                          >
                            {active ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              String.fromCharCode(65 + i)
                            )}
                          </span>
                          <span className="text-[14.5px] sm:text-[15px] text-navy leading-snug">
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                // ─── RESULT ───
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  {result && (
                    <>
                      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                        <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-subtle">
                          Your risk profile
                        </span>
                        <button
                          type="button"
                          onClick={retake}
                          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-subtle hover:text-navy transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Retake
                        </button>
                      </div>

                      {/* Risk meter */}
                      <RiskMeter activeId={result.id} />

                      {/* Profile summary */}
                      <div className="mt-7">
                        <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy leading-[1.1]">
                          {result.name}
                        </h3>
                        <p
                          className={`mt-1 text-sm font-semibold ${ACCENT[result.accent].text}`}
                        >
                          {result.tagline}
                        </p>
                        <p className="mt-3 text-[15px] text-subtle leading-relaxed max-w-2xl">
                          {result.blurb}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden border border-border">
                        <ResultStat label="Suggested horizon" value={result.horizon} />
                        <ResultStat label="Return target" value={result.target} />
                        <ResultStat label="Leans toward" value={result.leanLabel} />
                      </div>

                      {/* Income ↔ growth lean bar */}
                      <div className="mt-6">
                        <div className="flex justify-between text-[11px] font-mono uppercase tracking-[0.14em] text-subtle mb-2">
                          <span>Income</span>
                          <span>Growth</span>
                        </div>
                        <div className="relative h-2.5 rounded-full bg-gradient-to-r from-teal via-navy/15 to-capital">
                          <motion.div
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-navy shadow"
                            initial={{ left: "50%" }}
                            animate={{ left: `${result.lean}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          />
                        </div>
                      </div>

                      {/* Matched ETFs */}
                      <div className="mt-9">
                        <div className="flex items-baseline justify-between flex-wrap gap-2 mb-1">
                          <h4 className="text-lg font-semibold tracking-tight text-navy">
                            Satrix ETFs that tend to suit this profile
                          </h4>
                        </div>
                        <p className="text-[13px] text-subtle mb-4">
                          Explore the other tiers too &mdash; your profile is a
                          starting point, not a box.
                        </p>

                        {/* Tier chips */}
                        <div className="flex flex-wrap gap-2 mb-5">
                          {RISK_PROFILES.map((p) => {
                            const on = (tier?.id ?? result.id) === p.id;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setViewTier(p.id)}
                                className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
                                  on
                                    ? "bg-navy text-white border-navy"
                                    : "bg-white text-subtle border-border hover:border-navy/40 hover:text-navy"
                                }`}
                              >
                                {p.name}
                                {p.id === result.id && (
                                  <span className={on ? "text-capital" : "text-teal"}>
                                    {" "}
                                    &middot; you
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {etfsForProfile(tier?.id ?? result.id).map((etf) => (
                            <a
                              key={etf.ticker}
                              href={SATRIX_PRODUCTS_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex flex-col rounded-xl border border-border bg-snow hover:bg-white hover:border-navy/25 hover:-translate-y-0.5 transition-all p-4"
                            >
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="font-mono text-[13px] font-bold text-navy tracking-wide">
                                  {etf.ticker}
                                </span>
                                <span
                                  className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${CATEGORY[etf.category]}`}
                                >
                                  {etf.category}
                                </span>
                              </div>
                              <span className="text-[14px] font-semibold text-navy leading-snug flex items-center gap-1">
                                {etf.name}
                                <ArrowUpRight className="w-3.5 h-3.5 text-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
                              </span>
                              <span className="mt-1.5 text-[12.5px] text-subtle leading-relaxed">
                                {etf.blurb}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-[12px] text-subtle leading-relaxed flex items-start gap-2 max-w-3xl"
        >
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-subtle" />
          <span>
            Educational only &mdash; this is not financial advice and Lime Pages
            is not a registered financial services provider (FSP). The risk
            profile and Satrix ETF examples are illustrative; tickers and fund
            details must be verified on satrix.co.za, and you should speak to a
            licensed adviser before investing. #ThisIsNotFinancialAdvice
          </span>
        </motion.p>
      </Container>
    </section>
  );
}

// ── Sub-components ────────────────────────────────────────────────────
function RiskMeter({ activeId }: { activeId: ProfileId }) {
  const activeIdx = RISK_PROFILES.findIndex((p) => p.id === activeId);
  return (
    <div>
      <div className="flex gap-1.5">
        {RISK_PROFILES.map((p, i) => {
          const filled = i <= activeIdx;
          return (
            <div key={p.id} className="flex-1">
              <div
                className={`h-2.5 rounded-full transition-colors ${
                  filled ? ACCENT[RISK_PROFILES[activeIdx].accent].fill : "bg-border"
                }`}
              />
            </div>
          );
        })}
      </div>
      <div className="hidden sm:flex gap-1.5 mt-2">
        {RISK_PROFILES.map((p, i) => (
          <div key={p.id} className="flex-1 text-center">
            <span
              className={`text-[10px] font-medium leading-tight ${
                i === activeIdx ? "text-navy font-bold" : "text-subtle/70"
              }`}
            >
              {p.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-4 flex flex-col gap-1">
      <div className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-subtle">
        {label}
      </div>
      <div className="text-[15px] font-semibold tracking-tight text-navy">
        {value}
      </div>
    </div>
  );
}
