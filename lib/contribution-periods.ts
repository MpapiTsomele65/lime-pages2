/**
 * Pure period helpers — used by both server code (lib/contributions.ts,
 * server actions) and client components (admin Contributions UI).
 *
 * Kept in a standalone module — separate from lib/contributions.ts —
 * because that module is marked `server-only` and these helpers must
 * remain client-importable. They have zero runtime dependencies beyond
 * the LEHUMO_FIRST_DUE_PERIOD constant.
 *
 * Period strings here are `YYYY-MM` (e.g. "2026-06"). All comparisons
 * use lexicographic order — no `Date` parsing, no timezone surprises.
 */

import { LEHUMO_FIRST_DUE_PERIOD } from "./definitions";

/**
 * Compute the current SAST (Africa/Johannesburg) period as `YYYY-MM`.
 *
 * Pre-launch the "current" period anchors to LEHUMO_FIRST_DUE_PERIOD
 * (the launch month — currently June 2026). That way the default
 * "this month" filter and the expand window land on real schedule
 * rows, not an empty pre-launch slot.
 */
export function currentSastPeriod(): string {
  const sastNow = new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Johannesburg",
  });
  const sastPeriod = sastNow.slice(0, 7);
  return sastPeriod < LEHUMO_FIRST_DUE_PERIOD
    ? LEHUMO_FIRST_DUE_PERIOD
    : sastPeriod;
}

/**
 * Build a Set of `YYYY-MM` strings spanning `fromOffset` to
 * `toOffset` months relative to `anchor`. Both endpoints inclusive.
 * Negative offsets walk backwards from the anchor, positive walk
 * forwards.
 *
 * Defensive against pre-launch — never returns periods earlier than
 * LEHUMO_FIRST_DUE_PERIOD, so a "past 12 months from launch" query
 * doesn't fabricate phantom 2025 slots.
 */
export function buildPeriodRange(
  anchor: string,
  fromOffset: number,
  toOffset: number,
): Set<string> {
  const [yearStr, monthStr] = anchor.split("-");
  const anchorYear = Number(yearStr);
  const anchorMonth = Number(monthStr) - 1; // 0-indexed JS month
  const out = new Set<string>();
  for (let off = fromOffset; off <= toOffset; off++) {
    const d = new Date(anchorYear, anchorMonth + off, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const periodKey = `${year}-${month}`;
    if (periodKey >= LEHUMO_FIRST_DUE_PERIOD) {
      out.add(periodKey);
    }
  }
  return out;
}

/**
 * Build the "expand window" — the set of periods shown when an admin
 * expands a rollup row in the Contributions table.
 *
 * Spec from product:
 *   - Backwards: unlimited (everything since launch).
 *   - Forwards:  current SAST period + 6 months — anything beyond
 *                that is considered noise (the cohort is on a 60-month
 *                schedule, but a row for 2031 isn't actionable today).
 *
 * Independent of the user's active period filter at the top of the
 * page — the expand strip always shows the same window so the admin
 * has stable context when drilling in.
 */
export function buildExpandWindow(): Set<string> {
  const current = currentSastPeriod();
  // Months between launch and current. We over-shoot the backward
  // offset by 12 to defensively cover any timezone drift; the
  // pre-launch guard inside buildPeriodRange truncates anything
  // earlier than LEHUMO_FIRST_DUE_PERIOD anyway.
  const [curYear, curMonth] = current.split("-").map(Number);
  const [launchYear, launchMonth] = LEHUMO_FIRST_DUE_PERIOD.split("-").map(
    Number,
  );
  const monthsSinceLaunch =
    (curYear - launchYear) * 12 + (curMonth - launchMonth);
  // From: -(monthsSinceLaunch) → launch month.
  // To:   +6 → six months forward from current.
  return buildPeriodRange(current, -monthsSinceLaunch, 6);
}
