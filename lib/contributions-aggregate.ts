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
  /** How many periods drive the "X / N paid" denominator.
   *
   *  For a bounded filter ("Next 3 months" → 3) this is the size of
   *  the filter's period set — consistent across the cohort even if
   *  a member's rows for some of those periods aren't generated yet.
   *
   *  For "All periods" (periodSet=null) this falls back to the
   *  canonical 60-month schedule size, so a member with only 1 row
   *  reads "1 / 60" (truthful) rather than "1 / 1" (misleading). */
  expectedPeriodCount: number;
  /** How many of the expected periods have settled rows — Paid,
   *  Refunded, or Waived. Drives the numerator in the "X / N paid"
   *  column + the rollup status pill. */
  paidCount: number;
  /** How many of the canonical 60-month schedule periods this member
   *  has NO row for in Airtable. This is ABSOLUTE — measured against
   *  the full Jun 2026 → May 2031 universe, independent of the active
   *  filter — so the "Fix N" repair chip shows on every filter
   *  (including "All periods"). >0 means the schedule is incomplete
   *  and admin should regenerate the missing rows. Zero when the
   *  caller doesn't pass a canonicalSet (e.g. the expand-strip
   *  aggregation, which doesn't need it). */
  canonicalMissingCount: number;
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
  canonicalSet?: Set<string>,
): MemberContributionRollup {
  // IMPORTANT: `rows` must be the member's FULL row set (i.e. pass
  // ALL contributions, not a pre-period-filtered slice). The period
  // window is applied here, internally — passing pre-filtered rows
  // would corrupt both the canonical-completeness check and the
  // expand strip.
  const memberRows = rows.filter((r) => r.memberId === memberId);

  // In-scope = this member's rows within the active period filter.
  const inScope = memberRows.filter(
    (r) => periodSet === null || periodSet.has(r.period),
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

  // The "X / N paid" denominator. Bounded filter → its period count.
  // "All periods" → the canonical 60-month size (truthful universe),
  // falling back to existing-row count only if no canonicalSet was
  // passed (e.g. the expand-strip call).
  const expectedPeriodCount =
    periodSet?.size ?? canonicalSet?.size ?? inScope.length;
  const balance = Math.max(0, expectedTotal - receivedTotal);

  // Canonical schedule-completeness — ABSOLUTE, measured against the
  // full Jun 2026 → May 2031 universe using ALL the member's rows
  // (not just the in-scope slice). Drives the "Fix N" repair chip,
  // visible on every filter. Zero when no canonicalSet is supplied.
  let canonicalMissingCount = 0;
  if (canonicalSet) {
    const memberPeriods = new Set(memberRows.map((r) => r.period));
    let covered = 0;
    for (const p of canonicalSet) {
      if (memberPeriods.has(p)) covered += 1;
    }
    canonicalMissingCount = canonicalSet.size - covered;
  }

  // Status bucket priority:
  //   - Member has zero rows at all → no-data.
  //   - Fully paid AND schedule complete → paid. The canonical guard
  //     stops a member with one paid row (and 59 missing) from
  //     reading green "Paid" on the "All periods" view.
  //   - Any settled row → partial.
  //   - None settled → pending.
  let rollupStatus: RollupStatus;
  if (memberRows.length === 0) {
    rollupStatus = "no-data";
  } else if (
    paidCount === expectedPeriodCount &&
    canonicalMissingCount === 0
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
    canonicalMissingCount,
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
