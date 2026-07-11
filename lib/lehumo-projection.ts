/**
 * Lehumo "your stake & future value" projection.
 *
 * A personal commitment device: from a member's contributions so far + their
 * pace, project where they land at the end of the 5-year accumulation phase —
 * the shares/votes they'll convert into at Phase 2, and an ILLUSTRATIVE value
 * of their stake at the strategy's target net return.
 *
 * Everything here is an illustration, NOT a guarantee. The numbers are wired
 * to the figures members have already been told (FAQ + ToR):
 *   • R40,000 floor to convert into Phase 2; from there every R20,000
 *     contributed buys 1 more share & 1 more vote (R40k = 2, R60k = 3),
 *     capped at 5 (R100,000).
 *   • Target net return of 15–17% after fees (strategy, not a promise).
 *
 * Pure — safe to call from server or client. Only needs each row's
 * `period` + `status`.
 */

import {
  CONTRIBUTION_STATUS,
  LEHUMO_FIRST_DUE_PERIOD,
  type LehumoContribution,
} from "./definitions";

/** Standard monthly net-to-pool (R). Matches lib/lehumo-milestones — the ToR
 *  vote tiers are denominated in principal (R1,000/month → R60k = 3 votes). */
export const PROJECTION_MONTHLY_ZAR = 1000;
/** A levered-up pace, for the "what levering up adds" toggle. */
export const LEVERED_MONTHLY_ZAR = 1500;
/** 5-year accumulation phase. */
export const TERM_MONTHS = 60;
/** Phase-2 conversion floor (FAQ: R40k over the 60 months). */
export const FLOOR_ZAR = 40000;
/** Full standard tier (3 shares & 3 votes). */
export const STANDARD_ZAR = 60000;
/** Target net return band after fees (FAQ: 15–17%). Illustrative only. */
export const NET_RETURN_LOW = 0.15;
export const NET_RETURN_HIGH = 0.17;

export const VOTE_STEP_ZAR = 20000; // every R20,000 = 1 more share & 1 more vote
export const MAX_VOTES = 5; // lever-up cap (5 shares & votes, reached at R100,000)
/** Contribution at which the vote cap is reached (R100,000) — the full length
 *  of the shares & votes bar. */
export const MAX_STAKE_ZAR = MAX_VOTES * VOTE_STEP_ZAR;

export type StakeTier = "below" | "floor" | "standard" | "levered";

export interface StakeProjection {
  /** Months paid so far (Paid rows). */
  paidMonths: number;
  /** Net pool capital banked so far = paidMonths × R1,000. */
  contributedToDate: number;
  /** Monthly pace used for this projection. */
  pace: number;
  /** Future contribution months at this pace — the smaller of months still
   *  owed and calendar months left. */
  monthsRemaining: number;
  /** Total the member will have contributed by year 5 at this pace. */
  projectedContributions: number;
  /** Shares/votes secured at the projected total (0 if below the floor). */
  projectedVotes: number;
  /** Shares/votes EARNED from contributions banked so far — one per R20,000,
   *  capped at 5. The member's real current progress (0 until the first R20k),
   *  as opposed to the projected year-5 total. */
  earnedVotes: number;
  /** R still needed to earn the next share & vote (0 once at the R100k cap). */
  toNextVote: number;
  /** Which conversion tier the projected total lands in. */
  tier: StakeTier;
  /** R still short of the R40k floor (0 once cleared). */
  toFloor: number;
  /** Illustrative value of the stake at year 5 (low/high of the target band),
   *  rounded to the nearest R100 to signal it's an illustration. */
  illustrativeLow: number;
  illustrativeHigh: number;
}

/** Absolute month index for a YYYY-MM period (chronological ordering). */
function monthIndex(period: string): number {
  const [y, m] = period.split("-").map(Number);
  return y * 12 + (m - 1);
}

/** Shares/votes earned at a given cumulative contribution. Below the R40k
 *  floor the member hasn't converted yet (0). From the floor up, every
 *  R20,000 buys 1 more share & 1 more vote, capped at 5 (reached at R100k). */
export function votesForTotal(total: number): number {
  if (total < FLOOR_ZAR) return 0;
  return Math.min(MAX_VOTES, Math.floor(total / VOTE_STEP_ZAR));
}

