import "server-only";

import {
  CONTRIBUTIONS_TABLE_ID,
  CONTRIBUTION_FIELDS,
  CONTRIBUTION_STATUS,
  CONTRIBUTION_STATUS_CHOICE_ID_TO_NAME,
  CONTRIBUTION_SOURCE_CHOICE_ID_TO_NAME,
  CONTRIBUTION_PLAN_CHOICE_ID_TO_NAME,
  buildContributionKey,
  formatMemberNumber,
  generateContributionPeriods,
  parseContributionPeriod,
  type ContributionPlan,
  type ContributionSource,
  type ContributionStatus,
  type LehumoContribution,
} from "./definitions";

/**
 * Airtable client for the Contributions linked table.
 *
 * One row per (member, period) pair. The contribution key
 * (`{Leh##}-{YYYY-MM}`, e.g. `Leh24-2026-06`) is the application-enforced
 * unique index — every read/write helper here assumes it. See
 * lib/definitions.ts for the schema and field-ID constants.
 *
 * Why a separate module from lib/airtable.ts:
 *   - Different table ID (CONTRIBUTIONS_TABLE_ID, not AIRTABLE_TABLE_ID).
 *   - Different shape (parseContribution returns LehumoContribution).
 *   - Keeps the Members helper layer focused on members; contribution-
 *     specific logic (reconciliation, schedule generation, batch
 *     inserts) doesn't bleed into it.
 *
 * All functions are server-only. Importing from a client component
 * fails at build time with a clear error.
 */

// ─── Config ─────────────────────────────────────────────────────────
function getBaseId(): string {
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!baseId) throw new Error("AIRTABLE_BASE_ID is not set");
  return baseId;
}

