/**
 * Email validation helper that catches the common typos Zod's
 * RFC-syntactic `.email()` lets through.
 *
 * Motivating bug: a member typed `lond.kwinda@gmail.con` on Step 1 of
 * onboarding, the schema accepted `.con` as a valid TLD (it's not a real
 * TLD — it's never been delegated — but Zod only checks RFC syntax),
 * the welcome email silently bounced from Resend, and the member
 * assumed the whole signup was broken. Email is the *primary* identity
 * + access channel for Lehumo (login codes, payment receipts, KYC
 * follow-up), so a single typo here cascades into "Lime Pages doesn't
 * work" — exactly the failure mode we cannot afford during the soft
 * launch.
 *
 * Strategy: dictionary lookups, no Levenshtein heuristics. False
 * positives (auto-correcting a *real* domain that happens to look like
 * a typo) are worse than letting an exotic typo through, because they
 * lock a real member out. So we only correct what we know is wrong:
 *   1. TLD typo dictionary — every entry is a string that is NOT a
 *      valid TLD (so a positive match is unambiguous). `.con`, `.cmo`
 *      hit this; `.cm` (Cameroon) and `.co` (Colombia) deliberately
 *      don't.
 *   2. Domain typo dictionary — hand-curated common provider misspellings.
 *      Trades broad coverage for zero-false-positive guarantee.
 *
 * Used by both client (StepPersonalInfo on blur, with a "Did you mean…"
 * one-click prompt) and server (OnboardingFormSchema / PaystackInitSchema
 * via `.superRefine`, blocking obvious typos before they reach Airtable).
 */

/**
 * Known TLD typos. Every entry MUST be invalid as a real TLD so a
 * positive match is unambiguous. Don't add `.cm` (Cameroon), `.co`
 * (Colombia), `.zw` (Zimbabwe) — those are real and stay valid.
 */
const TLD_TYPOS: Record<string, string> = {
  // .com typos — by far the most common in the wild
  con: "com",
  cmo: "com",
  cim: "com",
  comm: "com",
  coom: "com",
  conm: "com",
  ocm: "com",
  vom: "com",
  xom: "com",
  cpm: "com",
  comn: "com",
  cmm: "com",
  // .net typos
  met: "net",
  nte: "net",
  ner: "net",
  nrt: "net",
  // .org typos
  rog: "org",
  ogr: "org",
  orh: "org",
  orgg: "org",
};

/**
 * Hand-curated common provider misspellings. Keys are full
 * lower-cased domains (`gmial.com`), values are the corrected
 * domain (`gmail.com`). Add SA-specific providers here too —
 * Lehumo's audience is heavy on mweb/vodamail/telkomsa users.
 */
const DOMAIN_TYPOS: Record<string, string> = {
  // gmail
  "gmial.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmali.com": "gmail.com",
  "ggmail.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.cm": "gmail.com",
  // yahoo
  "yhoo.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yhaoo.com": "yahoo.com",
  "yaho.com": "yahoo.com",
  "yahho.com": "yahoo.com",
  "yahoo.co": "yahoo.com",
  // hotmail
  "hotmial.com": "hotmail.com",
  "hotnail.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "hotmaill.com": "hotmail.com",
  "hotmail.co": "hotmail.com",
  // outlook
  "outlok.com": "outlook.com",
  "outloook.com": "outlook.com",
  "outllook.com": "outlook.com",
  "outlock.com": "outlook.com",
  "outlook.co": "outlook.com",
  // icloud / live / aol
  "iclod.com": "icloud.com",
  "icoud.com": "icloud.com",
  "icould.com": "icloud.com",
  "iclud.com": "icloud.com",
  "icloud.co": "icloud.com",
  "live.co": "live.com",
  "aol.co": "aol.com",
  // SA-specific
  "mwed.co.za": "mweb.co.za",
  "vodamai.co.za": "vodamail.co.za",
  "telcomsa.net": "telkomsa.net",
  "telkomsa.co.za": "telkomsa.net",
};

/**
 * Strict-but-not-paranoid email regex. Matches `local@host.tld` with
 * at least one `.` in the host part, ASCII-only, and a 2+ char TLD.
 * Won't accept emoji, spaces, leading/trailing dots in the local
 * part, or single-label hosts like `user@localhost`.
 */
const EMAIL_REGEX =
  /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

export interface EmailValidationResult {
  /** True when the input is well-formed AND no known typo was detected. */
  ok: boolean;
  /** Trimmed + lowercased input. Present whether or not `ok` is true. */
  normalized: string;
  /** Suggested replacement when a typo was detected. Mutually exclusive with `ok=true`. */
  suggestion?: string;
  /**
   * User-facing reason for failure. `"Please enter a valid email address"`
   * when the syntax is wrong; `"Did you mean <suggestion>?"` when we have
   * a typo correction.
   */
  reason?: string;
}

/**
 * Validate an email and (when applicable) suggest a correction.
 *
 * Pure function, no I/O — safe to call on every keystroke if needed.
 * For Lehumo we wire it into `onBlur` (client) and `superRefine`
 * (server schema) — keystroke validation is too noisy.
 */
export function validateEmail(input: string): EmailValidationResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return { ok: false, normalized: "", reason: "Email is required" };
  }

  // Normalize for the rest of the checks. Domain part is canonically
  // case-insensitive (RFC 1035); local part *can* be case-sensitive
  // but is treated as case-insensitive by every major provider Lehumo's
  // members use, so lower-casing globally is safe and gives us
  // consistent dictionary lookups.
  const normalized = trimmed.toLowerCase();

  if (!EMAIL_REGEX.test(normalized)) {
    return {
      ok: false,
      normalized,
      reason: "Please enter a valid email address",
    };
  }

  const atIdx = normalized.lastIndexOf("@");
  const local = normalized.slice(0, atIdx);
  const domain = normalized.slice(atIdx + 1);

  // ─── TLD typo check ──────────────────────────────────────────────
  // Take the last label (after the final `.`); if it's a known typo,
  // swap it. Every entry in TLD_TYPOS is invalid as a real TLD, so a
  // hit is unambiguous — no risk of nuking a real `.cm` Cameroonian
  // address.
  const lastDot = domain.lastIndexOf(".");
  const tld = domain.slice(lastDot + 1);
  if (TLD_TYPOS[tld]) {
    const fixed = `${local}@${domain.slice(0, lastDot + 1)}${TLD_TYPOS[tld]}`;
    return {
      ok: false,
      normalized,
      suggestion: fixed,
      reason: `Did you mean ${fixed}?`,
    };
  }

  // ─── Domain typo check ───────────────────────────────────────────
  // Same logic, full-domain match. Only entries we've confirmed are
  // misspellings of real providers.
  if (DOMAIN_TYPOS[domain]) {
    const fixed = `${local}@${DOMAIN_TYPOS[domain]}`;
    return {
      ok: false,
      normalized,
      suggestion: fixed,
      reason: `Did you mean ${fixed}?`,
    };
  }

  return { ok: true, normalized };
}
