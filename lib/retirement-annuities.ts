/**
 * South African retirement-annuity (RA) reference data + planning maths.
 *
 * Powers the Retirement Annuities section on /capital: the "how to choose"
 * guide, the goal calculator, and the fee-first benchmark tables.
 *
 * SOURCING RULE — every figure in this module was read off a primary
 * source (the provider's own fee schedule, fund MDD/factsheet, or a
 * National Treasury / SARS / FSCA document) and carries its `sourceUrl`
 * and `asAt` date. Nothing here is estimated or remembered. Where a
 * provider does not publish a figure, the field is `null` and the UI
 * renders "not published" rather than inventing a number. Improves on
 * lib/satrix-etfs.ts, which records no provenance at all.
 *
 * Fees change. Re-verify against `sourceUrl` before trusting a figure
 * older than the review date, and update DATA_REVIEWED_AT.
 *
 * EDUCATION ONLY. Lime Pages is not a licensed financial services
 * provider. This is factual product information to help readers ask
 * better questions — it is not advice and not a recommendation to buy
 * any product.
 */

/** When a human last re-checked every record below against its source. */
export const DATA_REVIEWED_AT = "2026-08-03";

// ─── Regulation 28 ──────────────────────────────────────────────────
/**
 * Reg 28 limits, from the amending gazette (GG 46649, Notice 2230,
 * 1 July 2022; effective 3 January 2023).
 *
 * The headline point for readers: Reg 28 is MANDATORY for every SA
 * retirement annuity — National Treasury's explanatory memorandum
 * states it "applies to all private pension funds". So "Reg 28
 * compliant" is a legal floor every RA shares, never a reason to pick
 * one over another. It caps how concentrated a fund may get; it does
 * not promise a good outcome, and Treasury says so explicitly.
 */
export const REG_28_SOURCE =
  "https://www.treasury.gov.za/comm_media/press/2022/2022070501%20Published%20Amendments%20to%20Reg%2028.pdf";

export interface Reg28Limit {
  assetClass: string;
  limitPct: number | null;
  note: string;
}

export const REG_28_LIMITS: Reg28Limit[] = [
  { assetClass: "Equities", limitPct: 75, note: "Listed shares, local and offshore combined" },
  { assetClass: "Offshore assets", limitPct: 45, note: "Raised from 35% in the 2022 amendment" },
  { assetClass: "Immovable property", limitPct: 25, note: "Listed property and direct property" },
  { assetClass: "Private equity", limitPct: 15, note: "Max 5% in any single private-equity fund" },
  { assetClass: "Hedge funds", limitPct: 10, note: "Max 2.5% in any single hedge fund" },
  { assetClass: "Commodities", limitPct: 10, note: "Gold up to 10%; other commodities 5% each" },
  { assetClass: "Crypto assets", limitPct: 0, note: "Expressly prohibited — a fund may not invest in crypto assets" },
];

// ─── Tax + access rules (2026/27 tax year) ──────────────────────────
/**
 * Verified against the National Treasury / SARS Budget 2026 Tax Guide.
 *
 * CAUTION for future editors: SARS's own s11F FAQ pages and its "Tax
 * and Retirement" page were still showing the OLD R350 000 cap and the
 * OLD R247 500 de minimis when this data was gathered. Do not "correct"
 * these constants against those stale pages — the Budget 2026 Tax Guide
 * and the March 2026 gazette are the authorities.
 */
export const TAX_YEAR_LABEL = "2026/27";

/** Max % of the greater of remuneration or taxable income that is deductible. */
export const RA_DEDUCTION_PCT = 0.275;

/** Annual rand cap on the deduction — raised from R350 000 on 1 March 2026. */
export const RA_DEDUCTION_CAP_ZAR = 430_000;

export const RA_TAX_SOURCE =
  "https://www.treasury.gov.za/documents/National%20Budget/2026/sars/Budget%202026%20Tax%20guide.pdf";

/** Retirement interest below which no annuity purchase is required. */
export const DE_MINIMIS_ZAR = 360_000;

