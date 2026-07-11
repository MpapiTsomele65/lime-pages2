import {
  CONTRIBUTION_STATUS,
  LEHUMO_FIRST_DUE_PERIOD,
  type ContributionLeaderboard,
  type LeaderboardEntry,
  type LehumoContribution,
} from "./definitions";

/** Absolute month index for a YYYY-MM period (chronological ordering). */
function monthIndex(period: string): number {
  const [y, m] = period.split("-").map(Number);
  return y * 12 + (m - 1);
}

/**
 * Derive the anonymised contribution leaderboard for a period from Paid
 * contribution rows.
 *
 * Identity is the member-number prefix of the contribution key
 * ("Leh17-2026-07" → "Leh17") — no names, no emails, so the board is safe
 * to show to every member. Ranking is who paid FIRST in the period
 * (earliest paymentDate); payment dates are date-only, so same-day
 * payments share a rank (competition ranking: 1, 2, 2, 4…). Paid rows
 * with no date on file still make the board but rank last.
 *
 * Each entry also carries a KEPT-UP score: of the months due since launch
 * through this period (July → 2, Aug → 3…), how many the member has paid.
 * That rewards keeping up with the schedule rather than raw tenure.
 *
 * Pure — safe to call from server or client.
 */
export function computeLeaderboard(
  rows: Pick<
    LehumoContribution,
    "contributionKey" | "period" | "status" | "paymentDate"
  >[],
  period: string,
): ContributionLeaderboard {
  // Denominator: months due since launch through the board period.
  // July 2026 → 2 (Jun + Jul), Aug → 3, and so on.
  const monthsDue = Math.max(
    1,
    monthIndex(period) - monthIndex(LEHUMO_FIRST_DUE_PERIOD) + 1,
  );

  const keptByMember = new Map<string, number>();
  const lastPeriodByMember = new Map<string, string>();
  const currentPaymentByMember = new Map<string, string | null>();

  for (const row of rows) {
    if (row.status !== CONTRIBUTION_STATUS.paid) continue;
    // "Leh17-2026-07" → "Leh17". Rows with a malformed key can't be
    // attributed anonymously — skip rather than guess.
    const memberNumber = row.contributionKey.split("-")[0];
    if (!/^Leh\d+$/i.test(memberNumber)) continue;

    // Kept-up numerator = paid rows for months that are actually DUE
    // (launch..board period). A prepaid future month isn't due yet, so
    // it can't push the score above the denominator. String compare is
    // safe for YYYY-MM.
    if (row.period >= LEHUMO_FIRST_DUE_PERIOD && row.period <= period) {
      keptByMember.set(memberNumber, (keptByMember.get(memberNumber) ?? 0) + 1);
    }
    // Furthest month this member has paid for (includes any prepaid month).
    const prevLast = lastPeriodByMember.get(memberNumber);
    if (!prevLast || row.period > prevLast) {
      lastPeriodByMember.set(memberNumber, row.period);
    }
    if (row.period === period) {
      currentPaymentByMember.set(memberNumber, row.paymentDate);
    }
  }

  const unranked = [...currentPaymentByMember.entries()].map(
    ([memberNumber, paymentDate]) => ({
      memberNumber,
      paymentDate,
      lastPaidPeriod: lastPeriodByMember.get(memberNumber) ?? period,
      keptCount: keptByMember.get(memberNumber) ?? 0,
    }),
  );

  // Earliest payment first; unknown dates land last. Ties break by member
  // number (numeric-aware) purely so the order is stable across renders —
  // the shared rank below is what members actually see.
  unranked.sort((a, b) => {
    const da = a.paymentDate ?? "9999-12-31";
    const db = b.paymentDate ?? "9999-12-31";
    if (da !== db) return da < db ? -1 : 1;
    return a.memberNumber.localeCompare(b.memberNumber, undefined, {
      numeric: true,
    });
  });

  const entries: LeaderboardEntry[] = [];
  unranked.forEach((e, i) => {
    const sharesPrev =
      i > 0 &&
      e.paymentDate !== null &&
      e.paymentDate === unranked[i - 1].paymentDate;
    entries.push({ ...e, rank: sharesPrev ? entries[i - 1].rank : i + 1 });
  });

  return { period, entries, paidCount: entries.length, monthsDue };
}
