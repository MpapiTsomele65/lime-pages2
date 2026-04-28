// ─── KYC identity-document helpers ──────────────────────────────────
// Used by Step 3 of the Lehumo onboarding wizard and (later) the
// member-portal & admin upload screens. Pure functions — no I/O — so
// they can run in the client validator and the API route.

export type IdType = "sa_id" | "passport";

/**
 * Heuristic detection of the document type from a raw input string.
 * - Pure digits, exactly 13 characters → treat as a South African ID.
 * - Anything else → treat as a passport candidate (alphanumeric).
 *
 * Returns `null` when the input is empty or too short to classify.
 * Use {@link validateSaId} / {@link validatePassport} to confirm the
 * specific format once the type is known.
 */
export function detectIdType(value: string): IdType | null {
  const cleaned = value.replace(/\s/g, "");
  if (cleaned.length === 0) return null;
  if (/^\d{13}$/.test(cleaned)) return "sa_id";
  // Anything that looks alphanumeric and is at least 5 chars is a
  // passport candidate. Below that we don't have enough signal yet.
  if (cleaned.length >= 5 && /^[A-Za-z0-9]+$/.test(cleaned)) return "passport";
  return null;
}

/**
 * SA ID validator — checks both structural format and the Luhn
 * checksum on the final digit. Catches transposition typos that
 * a length check would miss.
 *
 * Format: YYMMDD + SSSS + C + A + Z (13 digits)
 *  - C: 0/1 = SA citizen, others permitted residents
 *  - A: legacy (used to denote race) — now mostly 8/9
 *  - Z: Luhn check digit
 */
export function validateSaId(raw: string): { ok: boolean; reason?: string } {
  const id = raw.replace(/\s/g, "");
  if (!/^\d{13}$/.test(id)) {
    return { ok: false, reason: "SA ID must be 13 digits." };
  }

  // Luhn checksum (variant used by SA Home Affairs)
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    let digit = parseInt(id[i], 10);
    const positionFromRight = 12 - i;
    if (positionFromRight % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  if (sum % 10 !== 0) {
    return {
      ok: false,
      reason: "That doesn't look like a valid SA ID — please double-check.",
    };
  }

  return { ok: true };
}

/**
 * Passport validator — intentionally permissive because passport
 * formats vary by country. We require alphanumeric, 6–12 characters,
 * which covers the vast majority of issuers.
 */
export function validatePassport(raw: string): { ok: boolean; reason?: string } {
  const p = raw.replace(/\s/g, "").toUpperCase();
  if (p.length < 6 || p.length > 12) {
    return { ok: false, reason: "Passport number should be 6–12 characters." };
  }
  if (!/^[A-Z0-9]+$/.test(p)) {
    return { ok: false, reason: "Passport number can only contain letters and numbers." };
  }
  return { ok: true };
}

/**
 * Combined validator — runs the right check based on detected type.
 * Returns the resolved type so the caller can persist it without
 * re-running detection.
 */
export function validateIdInput(raw: string): {
  ok: boolean;
  type?: IdType;
  reason?: string;
} {
  const type = detectIdType(raw);
  if (!type) {
    return { ok: false, reason: "Enter an SA ID number or passport number." };
  }
  const result = type === "sa_id" ? validateSaId(raw) : validatePassport(raw);
  return { ok: result.ok, reason: result.reason, type };
}