function getContribUrl(recordId?: string): string {
  const tail = recordId ? `/${recordId}` : "";
  return `https://api.airtable.com/v0/${getBaseId()}/${CONTRIBUTIONS_TABLE_ID}${tail}`;
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
 * Resolve a singleSelect cell to its display name. Handles all three
 * shapes Airtable returns (choice ID, raw name, `{id, name}` object).
 * Mirrors the helper in lib/airtable.ts — kept local to avoid a
 * circular import dependency.
 */
function resolveSelect<T extends string>(
  value: unknown,
  choiceMap: Record<string, string>,
  fallback: T | null,
): T | null {
  if (value == null) return fallback;
  if (typeof value === "string") {
    return (choiceMap[value] ?? value) as T;
  }
  if (typeof value === "object" && "name" in (value as object)) {
    return String((value as { name: unknown }).name ?? "") as T;
  }
  return fallback;
}

/**
 * Escape a string for safe interpolation inside an Airtable
 * `filterByFormula` string literal. Single quotes get backslash-escaped;
 * we never accept user input directly so this is belt-and-braces.
 */
function escapeFormulaString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Convert an Airtable record into the app's LehumoContribution shape.
 *
 * The `Member` field comes back as an array of linked record IDs even
 * though we only ever store one per row. We take `[0]` and surface it
 * as `memberId: string`.
 */
function parseContribution(record: any): LehumoContribution {
  const f = record.fields ?? {};

  const memberLinks = f[CONTRIBUTION_FIELDS.member] as string[] | undefined;
  const memberId = Array.isArray(memberLinks) ? (memberLinks[0] ?? "") : "";

  const status =
    resolveSelect<ContributionStatus>(
      f[CONTRIBUTION_FIELDS.status],
      CONTRIBUTION_STATUS_CHOICE_ID_TO_NAME,
      "Pending",
    ) ?? "Pending";

  const source = resolveSelect<ContributionSource>(
    f[CONTRIBUTION_FIELDS.source],
    CONTRIBUTION_SOURCE_CHOICE_ID_TO_NAME,
    null,
  );

  const plan = resolveSelect<ContributionPlan>(
    f[CONTRIBUTION_FIELDS.plan],
    CONTRIBUTION_PLAN_CHOICE_ID_TO_NAME,
    null,
  );

  const amountExpectedRaw = f[CONTRIBUTION_FIELDS.amountExpected];
  const amountReceivedRaw = f[CONTRIBUTION_FIELDS.amountReceived];

  return {
    id: record.id,
    contributionKey: f[CONTRIBUTION_FIELDS.contributionKey] ?? "",
    memberId,
    period: f[CONTRIBUTION_FIELDS.period] ?? "",
    status,
    amountExpected:
      typeof amountExpectedRaw === "number" ? amountExpectedRaw : null,
    amountReceived:
      typeof amountReceivedRaw === "number" ? amountReceivedRaw : null,
    source,
    paymentReference: f[CONTRIBUTION_FIELDS.paymentReference] ?? "",
    paymentDate: f[CONTRIBUTION_FIELDS.paymentDate] ?? null,
    plan,
    reconciled: f[CONTRIBUTION_FIELDS.reconciled] === true,
    reconciledBy: f[CONTRIBUTION_FIELDS.reconciledBy] ?? "",
    reconciledAt: f[CONTRIBUTION_FIELDS.reconciledAt] ?? null,
    notes: f[CONTRIBUTION_FIELDS.notes] ?? "",
    createdAt: f[CONTRIBUTION_FIELDS.createdAt] ?? null,
    updatedAt: f[CONTRIBUTION_FIELDS.updatedAt] ?? null,
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */

/** SAST (Africa/Johannesburg) ISO 8601 datetime — drop into `updatedAt`,
 *  `createdAt`, or `reconciledAt`. Includes the `+02:00` offset. */
function nowSastIso(): string {
  const now = new Date();
  // Build YYYY-MM-DDTHH:mm:ss+02:00 from SAST-formatted parts. The
  // toLocaleString tricks for offsetting are fragile, so we add the 2h
  // offset directly to the UTC ms and then format from a Date built off
  // that ms — the resulting calendar fields are SAST.
  const sastMs = now.getTime() + 2 * 60 * 60 * 1000;
  const d = new Date(sastMs);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}+02:00`
  );
}

// ─── Reads ──────────────────────────────────────────────────────────

/** Fetch a single contribution by Airtable record ID. Returns null for 404. */
export async function getContributionById(
  recordId: string,
): Promise<LehumoContribution | null> {
  const url = `${getContribUrl(recordId)}?returnFieldsByFieldId=true`;
  const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });

  if (!res.ok) {
    if (res.status === 404) return null;
    const body = await res.text().catch(() => "");
    throw new Error(`Airtable getContributionById error: ${res.status} — ${body}`);
  }

  return parseContribution(await res.json());
}

/**
 * Fetch a contribution by its composite key, e.g. `Leh24-2026-06`.
 *
 * Use this before inserting to enforce the (member, period) uniqueness
 * invariant — Airtable doesn't enforce it natively.
 */
export async function getContributionByKey(
  contributionKey: string,
): Promise<LehumoContribution | null> {
  const safe = escapeFormulaString(contributionKey);
  const formula = encodeURIComponent(`{Contribution Key}='${safe}'`);
  const url = `${getContribUrl()}?filterByFormula=${formula}&maxRecords=1&returnFieldsByFieldId=true`;

  const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Airtable getContributionByKey error: ${res.status} — ${body}`);
  }

  const data = await res.json();
  if (!data.records || data.records.length === 0) return null;
  return parseContribution(data.records[0]);
}

/**
 * List all contributions for a member, sorted by period ascending.
 *
 * Filters by the contribution-key prefix (`Leh##-`) since the linked
 * Member field is awkward to filter on via formula. Cheap because the
 * prefix is the leading slice of the primary field.
 */
export async function listContributionsForMember(
  memberNumber: number,
): Promise<LehumoContribution[]> {
  const prefix = `${formatMemberNumber(memberNumber)}-`;
  const safe = escapeFormulaString(prefix);
  // FIND returns 0 when not found; we want rows where the prefix is at
  // position 1 (Airtable strings are 1-indexed).
  const formula = encodeURIComponent(`FIND('${safe}', {Contribution Key})=1`);
  const url =
    `${getContribUrl()}?filterByFormula=${formula}` +
    `&sort%5B0%5D%5Bfield%5D=Period&sort%5B0%5D%5Bdirection%5D=asc` +
    `&pageSize=100&returnFieldsByFieldId=true`;

  return fetchAllPages(url);
}

