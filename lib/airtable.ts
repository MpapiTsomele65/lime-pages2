import "server-only";

import {
  AIRTABLE_FIELDS,
  MONTH_FIELDS,
  MONTH_NAMES,
  STATUS_CHOICE_ID_TO_NAME,
  KYC_CHOICE_ID_TO_NAME,
  SOURCE_CHOICE_ID_TO_NAME,
  ID_TYPE_CHOICE_ID_TO_NAME,
  RELATIONSHIP_CHOICE_ID_TO_NAME,
  LOAN_TYPE_CHOICE_ID_TO_NAME,
  idTypeToAirtable,
  todayDate,
  type LehumoMember,
  type MemberStatus,
  type KycStatus,
  type CommunityPoolStats,
  type PoolMonthPoint,
  type AirtableAttachment,
  type BeneficiaryRelationship,
  type ActiveLoanType,
} from "./definitions";

// ─── Config ─────────────────────────────────────────────────────────
function getBaseUrl() {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableId = process.env.AIRTABLE_TABLE_ID;
  if (!baseId || !tableId) throw new Error("Airtable env vars not set");
  return `https://api.airtable.com/v0/${baseId}/${tableId}`;
}

function getHeaders() {
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
function resolveSelect(
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
function parseRecord(record: any): LehumoMember {
  const f = record.fields;
  const contributions: Record<string, boolean> = {};
  for (const month of MONTH_NAMES) {
    contributions[month] = f[MONTH_FIELDS[month]] === true;
  }

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
  const formula = encodeURIComponent(`{Email}='${safe}'`);
  const url = `${getBaseUrl()}?filterByFormula=${formula}&maxRecords=1&returnFieldsByFieldId=true`;

  const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Airtable findByEmail error: ${res.status} — ${body}`);
  }

  const data = await res.json();
  if (!data.records || data.records.length === 0) return null;
  return parseRecord(data.records[0]);
}

export async function findMemberByEmailAndNumber(
  email: string,
  memberNumber: number,
): Promise<LehumoMember | null> {
  const safe = normaliseEmail(email);
  const formula = encodeURIComponent(
    `AND({Email}='${safe}', {Member #}=${memberNumber})`,
  );
  const url = `${getBaseUrl()}?filterByFormula=${formula}&maxRecords=1&returnFieldsByFieldId=true`;

  const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Airtable findByEmailAndNumber error: ${res.status} — ${body}`);
  }

  const data = await res.json();
  if (!data.records || data.records.length === 0) return null;
  return parseRecord(data.records[0]);
}

export async function getMemberById(
  recordId: string,
): Promise<LehumoMember | null> {
  const url = `${getBaseUrl()}/${recordId}?returnFieldsByFieldId=true`;
  const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Airtable error: ${res.status}`);
  }

  const record = await res.json();
  return parseRecord(record);
}

export async function getNextMemberNumber(): Promise<number> {
  const url = `${getBaseUrl()}?fields%5B%5D=${AIRTABLE_FIELDS.memberNumber}&sort%5B0%5D%5Bfield%5D=Member+%23&sort%5B0%5D%5Bdirection%5D=desc&maxRecords=1&returnFieldsByFieldId=true`;

  const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error(`Airtable error: ${res.status}`);

  const data = await res.json();
  if (!data.records || data.records.length === 0) return 1;

  const maxNum = data.records[0].fields[AIRTABLE_FIELDS.memberNumber] || 0;
  return maxNum + 1;
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

export async function checkMonthPayment(
  recordId: string,
  month: string,
): Promise<void> {
  const fieldId = MONTH_FIELDS[month];
  if (!fieldId) throw new Error(`Invalid month: ${month}`);

  await updateMember(recordId, { [fieldId]: true });
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
  // LehumoMember (including all the other KYC bits).
  const refreshed = await getMemberById(recordId);
  if (!refreshed) {
    throw new Error("Member disappeared after attachment upload");
  }
  return refreshed;
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

  const now = new Date();
  const currentMonthIndex = now.getMonth();
  const currentMonth = MONTH_NAMES[currentMonthIndex];

  const { total: totalInterest, monthly: monthlyInterest } =
    loadInterestConfig(currentMonthIndex);

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
  };
}
