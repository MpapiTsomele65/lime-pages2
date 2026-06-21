/**
 * Lehumo portal risk-profile quiz.
 *
 * Scenario questions scaled to **R10,000** figures that map to Lehumo
 * member cashflows (the public /capital profiler uses the larger
 * R50k/R100k scenarios). The five-tier framework + tier copy is shared
 * with the marketing profiler (lib/satrix-etfs.ts), but scoring here is
 * self-contained so the portal never depends on the marketing question
 * set. The portal output is intentionally limited to the profile
 * outcome — no ETF matching.
 */

import {
  RISK_PROFILES,
  type QuizQuestion,
  type RiskProfile,
} from "@/lib/satrix-etfs";

export { RISK_PROFILES };
export type { QuizQuestion, RiskProfile };

export const PORTAL_QUESTIONS: QuizQuestion[] = [
  {
    id: "horizon",
    prompt: "When are you most likely to need this money back?",
    helper: "Your time horizon shapes how much short-term risk makes sense.",
    options: [
      { label: "Within the next 2 years", score: 0 },
      { label: "In about 3 to 5 years", score: 1 },
      { label: "In 7 to 10 years", score: 2 },
      { label: "10+ years — I'm in no rush", score: 3 },
    ],
  },
  {
    id: "loss",
    prompt:
      "Your R10,000 investment falls to R8,000 in three months. Your honest first reaction?",
    helper: "How you feel about a real drop says a lot about your appetite.",
    options: [
      { label: "Sell now — I can't watch it drop further", score: 0 },
      { label: "Move some into something safer", score: 1 },
      { label: "Sit tight and wait for it to recover", score: 2 },
      { label: "Buy more while it's cheaper", score: 3 },
    ],
  },
  {
    id: "income-growth",
    prompt: "What would you most want this money to do?",
    helper: "The classic trade-off: reliable income now, or growth for later.",
    options: [
      { label: "Pay me a steady, reliable income now", score: 0 },
      { label: "Mostly income, with a little growth", score: 1 },
      { label: "An even balance of income and growth", score: 2 },
      { label: "Mostly growth, a little income", score: 3 },
      { label: "Maximise long-term growth — I don't need income now", score: 4 },
    ],
  },
  {
    id: "outcome-band",
    prompt:
      "Over one year, which range of outcomes for R10,000 sits most comfortably with you?",
    helper: "Bigger possible gains always come with bigger possible drops.",
    options: [
      { label: "R10,400 up / R9,800 down — small and steady", score: 0 },
      { label: "R11,200 up / R9,400 down", score: 1 },
      { label: "R12,500 up / R8,500 down", score: 2 },
      { label: "R14,000 up / R7,500 down — big swings are fine", score: 3 },
    ],
  },
  {
    id: "goal",
    prompt: "What's this money really for?",
    options: [
      { label: "Protecting savings I can't afford to lose", score: 0 },
      { label: "A reliable income stream", score: 1 },
      { label: "Steadily building wealth over time", score: 2 },
      { label: "Maximum growth over the years ahead", score: 3 },
    ],
  },
  {
    id: "self-image",
    prompt: "Which sounds most like you?",
    options: [
      { label: "I'd rather avoid risk altogether", score: 0 },
      { label: "I'm cautious and weigh things carefully", score: 1 },
      { label: "I'm comfortable with ups and downs for better returns", score: 2 },
      { label: "I actively chase high-growth opportunities", score: 3 },
    ],
  },
];

/** Highest attainable score for the portal question set. */
export const PORTAL_MAX_SCORE = PORTAL_QUESTIONS.reduce(
  (s, q) => s + Math.max(...q.options.map((o) => o.score)),
  0,
);

/** Sum the option scores for a set of answer indices (one per question). */
export function scorePortalAnswers(answers: number[]): number {
  return answers.reduce((sum, choice, i) => {
    const q = PORTAL_QUESTIONS[i];
    return q && choice >= 0 ? sum + (q.options[choice]?.score ?? 0) : sum;
  }, 0);
}

/** Map a full set of answers to one of the five risk-profile tiers,
 *  banding by 20% slices of the portal max (self-contained — does not
 *  depend on the marketing scorer). */
export function portalProfileFor(answers: number[]): RiskProfile {
  const pct = PORTAL_MAX_SCORE > 0 ? scorePortalAnswers(answers) / PORTAL_MAX_SCORE : 0;
  const idx =
    pct <= 0.2 ? 0 : pct <= 0.4 ? 1 : pct <= 0.6 ? 2 : pct <= 0.8 ? 3 : 4;
  return RISK_PROFILES[idx];
}

/** Look up a tier object by its display name (e.g. the value stored on
 *  the member record). */
export function profileByName(name: string): RiskProfile | undefined {
  return RISK_PROFILES.find((p) => p.name === name);
}
