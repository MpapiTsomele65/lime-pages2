/**
 * Risk-profile framework + curated Satrix ETF set for the Lime Capital
 * risk profiler (components/sections/capital/RiskProfiler.tsx).
 *
 * Profiles follow the five tiers Satrix uses in "Understanding Risk
 * Profiles" (and the Discovery risk-profile assessment): Conservative →
 * Aggressive, spanning the income → growth spectrum.
 *
 * ⚠️ The ETF list below is ILLUSTRATIVE and for education only. Tickers,
 * availability and classifications must be verified on satrix.co.za
 * before anyone acts on them. Lime Pages is not an FSP and this is not
 * financial advice.
 */

export const SATRIX_PRODUCTS_URL = "https://satrix.co.za/products";

// ── Risk profiles ────────────────────────────────────────────────────
export type ProfileId =
  | "conservative"
  | "cautious"
  | "moderate"
  | "moderate-aggressive"
  | "aggressive";

export type Accent = "teal" | "capital" | "navy";

export interface RiskProfile {
  id: ProfileId;
  name: string;
  tagline: string;
  blurb: string;
  horizon: string;
  target: string;
  /** Position on the income(0) → growth(100) spectrum, for the lean bar. */
  lean: number;
  leanLabel: string;
  accent: Accent;
}

export const RISK_PROFILES: RiskProfile[] = [
  {
    id: "conservative",
    name: "Conservative",
    tagline: "Protect what I have",
    blurb:
      "You want stability and easy access to your money. Big swings keep you up at night, so capital preservation comes first and growth second.",
    horizon: "Under 3 years",
    target: "CPI + 1–2%",
    lean: 8,
    leanLabel: "Income & capital preservation",
    accent: "teal",
  },
  {
    id: "cautious",
    name: "Cautious",
    tagline: "Steady, with a little growth",
    blurb:
      "You'll accept small ups and downs to beat inflation, but you still lean on reliable income and want your capital to stay fairly stable.",
    horizon: "3+ years",
    target: "CPI + 2–3%",
    lean: 28,
    leanLabel: "Mostly income",
    accent: "teal",
  },
  {
    id: "moderate",
    name: "Moderate",
    tagline: "A balance of both",
    blurb:
      "You're comfortable with moderate ups and downs in exchange for real growth. You want a balance between income today and building wealth over time.",
    horizon: "5+ years",
    target: "CPI + 3–4%",
    lean: 50,
    leanLabel: "Balanced income & growth",
    accent: "navy",
  },
  {
    id: "moderate-aggressive",
    name: "Moderate-Aggressive",
    tagline: "Growth first",
    blurb:
      "Growth is the goal and you can ride out equity-style swings. Income is a secondary consideration — you're investing for the longer haul.",
    horizon: "7+ years",
    target: "CPI + 4–5%",
    lean: 72,
    leanLabel: "Mostly growth",
    accent: "capital",
  },
  {
    id: "aggressive",
    name: "Aggressive",
    tagline: "Maximise long-term growth",
    blurb:
      "You're chasing maximum growth and you won't flinch at sharp short-term drops. Time is on your side and you don't need income from this money.",
    horizon: "10+ years",
    target: "CPI + 5–6%",
    lean: 92,
    leanLabel: "Pure growth",
    accent: "capital",
  },
];

export function profileById(id: ProfileId): RiskProfile {
  return RISK_PROFILES.find((p) => p.id === id) ?? RISK_PROFILES[2];
}

// ── Curated Satrix ETFs (illustrative — verify on satrix.co.za) ───────
export type EtfCategory = "Income" | "Balanced" | "Growth";

export interface SatrixEtf {
  name: string;
  ticker: string;
  category: EtfCategory;
  /** Which risk profiles this fund typically suits. */
  profiles: ProfileId[];
  blurb: string;
}

