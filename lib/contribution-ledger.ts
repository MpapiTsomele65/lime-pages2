import {
  CONTRIBUTION_STATUS,
  type LehumoContribution,
} from "./definitions";

/**
 * Practical "where do I stand right now?" view of a member's
 * contribution history.
 *
 * Decouples three different progress lenses that look similar but
 * answer different questions:
 *
 *   1. Trust lifetime — "how many of the 60 monthly contributions
 *      have I actually paid?"  (`monthsPaid` / `totalMonths`)
 *
 *   2. Cumulative expectation — "how many monthly contributions
 *      should I have paid by now?"  (`monthsDue`)
 *      Counts periods whose YYYY-MM is at or before the current SAST
 *      period. Pre-launch (currentPeriod < 2026-06) this is 0;
 *      mid-trust it grows by 1 per calendar month; post-2031-05 it
 *      caps at the row count.
 *
 *   3. Outstanding balance — "how much do I owe right now?"
 *      `cumulativeExpected − cumulativeReceived`, clamped to zero
 *      (overpayments don't show as a negative balance — that's an
 *      admin reconciliation concern, not member-facing copy).
 *
 * Driven entirely off the new Contributions-table rows, so plan
 * changes (Premium = R2,000) flow through naturally — we sum
 * `amountExpected` per row instead of multiplying by a fixed R1,000.
 *
 * Pure function — no I/O, no `server-only` import — so it's safe
 * from both server and client components.
 */
export interface ContributionLedger {
  /** Count of contribution rows whose Period <= currentPeriod. Grows
   *  by 1 per calendar month from Jun 2026 onwards, capped at the
   *  total row count (typically 60). Pre-launch: 0. */
  monthsDue: number;
  /** Count of `monthsDue` rows whose Status=Paid. ≤ monthsDue. */
  monthsPaid: number;
  /** monthsDue − monthsPaid. The headline "months behind" figure. */
  monthsOutstanding: number;
  /** Sum of `amountExpected` across rows with Period <= currentPeriod
   *  (in ZAR). What the trust expected by now. */
  cumulativeExpected: number;
  /** Sum of `amountReceived` across `monthsDue` rows whose Status=Paid
   *  (in ZAR). What the trust has actually banked from this member by
   *  now. */
  cumulativeReceived: number;
  /** max(0, cumulativeExpected − cumulativeReceived). The R-amount the
   *  member owes right now to be square against the schedule. */
  outstanding: number;
  /** Total number of rows (lifetime). Typically 60 for the standard
   *  5-year trust. */
  totalMonths: number;
  /** Total `amountReceived` across all Paid rows, lifetime. Used by
   *  CommunityPoolCard's myContributed. */
  lifetimeReceived: number;
  /**
   * The member's lifetime contribution goal in ZAR — sum of
   * `amountExpected` across every row in the schedule. R60,000 for
   * the standard 5-year trust at R1,000/month. Becomes the anchor
   * the dashboard frames progress against ("R<lifetimeReceived> of
   * R<lifetimeGoal>") instead of treating 60 monthly payments as
   * the primary unit.
   */
  lifetimeGoal: number;
  /**
   * `lifetimeGoal − lifetimeReceived`, clamped to zero. The R-amount
   * still to contribute over the remaining trust lifetime —
   * monotonically decreasing as payments come in, distinct from the
   * `outstanding` figure (which only counts arrears against the
   * "due so far" slice).
   */
  lifetimeRemaining: number;
  /** Period of the next unpaid row in chronological order, or null
   *  if every row is Paid (= "all caught up" celebration state). */
  nextDuePeriod: string | null;
  /** Period of the most recent Paid row in chronological order, or
   *  null if no rows are Paid yet. */
  lastPaidPeriod: string | null;
  /** `amountReceived` on the most recent Paid row, in ZAR. */
  lastPaidAmount: number | null;
}

const EMPTY_LEDGER: ContributionLedger = {
  monthsDue: 0,
  monthsPaid: 0,
  monthsOutstanding: 0,
  cumulativeExpected: 0,
  cumulativeReceived: 0,
  outstanding: 0,
  totalMonths: 0,
  lifetimeReceived: 0,
  lifetimeGoal: 0,
  lifetimeRemaining: 0,
  nextDuePeriod: null,
  lastPaidPeriod: null,
  lastPaidAmount: null,
};

/**
 * Compute a {@link ContributionLedger} for a single member.
 *
 * `currentPeriod` should be SAST-current `YYYY-MM` (use
 * `getSastCurrentPeriod()` from lib/member-contributions-view.ts on
 * the server, or a server-passed prop on the client).
 *
 * Period comparisons are string-lexicographic, which works because
 * `YYYY-MM` sorts the same way it reads. We never parse to Date — no
 * timezone gotchas.
 */
export function computeContributionLedger(
  rows: LehumoContribution[],
  currentPeriod: string,
): ContributionLedger {
  if (!rows || rows.length === 0) return { ...EMPTY_LEDGER };

  // Sort once — defensive even though hydration paths return sorted.
  const sorted = [...rows].sort((a, b) => a.period.localeCompare(b.period));

  let monthsDue = 0;
  let monthsPaid = 0;
  let cumulativeExpected = 0;
  let cumulativeReceived = 0;
  let lifetimeReceived = 0;
  let lifetimeGoal = 0;
  let nextDuePeriod: string | null = null;
  let lastPaidPeriod: string | null = null;
  let lastPaidAmount: number | null = null;

  for (const row of sorted) {
    const isPaid = row.status === CONTRIBUTION_STATUS.paid;
    const isDue = row.period <= currentPeriod;

    lifetimeGoal += row.amountExpected ?? 0;

    if (isPaid) {
      lifetimeReceived += row.amountReceived ?? 0;
      lastPaidPeriod = row.period;
      lastPaidAmount = row.amountReceived ?? null;
    }

    if (isDue) {
      monthsDue += 1;
      cumulativeExpected += row.amountExpected ?? 0;
      if (isPaid) {
        monthsPaid += 1;
        cumulativeReceived += row.amountReceived ?? 0;
      }
    }

    // First non-Paid row in chronological order is "next due".
    // Includes overdue (period < currentPeriod, not yet paid) — that's
    // intentional: members see the oldest outstanding period first.
    if (!isPaid && nextDuePeriod === null) {
      nextDuePeriod = row.period;
    }
  }

  return {
    monthsDue,
    monthsPaid,
    monthsOutstanding: Math.max(0, monthsDue - monthsPaid),
    cumulativeExpected,
    cumulativeReceived,
    outstanding: Math.max(0, cumulativeExpected - cumulativeReceived),
    totalMonths: sorted.length,
    lifetimeReceived,
    lifetimeGoal,
    lifetimeRemaining: Math.max(0, lifetimeGoal - lifetimeReceived),
    nextDuePeriod,
    lastPaidPeriod,
    lastPaidAmount,
  };
}