/** Earliest retirement age from an RA, barring disability. */
export const EARLIEST_RETIREMENT_AGE = 55;

/**
 * SARS income-tax brackets for 2026/27, used by the calculator to work
 * out the marginal rate that determines a contribution's tax refund.
 * `from` is inclusive of the bracket's lower bound of taxable income.
 */
export interface TaxBracket {
  from: number;
  to: number | null;
  marginalRate: number;
  label: string;
}

export const TAX_BRACKETS: TaxBracket[] = [
  { from: 0, to: 262_050, marginalRate: 0.18, label: "Up to R262 050" },
  { from: 262_051, to: 410_460, marginalRate: 0.26, label: "R262 051 – R410 460" },
  { from: 410_461, to: 555_600, marginalRate: 0.31, label: "R410 461 – R555 600" },
  { from: 555_601, to: 708_310, marginalRate: 0.36, label: "R555 601 – R708 310" },
  { from: 708_311, to: 902_550, marginalRate: 0.39, label: "R708 311 – R902 550" },
  { from: 902_551, to: 1_817_000, marginalRate: 0.41, label: "R902 551 – R1 817 000" },
  { from: 1_817_001, to: null, marginalRate: 0.45, label: "Above R1 817 000" },
];

// ─── Two-pot system ─────────────────────────────────────────────────
export const TWO_POT_SOURCE =
  "https://www2.fsca.co.za/Documents/Two-Pot%20Brochure%20FAQs.pdf";

/** Minimum savings-component withdrawal, once per tax year. */
export const TWO_POT_MIN_WITHDRAWAL_ZAR = 2_000;

// ─── Product records ────────────────────────────────────────────────

export type FeeConfidence =
  /** Every component of the all-in cost came off a primary source. */
  | "verified"
  /** Some components verified; at least one is provider-dependent or unpublished. */
  | "partial";

export type RaShape =
  /** A single ready-made Reg 28 fund — one decision, one all-in number. */
  | "ready-made"
  /** A platform where you choose the underlying funds yourself. */
  | "self-directed";

export interface RaReturns {
  oneYear: number | null;
  threeYear: number | null;
  fiveYear: number | null;
  tenYear: number | null;
  /** Date the return series is measured to — returns are only comparable within the same date. */
  asAt: string;
  /** Peer/benchmark comparison where the factsheet publishes one. */
  benchmarkNote: string | null;
}

export interface RaProduct {
  id: string;
  provider: string;
  productName: string;
  /**
   * The fund's full registered name, exactly as it appears on the
   * provider's minimum disclosure document — including the "Fund" suffix
   * and unit class, because the class materially changes the fee (Old
   * Mutual's A class costs more than its B1 for identical exposure).
   * A reader should be able to paste this straight into a fund search.
   *
   * Null for self-directed platforms, which have no default fund.
   */
  fundName: string | null;
  shape: RaShape;
  /**
   * Total annual cost for a member with roughly R500 000 invested, as a
   * percentage. For self-directed platforms this is the PLATFORM cost
   * only — the fund you choose is charged on top, which is exactly why
   * the two shapes are never ranked against each other in the UI.
   */
  allInPct: number;
  /** Human-readable arithmetic behind allInPct, so a reader can check it. */
  feeBreakdown: string;
  feeConfidence: FeeConfidence;
  minMonthlyZar: number | null;
  returns: RaReturns | null;
  /** Reg 28 compliance is mandatory, so this is always true — shown for reassurance. */
  reg28Compliant: true;
  /** Early-termination / causal-event penalties. Null where the provider is silent. */
  penalties: string | null;
  bestFor: string;
  watchOut: string | null;
  sourceUrl: string;
  /** Date printed on the source document for the FEE figures. */
  asAt: string;
}

/**
 * Ready-made RA funds — a single Reg 28 balanced fund inside the RA
 * wrapper, so the quoted cost is genuinely all-in and the products are
 * directly comparable to each other.
 */
