import "server-only";

import { getFundInterestConfig } from "./fund-settings";
import {
  AIRTABLE_FIELDS,
  MONTH_NAMES,
  STATUS_CHOICE_ID_TO_NAME,
  KYC_CHOICE_ID_TO_NAME,
  SOURCE_CHOICE_ID_TO_NAME,
  ID_TYPE_CHOICE_ID_TO_NAME,
  RISK_PROFILE_CHOICE_ID_TO_NAME,
  WEALTH_PREFERENCE_CHOICE_ID_TO_NAME,
  ASSET_CLASS_CHOICE_ID_TO_NAME,
  RELATIONSHIP_CHOICE_ID_TO_NAME,
  LOAN_TYPE_CHOICE_ID_TO_NAME,
  CONTRIBUTION_SOURCE,
  extractPasswordHashFromNotes,
  extractPlanFromNotes,
  extractSteeringFromNotes,
  extractSubscriptionFromNotes,
  formatMemberNumber,
  hasBeneficiary,
  idTypeToAirtable,
  LEHUMO_FIRST_DUE_PERIOD,
  todayDate,
  type LehumoMember,
  type MemberStatus,
  type KycStatus,
  type CommunityPoolStats,
  type PoolMonthPoint,
  type PoolRecentMonth,
  type AirtableAttachment,
  type BeneficiaryRelationship,
  type ActiveLoanType,
  type LehumoRiskProfile,
  type LehumoWealthPreference,
  type LehumoAssetClass,
} from "./definitions";
import {
  listContributionsForMember,
  listPaidContributions,
  markPeriodPaidForMember,
} from "./contributions";
import {
  getSastYear,
  groupContributionsByMemberPrefix,
  projectToLegacyContributions,
} from "./member-contributions-view";
import { computeLeaderboard } from "./lehumo-leaderboard";

// ─── Config ─────────────────────────────────────────────────────────
// Exported (alongside resolveSelect + parseRecord further down) so
// lib/airtable-admin.ts can share the same Airtable plumbing instead
// of carrying a parallel copy that drifts. Keep these "package-
// internal" — they're consumed by airtable-admin.ts but not by app
// code.
export function getBaseUrl() {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableId = process.env.AIRTABLE_TABLE_ID;
  if (!baseId || !tableId) throw new Error("Airtable env vars not set");
  return `https://api.airtable.com/v0/${baseId}/${tableId}`;
}

export function getHeaders() {
  const pat = process.env.AIRTABLE_PAT;
  if (!pat) throw new Error("AIRTABLE_PAT is not set");
  return {
    Authorization: `Bearer ${pat}`,
    "Content-Type": "application/json",
  };
}

// ─── Helpers ────────────────────────────────────────────────────────
/**
 * Resolve a singleSelect cell value to its display name.
 *
 * Airtable returns singleSelect values in one of three shapes depending on
 * the request:
 *   - With `returnFieldsByFieldId=true`: a bare choice ID string, e.g. "selJHkVh1Jc2ZtdUr"
 *   - Without that flag: the choice name string, e.g. "Active"
 *   - Some older API paths: an object `{ id, name, color }`
 *
 * This helper handles all three, falling back to `fallback` for empty values.
 */
