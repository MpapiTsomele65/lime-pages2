/**
 * Lehumo portal risk + wealth profiler.
 *
 * Unlike the generic public /capital profiler (lib/satrix-etfs.ts), this
 * is framed around Lehumo's specific context — a POOLED savings vehicle
 * with a 5-year accumulation phase and then a payout decision. The quiz
 * blends pooled-savings scenarios with money-personality questions and
 * produces TWO reads:
 *
 *   1. Risk profile — protecting vs growing their share of the pool
 *      (five tiers, Conservative → Aggressive).
 *   2. Wealth preference — after the 5 years, draw passive income or keep
 *      growing (Income / Balanced / Growth), plus the asset class that
 *      most appeals to them (property, dividends, growth equity, cash &
 *      bonds).
 *
 * Educational only — not financial advice.
 */

import type {
  LehumoRiskProfile,
  LehumoWealthPreference,
  LehumoAssetClass,
} from "@/lib/definitions";

// ── Risk tiers (protect ↔ grow the pool) ─────────────────────────────
export type RiskTierId =
  | "conservative"
  | "cautious"
  | "moderate"
  | "moderate-aggressive"
  | "aggressive";

export interface RiskTier {
  id: RiskTierId;
  /** Matches the Airtable Risk Profile single-select option. */
  name: LehumoRiskProfile;
  tagline: string;
  blurb: string;
  /** 0 (protect) → 100 (grow) position, for the meter. */
  lean: number;
}

export const RISK_TIERS: RiskTier[] = [
  {
    id: "conservative",
    name: "Conservative",
    tagline: "Protect the pool first",
    blurb:
      "You'd rather the pool grew slowly and safely than risk any of everyone's hard-earned contributions. Keeping the capital safe matters most.",
    lean: 8,
  },
  {
    id: "cautious",
    name: "Cautious",
    tagline: "Safety, with a little growth",
    blurb:
      "You want the pool to stay stable but still beat inflation. You'll accept small dips for a slightly better return — nothing dramatic.",
    lean: 28,
  },
  {
    id: "moderate",
    name: "Moderate",
    tagline: "A steady balance",
    blurb:
      "You're comfortable with moderate ups and downs in exchange for real growth on the pool — a balance between safety and building wealth.",
    lean: 50,
  },
  {
    id: "moderate-aggressive",
    name: "Moderate-Aggressive",
    tagline: "Grow the pool",
    blurb:
      "Growing the pool is the priority and you can ride out tougher years. You're in it for the long haul and want the pool working hard.",
    lean: 72,
  },
  {
    id: "aggressive",
    name: "Aggressive",
    tagline: "Maximise the pool's growth",
    blurb:
      "You're happy for the pool to ride full market ups and downs in exchange for the strongest possible long-term growth. Time is on your side.",
    lean: 92,
  },
];

export const riskTierByName = (name: string): RiskTier | undefined =>
  RISK_TIERS.find((t) => t.name === name);

// ── Wealth preference (income ↔ growth, post-accumulation) ───────────
export type WealthPreferenceId = "income" | "balanced" | "growth";

export interface WealthPref {
  id: WealthPreferenceId;
  /** Matches the Airtable Wealth Preference single-select option. */
  name: LehumoWealthPreference;
  tagline: string;
  blurb: string;
}

export const WEALTH_PREFERENCES: WealthPref[] = [
  {
    id: "income",
    name: "Income",
    tagline: "Passive cashflow",
    blurb:
      "After the 5 years you'd lean toward drawing a steady, passive income from your share — think high-dividend or rental-style cashflow.",
  },
  {
    id: "balanced",
    name: "Balanced",
    tagline: "Income + growth",
    blurb:
      "You'd want a bit of both — some income to enjoy now, with the rest left invested to keep growing your share.",
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "Keep compounding",
    blurb:
      "After the 5 years you'd rather reinvest and keep growing your share than draw it down — building wealth for the longer term.",
  },
];

export const wealthPrefByName = (name: string): WealthPref | undefined =>
  WEALTH_PREFERENCES.find((w) => w.name === name);

// ── Questions ────────────────────────────────────────────────────────
export type Dimension = "risk" | "wealth";

export interface PortalOption {
  label: string;
  score: number;
  /** Only on the asset-class question — the categorical preference
   *  captured directly from the member's choice. */
  assetClass?: LehumoAssetClass;
}

export interface PortalQuestion {
  id: string;
  prompt: string;
  helper?: string;
  dimension: Dimension;
  options: PortalOption[];
}

