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
} from "./definitions";

// ─── Config (duplicated from lib/airtable.ts to keep this file standalone) ──

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

function resolveSelect(
  value: unknown,
  choiceMap: Record<string, string>,
  fallback: string,
): string {
  if (value == null) return fallback;
  if (typeof value === "string") {
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

// ─── Admin API Methods ─────────────────────────────────────────────

/**
 * Fetch EVERY member in the Lehumo table, handling Airtable pagination.
 * Sorted by member number ascending so the admin table renders in the
 * same order every time.
 */
export async function listAllMembers(): Promise<LehumoMember[]> {
  const baseUrl = getBaseUrl();
  const headers = getHeaders();

  const out: LehumoMember[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({
      pageSize: "100",
      returnFieldsByFieldId: "true",
    });
    if (offset) params.set("offset", offset);

    const res = await fetch(`${baseUrl}?${params.toString()}`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Airtable list error: ${res.status} — ${await res.text()}`);
    }

    const data = await res.json();
    for (const record of data.records ?? []) {
      out.push(parseRecord(record));
    }
    offset = data.offset;
  } while (offset);

  out.sort((a, b) => a.memberNumber - b.memberNumber);
  return out;
}

/**
 * Generic PATCH for one member record. Admin-only callers pass raw
 * Airtable field IDs as keys — use AIRTABLE_FIELDS / MONTH_FIELDS.
 */
export async function adminUpdateMember(
  recordId: string,
  fields: Record<string, unknown>,
): Promise<LehumoMember> {
  const url = `${getBaseUrl()}/${recordId}?returnFieldsByFieldId=true`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    throw new Error(`Airtable update error: ${res.status} — ${await res.text()}`);
  }

  return parseRecord(await res.json());
}

/**
 * Toggle a single month's contribution checkbox for one member.
 * `paid: true` marks the month paid, `false` un-marks it.
 */
export async function setMonthPayment(
  recordId: string,
  month: string,
  paid: boolean,
): Promise<LehumoMember> {
  const fieldId = MONTH_FIELDS[month];
  if (!fieldId) throw new Error(`Invalid month: ${month}`);
  return adminUpdateMember(recordId, { [fieldId]: paid });
}