export const READY_MADE_RAS: RaProduct[] = [
  {
    id: "sygnia-skeleton-70",
    provider: "Sygnia",
    productName: "Sygnia Retirement Annuity",
    fundName: "Sygnia Skeleton Balanced 70 Fund (Class A)",
    shape: "ready-made",
    allInPct: 0.9,
    feeBreakdown:
      "0.4025% platform admin (incl VAT, on the first R2m) + 0.50% total investment charge (TER 0.45% + 0.05% transaction costs)",
    feeConfidence: "verified",
    minMonthlyZar: 500,
    returns: {
      oneYear: 21.2,
      threeYear: 15.1,
      fiveYear: 12.4,
      tenYear: null,
      asAt: "2026-04-30",
      benchmarkNote:
        "Category median over the same periods: 18.6% / 13.3% / 12.4%",
    },
    reg28Compliant: true,
    penalties: null,
    bestFor:
      "The cheapest verified all-in cost here, tracking indices rather than trying to beat them.",
    watchOut:
      "Sygnia's RA has no default fund — this is their flagship balanced fund, but you must actively choose it. Adviser fees, if you use one, are charged on top.",
    sourceUrl: "https://www.sygnia.co.za/product/sygnia-retirement-annuity/",
    asAt: "2026-04-30",
  },
  {
    id: "10x-your-future",
    provider: "10X Investments",
    productName: "10X Retirement Annuity",
    fundName: "10X Your Future Fund (Class A)",
    shape: "ready-made",
    allInPct: 1.04,
    feeBreakdown:
      "Sliding-scale all-in fee of 1.04% at R500k (TER 0.62% + 0.03% transaction costs sit inside this)",
    feeConfidence: "partial",
    minMonthlyZar: null,
    returns: {
      oneYear: 13.8,
      threeYear: 12.6,
      fiveYear: 11.6,
      tenYear: null,
      asAt: "2026-03-31",
      benchmarkNote: "Net of fees, distributions reinvested. 7-year: 10.8% p.a.",
    },
    reg28Compliant: true,
    penalties: null,
    bestFor:
      "A genuinely single-decision RA — one fund, one sliding fee, no fund-picking required.",
    watchOut:
      "10X's own pages disagree on whether trading costs of 0.12%–0.18% sit inside the 1.04% or on top. Ask them to confirm in writing before you commit.",
    sourceUrl: "https://www.10x.co.za/retirement-annuity",
    asAt: "2026-03-31",
  },
  {
    id: "nedgroup-core-diversified",
    provider: "Nedgroup Investments",
    productName: "Nedgroup Investments Retirement Annuity",
    fundName: "Nedgroup Investments Core Diversified Fund (Class C)",
    shape: "ready-made",
    allInPct: 0.64,
    feeBreakdown:
      "Fund total investment charge 0.64% incl VAT (TER 0.62% + 0.02% transaction costs). Platform admin not separately published for this route",
    feeConfidence: "partial",
    minMonthlyZar: 250,
    returns: {
      oneYear: 13.8,
      threeYear: 13.7,
      fiveYear: 12.2,
      tenYear: 9.3,
      asAt: "2026-06-30",
      benchmarkNote:
        "ASISA category average over the same periods: 12.3% / 12.6% / 11.0%",
    },
    reg28Compliant: true,
    penalties: "None — the product brochure states 'No causal event fees or penalties'",
    bestFor:
      "The lowest published fund charge of the ready-made options, with a full 10-year track record behind it.",
    watchOut:
      "The 0.64% is the fund charge. Confirm what the platform adds on top for your investment route before comparing it to a true all-in number.",
    sourceUrl:
      "https://www.nedgroupinvestments.co.za/funds/core-diversified-fund",
    asAt: "2026-06-30",
  },
  {
    id: "old-mutual-balanced",
    provider: "Old Mutual",
    productName: "Old Mutual Wealth Retirement Annuity",
    fundName: "Old Mutual Balanced Fund (Class B1)",
    shape: "ready-made",
    allInPct: 1.34,
    feeBreakdown:
      "Total investment charge 1.34% incl VAT (TER 1.20% + 0.14% transaction costs). Platform admin charged separately",
    feeConfidence: "partial",
    minMonthlyZar: 500,
    returns: {
      oneYear: 13.9,
      threeYear: 13.2,
      fiveYear: 11.1,
      tenYear: 8.9,
      asAt: "2026-06-30",
      benchmarkNote: "Class B1 (the platform class), net of fees",
    },
    reg28Compliant: true,
    penalties: "None — 'You may stop your monthly contributions at any time. No penalties will apply'",
    bestFor:
      "An actively managed balanced fund from a large insurer, on a modern no-penalty platform.",
    watchOut:
      "Make sure you are quoted the B1 class. The A and R classes of the same fund cost materially more for identical exposure.",
    sourceUrl: "https://www.oldmutual.co.za/personal/solutions/retirement/",
    asAt: "2026-03-31",
  },
  {
    id: "allan-gray-balanced",
    provider: "Allan Gray",
    productName: "Allan Gray Retirement Annuity Fund",
    fundName: "Allan Gray Balanced Fund",
    shape: "ready-made",
    allInPct: 1.94,
    feeBreakdown:
      "1.71% total investment charge (TER 1.64% + 0.07% transaction costs) + 0.23% admin fee incl VAT (0.20% excl VAT)",
    feeConfidence: "verified",
    minMonthlyZar: null,
    returns: null,
    reg28Compliant: true,
    penalties:
      "None — you can change or add money at any time without transaction fees or penalties",
    bestFor:
      "A long-standing contrarian manager whose fee falls when they underperform.",
    watchOut:
      "The management fee is performance-linked: a 1% base at benchmark, moving between 0.5% and 1.5% (excl VAT) by 0.1% for every 1% of over- or under-performance over two years. It was running at 1.46% when checked, so your cost rises exactly when they do well.",
    sourceUrl: "https://www.allangray.co.za/fund-pages/balanced-fund/",
    asAt: "2026-06-30",
  },
  {
    id: "coronation-balanced-plus",
    provider: "Coronation",
    productName: "Coronation Retirement Annuity Fund",
    fundName: "Coronation Balanced Plus Fund (Class A)",
    shape: "ready-made",
    allInPct: 1.8,
    feeBreakdown:
      "1.80% total investment charge (TER 1.61% + 0.18% transaction costs). No initial fee and no annual administration fee — Coronation subsidises the admin in full",
    feeConfidence: "verified",
    minMonthlyZar: 500,
    returns: {
      oneYear: 9.8,
      threeYear: 9.3,
      fiveYear: 10.1,
      tenYear: 9.7,
      asAt: "2026-06-30",
      benchmarkNote:
        "Peer group average: 12.3% / 12.5% / 10.8% / 8.3%. Coronation trails its peers over 1–5 years but leads over 10, 15 and 20",
    },
    reg28Compliant: true,
    penalties:
      "None — contributions can be reduced, stopped or resumed at any time without penalty",
    bestFor:
      "The only major manager here charging no administration fee at all, and the strongest 10-year-plus record in this table.",
    watchOut:
      "The last five years have lagged the peer average. The long record is good, but past performance genuinely does not predict the next decade.",
    sourceUrl:
      "https://www.coronation.com/globalassets/sa-personal/funds/retirement_annuity_features_and_benefits.pdf",
    asAt: "2026-06-30",
  },
];

