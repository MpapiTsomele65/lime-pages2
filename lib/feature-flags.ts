import "server-only";

/**
 * Server-side feature flags for Lehumo. Read from environment variables
 * so they can be flipped per deploy / environment without a code change.
 *
 * The naming convention is `LEHUMO_<NOUN>_<VERB>` and the helpers below
 * read each flag exactly once, treating any of `1`, `true`, `yes`, `on`
 * (case-insensitive) as "on" so production toggles are forgiving.
 *
 * **Server-only on purpose.** Feature flags that gate UI shape changes
 * (visible to the browser) need to be exposed via `NEXT_PUBLIC_…`
 * variables and accessed differently — the patterns here are for
 * server-side cutovers (data sources, write paths, etc.).
 */

function isOn(envVarName: string): boolean {
  const raw = (process.env[envVarName] ?? "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

/**
 * When enabled, the application reads contribution data from the
 * dedicated `Contributions` Airtable table (added in commit 51c04b3 and
 * backfilled in commit ac6e3de) instead of the legacy 12 boolean columns
 * on the Members table.
 *
 * Reads project the new-table data into the same `Record<string, boolean>`
 * shape the existing UI expects (current SAST calendar year only) so
 * components don't change. Writes are dual — `checkMonthPayment` updates
 * BOTH the legacy column and the corresponding new-table row in one
 * server action. That keeps the flag flippable in either direction
 * without losing payments mid-flight.
 *
 * Default: OFF. Flip to ON once Phase 4 (PaymentCard / ContributionGrid
 * redesign for 60-month visibility) is verified — until then the
 * projection acts as a transparent shim and the legacy behaviour is
 * preserved.
 *
 * Env var: `LEHUMO_USE_NEW_CONTRIBUTIONS=true`.
 *
 * Deliberately named `isXEnabled` (not `useX`) — eslint's
 * react-hooks/rules-of-hooks rule treats any `use…` identifier as a
 * React hook regardless of context.
 */
export function isNewContributionsEnabled(): boolean {
  return isOn("LEHUMO_USE_NEW_CONTRIBUTIONS");
}
