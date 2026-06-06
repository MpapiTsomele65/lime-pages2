/**
 * Pure aggregation helpers for the admin Contributions rollup view.
 *
 * Takes the flat list of contribution rows the admin page already
 * loads and rolls them up to one record per member, scoped to a
 * given period set. Used by AdminContributionsRollupTable to render
 * the ~30-row "row per member" view that replaced the long per-period
 * list.
 *
 * Mirrors the aggregation pattern in lib/contribution-ledger.ts (lex
 * compare on YYYY-MM, no Date parsing, enum-based status check). Pure
 * functions only — no I/O, no React, safe to import from server or
 * client code.
 */

import {
  CONTRIBUTION_STATUS,
  type LehumoContribution,
} from "./definitions";

/**
 * A single member's contribution data rolled up across a period set.
 * Drives one row in the admin rollup table.
 */
export interface MemberContributionRollup {
  memberId: string;
  /** Sum of amountExpected on every in-scope row. NOTE: when the
   *  schedule is incomplete for this member (missingRowCount > 0)
   *  this is undercounted — we can't synthesise the expected amount
   *  for a row that doesn't exist yet. */
  expectedTotal: number;
  /** Sum of amountReceived on every in-scope row whose status is settled. */
  receivedTotal: number;
  /** max(0, expectedTotal - receivedTotal). Never negative — prepayments
   *  don't render as "owed -R1000". */
  balance: number;
  /** How many periods the active filter selected. Drives the
   *  denominator in the "X / N paid" column.
   *
   *  When the filter is "All periods" (periodSet=null), we can't
   *  know the universe size, so this falls back to the count of
   *  rows that actually exist for the member. In every other case
   *  this is the size of the filter's period set — e.g. "Next 3
   *  months" gives expectedPeriodCount=3 for every member, even
   *  if a particular member only has 2 of those 3 rows generated
   *  in Airtable yet. */
  expectedPeriodCount: number;
  /** How many of the expected periods have settled rows — Paid,
   *  Refunded, or Waived. Drives the numerator in the "X / N paid"
   *  column + the rollup status pill. */
  paidCount: number;
  /** How many periods the filter expected that have no row in
   *  Airtable at all for this member. >0 means the schedule is
   *  incomplete — admin should regenerate missing schedule rows.
   *  Zero when filter is "All periods" (no expected universe). */
  missingRowCount: number;
  /** Most recent paymentDate (YYYY-MM-DD) on a Paid row, or null. */
  lastPaymentDate: string | null;
  /** Amount on the most recent Paid row, or null. */
  lastPaymentAmount: number | null;
  /** Derived rollup status bucket. */
  rollupStatus: RollupStatus;
  /** The in-scope rows themselves — passed down to the expanded
   *  detail strip so it doesn't have to re-filter. */
  rows: LehumoContribution[];
}

export type RollupStatus = "paid" | "partial" | "pending" | "no-data";

/**
 * Sort priority for the rollup table. Lower = earlier in the list.
 * Matches the "paid first" sort the existing per-period table used —
 * admins want to see who's already settled before they start hunting
 * variance.
 */
export const ROLLUP_STATUS_PRIORITY: Record<RollupStatus, number> = {
  paid: 0,
  partial: 1,
  pending: 2,
  "no-data": 3,
};

/**
 * A contribution row counts as "settled" if it's been satisfied in
 * any way — Paid (cash hit the account), Refunded (returned, but
 * accounted for), or Waived (admin decision, but accounted for).
 *
 * Pending / Failed are "unsettled" — the member still owes us.
 */
function isSettled(status: string): boolean {
  return (
    status === CONTRIBUTION_STATUS.paid ||
    status === CONTRIBUTION_STATUS.refunded ||
    status === CONTRIBUTION_STATUS.waived
  );
}

/**
 * Aggregate one member's contributions across the given period set.
 *
 * `periodSet === null` means "no period filter" (the admin picked
 * "All periods") — every row for the member counts.
 *
 * Returns a zero-valued rollup (status = "no-data") when the member
 * has no rows in scope. The table still renders that row so the full
 * cohort stays visible regardless of filter — admin can see at a
 * glance that, say, a new member doesn't yet have rows for May.
 */