/**
 * Self-directed platforms — you pick the underlying funds, so the cost
 * shown is the PLATFORM fee only and your total depends on what you
 * choose. Deliberately kept in a separate table: ranking a 0.35%
 * platform fee against a 1.80% all-in fund cost would be nonsense.
 */
export const SELF_DIRECTED_RAS: RaProduct[] = [
  {
    id: "easyequities-ra",
    provider: "EasyEquities",
    productName: "EasyEquities Retirement Annuity",
    fundName: null,
    shape: "self-directed",
    allInPct: 0.595,
    feeBreakdown:
      "0.345% platform admin incl VAT + 0.25% unit trust platform fee. Your chosen funds or bundles charge on top",
    feeConfidence: "partial",
    minMonthlyZar: null,
    returns: null,
    reg28Compliant: true,
    penalties: null,
    bestFor:
      "No minimum at all, so you can start with whatever you have and add ad hoc.",
    watchOut:
      "You are responsible for keeping your own mix Reg 28 compliant. Administered by D&D The Cycle (Pty) Ltd, not by EasyEquities itself.",
    sourceUrl: "https://www.easyequities.co.za/retirement-annuity",
    asAt: "2025-04-23",
  },
  {
    id: "fnb-ra",
    provider: "FNB",
    productName: "FNB Retirement Annuity (Horizon Series)",
    fundName: null,
    shape: "self-directed",
    allInPct: 0.4025,
    feeBreakdown:
      "0.4025% admin incl VAT via the digital channel in FNB/Ashburton funds. Fund TER charged on top",
    feeConfidence: "partial",
    minMonthlyZar: 300,
    returns: null,
    reg28Compliant: true,
    penalties: null,
    bestFor:
      "A low admin fee if you already bank with FNB and will manage it in the app.",
    watchOut:
      "The 0.4025% applies to the digital channel in their own funds — other routes cost more. Fund TERs were not published in a machine-readable form when checked.",
    sourceUrl: "https://www.fnb.co.za/investments/retirement-annuity.html",
    asAt: "2026-07-01",
  },
  {
    id: "discovery-flexible-ra",
    provider: "Discovery",
    productName: "Discovery Flexible Recurring Retirement Annuity",
    fundName: null,
    shape: "self-directed",
    allInPct: 0.46,
    feeBreakdown:
      "0.46% incl VAT administration at R500k (0.40% excl VAT). Fund management fees charged on top",
    feeConfidence: "partial",
    minMonthlyZar: null,
    returns: null,
    reg28Compliant: true,
    penalties:
      "None — 'You will not pay any early exit fees if you stop or reduce your contributions'",
    bestFor:
      "Discovery's new-generation low-cost option, launched March 2026, with around 200 funds to choose from.",
    watchOut:
      "Do not confuse it with Discovery's legacy Recurring RA, which charges 3.565% incl VAT administration and forces a contractual annual contribution increase.",
    sourceUrl: "https://www.discovery.co.za/invest/retirement-annuity",
    asAt: "2026-03-01",
  },
  {
    id: "absa-ra",
    provider: "Absa",
    productName: "Absa Retirement Annuity",
    fundName: null,
    shape: "self-directed",
    allInPct: 0.719,
    feeBreakdown:
      "0.719% incl VAT at R500k (0.75% on the first R250k, 0.50% on the next R250k, excl VAT). Fund fees on top",
    feeConfidence: "partial",
    minMonthlyZar: 500,
    returns: null,
    reg28Compliant: true,
    penalties: null,
    bestFor: "An open fund range for someone who wants to build their own mix.",
    watchOut:
      "R25 000 minimum lump sum is the highest here, and the brochure carried no printed date when checked — confirm current pricing.",
    sourceUrl: "https://www.absa.co.za/personal/invest/for-retirement/",
    asAt: "2026-01-01",
  },
];

