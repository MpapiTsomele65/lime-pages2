import "server-only";

import {
  AIRTABLE_FIELDS,
  CONTRIBUTION_SOURCE,
  CONTRIBUTION_STATUS,
  MONTH_NAMES,
  STATUS_CHOICE_ID_TO_NAME,
  KYC_CHOICE_ID_TO_NAME,
  SOURCE_CHOICE_ID_TO_NAME,
  ID_TYPE_CHOICE_ID_TO_NAME,
  buildContributionKey,
  formatMemberNumber,
  parseContributionPeriod,
  type AirtableAttachment,
  type LehumoMember,
  type MemberStatus,
  type KycStatus,
} from "./definitions";
import {
  getContributionByKey,
  listAllContributions,
  listContributionsForMember,
  markPeriodPaidForMember,
  updateContribution,
} from "./contributions";
import {
  getSastYear,
  groupContributionsByMemberPrefix,
  projectToLegacyContributions,
} from "./member-contributions-view";

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
  // Phase 5: contributions are sourced exclusively from the
  // Contributions linked table — `listAllMembers` overwrites this empty
  // map with a SAST-year projection of `contributionRows` after
  // `parseRecord` returns. The legacy MONTH_FIELDS boolean columns on
  // the Members table are no longer read from.
  const contributions: Record<string, boolean> = {};

  // Mirror the optional-shape coercion done in lib/airtable.ts so the
  // admin reads expose the same `LehumoMember` contract — admin UI can
  // safely render attachments without TS gymnastics.
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
    // ── KYC fields (Tier 2A) — admin needs to read attachments + dates ──
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
    // ── DIAGNOSTIC ──
    // On the FIRST page only, find the most-populated member record
    // and dump every field key + first ~50 chars of each value. The
    // previous version sampled records[0] which landed on a sparse
    // prospect with no beneficiary data — useless for diagnosing
    // field-ID drift. The "richest" member (most populated keys) is
    // far more likely to be Mpapi / Londani — both fully onboarded
    // with KYC + beneficiary on file.
    if (!offset && (data.records?.length ?? 0) > 0) {
      const records = data.records as Array<{
        id: string;
        fields: Record<string, unknown>;
      }>;
      const richest = records.reduce((best, r) =>
        Object.keys(r.fields ?? {}).length >
        Object.keys(best.fields ?? {}).length
          ? r
          : best,
      );
      console.log(
        `[listAllMembers] richest member ${richest.id} has ${Object.keys(richest.fields ?? {}).length} fields populated`,
      );
      console.log(
        `[listAllMembers] richest member field IDs: ${JSON.stringify(
          Object.keys(richest.fields ?? {}),
        )}`,
      );
      console.log(
        `[listAllMembers] richest member field values: ${Object.entries(
          richest.fields ?? {},
        )
          .map(([k, v]) => {
            const s = typeof v === "string" ? v : JSON.stringify(v);
            return `${k}=${s.length > 50 ? `${s.slice(0, 50)}…` : s}`;
          })
          .join(" | ")}`,
      );
    }
    offset = data.offset;
  } while (offset);

  out.sort((a, b) => a.memberNumber - b.memberNumber);

  // ── DIAGNOSTIC ─────────────────────────────────────────────
  // Beneficiary count tracker — investigating a report that
  // beneficiary data isn't surfacing in the admin dashboard. Logs
  // once per page load so we can confirm whether the data is
  // present in the parsed records (Airtable returned it) or absent
  // (data isn't actually in Airtable). Drop this log once the
  // root cause is identified.
  const totalMembers = out.length;
  const withBeneficiary = out.filter(
    (m) =>
      Boolean(m.beneficiaryFirstName?.trim()) &&
      Boolean(m.beneficiarySurname?.trim()),
  ).length;
  const sampleNamed = out.find(
    (m) => m.beneficiaryFirstName || m.beneficiarySurname,
  );
  console.log(
    `[listAllMembers] beneficiary diag: ${withBeneficiary}/${totalMembers} on file. ` +
      `sample: ${
        sampleNamed
          ? `member#${sampleNamed.memberNumber} firstName=${JSON.stringify(sampleNamed.beneficiaryFirstName)} surname=${JSON.stringify(sampleNamed.beneficiarySurname)}`
          : "(none populated)"
      }`,
  );

  // ── Bulk hydration from the Contributions table ──
  // One full-table read for ~1,500 rows beats ~25 per-member fetches
  // against Airtable's 5 req/sec rate limit. Phase 5: this is the
  // only contribution data path — parseRecord no longer populates
  // `contributions` from MONTH_FIELDS, so a hydration failure means
  // members render with empty history (logged for ops triage).
  try {
    const allContribs = await listAllContributions();
    const byPrefix = groupContributionsByMemberPrefix(allContribs);
    const year = getSastYear();
    for (const m of out) {
      const rows = byPrefix.get(formatMemberNumber(m.memberNumber)) ?? [];
      m.contributions = projectToLegacyContributions(rows, year);
      m.contributionRows = rows;
    }
  } catch (err) {
    console.error("listAllMembers bulk hydration failed:", err);
  }

  return out;
}

/**
 * Generic PATCH for one member record. Admin-only callers pass raw
 * Airtable field IDs as keys — use AIRTABLE_FIELDS.
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
 * Read one member by Airtable record ID — admin path.
 *
 * Mirrors `getMemberById` in lib/airtable.ts but lives here so admin
 * actions don't need to cross the airtable / airtable-admin module
 * boundary. Includes the same Phase 3 hydration: the projected
 * `contributions` shape and `contributionRows` are both populated
 * from the Contributions linked table.
 */
async function getMemberByIdAdmin(
  recordId: string,
): Promise<LehumoMember | null> {
  const url = `${getBaseUrl()}/${recordId}?returnFieldsByFieldId=true`;
  const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Airtable error: ${res.status}`);
  }
  const member = parseRecord(await res.json());

  // Hydrate THIS member's contributions only — `listContributionsForMember`
  // filters server-side by the contribution-key prefix so we read 60
  // rows in a single page instead of paginating the full 1,500-row
  // table just to discard 24 members worth.
  try {
    const rows = await listContributionsForMember(member.memberNumber);
    member.contributions = projectToLegacyContributions(rows, getSastYear());
    member.contributionRows = rows;
  } catch (err) {
    console.error(
      `getMemberByIdAdmin contributions hydration failed for ${recordId}:`,
      err,
    );
  }

  return member;
}