export function resolveSelect(
  value: unknown,
  choiceMap: Record<string, string>,
  fallback: string,
): string {
  if (value == null) return fallback;
  if (typeof value === "string") {
    // Looks like a choice ID? Map it. Otherwise assume it's already the name.
    return choiceMap[value] ?? value;
  }
  if (typeof value === "object" && "name" in (value as object)) {
    return String((value as { name: unknown }).name ?? fallback);
  }
  return fallback;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function parseRecord(record: any): LehumoMember {
  const f = record.fields;
  // Phase 5: contributions are now sourced exclusively from the
  // Contributions linked table — `hydrateContributionsFromNewTable` (or
  // its bulk equivalent) overwrites this empty map with a SAST-year
  // projection of the rich `contributionRows`. The legacy MONTH_FIELDS
  // boolean columns on the Members table are no longer read.
  const contributions: Record<string, boolean> = {};

  // Multipart attachments may be undefined when no file has been uploaded
  // yet, so coerce to undefined (rather than empty array) to mirror the
  // optional shape on LehumoMember.
  const idDoc = f[AIRTABLE_FIELDS.kycIdDocument] as
    | AirtableAttachment[]
    | undefined;
  const poaDoc = f[AIRTABLE_FIELDS.kycProofOfAddress] as
    | AirtableAttachment[]
    | undefined;

  return {
    id: record.id,
    fullName: f[AIRTABLE_FIELDS.fullName] || "",
    memberNumber: f[AIRTABLE_FIELDS.memberNumber] || 0,
    email: f[AIRTABLE_FIELDS.email] || "",
    phone: f[AIRTABLE_FIELDS.phone] || "",
    status: resolveSelect(
      f[AIRTABLE_FIELDS.status],
      STATUS_CHOICE_ID_TO_NAME,
      "Prospect",
    ) as MemberStatus,
    kycStatus: resolveSelect(
      f[AIRTABLE_FIELDS.kycStatus],
      KYC_CHOICE_ID_TO_NAME,
      "Not Started",
    ) as KycStatus,
    source: resolveSelect(
      f[AIRTABLE_FIELDS.source],
      SOURCE_CHOICE_ID_TO_NAME,
      "",
    ),
    notes: f[AIRTABLE_FIELDS.notes] || "",
    contributions,
    // Plan tier — derived from the notes blob (see extractPlanFromNotes).
    // Falls through to undefined for legacy members onboarded before
    // Step 2 was added or whose notes have been cleared.
    plan: extractPlanFromNotes(f[AIRTABLE_FIELDS.notes] || ""),
    // Paystack subscription state — also derived from notes (see
    // extractSubscriptionFromNotes). `code` is set by the
    // subscription.create webhook handler; `action` is set when a
    // member downgrades to Basic but auto-cancel isn't possible.
    ...(() => {
      const sub = extractSubscriptionFromNotes(
        f[AIRTABLE_FIELDS.notes] || "",
      );
      return {
        subscriptionCode: sub.code,
        subscriptionAction: sub.action,
      };
    })(),
    // Steering Committee volunteer submission — null when the member
    // hasn't opted in. Populated once they hit Apply on the portal
    // SteeringCommitteeCard.
    steering: extractSteeringFromNotes(f[AIRTABLE_FIELDS.notes] || ""),
    // Optional self-service password hash — set by the portal's
    // /security card. `null` means no password is set; login falls
    // back to the email + member-number path. We deliberately surface
    // this on every read so route handlers and UI can check
    // `!!member.passwordHash` without re-parsing the notes blob.
    passwordHash: extractPasswordHashFromNotes(
      f[AIRTABLE_FIELDS.notes] || "",
    ),
    // ── KYC fields (Tier 2A) — all optional, populated post-onboarding ──
    idType: resolveSelect(
      f[AIRTABLE_FIELDS.idType],
      ID_TYPE_CHOICE_ID_TO_NAME,
      "",
    ) as "SA ID" | "Passport" | "",
    idNumber: f[AIRTABLE_FIELDS.idNumber] || "",
    residentialAddress: f[AIRTABLE_FIELDS.residentialAddress] || "",
    kycIdDocument: idDoc && idDoc.length > 0 ? idDoc : undefined,
    kycProofOfAddress: poaDoc && poaDoc.length > 0 ? poaDoc : undefined,
    kycSubmittedAt: f[AIRTABLE_FIELDS.kycSubmittedAt] || undefined,
    kycVerifiedAt: f[AIRTABLE_FIELDS.kycVerifiedAt] || undefined,
    // ── Investor risk profile (portal quiz; dedicated columns) ──
    riskProfile: resolveSelect(
      f[AIRTABLE_FIELDS.riskProfile],
      RISK_PROFILE_CHOICE_ID_TO_NAME,
      "",
    ) as LehumoRiskProfile | "",
    riskScore:
      typeof f[AIRTABLE_FIELDS.riskScore] === "number"
        ? (f[AIRTABLE_FIELDS.riskScore] as number)
        : undefined,
    riskAssessed: f[AIRTABLE_FIELDS.riskAssessed] || undefined,
    wealthPreference: resolveSelect(
      f[AIRTABLE_FIELDS.wealthPreference],
      WEALTH_PREFERENCE_CHOICE_ID_TO_NAME,
      "",
    ) as LehumoWealthPreference | "",
    preferredAssetClass: resolveSelect(
      f[AIRTABLE_FIELDS.preferredAssetClass],
      ASSET_CLASS_CHOICE_ID_TO_NAME,
      "",
    ) as LehumoAssetClass | "",
    // ── Beneficiary / next-of-kin (all optional) ──
    beneficiaryFirstName: f[AIRTABLE_FIELDS.beneficiaryFirstName] || undefined,
    beneficiarySurname: f[AIRTABLE_FIELDS.beneficiarySurname] || undefined,
    beneficiaryRelationship: resolveSelect(
      f[AIRTABLE_FIELDS.beneficiaryRelationship],
      RELATIONSHIP_CHOICE_ID_TO_NAME,
      "",
    ) as BeneficiaryRelationship | "",
    beneficiaryPhone: f[AIRTABLE_FIELDS.beneficiaryPhone] || undefined,
    beneficiaryEmail: f[AIRTABLE_FIELDS.beneficiaryEmail] || undefined,
    beneficiaryAddress: f[AIRTABLE_FIELDS.beneficiaryAddress] || undefined,
    beneficiaryUpdatedAt:
      f[AIRTABLE_FIELDS.beneficiaryUpdatedAt] || undefined,
    // ── Active loan ledger (Phase 1 emergency access). When the cell is
    //    empty / unset Airtable returns `undefined`; we coerce numerics to
    //    actual numbers and let the type-only-loan field fall through the
    //    same singleSelect resolver as every other choice column. ──
    activeLoanBalance:
      typeof f[AIRTABLE_FIELDS.activeLoanBalance] === "number"
        ? (f[AIRTABLE_FIELDS.activeLoanBalance] as number)
        : undefined,
    activeLoanIssuedAt: f[AIRTABLE_FIELDS.activeLoanIssuedAt] || undefined,
    activeLoanType: resolveSelect(
      f[AIRTABLE_FIELDS.activeLoanType],
      LOAN_TYPE_CHOICE_ID_TO_NAME,
      "",
    ) as ActiveLoanType | "",
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── API Methods ────────────────────────────────────────────────────

/**
 * Normalise an email for Airtable lookup. Airtable's email field type
 * stores values as-entered, but emails are case-insensitive by RFC so we
 * lowercase user input before the exact-match formula.
 */
function normaliseEmail(email: string): string {
  // Strip CR/LF + surrounding whitespace, lowercase, and escape single
  // quotes for safe use inside an Airtable filterByFormula string literal.
  return email.trim().toLowerCase().replace(/'/g, "\\'");
}

export async function findMemberByEmail(
  email: string,
): Promise<LehumoMember | null> {
  const safe = normaliseEmail(email);
  // CRITICAL: wrap the column ref in `LOWER(...)` so the comparison is
  // case-insensitive. Airtable's Email field type stores values
  // case-PRESERVED ("Heshunkosazana@gmail.com"), but emails are
  // case-insensitive by RFC. Without LOWER, a record stored with a
  // capital first letter never matches a lowercased search input,
  // which is what spawned the Nkosazana Leh03/Leh27 duplicate (one
  // record had capital H, the other lowercase; neither lookup found
  // the other, so a second member record got created on re-onboarding).
  const formula = encodeURIComponent(`LOWER({Email})='${safe}'`);
  const url = `${getBaseUrl()}?filterByFormula=${formula}&maxRecords=1&returnFieldsByFieldId=true`;

  const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Airtable findByEmail error: ${res.status} — ${body}`);
  }

  const data = await res.json();
  if (!data.records || data.records.length === 0) return null;
  return hydrateContributionsFromNewTable(parseRecord(data.records[0]));
}

export async function findMemberByEmailAndNumber(
  email: string,
  memberNumber: number,
): Promise<LehumoMember | null> {
  const safe = normaliseEmail(email);
  // Same case-insensitive comparison as findMemberByEmail above —
  // wrapping in LOWER() so login + onboarding don't break when a
  // record's email casing drifts. Without this, a member who typed
  // their email with a capital first letter at signup couldn't log
  // in with the lowercase version (or vice versa).
  const formula = encodeURIComponent(
    `AND(LOWER({Email})='${safe}', {Member #}=${memberNumber})`,
  );
  const url = `${getBaseUrl()}?filterByFormula=${formula}&maxRecords=1&returnFieldsByFieldId=true`;

  const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Airtable findByEmailAndNumber error: ${res.status} — ${body}`);
  }

  const data = await res.json();
  if (!data.records || data.records.length === 0) return null;
  // No hydration — login flow only needs id / email / memberNumber /
  // fullName for createSession. The dashboard re-fetches with
  // contributions hydrated on the next page render. Saves one Airtable
  // round trip per login (the user's 60-row contribution list).
  return parseRecord(data.records[0]);
}

/**
 * Hydrate a parsed member with their contribution history from the
 * Contributions linked table.
 *
 * Populates two fields:
 *   • `contributions` — Record<string, boolean> projected onto Jan-Dec
 *     for the current SAST year. Backward-compat shape for components
 *     (PaymentCard legacy fallback, ContributionGrid 12-cell mode,
 *     CompletenessMeter, EmergencyAccessCard's legacy path,
 *     admin-stats) that read the projected shape.
 *   • `contributionRows` — the full 60-row sequence powering Phase 4's
 *     year-spanning visualisations (year tabs, R60K progress bar,
 *     R12K emergency cash bar).
 *
 * Phase 5: the legacy MONTH_FIELDS columns are no longer the source of
 * truth — this is the only path. If the new-table fetch fails (rate
 * limit, network), members see empty contribution history rather than
 * stale legacy data; an error is logged for ops triage.
 */
async function hydrateContributionsFromNewTable(
  member: LehumoMember,
): Promise<LehumoMember> {
  try {
    const rows = await listContributionsForMember(member.memberNumber);
    return {
      ...member,
      contributions: projectToLegacyContributions(rows, getSastYear()),
      contributionRows: rows,
    };
  } catch (err) {
    console.error(
      `hydrateContributionsFromNewTable failed for member ${member.memberNumber}:`,
      err,
    );
    return member;
  }
}

export async function getMemberById(
  recordId: string,
): Promise<LehumoMember | null> {
  const url = `${getBaseUrl()}/${recordId}?returnFieldsByFieldId=true`;
  const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
  if (!res.ok) {
    if (res.status === 404) return null;
    const body = await res.text().catch(() => "");
    const patSig = (process.env.AIRTABLE_PAT ?? "").slice(0, 6);
    throw new Error(
      `Airtable getMemberById error: ${res.status} — recordId="${recordId}" url="${url}" body=${body.slice(0, 300)} ` +
        `(pat="${patSig}…", patLen=${(process.env.AIRTABLE_PAT ?? "").length})`,
    );
  }

  const record = await res.json();
  const member = parseRecord(record);
  return hydrateContributionsFromNewTable(member);
}

/**
 * Lighter sibling of `getMemberById` that skips the Contributions-table
 * hydration step.
 *
 * Use for code paths that only need the Members-table fields (KYC
 * uploads, KYC status flips, beneficiary writes, status changes etc) —
 * paths that don't render contribution data and don't need the
 * 60-period rows attached.
 *
 * Why: post-Phase-5 every `getMemberById` performs an additional
 * Airtable list call to fetch ~60 contribution rows, plus the
 * projection calc. For an upload route that calls `getMemberById`
 * twice (pre-validate + post-upload refetch), that's two unnecessary
 * paginated list calls per request — easy to push past Vercel's
 * function timeout on a slow Airtable response, and easy to chew
 * through Airtable's 5 req/sec rate limit.
 *
 * Returns the member with `contributions` as the empty `parseRecord`
 * default (`{}`) and `contributionRows` undefined. Callers that need
 * contribution data should still use `getMemberById`.
 */
export async function getMemberByIdLite(
  recordId: string,
): Promise<LehumoMember | null> {
  const url = `${getBaseUrl()}/${recordId}?returnFieldsByFieldId=true`;
  const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
  if (!res.ok) {
    if (res.status === 404) return null;
    const body = await res.text().catch(() => "");
    const patSig = (process.env.AIRTABLE_PAT ?? "").slice(0, 6);
    throw new Error(
      `Airtable getMemberByIdLite error: ${res.status} — ${body.slice(0, 300)} ` +
        `(pat="${patSig}…", patLen=${(process.env.AIRTABLE_PAT ?? "").length})`,
    );
  }

  return parseRecord(await res.json());
}

/**
 * Allocate the next Member # for a new registration.
 *
 * "Lowest gap" policy: returns the smallest positive integer that
 * isn't already used by an existing member record. Fills holes left
 * by deleted / merged member records so the founding-30 roster stays
 * tidy.
 *
 * Walked through Lehumo's current state:
 *   used = {1..22, 24..26, 29, 31}
 *   gaps = [23, 27, 28, 30]
 *   → first new signup gets 23, then 27, then 28, then 30, then 32.
 *
 * Trade-off vs the old MAX+1 allocator: we lose implicit chronological
 * ordering by member number. That's fine because every Airtable row
 * carries `createdTime` anyway, so "Nth member onboarded" is still
 * recoverable from the source of truth.
 *
 * Race-condition note: two simultaneous registrations could both read
 * the same gap set and pick the same number → duplicate Leh##. Airtable
 * has no unique-constraint primitive to prevent this; for a founding
 * cohort of ~30 the collision probability is vanishingly small in
 * practice. If we ever need stronger guarantees, a Vercel KV / Redis
 * counter or an Airtable "Member Counter" record with optimistic
 * concurrency would be the upgrade path.
 */
export async function getNextMemberNumber(): Promise<number> {
  const used = new Set<number>();
  let offset: string | undefined;
  do {
    const params = new URLSearchParams({
      pageSize: "100",
      returnFieldsByFieldId: "true",
    });
    params.append("fields[]", AIRTABLE_FIELDS.memberNumber);
    if (offset) params.set("offset", offset);
    const res = await fetch(`${getBaseUrl()}?${params.toString()}`, {
      headers: getHeaders(),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Airtable error: ${res.status}`);
    const data = await res.json();
    for (const r of data.records ?? []) {
      const n = r.fields?.[AIRTABLE_FIELDS.memberNumber];
      if (typeof n === "number" && n > 0 && Number.isInteger(n)) {
        used.add(n);
      }
    }
    offset = data.offset;
  } while (offset);

  // Walk up from 1 until we hit a number nobody owns yet. Bounded by
  // (used.size + 1) — even with every existing number contiguous from
  // 1, the answer is at most size+1.
  let candidate = 1;
  while (used.has(candidate)) candidate++;
  return candidate;
}

export async function createMember(fields: {
  fullName: string;
  email: string;
  phone: string;
  source: string;
  memberNumber: number;
  notes?: string;
  // ── KYC structured fields (optional — Tier 2A) ──
  idType?: "sa_id" | "passport";
  idNumber?: string;
  residentialAddress?: string;
}): Promise<LehumoMember> {
  // For POST/PATCH, Airtable's `returnFieldsByFieldId` flag must live in
  // the request BODY — passing it as a query string is silently ignored
  // and the response is keyed by display name, which breaks parseRecord.
  const url = getBaseUrl();

  const airtableFields: Record<string, unknown> = {
    [AIRTABLE_FIELDS.fullName]: fields.fullName,
    [AIRTABLE_FIELDS.email]: fields.email,
    [AIRTABLE_FIELDS.phone]: fields.phone,
    [AIRTABLE_FIELDS.source]: fields.source,
    [AIRTABLE_FIELDS.memberNumber]: fields.memberNumber,
    [AIRTABLE_FIELDS.status]: "Onboarding",
    [AIRTABLE_FIELDS.kycStatus]: "Docs Requested",
  };

  if (fields.notes) {
    airtableFields[AIRTABLE_FIELDS.notes] = fields.notes;
  }
  if (fields.idType) {
    airtableFields[AIRTABLE_FIELDS.idType] = idTypeToAirtable(fields.idType);
  }
  if (fields.idNumber) {
    airtableFields[AIRTABLE_FIELDS.idNumber] = fields.idNumber;
  }
  if (fields.residentialAddress) {
    airtableFields[AIRTABLE_FIELDS.residentialAddress] = fields.residentialAddress;
  }

  const body = {
    fields: airtableFields,
    returnFieldsByFieldId: true,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Airtable create error: ${res.status} — ${err}`);
  }

  const record = await res.json();
  return parseRecord(record);
}

export async function updateMember(
  recordId: string,
  fields: Record<string, unknown>,
): Promise<LehumoMember> {
  // `returnFieldsByFieldId` lives in the body for PATCH — see createMember.
  const url = `${getBaseUrl()}/${recordId}`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ fields, returnFieldsByFieldId: true }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Airtable update error: ${res.status} — ${err}`);
  }

  const record = await res.json();
  return parseRecord(record);
}

/**
 * Mark a member's contribution paid for a given month.
 *
 * Phase 5: writes go exclusively to the Contributions linked table —
 * the legacy MONTH_FIELDS column write was removed once dual-write was
 * no longer needed (the new table has been the read source since
 * Phase 3 went live). The function still accepts the year-agnostic
 * `month` parameter for backward compatibility with the Paystack
 * verify/webhook handlers; if no `period` override is supplied we
 * resolve `{currentSastYear}-{monthOfYear}` so the Jun 2026 launch
 * lands in `2026-06`.
 *
 * Throws on validation errors (invalid month code, member not found).
 * Airtable failures bubble up — the Paystack handlers wrap the call
 * in their own try/catch since a webhook retry is the right behaviour
 * for transient Airtable issues, not a silent log-and-skip.
 */
export async function checkMonthPayment(
  recordId: string,
  month: string,
  options?: {
    /** YYYY-MM. Defaults to {currentSastYear}-{monthOfYear}. */
    period?: string;
    /** The Members.id stored on the contribution row's Member link.
     *  Pass when known to avoid an extra round trip; otherwise we'll
     *  fetch the member by ID. */
    memberId?: string;
    /** Contribution Key prefix is `Leh##` — pass to skip the member
     *  lookup. */
    memberNumber?: number;
    /** Defaults to R1,000 (Standard plan). */
    amountReceived?: number;
    /** Defaults to "Adjustment" so admin manual ticks don't masquerade
     *  as Paystack debits. Paystack-driven calls should pass "Paystack". */
    source?: (typeof CONTRIBUTION_SOURCE)[keyof typeof CONTRIBUTION_SOURCE];
    /** Paystack reference / EFT ref / receipt number. Empty string by
     *  default — admins can fill it in via the reconciliation view. */
    paymentReference?: string;
    /** YYYY-MM-DD. Defaults to today (SAST). */
    paymentDate?: string;
  },
): Promise<void> {
  const monthIdx = MONTH_NAMES.indexOf(month);
  if (monthIdx < 0) throw new Error(`Invalid month: ${month}`);
  const period =
    options?.period ??
    `${getSastYear()}-${String(monthIdx + 1).padStart(2, "0")}`;

  let memberId = options?.memberId;
  let memberNumber = options?.memberNumber;
  if (!memberId || !memberNumber) {
    const member = await getMemberById(recordId);
    if (!member) {
      throw new Error(`member ${recordId} not found`);
    }
    memberId = member.id;
    memberNumber = member.memberNumber;
  }

  await markPeriodPaidForMember({
    memberId,
    memberNumber,
    period,
    amountReceived: options?.amountReceived ?? 1000,
    source: options?.source ?? CONTRIBUTION_SOURCE.adjustment,
    paymentReference: options?.paymentReference ?? "",
    paymentDate: options?.paymentDate,
  });
}

export async function setMemberActive(recordId: string): Promise<void> {
  await updateMember(recordId, {
    [AIRTABLE_FIELDS.status]: "Active",
  });
}

/**
 * Upload a file as an Airtable attachment to one of the two KYC slots
 * (ID document or proof of address). Uses Airtable's content-upload
 * endpoint which lives on `content.airtable.com` (different host from
 * the data API) and accepts base64-encoded files inline.
 *
 * Limits enforced by Airtable: 5MB per file, image/* + application/pdf
 * are the practical content types we care about. We don't enforce these
 * here — the API route is the gate for size/type validation so the
 * caller gets a clean 4xx instead of a generic Airtable failure.
 *
 * Returns the freshly-fetched member record (the upload endpoint
 * returns only the new attachment metadata, not the full row, so we
 * re-fetch via getMemberById to get parseRecord's normalised shape).
 */
export async function uploadKycAttachment(
  recordId: string,
  slot: "id" | "poa",
  file: { contentType: string; base64: string; filename: string },
): Promise<LehumoMember> {
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!baseId) throw new Error("AIRTABLE_BASE_ID is not set");

  const fieldId =
    slot === "id"
      ? AIRTABLE_FIELDS.kycIdDocument
      : AIRTABLE_FIELDS.kycProofOfAddress;

  const url = `https://content.airtable.com/v0/${baseId}/${recordId}/${fieldId}/uploadAttachment`;

  const res = await fetch(url, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      contentType: file.contentType,
      file: file.base64,
      filename: file.filename,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Airtable attachment upload error: ${res.status} — ${err}`);
  }

  // The upload endpoint returns the field's new attachment array only.
  // Re-fetch the whole record so the caller gets a fully-parsed
  // LehumoMember (including all the other KYC bits). Use the lite
  // fetcher — the upload route immediately triggers `router.refresh()`
  // on the client which re-renders the dashboard with full contribution
  // hydration, so we don't need to pay for it on the upload path itself.
  const refreshed = await getMemberByIdLite(recordId);
  if (!refreshed) {
    throw new Error("Member disappeared after attachment upload");
  }
  return refreshed;
}

/**
 * Attach a KYC document to a member by handing Airtable a public URL,
 * skipping the 5-MB-base64 limit on the content-upload endpoint.
 *
 * Airtable downloads the file from the URL server-side and stores its
 * own copy in attachment storage; once the PATCH returns successfully
 * the original URL is no longer needed. Used by the Vercel Blob
 * direct-upload path so members can submit large PDFs (typical
 * proof-of-address scans run 4–8 MB) without hitting our function
 * body cap or Airtable's base64 ceiling.
 *
 * Replace semantics: PATCH on a multipleAttachments field replaces
 * the entire array, so we set `[{url, filename}]` — a fresh upload
 * supersedes whatever was in that slot before. (The legacy content-
 * upload path APPENDS, which silently accumulates stale attachments;
 * replace is the cleaner default.)
 */
export async function uploadKycAttachmentByUrl(
  recordId: string,
  slot: "id" | "poa",
  url: string,
  filename: string,
): Promise<LehumoMember> {
  const fieldId =
    slot === "id"
      ? AIRTABLE_FIELDS.kycIdDocument
      : AIRTABLE_FIELDS.kycProofOfAddress;
  return updateMember(recordId, {
    [fieldId]: [{ url, filename }],
  });
}

/**
 * Patch the structured KYC fields on a member record. Used by:
 *   - the onboarding API to write Step-3 captures (id type, id number,
 *     residential address) to dedicated columns instead of the notes blob
 *   - the resume path to refresh those fields if the user re-runs Step 3
 *
 * Document attachments (kycIdDocument / kycProofOfAddress) flow through
 * `uploadKycAttachment` above — that's the content-upload API which
 * lives on a different Airtable host.
 */
export async function setMemberKyc(
  recordId: string,
  fields: {
    idType?: "sa_id" | "passport";
    idNumber?: string;
    residentialAddress?: string;
    /** Set the kycStatus column. Pass to flag eg. "In Progress" once docs land. */
    kycStatus?: KycStatus;
    /** When true, stamps kycSubmittedAt with today's date (YYYY-MM-DD). */
    markSubmittedNow?: boolean;
    /** When true, stamps kycVerifiedAt with today's date (YYYY-MM-DD). */
    markVerifiedNow?: boolean;
  },
): Promise<LehumoMember> {
  const update: Record<string, unknown> = {};
  if (fields.idType) {
    update[AIRTABLE_FIELDS.idType] = idTypeToAirtable(fields.idType);
  }
  if (fields.idNumber !== undefined) {
    update[AIRTABLE_FIELDS.idNumber] = fields.idNumber;
  }
  if (fields.residentialAddress !== undefined) {
    update[AIRTABLE_FIELDS.residentialAddress] = fields.residentialAddress;
  }
  if (fields.kycStatus) {
    update[AIRTABLE_FIELDS.kycStatus] = fields.kycStatus;
  }
  // Airtable's date columns reject ISO timestamps with a time component
  // (INVALID_VALUE_FOR_COLUMN). todayDate() returns plain YYYY-MM-DD.
  if (fields.markSubmittedNow) {
    update[AIRTABLE_FIELDS.kycSubmittedAt] = todayDate();
  }
  if (fields.markVerifiedNow) {
    update[AIRTABLE_FIELDS.kycVerifiedAt] = todayDate();
  }
  return updateMember(recordId, update);
}

/**
 * Save (or update) a member's next-of-kin / beneficiary details.
 *
 * Always stamps `beneficiaryUpdatedAt` with today's date so admins can
 * see at a glance how stale a record is — beneficiary info that hasn't
 * been touched in a year is worth a nudge to reconfirm.
 *
 * Empty-string inputs are translated to `null` so Airtable clears the
 * field rather than storing the literal "" — that way a member can
 * remove a phone/email/address they previously entered. The first-name
 * / surname / relationship fields are required by the Zod schema, so
 * we don't allow null on those.
 *
 * Single-beneficiary today; multi-beneficiary splits land with the
 * trust paperwork after Phase 2.
 */
export async function setMemberBeneficiary(
  recordId: string,
  fields: {
    firstName: string;
    surname: string;
    relationship: BeneficiaryRelationship;
    phone?: string;
    email?: string;
    address?: string;
  },
): Promise<LehumoMember> {
  // Optional contact fields: empty string → null (Airtable clears the cell);
  // otherwise trim and pass through.
  const blank = (v: string | undefined) => {
    const t = (v ?? "").trim();
    return t.length === 0 ? null : t;
  };

  const update: Record<string, unknown> = {
    [AIRTABLE_FIELDS.beneficiaryFirstName]: fields.firstName.trim(),
    [AIRTABLE_FIELDS.beneficiarySurname]: fields.surname.trim(),
    [AIRTABLE_FIELDS.beneficiaryRelationship]: fields.relationship,
    [AIRTABLE_FIELDS.beneficiaryPhone]: blank(fields.phone),
    [AIRTABLE_FIELDS.beneficiaryEmail]: blank(fields.email),
    [AIRTABLE_FIELDS.beneficiaryAddress]: blank(fields.address),
    // Date-only field: full ISO timestamps are rejected with
    // INVALID_VALUE_FOR_COLUMN. todayDate() returns YYYY-MM-DD.
    [AIRTABLE_FIELDS.beneficiaryUpdatedAt]: todayDate(),
  };

  return updateMember(recordId, update);
}

// ─── Community Pool Stats ──────────────────────────────────────────
const MONTHLY_CONTRIBUTION_ZAR = 1000;
const FOUNDING_SLOTS = 30;

/**
 * Parse env-configured interest values.
 *
 * Two env vars are used (both optional, both in ZAR):
 *   LEHUMO_INTEREST_EARNED_ZAR       — single total number (e.g. "1250")
 *   LEHUMO_INTEREST_HISTORY_JSON     — per-month breakdown, e.g.
 *                                       '{"Jan":0,"Feb":0,"Mar":420.50}'
 *
 * When only the total is set, it is distributed across months up to and
 * including the current calendar month (linear). When the history JSON is
 * provided, it takes precedence and its sum is used as the total.
 */
function loadInterestConfig(currentMonthIndex: number): {
  total: number;
  monthly: number[];
} {
  const historyRaw = process.env.LEHUMO_INTEREST_HISTORY_JSON;
  if (historyRaw) {
    try {
      const parsed = JSON.parse(historyRaw) as Record<string, number>;
      const monthly = MONTH_NAMES.map((m) => Number(parsed[m]) || 0);
      const total = monthly.reduce((a, b) => a + b, 0);
      return { total, monthly };
    } catch {
      // fall through to single-total handling
    }
  }

  const totalRaw = process.env.LEHUMO_INTEREST_EARNED_ZAR;
  const total = Number(totalRaw) || 0;
  if (total <= 0 || currentMonthIndex < 0) {
    return { total: 0, monthly: MONTH_NAMES.map(() => 0) };
  }

  // Distribute the total linearly across elapsed months (inclusive of current).
  const elapsed = currentMonthIndex + 1;
  const perMonth = total / elapsed;
  const monthly = MONTH_NAMES.map((_, i) => (i <= currentMonthIndex ? perMonth : 0));
  return { total, monthly };
}

/**
 * Fetch all members (paginated) and aggregate pool-wide metrics for the
 * member dashboard. Runs server-side — do not call from the client.
 *
 * When the LEHUMO_USE_NEW_CONTRIBUTIONS flag is on, member contribution
 * data is sourced from the Contributions linked table instead of the
 * legacy MONTH_FIELDS columns. To avoid an N+1 fetch (1 list call + N
 * per-member contribution calls), we run ONE bulk read of the entire
 * Contributions table and group by member-number prefix in memory.
 */
export async function getCommunityPoolStats(): Promise<CommunityPoolStats> {
  const baseUrl = getBaseUrl();
  const headers = getHeaders();

  const allRecords: LehumoMember[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({
      pageSize: "100",
      returnFieldsByFieldId: "true",
    });
    if (offset) params.set("offset", offset);
    const url = `${baseUrl}?${params.toString()}`;

    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) throw new Error(`Airtable list error: ${res.status}`);

    const data = await res.json();
    for (const record of data.records ?? []) {
      allRecords.push(parseRecord(record));
    }
    offset = data.offset;
  } while (offset);

  // ── Bulk hydration from the Contributions table — Paid rows only ──
  // The aggregation below only counts Paid contributions (per-month
  // contributor count, total ZAR), so we pull the Paid-filtered slice
  // instead of the entire 1,500-row schedule. Pre-launch this returns
  // zero rows in a single round trip; post-launch it scales with
  // actual collections rather than the fixed schedule footprint —
  // the difference between sub-second and ~5-second page renders on
  // the dashboard. The logged-in member's full contributionRows still
  // gets hydrated separately by `getMemberById` so PaymentCard /
  // ContributionGrid Phase 4 visuals see the complete schedule.
  try {
    const paidContribs = await listPaidContributions();
    const byPrefix = groupContributionsByMemberPrefix(paidContribs);
    const year = getSastYear();
    for (const m of allRecords) {
      // formatMemberNumber returns "Leh##" — exactly the prefix the
      // grouping helper keys on.
      const paidRows = byPrefix.get(formatMemberNumber(m.memberNumber)) ?? [];
      m.contributions = projectToLegacyContributions(paidRows, year);
      // Intentionally NOT setting m.contributionRows here — community
      // pool stats only needs the projected boolean shape for its
      // monthlyContributors aggregation. Phase 4 cards on the
      // dashboard read the logged-in member's contributionRows from
      // getMemberById's per-member hydration.
    }
  } catch (err) {
    console.error(
      "getCommunityPoolStats Paid-rows hydration failed:",
      err,
    );
  }

  const now = new Date();
  const currentMonthIndex = now.getMonth();
  const currentMonth = MONTH_NAMES[currentMonthIndex];

  // Interest now comes from the admin-entered Fund Settings value.
  // During the transition we fall back to the legacy env vars when no
  // interest has been entered in Airtable yet, so an existing env value
  // isn't lost before admin sets it on the Portfolio page.
  const fundInterest = await getFundInterestConfig(currentMonthIndex);
  const { total: totalInterest, monthly: monthlyInterest } =
    fundInterest.total > 0
      ? fundInterest
      : loadInterestConfig(currentMonthIndex);

  const monthlyContributors: number[] = MONTH_NAMES.map((month) =>
    allRecords.reduce((n, m) => n + (m.contributions[month] ? 1 : 0), 0),
  );

  const totalContributionMonths = monthlyContributors.reduce((a, b) => a + b, 0);
  const totalContributed = totalContributionMonths * MONTHLY_CONTRIBUTION_ZAR;

  // Build cumulative timeline
  let cumulativeContributed = 0;
  let cumulativeInterest = 0;
  const timeline: PoolMonthPoint[] = MONTH_NAMES.map((month, i) => {
    const contributorsThisMonth = monthlyContributors[i];
    const contributedThisMonth = contributorsThisMonth * MONTHLY_CONTRIBUTION_ZAR;
    cumulativeContributed += contributedThisMonth;
    cumulativeInterest += monthlyInterest[i] || 0;
    return {
      month,
      contributorsThisMonth,
      contributedThisMonth,
      cumulativeContributed,
      cumulativeInterest,
      cumulativeBalance: cumulativeContributed + cumulativeInterest,
    };
  });

  const membersContributedEver = allRecords.filter((m) =>
    Object.values(m.contributions).some(Boolean),
  ).length;

  const activeMembers = allRecords.filter((m) => m.status === "Active").length;
  const membersContributingThisMonth = monthlyContributors[currentMonthIndex];

  // ── Cohort progress metrics — community-facing "how far along
  //    are we?" counters surfaced on the portal CommunityPoolCard.
  //
  //    Both are computed against non-Exited members (Exited members
  //    skew the denominator if we lose anyone).
  const cohortPool = allRecords.filter((m) => m.status !== "Exited");

  //    Onboarded = wizard end-to-end: KYC submitted (status ≠
  //    "Not Started") AND a plan picked. The Notes blob holds the
  //    Plan: <tier> segment; parseRecord already extracts it onto
  //    `m.plan` (undefined when missing).
  const membersOnboarded = cohortPool.filter(
    (m) => m.kycStatus !== "Not Started" && Boolean(m.plan),
  ).length;

  //    Profile updated = engaged with profile post-Step-1 — either
  //    beneficiary on file OR residential address captured. Address
  //    lands during KYC Step 3; beneficiary is portal-only. Together
  //    they catch any meaningful profile interaction beyond the
  //    initial Step-1 contact-details capture.
  const membersProfileUpdated = cohortPool.filter(
    (m) =>
      hasBeneficiary(m) || Boolean(m.residentialAddress && m.residentialAddress.trim()),
  ).length;

  // ── Monthly goal vs received ──────────────────────────────────
  // Target period: pre-launch (SAST < 2026-06) anchors to the launch
  // month so the bar shows what's coming. Post-launch follows the
  // current SAST period.
  const sastPeriodNow = now.toLocaleDateString("en-CA", {
    timeZone: "Africa/Johannesburg",
  }).slice(0, 7);
  const monthlyGoalPeriod =
    sastPeriodNow < LEHUMO_FIRST_DUE_PERIOD
      ? LEHUMO_FIRST_DUE_PERIOD
      : sastPeriodNow;

  // Human label: "June 2026", "July 2026" etc. Built from the period
  // directly rather than re-deriving from now() so the label stays
  // accurate across pre/post-launch transitions.
  const [goalYear, goalMonthNum] = monthlyGoalPeriod.split("-");
  const goalMonthIdx = Number(goalMonthNum) - 1;
  const monthlyGoalLabel = `${
    new Date(2000, goalMonthIdx, 1).toLocaleString("en-ZA", { month: "long" })
  } ${goalYear}`;

  // Goal = onboarded members × R1,000. Uses R1,000 base (not the
  // per-plan amount including service fees) since the fee covers
  // processor cost, not pool capital. Pool growth tracks principal.
  const monthlyGoalAmount = membersOnboarded * MONTHLY_CONTRIBUTION_ZAR;

  // Received = count of Paid rows for the target period × R1,000.
  //
  // We deliberately count rows rather than summing `amountReceived`.
  // For Standard/VIP subscribers, Paystack debits the gross amount
  // (R1,035 / R1,050) which includes the service fee that covers
  // the processor's collection cost — that fee is NOT pool capital
  // (Paystack absorbs it on their side), so summing the gross would
  // overstate the pool. EFT contributors transfer the net R1,000
  // directly. By treating every Paid row as a R1,000 pool deposit
  // we get a consistent, accurate "net to pool" figure regardless
  // of which rail the contribution came through.
  let monthlyReceivedAmount = 0;
  let recentMonths: PoolRecentMonth[] = [];
  let leaderboard: ReturnType<typeof computeLeaderboard> | null = null;
  try {
    const periodPaidRows = await listPaidContributions();
    monthlyReceivedAmount =
      periodPaidRows.filter((c) => c.period === monthlyGoalPeriod).length *
      MONTHLY_CONTRIBUTION_ZAR;

    // Rolling recent-months series: the goal period + up to two prior,
    // clamped to launch. Same paid-row source as monthlyReceivedAmount so
    // every month stays consistent with the current bar and the pool.
    const periods: string[] = [];
    let ry = Number(goalYear);
    let rm = Number(goalMonthNum);
    for (let i = 0; i < 3; i += 1) {
      const p = `${ry}-${String(rm).padStart(2, "0")}`;
      if (p < LEHUMO_FIRST_DUE_PERIOD) break;
      periods.unshift(p);
      rm -= 1;
      if (rm < 1) {
        rm = 12;
        ry -= 1;
      }
    }
    recentMonths = periods.map((period) => {
      const [py, pm] = period.split("-");
      const label = `${new Date(2000, Number(pm) - 1, 1).toLocaleString("en-ZA", {
        month: "long",
      })} ${py}`;
      const received =
        periodPaidRows.filter((c) => c.period === period).length *
        MONTHLY_CONTRIBUTION_ZAR;
      return { period, label, received, goal: monthlyGoalAmount };
    });

    // Anonymised who-paid-first board for the same goal period —
    // derived from the identical Paid-rows read so the board, the goal
    // bar and the pool total always agree.
    leaderboard = computeLeaderboard(periodPaidRows, monthlyGoalPeriod);
  } catch {
    // Same fallback as the cohort hydration above — the rest of the
    // dashboard renders fine even if this fetch hiccups.
    monthlyReceivedAmount = 0;
    recentMonths = [];
    leaderboard = null;
  }

  return {
    totalFoundingSlots: FOUNDING_SLOTS,
    activeMembers,
    membersContributedEver,
    membersContributingThisMonth,
    totalContributed,
    totalInterest,
    totalPool: totalContributed + totalInterest,
    currentMonth,
    timeline,
    membersOnboarded,
    membersProfileUpdated,
    monthlyGoalPeriod,
    monthlyGoalLabel,
    monthlyGoalAmount,
    monthlyReceivedAmount,
    recentMonths,
    leaderboard,
  };
}