/**
 * Products whose published cost is high enough that a reader should
 * understand what they are buying before signing. Not ranked with the
 * rest — the point is the warning, not the league position.
 */
export interface RaWatchOut {
  provider: string;
  productName: string;
  headlineCost: string;
  why: string;
  sourceUrl: string;
}

export const HIGH_COST_WATCHLIST: RaWatchOut[] = [
  {
    provider: "Discovery",
    productName: "Discovery Recurring Retirement Annuity (legacy pricing)",
    headlineCost: "3.565% incl VAT administration, plus fund fees",
    why:
      "Roughly four times the cheapest option in the ready-made table, before any fund fee. It also requires a contractual annual contribution increase. Discovery's own Flexible RA, launched March 2026, does the same job far cheaper.",
    sourceUrl: "https://www.discovery.co.za/invest/retirement-annuity",
  },
  {
    provider: "Sanlam",
    productName: "Sanlam Cumulus Echo Retirement Plan",
    headlineCost: "4.20% marketing and administration charge",
    why:
      "A life-wrapped legacy structure. Sanlam's page does not state whether the 4.20% is annual or once-off, so we will not publish it as an annual figure — but a charge of that size on any basis deserves a direct question before you sign.",
    sourceUrl: "https://www.sanlam.co.za/personal/retirement/Pages/default.aspx",
  },
];