export const SATRIX_ETFS: SatrixEtf[] = [
  {
    name: "Satrix SA Bond ETF",
    ticker: "STXGOV",
    category: "Income",
    profiles: ["conservative", "cautious"],
    blurb:
      "Tracks South African government bonds for steady interest income and low volatility.",
  },
  {
    name: "Satrix Inflation-Linked Bond ETF",
    ticker: "STXILB",
    category: "Income",
    profiles: ["conservative", "cautious"],
    blurb:
      "Government inflation-linked bonds that aim to protect your money's buying power.",
  },
  {
    name: "Satrix Dividend Plus ETF",
    ticker: "STXDIV",
    category: "Income",
    profiles: ["cautious", "moderate"],
    blurb:
      "High-dividend JSE shares selected for above-average, regular income.",
  },
  {
    name: "Satrix Property ETF",
    ticker: "STXPRO",
    category: "Income",
    profiles: ["cautious", "moderate"],
    blurb:
      "SA listed property (REITs) for rental-driven income with some capital growth.",
  },
  {
    name: "Satrix Quality SA ETF",
    ticker: "STXQUA",
    category: "Balanced",
    profiles: ["moderate", "moderate-aggressive"],
    blurb:
      "Profitable, stable SA companies — growth with a defensive quality tilt.",
  },
  {
    name: "Satrix 40 ETF",
    ticker: "STX40",
    category: "Balanced",
    profiles: ["moderate", "moderate-aggressive"],
    blurb:
      "The 40 largest companies on the JSE — South Africa's core equity building block.",
  },
  {
    name: "Satrix Capped SWIX All Share ETF",
    ticker: "STXCAP",
    category: "Growth",
    profiles: ["moderate-aggressive", "aggressive"],
    blurb:
      "Broad SA equity-market exposure with single-stock caps for diversification.",
  },
  {
    name: "Satrix MSCI World ETF",
    ticker: "STXWDM",
    category: "Growth",
    profiles: ["moderate-aggressive", "aggressive"],
    blurb:
      "Thousands of companies across developed markets — global growth in one fund.",
  },
  {
    name: "Satrix S&P 500 ETF",
    ticker: "STX500",
    category: "Growth",
    profiles: ["moderate-aggressive", "aggressive"],
    blurb:
      "The 500 largest US companies — broad exposure to the world's biggest market.",
  },
  {
    name: "Satrix Nasdaq 100 ETF",
    ticker: "STXNDQ",
    category: "Growth",
    profiles: ["aggressive"],
    blurb:
      "The 100 biggest US non-financials — tech-heavy, higher growth and higher swings.",
  },
  {
    name: "Satrix MSCI Emerging Markets ETF",
    ticker: "STXEMG",
    category: "Growth",
    profiles: ["aggressive"],
    blurb:
      "Faster-growing emerging economies — more volatility, suited to long horizons.",
  },
  {
    name: "Satrix MSCI India ETF",
    ticker: "STXNDA",
    category: "Growth",
    profiles: ["aggressive"],
    blurb:
      "Concentrated exposure to one of the fastest-growing large economies.",
  },
];

export function etfsForProfile(id: ProfileId): SatrixEtf[] {
  return SATRIX_ETFS.filter((e) => e.profiles.includes(id));
}

// ── Scenario questions + scoring ─────────────────────────────────────
export interface QuizOption {
  label: string;
  score: number;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  helper?: string;
  options: QuizOption[];
}

export const QUESTIONS: QuizQuestion[] = [
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
      "Your R50,000 investment falls to R40,000 in three months. Your honest first reaction?",
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
      "Over one year, which range of outcomes for R100,000 sits most comfortably with you?",
    helper: "Bigger possible gains always come with bigger possible drops.",
    options: [
      { label: "R104k up / R98k down — small and steady", score: 0 },
      { label: "R112k up / R94k down", score: 1 },
      { label: "R125k up / R85k down", score: 2 },
      { label: "R140k up / R75k down — big swings are fine", score: 3 },
    ],
  },
  {
    id: "goal",
    prompt: "What's this money really for?",
    options: [
      { label: "Protecting savings I can't afford to lose", score: 0 },
      { label: "A reliable income stream", score: 1 },
      { label: "Steadily building wealth over time", score: 2 },
      { label: "Maximum growth over the decades ahead", score: 3 },
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

export const MAX_SCORE = QUESTIONS.reduce(
  (sum, q) => sum + Math.max(...q.options.map((o) => o.score)),
  0,
);

/** Map a total score to a profile using even 20% bands of the maximum. */
export function scoreToProfile(total: number): RiskProfile {
  const pct = MAX_SCORE > 0 ? total / MAX_SCORE : 0;
  const idx =
    pct <= 0.2 ? 0 : pct <= 0.4 ? 1 : pct <= 0.6 ? 2 : pct <= 0.8 ? 3 : 4;
  return RISK_PROFILES[idx];
}
