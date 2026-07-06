import {
  CONTRIBUTION_STATUS,
  LEHUMO_FIRST_DUE_PERIOD,
  type LehumoContribution,
} from "./definitions";

// Net pool capital per Paid month. The ToR vote tiers are denominated in
// principal (R1,000/month → R60,000 = 3 votes), NOT the gross Paystack debit
// that includes the service fee — so milestones count Paid months × R1,000,
// consistent with the community-pool "net to pool" figure.
const MONTHLY_ZAR = 1000;

export interface Milestone {
  id: string;
  /** Cumulative net pool capital (R) that unlocks this badge. */
  threshold: number;
  label: string;
  sub: string;
}

/** Contribution milestones, tied to the ToR vote tiers (R40k = 2 votes,
 *  R60k = 3 votes). Ascending by threshold. */
export const MILESTONES: Milestone[] = [
  { id: "first", threshold: 1000, label: "Founding contributor", sub: "First R1,000 in the pool" },
  { id: "ten", threshold: 10000, label: "R10k milestone", sub: "Momentum is building" },
  { id: "floor", threshold: 40000, label: "Floor cleared", sub: "2 shares & 2 votes secured" },
  { id: "standard", threshold: 60000, label: "Full standard", sub: "3 shares & 3 votes" },
];

export interface MilestoneProgress {
  /** Net pool capital contributed = Paid months × R1,000. */
  totalContributed: number;
  /** Consecutive most-recent months paid. An unpaid in-progress current
   *  month is grace (doesn't break the streak). */
  streak: number;
  /** Highest milestone reached, or null if none yet. */
  current: Milestone | null;
  /** Next milestone not yet reached, or null once all are done. */
  next: Milestone | null;
  /** R still needed to reach `next` (0 when next is null). */
  toNext: number;
  /** True once contributions exceed the R60k standard (voluntary lever-up). */
  levered: boolean;
  /** How many milestones achieved, and the total count. */
  achieved: number;
  total: number;
}

function prevPeriod(period: string): string {
  let [y, m] = period.split("-").map(Number);
  m -= 1;
  if (m < 1) {
    m = 12;
    y -= 1;
  }
  return `${y}-${String(m).padStart(2, "0")}`;
}

// YYYY-MM compares lexicographically = chronologically, so plain string
// comparison is safe here.
function computeStreak(paid: Set<string>, currentPeriod: string): number {
  let cursor = paid.has(currentPeriod)
    ? currentPeriod
    : prevPeriod(currentPeriod);
  let streak = 0;
  while (cursor >= LEHUMO_FIRST_DUE_PERIOD && paid.has(cursor)) {
    streak += 1;
    cursor = prevPeriod(cursor);
  }
  return streak;
}

/**
 * Derive a member's contribution milestones + streak from their rows.
 * Pure — safe to call from server or client. Only needs `period` + `status`.
 */
export function computeMilestoneProgress(
  rows: Pick<LehumoContribution, "period" | "status">[] | undefined,
  currentPeriod: string,
): MilestoneProgress {
  const paidPeriods = new Set(
    (rows ?? [])
      .filter((r) => r.status === CONTRIBUTION_STATUS.paid)
      .map((r) => r.period),
  );
  const totalContributed = paidPeriods.size * MONTHLY_ZAR;
  const achieved = MILESTONES.filter((m) => totalContributed >= m.threshold);
  const current = achieved[achieved.length - 1] ?? null;
  const next = MILESTONES.find((m) => totalContributed < m.threshold) ?? null;

  return {
    totalContributed,
    streak: computeStreak(paidPeriods, currentPeriod),
    current,
    next,
    toNext: next ? next.threshold - totalContributed : 0,
    levered: totalContributed > 60000,
    achieved: achieved.length,
    total: MILESTONES.length,
  };
}
