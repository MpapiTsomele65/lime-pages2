import "server-only";

import {
  CONTRIBUTION_STATUS,
  MONTH_NAMES,
  isBeforeLaunch,
  type LehumoContribution,
} from "./definitions";

const MONTH_FULL_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Read-side adapter for the Path B Contributions table cutover.
 *
 * The legacy contribution shape (`Record<string, boolean>` keyed by
 * Jan-Dec) is what every UI component reads today. The new
 * `Contributions` table stores 60 rows per member spanning Jun 2026 →
 * May 2031, each carrying full payment metadata.
 *
 * This module sits between the two: given the new-table rows, it
 * projects them onto the legacy 12-key shape so existing components
 * keep working unchanged. Components can be migrated to the richer
 * shape one at a time in Phase 4 — until then the projection is the
 * transparent shim that lets reads come from the new table without
 * any UI change.
 *
 * Projection rule (current calendar year):
 *   - For each Jan-Dec key, look up the row whose Period is
 *     `{currentYear}-{MM}`.
 *   - The legacy boolean is `true` iff that row's Status is `Paid`
 *     (Reconciled rows are also Paid by transition rules — they're
 *     just additionally verified).
 *   - Missing rows / Pending / Failed / Refunded / Waived all map to
 *     `false` ("not paid").
 *
 * Year-boundary semantics: the projection is intentionally
 * single-year. UI components built for the legacy shape can only show
 * 12 months, so showing the *current* SAST year is the right answer
 * pre-Phase 4. Year-spanning views (5-year roadmap, full member
 * history) need to consume the raw `LehumoContribution[]` directly.
 */

/**
 * Resolve the "current" calendar year in SAST (Africa/Johannesburg).
 *
 * Vercel runs in UTC; SA is UTC+2. A naive `new Date().getFullYear()`
 * is correct ~99.97% of the time, but on 31 Dec at 22:00 UTC (which is
 * 00:00 1 Jan SAST) it would still report the old year. This helper
 * uses the same `toLocaleDateString` trick `getSastMonthInfo` does so
 * the year boundary lines up with the SAST calendar.
 */
export function getSastYear(now: Date = new Date()): number {
  // en-CA gives YYYY-MM-DD which is trivial to slice.
  const ymd = now.toLocaleDateString("en-CA", {
    timeZone: "Africa/Johannesburg",
  });
  return Number(ymd.slice(0, 4));
}

/**
 * Project a member's full Contributions-table rows onto the legacy
 * `Record<string, boolean>` shape. Backward compat with every component
 * that reads `member.contributions[Jan]` / etc.
 *
 * @param contributions  The member's full 60-row contribution history.
 * @param year           Calendar year to project. Defaults to current SAST year.
 */
export function projectToLegacyContributions(
  contributions: LehumoContribution[],
  year: number = getSastYear(),
): Record<string, boolean> {
  // Index this year's rows by month-of-year for O(1) lookup. Rows for
  // other years are ignored — the legacy shape can't represent them.
  const byMonth = new Map<string, LehumoContribution>();
  for (const c of contributions) {
    if (!c.period.startsWith(`${year}-`)) continue;
    const monthIdx = Number(c.period.slice(5, 7)) - 1;
    if (monthIdx < 0 || monthIdx >= 12) continue;
    const monthCode = MONTH_NAMES[monthIdx];
    if (monthCode) byMonth.set(monthCode, c);
  }

  const out: Record<string, boolean> = {};
  for (const month of MONTH_NAMES) {
    const row = byMonth.get(month);
    out[month] = row?.status === CONTRIBUTION_STATUS.paid;
  }
  return out;
}

/**
 * Format a YYYY-MM period as a long human-readable string.
 *
 * `formatPeriodLong("2026-06")` → "June 2026"
 *
 * Returns the input verbatim if it doesn't parse — defensive fallback
 * so a malformed period never crashes the UI.
 */
export function formatPeriodLong(period: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(period);
  if (!m) return period;
  const monthIdx = Number(m[2]) - 1;
  const monthName = MONTH_FULL_NAMES[monthIdx];
  if (!monthName) return period;
  return `${monthName} ${m[1]}`;
}

/**
 * Format a YYYY-MM period as a short human-readable string.
 *
 * `formatPeriodShort("2026-06")` → "Jun 2026"
 *
 * Use for compact UI surfaces (chips, table cells) where vertical real
 * estate is tight. `formatPeriodLong` is the right choice for the
 * dashboard headline copy.
 */
export function formatPeriodShort(period: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(period);
  if (!m) return period;
  const monthIdx = Number(m[2]) - 1;
  const monthCode = MONTH_NAMES[monthIdx];
  if (!monthCode) return period;
  return `${monthCode} ${m[1]}`;
}

/**
 * Compute the SAST-current period (`YYYY-MM`).
 *
 * Same SAST-aware trick as `getSastYear` — uses `toLocaleDateString`
 * with the Africa/Johannesburg timezone so the period boundary lines
 * up with the South African calendar, not UTC's. Used by
 * ContributionReminderCard to look up "this month's row" in the new
 * 60-period shape.
 */
export function getSastCurrentPeriod(now: Date = new Date()): string {
  const ymd = now.toLocaleDateString("en-CA", {
    timeZone: "Africa/Johannesburg",
  });
  return ymd.slice(0, 7); // "YYYY-MM"
}

/**
 * Resolves the `{ month, period }` a payment received NOW should be credited
 * to. Pre-launch (current time < 1 Jun 2026 SAST) this always returns
 * `{ month: "Jun", period: "2026-06" }` so smoke-test contributions and
 * any early member onboards land in the official first collection month —
 * no May 2026 ghost rows for recon to chase.
 *
 * After launch the helper falls through to the SAST-current month + period,
 * matching the historic Paystack verify/webhook behaviour.
 *
 * Used by `app/api/lehumo/paystack/verify` and `app/api/lehumo/paystack/webhook`
 * so both payment paths produce identical Contribution Keys regardless of
 * which one wins the race.
 */
export function getCreditMonthAndPeriod(now: Date = new Date()): {
  month: string;
  period: string;
} {
  if (isBeforeLaunch(now)) {
    return { month: "Jun", period: "2026-06" };
  }
  const period = getSastCurrentPeriod(now);
  const monthIdx = Number(period.slice(5, 7)) - 1;
  return { month: MONTH_NAMES[monthIdx] ?? "Jan", period };
}

/**
 * Group a flat list of contribution rows by their member's contribution
 * key prefix (`Leh##-`). Returns a map keyed by the {Leh##} prefix.
 *
 * Used by the bulk admin path: one full-table read instead of N
 * per-member fetches when listing all 25+ members.
 */
export function groupContributionsByMemberPrefix(
  rows: LehumoContribution[],
): Map<string, LehumoContribution[]> {
  const out = new Map<string, LehumoContribution[]>();
  for (const r of rows) {
    // Contribution Key format: "Leh##-YYYY-MM"
    const dashIdx = r.contributionKey.indexOf("-");
    if (dashIdx < 0) continue;
    const prefix = r.contributionKey.slice(0, dashIdx);
    const bucket = out.get(prefix);
    if (bucket) {
      bucket.push(r);
    } else {
      out.set(prefix, [r]);
    }
  }
  return out;
}