/**
 * List ALL contributions across the table — one paginated read.
 *
 * Use for the bulk admin path (member list with progress, community
 * pool stats) where N+1 per-member fetches would blow Airtable's
 * 5 req/sec rate limit. With 25 members × 60 periods, the table is
 * ~1,500 rows — comfortably within Airtable's 100-rows-per-page limit
 * over 15 round trips.
 *
 * The per-member view should still use `listContributionsForMember`
 * for cache-friendliness and clarity.
 */
export async function listAllContributions(): Promise<LehumoContribution[]> {
  const url =
    `${getContribUrl()}?` +
    `sort%5B0%5D%5Bfield%5D=Contribution+Key&sort%5B0%5D%5Bdirection%5D=asc` +
    `&pageSize=100&returnFieldsByFieldId=true`;
  return fetchAllPages(url);
}

/**
 * List all contributions for a given period (e.g. all `2026-06` rows).
 * Powers the admin reconciliation view — one period at a time keeps the
 * page-size manageable for 90+ members.
 */
export async function listContributionsForPeriod(
  period: string,
): Promise<LehumoContribution[]> {
  const cleaned = parseContributionPeriod(period);
  if (!cleaned) {
    throw new Error(`Invalid period — expected YYYY-MM, got "${period}"`);
  }
  const safe = escapeFormulaString(cleaned);
  const formula = encodeURIComponent(`{Period}='${safe}'`);
  const url =
    `${getContribUrl()}?filterByFormula=${formula}` +
    `&sort%5B0%5D%5Bfield%5D=Contribution+Key&sort%5B0%5D%5Bdirection%5D=asc` +
    `&pageSize=100&returnFieldsByFieldId=true`;

  return fetchAllPages(url);
}

/**
 * Generic paginator. Airtable returns up to 100 records per page and
 * gives an `offset` cursor for the next page. Rolls until exhausted.
 */