// ─── Ranking ────────────────────────────────────────────────────────
/**
 * Fees first, performance second — the user-facing promise of this
 * section, and the defensible order given fees are knowable in advance
 * while returns are not.
 *
 * Cost is rounded to the nearest 0.05% before comparison so that
 * products which are effectively the same price are separated by their
 * long-term record rather than by a rounding artefact. Performance uses
 * the longest series a product publishes, because a 10-year number
 * survives a market cycle and a 1-year number does not. Products with
 * no published returns sort last within their cost band.
 */
export function rankByFeesThenPerformance(products: RaProduct[]): RaProduct[] {
  const band = (pct: number) => Math.round(pct / 0.05);
  const longestReturn = (p: RaProduct): number | null => {
    const r = p.returns;
    if (!r) return null;
    return r.tenYear ?? r.fiveYear ?? r.threeYear ?? r.oneYear ?? null;
  };

  return [...products].sort((a, b) => {
    const costDiff = band(a.allInPct) - band(b.allInPct);
    if (costDiff !== 0) return costDiff;

    const ra = longestReturn(a);
    const rb = longestReturn(b);
    if (ra === null && rb === null) return a.provider.localeCompare(b.provider);
    if (ra === null) return 1;
    if (rb === null) return -1;
    return rb - ra;
  });
}

// ─── Calculator maths ───────────────────────────────────────────────

export interface RetirementInputs {
  currentAge: number;
  retirementAge: number;
  currentSavingsZar: number;
  monthlyContributionZar: number;
  /** Target monthly income at retirement, expressed in TODAY's money. */
  targetMonthlyIncomeZar: number;
  /** Expected nominal annual return before fees, as a percentage. */
  grossReturnPct: number;
  /** Annual fee drag, as a percentage — the whole point of the fee tables. */
  feePct: number;
  inflationPct: number;
  /** Annual taxable income, used to find the marginal rate for the refund. */
  annualIncomeZar: number;
}

export interface RetirementProjection {
  yearsToRetirement: number;
  /** Projected fund value at retirement, in nominal (future) rands. */
  projectedValueZar: number;
  /** The same value expressed in today's purchasing power. */
  projectedValueTodayZar: number;
  /** Sustainable monthly income the pot supports, in today's money. */
  sustainableMonthlyIncomeZar: number;
  targetMonthlyIncomeZar: number;
  /** Positive when on track to exceed the target, negative when short. */
  monthlySurplusZar: number;
  onTrack: boolean;
  /** Monthly contribution needed to exactly hit the target. */
  requiredMonthlyZar: number;
  /** Total contributed over the term, nominal. */
  totalContributedZar: number;
  /** This year's SARS refund from the contributions. */
  annualTaxRefundZar: number;
  marginalRate: number;
  /** True when contributions exceed the deductible limit. */
  exceedsDeductionLimit: boolean;
  deductibleLimitZar: number;
}

/**
 * The 4% rule, applied to a South African RA. At retirement two-thirds
 * of the pot must buy an annuity, so this is a planning approximation
 * of sustainable income rather than a quote for any specific annuity.
 */
export const SAFE_WITHDRAWAL_RATE = 0.04;

/** Marginal rate for a given annual taxable income. */
export function marginalRateFor(annualIncomeZar: number): number {
  const bracket =
    TAX_BRACKETS.find(
      (b) => annualIncomeZar >= b.from && (b.to === null || annualIncomeZar <= b.to),
    ) ?? TAX_BRACKETS[0];
  return bracket.marginalRate;
}

/**
 * Future value of a starting balance plus a monthly contribution,
 * compounded monthly at `annualRate`. Contributions are treated as
 * arriving at the end of each month (an ordinary annuity), which is how
 * a debit order actually behaves.
 */
