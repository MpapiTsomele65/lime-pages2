import {
  CONTRIBUTION_STATUS,
  LEHUMO_FIRST_DUE_PERIOD,
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
  /** Count of scheduled rows (period ≥ first-due) whose Period <=
   *  currentPeriod. Grows by 1 per calendar month from Jun 2026
   *  onwards, capped at the schedule length (60 for the standard
   *  5-year trust). Pre-launch: 0 — there's nothing the trust expects
   *  yet, even if the table contains seed rows for earlier months. */
  monthsDue: number;
  /** Count of scheduled rows whose Status=Paid — INCLUDING those whose
   *  period is in the future (prepayments). A member who has prepaid
   *  June while May's `currentPeriod` is active shows 1 here, not 0. */
  monthsPaid: number;
  /** max(0, monthsDue − monthsPaid). The headline "months behind"
   *  figure. Clamps so prepayments don't render a negative count. */
  monthsOutstanding: number;
  /** Sum of `amountExpected` across scheduled rows with Period <=
   *  currentPeriod (in ZAR). What the trust expected by now. */
  cumulativeExpected: number;
  /** Sum of `amountReceived` across every scheduled Paid row (in ZAR),
   *  including prepayments. Pairs with `cumulativeExpected` for the
   *  outstanding math — prepayments correctly net against any current
   *  arrears so a member who pays Jul up-front while Jun is overdue
   *  still shows outstanding=0. */
  cumulativeReceived: number;
  /** max(0, cumulativeExpected − cumulativeReceived). The R-amount the
   *  member owes right now to be square against the schedule. */
  outstanding: number;
  /** Total scheduled rows (period ≥ first-due). 60 for the standard
   *  5-year trust. Seed rows for pre-launch months are excluded so the
   *  "X of Y" copy on the portal stays anchored to the real schedule. */
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
  let totalScheduledMonths = 0;
  let cumulativeExpected = 0;
  let cumulativeReceived = 0;
  let lifetimeReceived = 0;
  let lifetimeGoal = 0;
  let nextDuePeriod: string | null = null;
  let lastPaidPeriod: string | null = null;
  let lastPaidAmount: number | null = null;

  for (const row of sorted) {
    const isPaid = row.status === CONTRIBUTION_STATUS.paid;
    // `isScheduled` gates every "is this row part of the trust's
    // collection schedule?" question. Pre-launch rows (period <
    // 2026-06) live in the table for historical/seed reasons but aren't
    // part of what the trust expects — so they don't inflate the goal,
    // total-months count, or arrears math. They also don't surface as
    // "next due" so a fresh member never sees "Next due: May 2026"
    // before launch day.
    const isScheduled = row.period >= LEHUMO_FIRST_DUE_PERIOD;
    // `isDue` is the "should have been paid by now" check — a scheduled
    // row at or before the SAST-current period.
    const isDue = isScheduled && row.period <= currentPeriod;

    if (isScheduled) {
      lifetimeGoal += row.amountExpected ?? 0;
      totalScheduledMonths += 1;
    }

    // `lifetimeReceived` / `lastPaidPeriod` / `lastPaidAmount` track the
    // member's actual cash flow — they're never filtered by schedule
    // membership, so even a stray pre-launch payment (shouldn't happen
    // under the credit-to-Jun policy, but defensively) still gets
    // credited to the member's running total.
    if (isPaid) {
      lifetimeReceived += row.amountReceived ?? 0;
      lastPaidPeriod = row.period;
      lastPaidAmount = row.amountReceived ?? null;
    }

    // `monthsPaid` / `cumulativeReceived` count every scheduled paid
    // row — including prepayments where the row's period is after
    // `currentPeriod`. That way a member who's prepaid the next month
    // sees "1 of 60 paid" instead of "0 of 60 paid", and the
    // outstanding math correctly nets prepayments against any current
    // arrears.
    if (isScheduled && isPaid) {
      monthsPaid += 1;
      cumulativeReceived += row.amountReceived ?? 0;
    }

    if (isDue) {
      monthsDue += 1;
      cumulativeExpected += row.amountExpected ?? 0;
    }

    // First non-Paid scheduled row in chronological order is "next
    // due". Pre-launch rows are skipped so members see the real
    // schedule entry, not a synthetic May 2026 placeholder.
    if (isScheduled && !isPaid && nextDuePeriod === null) {
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
    totalMonths: totalScheduledMonths,
    lifetimeReceived,
    lifetimeGoal,
    lifetimeRemaining: Math.max(0, lifetimeGoal - lifetimeReceived),
    nextDuePeriod,
    lastPaidPeriod,
    lastPaidAmount,
  };
}
