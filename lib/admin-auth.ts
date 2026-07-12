import "server-only";

import { getSession } from "./session";
import type { SessionPayload } from "./definitions";

/**
 * Parse the comma-separated LEHUMO_ADMIN_EMAILS env var into a set of
 * lowercase admin email addresses.
 *
 * Example env value:
 *   LEHUMO_ADMIN_EMAILS=papi.tsomele@gmail.com,admin@limepages.co.za
 *
 * If the env var is unset the admin panel is effectively disabled (no one
 * is admin), which is the safe default for preview deployments.
 */
function getAdminEmails(): Set<string> {
  const raw = process.env.LEHUMO_ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().has(email.trim().toLowerCase());
}

/**
 * Super-admin tier — the only accounts allowed to MUTATE money records
 * (contributions, month locks, fund settings). Every other admin gets
 * read-only access to the admin views. Role-based, deliberately without
 * extra password prompts — the tier IS the friction.
 *
 * Configured via LEHUMO_SUPERADMIN_EMAILS (comma-separated). When unset
 * it defaults to the founding owner, so adding new emails to
 * LEHUMO_ADMIN_EMAILS can never silently grant write access to money.
 */
const DEFAULT_SUPERADMIN_EMAILS = "papi.tsomele@gmail.com";

function getSuperAdminEmails(): Set<string> {
  const raw =
    process.env.LEHUMO_SUPERADMIN_EMAILS ?? DEFAULT_SUPERADMIN_EMAILS;
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  // Super is a subset of admin — an email dropped from the admin list
  // loses super rights with it.
  return (
    isAdminEmail(email) &&
    getSuperAdminEmails().has(email.trim().toLowerCase())
  );
}

/**
 * Returns the session if (and only if) the caller is signed in AND their
 * email is in LEHUMO_ADMIN_EMAILS. Returns null otherwise — callers decide
 * whether to redirect (UI) or return 401/403 (API).
 */
export async function getAdminSession(): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session) return null;
  if (!isAdminEmail(session.email)) return null;
  return session;
}