export const PORTAL_QUESTIONS: PortalQuestion[] = [
  // ── Risk dimension: protect ↔ grow the pool ──
  {
    id: "pool-priority",
    dimension: "risk",
    prompt:
      "Lehumo invests everyone's monthly contributions together as one pool. For your share, what matters most?",
    options: [
      { label: "Protecting every rand, even if it grows slowly", score: 0 },
      { label: "Mostly safety, with a little growth", score: 1 },
      { label: "A balance of safety and growth", score: 2 },
      { label: "Mostly growth, accepting some ups and downs", score: 3 },
      { label: "The strongest growth, even through bad years", score: 4 },
    ],
  },
  {
    id: "down-year",
    dimension: "risk",
    prompt:
      "In a tough year, the pool's value drops about 10% on paper. How would you feel?",
    helper: "There's no wrong answer — it's just how you're wired.",
    options: [
      { label: "Very anxious — I'd want to pull my share out", score: 0 },
      { label: "Uneasy, but I'd hold on", score: 1 },
      { label: "Fine — markets go up and down", score: 2 },
      { label: "Relaxed — I might even want to add more", score: 3 },
    ],
  },
  {
    id: "spare-money",
    dimension: "risk",
    prompt:
      "When you have spare money after your monthly expenses, what do you usually do with it?",
    helper: "How you handle your own money is a good guide.",
    options: [
      { label: "Spend it — treat myself or enjoy it", score: 0 },
      { label: "Keep it safe in savings", score: 1 },
      { label: "Save most, invest a little", score: 2 },
      { label: "Split it between saving and investing", score: 3 },
      { label: "Invest most of it to grow", score: 4 },
    ],
  },
  {
    id: "lock-in",
    dimension: "risk",
    prompt:
      "Lehumo locks contributions for the 5-year accumulation phase. How does that sit with you?",
    options: [
      { label: "I'd be nervous not being able to touch it", score: 0 },
      { label: "A little, but I understand why", score: 1 },
      { label: "Comfortable — that's the plan", score: 2 },
      { label: "Happy to leave it even longer for more growth", score: 3 },
    ],
  },
  // ── Wealth dimension: income ↔ growth + asset class ──
  {
    id: "post-accumulation",
    dimension: "wealth",
    prompt:
      "After the 5 years, once the pool has grown (say ~R2m for the group), what would you most want for your share?",
    helper: "This helps us plan the next phase around what members want.",
    options: [
      { label: "A steady passive income paid out to me", score: 0 },
      { label: "A mix of some income and some growth", score: 2 },
      { label: "Long-term capital growth, with little or no income", score: 4 },
    ],
  },
  {
    id: "asset-appeal",
    dimension: "wealth",
    prompt: "Which of these appeals most to you for building wealth?",
    helper: "Tells us the kind of assets the community is drawn to.",
    options: [
      {
        label: "Safe interest from bonds & cash",
        score: 0,
        assetClass: "Cash & bonds",
      },
      {
        label: "Shares that pay regular dividends",
        score: 1,
        assetClass: "Dividend income",
      },
      {
        label: "Property you can earn rent from",
        score: 2,
        assetClass: "Property",
      },
      {
        label: "Growth shares & ETFs that rise over time",
        score: 3,
        assetClass: "Growth equity",
      },
    ],
  },
  {
    id: "ideal-win",
    dimension: "wealth",
    prompt: "Picture your ideal money 'win'. Which feels better?",
    options: [
      { label: "A reliable monthly payout I can count on", score: 0 },
      { label: "A nice balance of payout and a growing balance", score: 2 },
      { label: "A much bigger balance years from now", score: 4 },
    ],
  },
];

export const PORTAL_QUESTION_COUNT = PORTAL_QUESTIONS.length;

// ── Scoring ──────────────────────────────────────────────────────────
const RISK_QUESTIONS = PORTAL_QUESTIONS.filter((q) => q.dimension === "risk");
const WEALTH_QUESTIONS = PORTAL_QUESTIONS.filter(
  (q) => q.dimension === "wealth",
);
const dimMax = (qs: PortalQuestion[]) =>
  qs.reduce((s, q) => s + Math.max(...q.options.map((o) => o.score)), 0);
const RISK_MAX = dimMax(RISK_QUESTIONS);
const WEALTH_MAX = dimMax(WEALTH_QUESTIONS);

export interface LehumoSurveyResult {
  riskTier: RiskTier;
  riskScore: number;
  wealthPref: WealthPref;
  assetClass: LehumoAssetClass | null;
}

/**
 * Score a full set of answers (option index per question, aligned to
 * PORTAL_QUESTIONS order) into the two-dimension result. Risk bands by
 * even 20% slices; wealth into Income / Balanced / Growth thirds.
 */
export function scoreLehumoSurvey(answers: number[]): LehumoSurveyResult {
  let riskScore = 0;
  let wealthScore = 0;
  let assetClass: LehumoAssetClass | null = null;

  PORTAL_QUESTIONS.forEach((q, i) => {
    const choice = answers[i];
    const opt = choice >= 0 ? q.options[choice] : undefined;
    if (!opt) return;
    if (q.dimension === "risk") riskScore += opt.score;
    else wealthScore += opt.score;
    if (opt.assetClass) assetClass = opt.assetClass;
  });

  const riskPct = RISK_MAX > 0 ? riskScore / RISK_MAX : 0;
  const riskIdx =
    riskPct <= 0.2
      ? 0
      : riskPct <= 0.4
        ? 1
        : riskPct <= 0.6
          ? 2
          : riskPct <= 0.8
            ? 3
            : 4;

  const wealthPct = WEALTH_MAX > 0 ? wealthScore / WEALTH_MAX : 0;
  const wealthIdx = wealthPct <= 0.34 ? 0 : wealthPct <= 0.66 ? 1 : 2;

  return {
    riskTier: RISK_TIERS[riskIdx],
    riskScore,
    wealthPref: WEALTH_PREFERENCES[wealthIdx],
    assetClass,
  };
}
