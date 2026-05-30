import "server-only";

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Member-portal password hashing.
 *
 * Uses Node's built-in `crypto.scrypt` so we ship no new dependencies
 * (native `bcrypt` is painful on Vercel's serverless runtime, and
 * `bcryptjs` is pure JS but ~10× slower than scrypt for the same work
 * factor). scrypt is memory-hard, NIST-recommended, and what BIP39 +
 * Litecoin use — it's a solid pick for a low-volume member portal.
 *
 * Storage format: `<saltHex>:<keyHex>`. Hex is `a-f0-9`, never `|`, so
 * it survives the existing notes-blob splice pattern verbatim.
 *
 * - salt: 16 bytes random per password (32 hex chars)
 * - key:  64 bytes derived (128 hex chars)
 * - cost: N=2^15 (32 768) — same as Node's default. ~50ms on Vercel
 *         lambda, well below any user-perceptible latency budget.
 *
 * If we ever need to bump cost, increment the prefix to keep
 * back-compat: stored hashes without a version are scrypt N=2^15;
 * future hashes can prepend `v2:` etc. and verify-by-version.
 */

const SCRYPT_KEYLEN = 64;
const SCRYPT_SALT_BYTES = 16;
const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

/**
 * Lightweight password strength check shared by the set / reset
 * endpoints. We intentionally keep this loose — long-and-memorable
 * beats short-and-cryptic for a member portal whose users are not
 * security professionals. The portal UI surfaces the same rules so
 * users see the requirement before they submit.
 *
 * Rules:
 *   - At least 8 characters
 *   - Not entirely numeric (defends against birthdays / phone numbers)
 *   - Not the member's own member number
 *
 * Returns `null` if OK, or a user-facing error string. Callers should
 * pass the member's number so we can reject "Leh01" / "01" as the
 * password.
 */
export function checkPasswordStrength(
  password: string,
  memberNumberString?: string,
): string | null {
  if (typeof password !== "string") return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 200) return "Password is too long (max 200 characters).";
  if (/^\d+$/.test(password)) {
    return "Password can't be all digits — add a letter or symbol.";
  }
  if (memberNumberString) {
    const normalised = password.replace(/\s+/g, "").toLowerCase();
    const memberLower = memberNumberString.toLowerCase();
    if (normalised === memberLower || normalised === memberLower.replace(/^leh/, "")) {
      return "Password can't be your member number.";
    }
  }
  return null;
}

/**
 * Hash a plaintext password. Returns the storage string
 * `<saltHex>:<keyHex>`.
 *
 * Throws if the password is empty — callers should validate via
 * `checkPasswordStrength` first; this is a defensive last line.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) throw new Error("Cannot hash empty password");
  const salt = randomBytes(SCRYPT_SALT_BYTES);
  const key = await scryptAsync(password, salt, SCRYPT_KEYLEN);
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

/**
 * Constant-time verification of a plaintext password against a stored
 * hash. Returns false on any parse error so a corrupted hash field
 * never short-circuits the comparison.
 *
 * Uses `timingSafeEqual` to defend against timing side-channels — a
 * naive `===` on the derived key leaks information about how many
 * leading bytes match.
 */
export async function verifyPassword(
  password: string,
  storedHash: string | null | undefined,
): Promise<boolean> {
  if (!password || !storedHash) return false;
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;
  const [saltHex, keyHex] = parts;
  if (!/^[a-f0-9]+$/i.test(saltHex) || !/^[a-f0-9]+$/i.test(keyHex)) {
    return false;
  }
  let salt: Buffer;
  let expectedKey: Buffer;
  try {
    salt = Buffer.from(saltHex, "hex");
    expectedKey = Buffer.from(keyHex, "hex");
  } catch {
    return false;
  }
  if (expectedKey.length !== SCRYPT_KEYLEN) return false;
  let candidateKey: Buffer;
  try {
    candidateKey = await scryptAsync(password, salt, expectedKey.length);
  } catch {
    return false;
  }
  // Length-check before timingSafeEqual — it throws on mismatched
  // lengths rather than returning false, which would leak length
  // information via the exception path.
  if (candidateKey.length !== expectedKey.length) return false;
  return timingSafeEqual(candidateKey, expectedKey);
}