/** The share/vote tiers, for the on-card conversion scale. R40k = 2 (floor),
 *  R60k = 3, R80k = 4, R100k = 5 (max). */
export interface VoteTier {
  threshold: number;
  votes: number;
  max?: boolean;
}
export const VOTE_TIERS: VoteTier[] = [
  { threshold: FLOOR_ZAR, votes: 2 },
  { threshold: STANDARD_ZAR, votes: 3 },
  { threshold: STANDARD_ZAR + VOTE_STEP_ZAR, votes: 4 },
  { threshold: STANDARD_ZAR + 2 * VOTE_STEP_ZAR, votes: 5, max: true },
];

/** Future value of existing capital compounded + a monthly annuity of `pace`,
 *  over `months`, at `annualRate` (monthly compounding). Illustrative. */
function futureValue(
  existing: number,
  pace: number,
  months: number,
  annualRate: number,
): number {
  const i = annualRate / 12;
  const growth = Math.pow(1 + i, months);
  const existingFV = existing * growth;
  const annuityFV = i > 0 ? pace * ((growth - 1) / i) : pace * months;
  return existingFV + annuityFV;
}

const roundTo100 = (n: number): number => Math.round(n / 100) * 100;

function tierFor(total: number): StakeTier {
  if (total < FLOOR_ZAR) return "below";
  if (total < STANDARD_ZAR) return "floor";
  if (total < STANDARD_ZAR + VOTE_STEP_ZAR) return "standard"; // 60k–<80k
  return "levered";
}

/**
 * Project a member's stake at the end of the accumulation phase.
 *
 * `currentPeriod` (YYYY-MM) anchors how much of the 60-month term is left, so
 * a member who has fallen behind projects lower (they can't retroactively
 * refill missed months) rather than always landing on the on-pace total.
 */
export function computeStakeProjection(
  rows: Pick<LehumoContribution, "period" | "status">[] | undefined,
  currentPeriod: string,
  monthlyPace: number = PROJECTION_MONTHLY_ZAR,
): StakeProjection {
  const paidMonths = new Set(
    (rows ?? [])
      .filter((r) => r.status === CONTRIBUTION_STATUS.paid)
      .map((r) => r.period),
  ).size;
  const contributedToDate = paidMonths * PROJECTION_MONTHLY_ZAR;

  // Calendar months fully elapsed since launch, EXCLUDING the current
  // (in-progress) month — so the current month still counts as payable.
  // June 2026 → 0, July 2026 → 1.
  const monthsElapsed = Math.max(
    0,
    monthIndex(currentPeriod) - monthIndex(LEHUMO_FIRST_DUE_PERIOD),
  );
  const calendarMonthsLeft = Math.min(TERM_MONTHS, TERM_MONTHS - monthsElapsed);
  // Future contribution months at this pace: the smaller of the months still
  // owed to finish the 60-month term and the calendar months actually left —
  // a member who has fallen behind can't retroactively refill missed months,
  // so they project lower rather than always landing on the on-pace total.
  const monthsRemaining = Math.max(
    0,
    Math.min(TERM_MONTHS - paidMonths, calendarMonthsLeft),
  );

  const projectedContributions = contributedToDate + monthsRemaining * monthlyPace;

  return {
    paidMonths,
    contributedToDate,
    pace: monthlyPace,
    monthsRemaining,
    projectedContributions,
    projectedVotes: votesForTotal(projectedContributions),
    earnedVotes: Math.min(MAX_VOTES, Math.floor(contributedToDate / VOTE_STEP_ZAR)),
    toNextVote:
      contributedToDate >= MAX_STAKE_ZAR
        ? 0
        : VOTE_STEP_ZAR - (contributedToDate % VOTE_STEP_ZAR),
    tier: tierFor(projectedContributions),
    toFloor: Math.max(0, FLOOR_ZAR - projectedContributions),
    illustrativeLow: roundTo100(
      futureValue(contributedToDate, monthlyPace, monthsRemaining, NET_RETURN_LOW),
    ),
    illustrativeHigh: roundTo100(
      futureValue(contributedToDate, monthlyPace, monthsRemaining, NET_RETURN_HIGH),
    ),
  };
}