export function aggregateMemberContributions(
  rows: LehumoContribution[],
  memberId: string,
  periodSet: Set<string> | null,
): MemberContributionRollup {
  // Pull just this member's rows, then filter to the active period
  // set (if any). Two passes is fine here — the typical cohort is
  // ~30 members × ≤60 periods, well under any perf concern.
  const inScope = rows.filter(
    (r) =>
      r.memberId === memberId &&
      (periodSet === null || periodSet.has(r.period)),
  );

  let expectedTotal = 0;
  let receivedTotal = 0;
  let paidCount = 0;
  let lastPaymentDate: string | null = null;
  let lastPaymentAmount: number | null = null;

  for (const r of inScope) {
    expectedTotal += r.amountExpected ?? 0;

    // Only count receivedTotal on settled rows — a Pending row with
    // amountReceived=0 must not depress the "paid so far" tally; a
    // Failed row with amountReceived=null must not blow up the sum.
    if (isSettled(r.status)) {
      paidCount += 1;
      receivedTotal += r.amountReceived ?? 0;
    }

    // Last payment tracking — only "Paid" status counts (not
    // Refunded / Waived — those aren't real cash-in events).
    if (
      r.status === CONTRIBUTION_STATUS.paid &&
      r.paymentDate &&
      (lastPaymentDate === null || r.paymentDate > lastPaymentDate)
    ) {
      lastPaymentDate = r.paymentDate;
      lastPaymentAmount = r.amountReceived ?? null;
    }
  }

  // The "expected" denominator. When the filter selects a specific
  // period set (e.g. "Next 3 months" → 3 periods), every member's
  // denominator is the SIZE of that set — not the count of rows
  // they happen to have in Airtable. This is what makes the X/N
  // display consistent across the cohort regardless of schedule
  // generation gaps.
  //
  // For "All periods" (periodSet=null) there's no universe to
  // measure against, so we fall back to existing-row count.
  const expectedPeriodCount = periodSet?.size ?? inScope.length;
  const existingRowCount = inScope.length;
  const missingRowCount = Math.max(
    0,
    expectedPeriodCount - existingRowCount,
  );
  const balance = Math.max(0, expectedTotal - receivedTotal);

  // Status bucket priority:
  //   - No expected periods at all → no-data.
  //   - All expected periods settled (even if some rows are missing
  //     they'd still be unpaid by definition) → paid only when
  //     paidCount === expectedPeriodCount AND no rows are missing.
  //   - Any paid → partial.
  //   - None paid → pending.
  let rollupStatus: RollupStatus;
  if (expectedPeriodCount === 0) {
    rollupStatus = "no-data";
  } else if (
    paidCount === expectedPeriodCount &&
    missingRowCount === 0
  ) {
    rollupStatus = "paid";
  } else if (paidCount > 0) {
    rollupStatus = "partial";
  } else {
    rollupStatus = "pending";
  }

  return {
    memberId,
    expectedTotal,
    receivedTotal,
    balance,
    expectedPeriodCount,
    missingRowCount,
    paidCount,
    lastPaymentDate,
    lastPaymentAmount,
    rollupStatus,
    rows: inScope,
  };
}

/**
 * Find contribution rows whose `memberId` points at a Members record
 * that isn't in the live cohort — e.g. a Paystack payment came in
 * referencing a member who's since been deleted from the Members
 * table, or a row was hand-entered with a stale ID.
 *
 * The admin needs these surfaced explicitly so they can reassign
 * them to the right member via the Edit dialog. Otherwise the cash
 * is in the trust account but invisible from the rollup view.
 */
export function findOrphanContributions(
  rows: LehumoContribution[],
  liveMemberIds: Set<string>,
): LehumoContribution[] {
  return rows.filter((r) => !liveMemberIds.has(r.memberId));
}