function futureValue(
  presentValue: number,
  monthlyContribution: number,
  annualRate: number,
  years: number,
): number {
  const months = Math.round(years * 12);
  const r = annualRate / 12;
  if (months <= 0) return presentValue;
  if (Math.abs(r) < 1e-9) return presentValue + monthlyContribution * months;
  const growth = Math.pow(1 + r, months);
  return presentValue * growth + monthlyContribution * ((growth - 1) / r);
}

/** Monthly contribution required to reach `target`, given a starting balance. */
function requiredMonthly(
  presentValue: number,
  target: number,
  annualRate: number,
  years: number,
): number {
  const months = Math.round(years * 12);
  const r = annualRate / 12;
  if (months <= 0) return 0;
  const growth = Math.pow(1 + r, months);
  const shortfall = target - presentValue * growth;
  if (shortfall <= 0) return 0;
  if (Math.abs(r) < 1e-9) return shortfall / months;
  return shortfall / ((growth - 1) / r);
}

export function projectRetirement(input: RetirementInputs): RetirementProjection {
  const years = Math.max(0, input.retirementAge - input.currentAge);

  // Fees come straight off the return — this is the lever the whole
  // section is about, so it is modelled explicitly rather than folded
  // into a single "expected return" assumption.
  const netReturn = (input.grossReturnPct - input.feePct) / 100;
  const inflation = input.inflationPct / 100;

  const projectedValueZar = futureValue(
    input.currentSavingsZar,
    input.monthlyContributionZar,
    netReturn,
    years,
  );

  const inflationFactor = Math.pow(1 + inflation, years);
  const projectedValueTodayZar = projectedValueZar / inflationFactor;

  const sustainableMonthlyIncomeZar =
    (projectedValueTodayZar * SAFE_WITHDRAWAL_RATE) / 12;

  // The target is given in today's money, so grow it to a nominal pot.
  const targetPotNominal =
    ((input.targetMonthlyIncomeZar * 12) / SAFE_WITHDRAWAL_RATE) * inflationFactor;

  const requiredMonthlyZar = requiredMonthly(
    input.currentSavingsZar,
    targetPotNominal,
    netReturn,
    years,
  );

  const annualContribution = input.monthlyContributionZar * 12;
  const deductibleLimitZar = Math.min(
    input.annualIncomeZar * RA_DEDUCTION_PCT,
    RA_DEDUCTION_CAP_ZAR,
  );
  const deductible = Math.min(annualContribution, deductibleLimitZar);
  const marginalRate = marginalRateFor(input.annualIncomeZar);

  return {
    yearsToRetirement: years,
    projectedValueZar,
    projectedValueTodayZar,
    sustainableMonthlyIncomeZar,
    targetMonthlyIncomeZar: input.targetMonthlyIncomeZar,
    monthlySurplusZar:
      sustainableMonthlyIncomeZar - input.targetMonthlyIncomeZar,
    onTrack: sustainableMonthlyIncomeZar >= input.targetMonthlyIncomeZar,
    requiredMonthlyZar,
    totalContributedZar: annualContribution * years,
    annualTaxRefundZar: deductible * marginalRate,
    marginalRate,
    exceedsDeductionLimit: annualContribution > deductibleLimitZar,
    deductibleLimitZar,
  };
}

/**
 * What a fee difference costs over the whole term, holding everything
 * else constant. Used to turn "0.9% vs 1.94%" from an abstraction into
 * a rand number the reader can feel.
 */
export function feeImpact(
  input: RetirementInputs,
  lowFeePct: number,
  highFeePct: number,
): { lowFeeValueZar: number; highFeeValueZar: number; differenceZar: number } {
  const low = projectRetirement({ ...input, feePct: lowFeePct }).projectedValueZar;
  const high = projectRetirement({ ...input, feePct: highFeePct }).projectedValueZar;
  return {
    lowFeeValueZar: low,
    highFeeValueZar: high,
    differenceZar: low - high,
  };
}
