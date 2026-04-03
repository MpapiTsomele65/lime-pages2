import "server-only";

import {
  AIRTABLE_FIELDS,
  MONTH_FIELDS,
  MONTH_NAMES,
  type LehumoMember,
  type MemberStatus,
  type KycStatus,
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
    status: (f[AIRTABLE_FIELDS.status]?.name || "Prospect") as MemberStatus,
    kycStatus: (f[AIRTABLE_FIELDS.kycStatus]?.name || "Not Started") as KycStatus,
    source: f[AIRTABLE_FIELDS.source]?.name || "",
    notes: f[AIRTABLE_FIELDS.notes] || "",
    contributions,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── API Methods ────────────────────────────────────────────────────

export async function findMemberByEmail(
  email: string,
): Promise<LehumoMember | null> {
  const formula = encodeURIComponent(`{Email}='${email}'`);
  const url = `${getBaseUrl()}?filterByFormula=${formula}&maxRecords=1`;

  const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error(`Airtable error: ${res.status}`);

  const data = await res.json();
  if (!data.records || data.records.length === 0) return null;
  return parseRecord(data.records[0]);
}

export async function findMemberByEmailAndNumber(
  email: string,
  memberNumber: number,
): Promise<LehumoMember | null> {
  const formula = encodeURIComponent(
    `AND({Email}='${email}', {Member #}=${memberNumber})`,
  );
  const url = `${getBaseUrl()}?filterByFormula=${formula}&maxRecords=1`;

  const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error(`Airtable error: ${res.status}`);

  const data = await res.json();
  if (!data.records || data.records.length === 0) return null;
  return parseRecord(data.records[0]);
}

export async function getMemberById(
  recordId: string,
): Promise<LehumoMember | null> {
  const url = `${getBaseUrl()}/${recordId}`;
  const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Airtable error: ${res.status}`);
  }

  const record = await res.json();
  return parseRecord(record);
}

export async function getNextMemberNumber(): Promise<number> {
  const url = `${getBaseUrl()}?fields%5B%5D=${AIRTABLE_FIELDS.memberNumber}&sort%5B0%5D%5Bfield%5D=Member+%23&sort%5B0%5D%5Bdirection%5D=desc&maxRecords=1`;

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
}): Promise<LehumoMember> {
  const url = getBaseUrl();

  const body = {
    fields: {
      [AIRTABLE_FIELDS.fullName]: fields.fullName,
      [AIRTABLE_FIELDS.email]: fields.email,
      [AIRTABLE_FIELDS.phone]: fields.phone,
      [AIRTABLE_FIELDS.source]: fields.source,
      [AIRTABLE_FIELDS.memberNumber]: fields.memberNumber,
      [AIRTABLE_FIELDS.status]: "Onboarding",
      [AIRTABLE_FIELDS.kycStatus]: "Docs Requested",
    },
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
  const url = `${getBaseUrl()}/${recordId}`;

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