async function fetchAllPages(initialUrl: string): Promise<LehumoContribution[]> {
  const out: LehumoContribution[] = [];
  const sep = initialUrl.includes("?") ? "&" : "?";
  let nextUrl: string | undefined = initialUrl;

  while (nextUrl !== undefined) {
    const res: Response = await fetch(nextUrl, {
      headers: getHeaders(),
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Airtable list error: ${res.status} — ${body}`);
    }

    const data = await res.json();
    for (const r of data.records ?? []) {
      out.push(parseContribution(r));
    }

    nextUrl = data.offset
      ? `${initialUrl}${sep}offset=${encodeURIComponent(data.offset)}`
      : undefined;
  }

  return out;
}

// ─── Writes ─────────────────────────────────────────────────────────

export interface CreateContributionInput {
  memberId: string;
  memberNumber: number;
  period: string;
  /** Default R1,000 (the Standard plan amount) if omitted. Pass an
   *  explicit value for Premium / Custom rows. */
  amountExpected?: number;
  /** Defaults to "Pending" — the right shape for schedule generation.
   *  Pass "Paid" only when creating a row for an already-completed
   *  payment (rare; usually you create Pending then transition). */
  status?: ContributionStatus;
  plan?: ContributionPlan;
  notes?: string;
}

/**
 * Insert a single contribution row.
 *
 * Idempotent against duplicate keys: throws a clear error if a row
 * already exists for `(memberNumber, period)` rather than letting
 * Airtable accept a duplicate. Use `upsertContribution` if you want
 * insert-or-update semantics.
 */
export async function createContribution(
  input: CreateContributionInput,
): Promise<LehumoContribution> {
  const period = parseContributionPeriod(input.period);
  if (!period) {
    throw new Error(`Invalid period — expected YYYY-MM, got "${input.period}"`);
  }
  const key = buildContributionKey(input.memberNumber, period);

  const existing = await getContributionByKey(key);
  if (existing) {
    throw new Error(
      `Contribution ${key} already exists (id=${existing.id}). ` +
        `Use upsertContribution if you intended to update.`,
    );
  }

  const now = nowSastIso();
  const fields: Record<string, unknown> = {
    [CONTRIBUTION_FIELDS.contributionKey]: key,
    [CONTRIBUTION_FIELDS.member]: [input.memberId],
    [CONTRIBUTION_FIELDS.period]: period,
    [CONTRIBUTION_FIELDS.status]: input.status ?? CONTRIBUTION_STATUS.pending,
    [CONTRIBUTION_FIELDS.amountExpected]: input.amountExpected ?? 1000,
    [CONTRIBUTION_FIELDS.createdAt]: now,
    [CONTRIBUTION_FIELDS.updatedAt]: now,
  };
  if (input.plan) fields[CONTRIBUTION_FIELDS.plan] = input.plan;
  if (input.notes) fields[CONTRIBUTION_FIELDS.notes] = input.notes;

  const res = await fetch(getContribUrl(), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ fields, returnFieldsByFieldId: true }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Airtable createContribution error: ${res.status} — ${body}`);
  }

  return parseContribution(await res.json());
}

/**
 * Bulk-insert contribution rows. Airtable caps at 10 records per request
 * — this helper chunks the input transparently so callers can pass the
 * full 60-period schedule in one call.
 *
 * Does NOT pre-check for duplicates (a single dup would force 60 round
 * trips). The caller is expected to be inserting fresh schedules — use
 * `generateMemberSchedule` which wraps this with the right invariants.
 */
export async function createContributionsBatch(
  inputs: CreateContributionInput[],
): Promise<LehumoContribution[]> {
  if (inputs.length === 0) return [];

  const now = nowSastIso();
  const records = inputs.map((input) => {
    const period = parseContributionPeriod(input.period);
    if (!period) {
      throw new Error(
        `Invalid period in batch — expected YYYY-MM, got "${input.period}"`,
      );
    }
    const fields: Record<string, unknown> = {
      [CONTRIBUTION_FIELDS.contributionKey]: buildContributionKey(
        input.memberNumber,
        period,
      ),
      [CONTRIBUTION_FIELDS.member]: [input.memberId],
      [CONTRIBUTION_FIELDS.period]: period,
      [CONTRIBUTION_FIELDS.status]:
        input.status ?? CONTRIBUTION_STATUS.pending,
      [CONTRIBUTION_FIELDS.amountExpected]: input.amountExpected ?? 1000,
      [CONTRIBUTION_FIELDS.createdAt]: now,
      [CONTRIBUTION_FIELDS.updatedAt]: now,
    };
    if (input.plan) fields[CONTRIBUTION_FIELDS.plan] = input.plan;
    if (input.notes) fields[CONTRIBUTION_FIELDS.notes] = input.notes;
    return { fields };
  });

  const out: LehumoContribution[] = [];
  for (let i = 0; i < records.length; i += 10) {
    const chunk = records.slice(i, i + 10);
    const res = await fetch(getContribUrl(), {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        records: chunk,
        returnFieldsByFieldId: true,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `Airtable createContributionsBatch error: ${res.status} — ${body} (chunk ${i / 10})`,
      );
    }

    const data = await res.json();
    for (const r of data.records ?? []) {
      out.push(parseContribution(r));
    }
  }

  return out;
}

/**
 * Generic update. Pass any subset of contribution fields keyed by
 * field NAME (not field ID — caller-friendly) and we map to IDs before
 * the PATCH. Always bumps `updatedAt`.
 *
 * For state transitions prefer the convenience helpers
 * (`markContributionPaid`, `reconcileContribution`) which encode the
 * domain rules.
 */
export async function updateContribution(
  recordId: string,
  patch: Partial<{
    status: ContributionStatus;
    amountExpected: number;
    amountReceived: number;
    source: ContributionSource;
    paymentReference: string;
    /** YYYY-MM-DD */
    paymentDate: string;
    plan: ContributionPlan;
    reconciled: boolean;
    reconciledBy: string;
    /** ISO 8601 with timezone */
    reconciledAt: string;
    notes: string;
  }>,
): Promise<LehumoContribution> {
  const fields: Record<string, unknown> = {
    [CONTRIBUTION_FIELDS.updatedAt]: nowSastIso(),
  };
  if (patch.status !== undefined) fields[CONTRIBUTION_FIELDS.status] = patch.status;
  if (patch.amountExpected !== undefined)
    fields[CONTRIBUTION_FIELDS.amountExpected] = patch.amountExpected;
  if (patch.amountReceived !== undefined)
    fields[CONTRIBUTION_FIELDS.amountReceived] = patch.amountReceived;
  if (patch.source !== undefined) fields[CONTRIBUTION_FIELDS.source] = patch.source;
  if (patch.paymentReference !== undefined)
    fields[CONTRIBUTION_FIELDS.paymentReference] = patch.paymentReference;
  if (patch.paymentDate !== undefined)
    fields[CONTRIBUTION_FIELDS.paymentDate] = patch.paymentDate;
  if (patch.plan !== undefined) fields[CONTRIBUTION_FIELDS.plan] = patch.plan;
  if (patch.reconciled !== undefined)
    fields[CONTRIBUTION_FIELDS.reconciled] = patch.reconciled;
  if (patch.reconciledBy !== undefined)
    fields[CONTRIBUTION_FIELDS.reconciledBy] = patch.reconciledBy;
  if (patch.reconciledAt !== undefined)
    fields[CONTRIBUTION_FIELDS.reconciledAt] = patch.reconciledAt;
  if (patch.notes !== undefined) fields[CONTRIBUTION_FIELDS.notes] = patch.notes;

  const res = await fetch(getContribUrl(recordId), {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ fields, returnFieldsByFieldId: true }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Airtable updateContribution error: ${res.status} — ${body}`);
  }

  return parseContribution(await res.json());
}

/**
 * Mark a contribution paid and record the payment metadata in one PATCH.
 *
 * Sets Status=Paid, fills in amountReceived / source / reference /
 * paymentDate. Reconciliation is a SEPARATE step — paying != reconciled.
 * Admins must explicitly reconcile after verifying against the bank
 * statement, which is what makes the audit trail meaningful.
 *
 * If `paymentDate` is omitted, defaults to today (SAST).
 */
export async function markContributionPaid(
  recordId: string,
  details: {
    amountReceived: number;
    source: ContributionSource;
    paymentReference: string;
    paymentDate?: string;
    notes?: string;
  },
): Promise<LehumoContribution> {
  return updateContribution(recordId, {
    status: CONTRIBUTION_STATUS.paid,
    amountReceived: details.amountReceived,
    source: details.source,
    paymentReference: details.paymentReference,
    paymentDate: details.paymentDate ?? nowSastIso().slice(0, 10),
    ...(details.notes !== undefined ? { notes: details.notes } : {}),
  });
}

/**
 * Mark a contribution reconciled — admin has confirmed the row against
 * an external source of truth (bank statement, Paystack dashboard).
 *
 * Reconciliation is a one-way ratchet by convention: reconciled rows
 * shouldn't normally be unmarked. `unreconcileContribution` exists for
 * the rare correction case (admin made a mistake; the bank reversed).
 */
export async function reconcileContribution(
  recordId: string,
  adminEmail: string,
): Promise<LehumoContribution> {
  return updateContribution(recordId, {
    reconciled: true,
    reconciledBy: adminEmail,
    reconciledAt: nowSastIso(),
  });
}

/**
 * Convenience wrapper for the dual-write path: given a member and a
 * period, ensure a Contribution row exists for that pair and mark it
 * Paid in one logical operation.
 *
 * Used by `checkMonthPayment` and the Paystack webhook to land payments
 * on the new table while the legacy MONTH_FIELDS columns are still the
 * source of truth for the UI. After Phase 4 cuts the UI over to the
 * new shape, this becomes the canonical write path; the legacy column
 * write goes away in Phase 5.
 *
 * Idempotent: re-running with the same params is a no-op once the row
 * is already Paid (the second update just bumps `Updated At`).
 *
 * Period semantics: pass the SAST-current period (e.g. `2026-06`) when
 * the legacy code did `member.contributions[Jun] = true`. Year is
 * required since the new table tracks 60 months across 5 years.
 */
export async function markPeriodPaidForMember(params: {
  memberId: string;
  memberNumber: number;
  period: string;
  amountReceived: number;
  source: ContributionSource;
  paymentReference: string;
  paymentDate?: string;
  notes?: string;
}): Promise<LehumoContribution> {
  const period = parseContributionPeriod(params.period);
  if (!period) {
    throw new Error(`Invalid period — expected YYYY-MM, got "${params.period}"`);
  }
  const key = buildContributionKey(params.memberNumber, period);

  let row = await getContributionByKey(key);
  if (!row) {
    // Row doesn't exist — create it as Pending first, then mark Paid.
    // This handles the edge case where a member onboards AFTER the
    // backfill ran but BEFORE Phase 5 wires generateMemberSchedule into
    // the onboarding action. Idempotent enough that we don't need a
    // dedicated upsert primitive.
    row = await createContribution({
      memberId: params.memberId,
      memberNumber: params.memberNumber,
      period,
    });
  }

  return markContributionPaid(row.id, {
    amountReceived: params.amountReceived,
    source: params.source,
    paymentReference: params.paymentReference,
    paymentDate: params.paymentDate,
    notes: params.notes,
  });
}

/** Reverse a reconciliation. Use sparingly — wipes the audit trail
 *  fields. The Notes field on the row is the right place to log why. */
export async function unreconcileContribution(
  recordId: string,
  reasonNote: string,
): Promise<LehumoContribution> {
  return updateContribution(recordId, {
    reconciled: false,
    reconciledBy: "",
    notes: reasonNote,
  });
}

// ─── Schedule generation ────────────────────────────────────────────

/**
 * Create the full 60-month contribution schedule for a member.
 *
 * Default start is 1 Jun 2026 (the Lehumo launch date). Generates 60
 * Pending rows in chronological order (`Jun 2026` → `May 2031`),
 * batched 10-at-a-time per Airtable's request limit.
 *
 * Idempotent guard: if ANY contribution row already exists for this
 * member, the function refuses to run rather than risk creating a
 * partial-overlapping schedule. Use `backfillMissingPeriods` to fill
 * gaps in an existing schedule.
 */
export async function generateMemberSchedule(params: {
  memberId: string;
  memberNumber: number;
  /** Plan tier for these contributions. Defaults to Standard (R1,000). */
  plan?: ContributionPlan;
  /** Override the start month. Defaults to Jun 2026. */
  start?: { year: number; month: number };
  /** Override the count. Defaults to 60 (5 years). */
  count?: number;
}): Promise<LehumoContribution[]> {
  const existing = await listContributionsForMember(params.memberNumber);
  if (existing.length > 0) {
    throw new Error(
      `Member ${formatMemberNumber(params.memberNumber)} already has ` +
        `${existing.length} contribution rows — refusing to generate a ` +
        `partial-overlapping schedule. Use backfillMissingPeriods if you ` +
        `intended to fill gaps.`,
    );
  }

  const start = params.start ?? { year: 2026, month: 6 };
  const count = params.count ?? 60;
  const periods = generateContributionPeriods(start, count);

  const inputs: CreateContributionInput[] = periods.map((period) => ({
    memberId: params.memberId,
    memberNumber: params.memberNumber,
    period,
    plan: params.plan,
  }));

  return createContributionsBatch(inputs);
}

/**
 * Insert any missing periods from a member's schedule, leaving existing
 * rows untouched. Useful for partial-recovery (a previous bulk insert
 * crashed mid-batch) without trampling reconciled rows.
 */
export async function backfillMissingPeriods(params: {
  memberId: string;
  memberNumber: number;
  plan?: ContributionPlan;
  start?: { year: number; month: number };
  count?: number;
}): Promise<LehumoContribution[]> {
  const existing = await listContributionsForMember(params.memberNumber);
  const existingPeriods = new Set(existing.map((c) => c.period));

  const start = params.start ?? { year: 2026, month: 6 };
  const count = params.count ?? 60;
  const allPeriods = generateContributionPeriods(start, count);
  const missing = allPeriods.filter((p) => !existingPeriods.has(p));

  if (missing.length === 0) return [];

  const inputs: CreateContributionInput[] = missing.map((period) => ({
    memberId: params.memberId,
    memberNumber: params.memberNumber,
    period,
    plan: params.plan,
  }));

  return createContributionsBatch(inputs);
}
