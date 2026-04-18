import "server-only";

import {
  AIRTABLE_FIELDS,
  MONTH_FIELDS,
  MONTH_NAMES,
  STATUS_CHOICE_ID_TO_NAME,
  KYC_CHOICE_ID_TO_NAME,
  SOURCE_CHOICE_ID_TO_NAME,
  type LehumoMember,
  type MemberStatus,
  type KycStatus,
  type CommunityPoolStats,
  type PoolMonthPoint,
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
}): Promise<LehumoMember> {
  // returnFieldsByFieldId on the URL ensures the response is keyed by
  // field ID (matching parseRecord), and also tells Airtable the request
  // body uses field IDs as keys rather than display names.
  const url = `${getBaseUrl()}?returnFieldsByFieldId=true`;

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

  const body = { fields: airtableFields };

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
  // Field IDs on input + output — see createMember comment above.
  const url = `${getBaseUrl()}/${recordId}?returnFieldsByFieldId=true`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ fields }),
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
