import "server-only";

/**
 * In-memory sliding-window failure tracker for the portal login route.
 *
 * Why in-memory rather than KV / Redis:
 *   - Lehumo is a 30-90 member portal; per-second login throughput is
 *     vanishingly small.
 *   - Vercel's serverless runtime keeps warm instances alive for ~5
 *     minutes between invocations, so a single instance handles most
 *     of any given attack window.
 *   - Even with cold-start leakage (an attacker timing their attempts
 *     to hit fresh instances), a brute-force still has to compete
 *     against the 8+ character password requirement — the practical
 *     entropy floor is high enough that even a leaky rate limiter
 *     pushes attack cost well past patience.
 *
 * If this ever becomes load-bearing for a larger tenant pool, swap
 * this module for an Upstash / Vercel-KV-backed implementation behind
 * the same exported signatures — call sites won't need to change.
 *
 * What it tracks:
 *   - One sliding window per key (email-lowered or IP address).
 *   - Each failed credential attempt → `recordFailure(key)`.
 *   - Each successful login → `clearFailures(key)`.
 *   - Before processing, callers ask `checkRateLimit(key)`. If the
 *     key is locked out, the caller responds with 429 + `Retry-After`.
 *
 * Failures only — successful logins do NOT count toward the limit.
 * That way a member who's just signed in and accidentally signs in
 * again (e.g. across two tabs) never trips it.
 */

const FAILURE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FAILURES_PER_WINDOW = 5;

interface FailureRecord {
  /** Number of failed attempts in the active window. */
  count: number;
  /** Epoch ms when the FIRST failure in this window happened. The
   *  window ends `FAILURE_WINDOW_MS` ms after this timestamp. */
  windowStart: number;
}

// Module-level Map: persists for the lifetime of the warm function
// instance. Keys are typically `email:<lowercased-email>` but the
// shape is opaque to the limiter — callers choose the key prefix.
const failures = new Map<string, FailureRecord>();

// Periodic sweep: drop any records whose window has fully elapsed so
// the Map doesn't grow unboundedly across a warm instance's lifetime.
// Triggered lazily on every check/record so we don't need setInterval
// (which doesn't play well with serverless lifecycles).
let lastSweepAt = 0;
const SWEEP_INTERVAL_MS = 60 * 1000;

function maybeSweep(now: number) {
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) return;
  lastSweepAt = now;
  for (const [key, record] of failures) {
    if (now - record.windowStart > FAILURE_WINDOW_MS) {
      failures.delete(key);
    }
  }
}

export type RateLimitCheck =
  | { ok: true }
  | { ok: false; retryAfterSec: number; failureCount: number };

/**
 * Should the caller proceed with credential verification, or short-
 * circuit with a 429? Pure query — does not mutate state. Call this
 * BEFORE running the credential check so the response time stays
 * uniform whether the credential is right or wrong (timing side-
 * channel resistance).
 */
export function checkRateLimit(key: string): RateLimitCheck {
  const now = Date.now();
  maybeSweep(now);
  const record = failures.get(key);
  if (!record) return { ok: true };
  if (now - record.windowStart > FAILURE_WINDOW_MS) {
    // Window expired — drop the stale record and let through. This
    // also implicitly resets the counter for the next failure.
    failures.delete(key);
    return { ok: true };
  }
  if (record.count >= MAX_FAILURES_PER_WINDOW) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((record.windowStart + FAILURE_WINDOW_MS - now) / 1000),
    );
    return { ok: false, retryAfterSec, failureCount: record.count };
  }
  return { ok: true };
}

/**
 * Mark a credential attempt as having failed. Increments the active
 * window's counter, or starts a new window if none is active.
 *
 * Note: this should be called for genuinely-failed credential
 * attempts only — NOT for malformed-request 400s (those don't
 * indicate a brute-force) and NOT for the "must use other path"
 * hints (MUST_USE_PASSWORD / MUST_USE_MEMBER_NUMBER), which are
 * informational and would otherwise lock a legitimate member out
 * the moment they pick the wrong path.
 */
export function recordFailure(key: string): void {
  const now = Date.now();
  maybeSweep(now);
  const record = failures.get(key);
  if (!record || now - record.windowStart > FAILURE_WINDOW_MS) {
    failures.set(key, { count: 1, windowStart: now });
    return;
  }
  record.count += 1;
}

/**
 * Reset the failure count for a key. Call after a successful login so
 * a member who fat-fingered a few times before getting it right
 * doesn't carry that count into their next session.
 */
export function clearFailures(key: string): void {
  failures.delete(key);
}

/**
 * Build a stable, lowercased rate-limit key from an email. Callers
 * use this for the email-keyed limit. The same email regardless of
 * casing collapses to the same key.
 */
export function rateLimitKeyForEmail(email: string): string {
  return `email:${email.trim().toLowerCase()}`;
}
