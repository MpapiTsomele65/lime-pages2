import "server-only";

import {
  CONTRIBUTION_SOURCE,
  CONTRIBUTION_STATUS,
  MONTH_NAMES,
  buildContributionKey,
  formatMemberNumber,
  parseContributionPeriod,
  type LehumoMember,
} from "./definitions";
import {
  allocateEftPayment,
  type EftAllocationPlan,
} from "./eft-allocation";
// Shared Airtable plumbing — see lib/airtable.ts for the canonical
// implementations. Importing rather than duplicating eliminates the
// parseRecord-drift class of bug that previously caused the admin
// dashboard to silently drop beneficiary + active-loan fields.
import {
  getBaseUrl,
  getHeaders,
  parseRecord,
} from "./airtable";
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

/**
 * Log a manual EFT payment against a member's account, allocating the
 * amount across one-or-more contribution rows (oldest unpaid first).
 *
 * The recon flow we want to support:
 *   • Admin pulls the bank statement, sees `John, R2,000, ref ABC123,
 *     date 2026-06-15`.
 *   • Admin opens John's row in the admin portal, clicks "Log EFT",
 *     enters R2,000 + ref + date.
 *   • Backend allocates: Jun 2026 R1,000 (Paid) + Jul 2026 R1,000 (Paid).
 *   • Member sees both months light up + can verify by checking the
 *     reference on each row.
 *
 * Partial amounts top up the next unpaid row's `amountReceived` and
 * leave it Pending — admin can see exactly where the shortfall sits.
 * Overpayments (after every unpaid row is fully covered) surface as
 * `remainder` in the response so the admin knows there's excess to
 * deal with — we deliberately don't auto-refund or stuff the excess
 * somewhere it might surprise the admin later.
 *
 * Atomicity caveat: each row write is a separate PATCH to Airtable;
 * there's no transaction primitive. If the second of three writes
 * fails, the first one has already landed. We return the partial
 * plan so the caller can surface "applied 1 of 3 — second write
 * failed, please retry" rather than pretending the whole call rolled
 * back. In practice Airtable is reliable enough that this is rare.
 */
export async function logEftPayment(args: {
  memberRecordId: string;
  amount: number;
  paymentReference: string;
  paymentDate?: string;
  notes?: string;
}): Promise<{
  plan: EftAllocationPlan;
  member: LehumoMember;
}> {
  const member = await getMemberByIdAdmin(args.memberRecordId);
  if (!member) throw new Error(`member ${args.memberRecordId} not found`);
  if (!member.contributionRows || member.contributionRows.length === 0) {
    throw new Error(
      `member ${args.memberRecordId} has no contribution rows — schedule not seeded`,
    );
  }

  const plan = allocateEftPayment(member.contributionRows, args.amount);
  if (plan.rows.length === 0) {
    // Nothing to allocate — every scheduled row is already covered.
    // Return the (empty) plan so the caller can show a "nothing to do"
    // message; don't throw, since this is a valid no-op outcome.
    return { plan, member };
  }

  // Apply writes sequentially. Each row gets a fresh PATCH with the
  // new amountReceived + status; the apply order is oldest → newest
  // so a mid-run failure leaves the older months Paid (which is the
  // correct partial-state outcome anyway).
  const today = new Date().toISOString().slice(0, 10);
  for (const allocation of plan.rows) {
    const status =
      allocation.status === "fully-covers"
        ? CONTRIBUTION_STATUS.paid
        : CONTRIBUTION_STATUS.pending;
    await updateContribution(allocation.recordId, {
      status,
      amountReceived: allocation.newAmountReceived,
      source: CONTRIBUTION_SOURCE.eft,
      paymentReference: args.paymentReference,
      paymentDate: args.paymentDate ?? today,
      ...(args.notes ? { notes: args.notes } : {}),
    });
  }

  // Re-fetch to surface the freshly-applied state to the caller.
  const updated = await getMemberByIdAdmin(args.memberRecordId);
  if (!updated) throw new Error(`member ${args.memberRecordId} disappeared after EFT log`);
  return { plan, member: updated };
}