/**
 * Toggle a single month's contribution status for one member.
 * `paid: true` marks the month Paid, `false` demotes it back to
 * Pending (preserving payment metadata as audit trail of "marked then
 * reversed").
 *
 * Phase 5: writes go exclusively to the Contributions linked table.
 * The legacy MONTH_FIELDS column write was removed once dual-write was
 * no longer needed.
 *
 * Year resolution: admin ticks come from the year-agnostic month label
 * ("Jun") so we resolve `{currentSastYear}-{monthOfYear}` for the
 * Contributions row. If the admin needs to retroactively mark Jun 2027
 * paid while sitting in 2026 (or vice versa), they should reconcile
 * through the period-aware admin view rather than this toggle.
 */
export async function setMonthPayment(
  recordId: string,
  month: string,
  paid: boolean,
): Promise<LehumoMember> {
  const monthIdx = MONTH_NAMES.indexOf(month);
  if (monthIdx < 0) throw new Error(`Invalid month: ${month}`);

  const period = parseContributionPeriod(
    `${getSastYear()}-${String(monthIdx + 1).padStart(2, "0")}`,
  );
  if (!period) throw new Error(`Invalid period for month ${month}`);

  const member = await getMemberByIdAdmin(recordId);
  if (!member) throw new Error(`member ${recordId} not found`);

  if (paid) {
    await markPeriodPaidForMember({
      memberId: member.id,
      memberNumber: member.memberNumber,
      period,
      amountReceived: 1000,
      source: CONTRIBUTION_SOURCE.adjustment,
      paymentReference: "",
      notes: "Admin-marked paid via month toggle",
    });
  } else {
    const key = buildContributionKey(member.memberNumber, period);
    const row = await getContributionByKey(key);
    if (row && row.status === CONTRIBUTION_STATUS.paid) {
      await updateContribution(row.id, {
        status: CONTRIBUTION_STATUS.pending,
        notes: "Admin-untick via month toggle",
      });
    }
  }

  // Re-fetch so the returned member reflects the row-write update via
  // the projection. The row write doesn't touch the Members record
  // itself, so the pre-write `member` variable is stale w.r.t.
  // `contributions` / `contributionRows`.
  const updated = await getMemberByIdAdmin(recordId);
  if (!updated) throw new Error(`member ${recordId} disappeared after write`);
  return updated;
}
