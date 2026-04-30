// Phase 2 of the Path B contribution-tracking redesign.
//
// Generates the 60-month contribution schedule (Jun 2026 → May 2031)
// for every existing Lehumo member and writes it to the Contributions
// table created in Phase 1 (commit 51c04b3).
//
// Modes:
//   - default (dry run): inspects every member, reports the plan,
//     writes nothing.
//   - `--execute`: performs the planned writes, batched 10/request
//     per Airtable's limit. Idempotent — members who already have
//     contribution rows are skipped, so reruns are safe.
//
// Anomaly handling: if any member has legacy `true` cells in the old
// MONTH_FIELDS booleans, the script REFUSES to proceed (even with
// --execute). The legacy schema couldn't disambiguate years, so a
// `true` in `Jun` could mean Jun 2026 / Jun 2027 / etc — backfilling
// without admin input would lose data. Surface them and stop.
//
// Run:
//   set -a && source .env.airtable.local && set +a   # or .env.local
//   npx tsx --require ./scripts/server-only-stub.cjs scripts/backfill-contributions.ts            # dry run
//   npx tsx --require ./scripts/server-only-stub.cjs scripts/backfill-contributions.ts --execute  # apply

import {
  AIRTABLE_FIELDS,
  CONTRIBUTION_PLAN,
  MONTH_FIELDS,
  MONTH_NAMES,
  formatMemberNumber,
} from "@/lib/definitions";
import {
  generateMemberSchedule,
  listContributionsForMember,
} from "@/lib/contributions";

interface MemberSummary {
  recordId: string;
  memberNumber: number;
  fullName: string;
  legacyTrueCells: string[]; // month codes from MONTH_FIELDS that are true
  existingContributionRows: number;
}

const EXECUTE = process.argv.includes("--execute");

async function listAllMembers(): Promise<MemberSummary[]> {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableId = process.env.AIRTABLE_TABLE_ID;
  const pat = process.env.AIRTABLE_PAT;
  if (!baseId || !tableId || !pat) {
    throw new Error(
      "Missing Airtable env vars (AIRTABLE_BASE_ID / AIRTABLE_TABLE_ID / AIRTABLE_PAT)",
    );
  }

  const out: MemberSummary[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(`https://api.airtable.com/v0/${baseId}/${tableId}`);
    url.searchParams.set("returnFieldsByFieldId", "true");
    url.searchParams.set("pageSize", "100");
    url.searchParams.append("sort[0][field]", "Member #");
    url.searchParams.append("sort[0][direction]", "asc");
    if (offset) url.searchParams.set("offset", offset);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${pat}` },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Airtable list members error: ${res.status} — ${body}`);
    }
    const data = (await res.json()) as {
      records: Array<{ id: string; fields: Record<string, unknown> }>;
      offset?: string;
    };

    for (const r of data.records) {
      const f = r.fields;
      const legacyTrueCells = MONTH_NAMES.filter(
        (m) => f[MONTH_FIELDS[m]] === true,
      );
      out.push({
        recordId: r.id,
        memberNumber: Number(f[AIRTABLE_FIELDS.memberNumber] ?? 0),
        fullName: String(f[AIRTABLE_FIELDS.fullName] ?? "(no name)"),
        legacyTrueCells,
        existingContributionRows: 0, // filled in next pass
      });
    }

    offset = data.offset;
  } while (offset);

  // Second pass — count existing Contributions rows per member.
  // Sequential (not parallel) to keep within Airtable's 5 req/sec/base limit.
  for (const m of out) {
    const rows = await listContributionsForMember(m.memberNumber);
    m.existingContributionRows = rows.length;
  }

  return out;
}

function plan(members: MemberSummary[]): {
  toBackfill: MemberSummary[];
  alreadyComplete: MemberSummary[];
  withAnomalies: MemberSummary[];
} {
  return {
    toBackfill: members.filter(
      (m) => m.existingContributionRows === 0 && m.legacyTrueCells.length === 0,
    ),
    alreadyComplete: members.filter((m) => m.existingContributionRows > 0),
    withAnomalies: members.filter(
      (m) => m.legacyTrueCells.length > 0 && m.existingContributionRows === 0,
    ),
  };
}

function printPlan(members: MemberSummary[]): void {
  console.log(`\n=== Backfill plan ===`);
  console.log(`Total members: ${members.length}`);

  const { toBackfill, alreadyComplete, withAnomalies } = plan(members);

  if (alreadyComplete.length) {
    console.log(`\n✓ Already have contribution rows (will skip):`);
    for (const m of alreadyComplete) {
      console.log(
        `  - ${formatMemberNumber(m.memberNumber)} ${m.fullName.padEnd(28)} ${m.existingContributionRows} rows`,
      );
    }
  }

  if (withAnomalies.length) {
    console.log(
      `\n⚠ ANOMALY — legacy MONTH_FIELDS true cells (year ambiguous, refusing to backfill):`,
    );
    for (const m of withAnomalies) {
      console.log(
        `  - ${formatMemberNumber(m.memberNumber)} ${m.fullName.padEnd(28)} cells: ${m.legacyTrueCells.join(", ")}`,
      );
    }
  }

  if (toBackfill.length) {
    console.log(
      `\n→ Will generate 60-period schedule (Jun 2026 → May 2031, all Pending):`,
    );
    for (const m of toBackfill) {
      console.log(
        `  - ${formatMemberNumber(m.memberNumber)} ${m.fullName}`,
      );
    }
    console.log(
      `\n  Total rows to create: ${toBackfill.length} × 60 = ${toBackfill.length * 60}`,
    );
  } else {
    console.log(`\n(Nothing to backfill.)`);
  }
}

async function main() {
  console.log(`→ Listing all members + their existing contribution-table state…`);
  const members = await listAllMembers();
  printPlan(members);

  const { toBackfill, withAnomalies } = plan(members);

  if (withAnomalies.length > 0) {
    console.log(
      `\n✗ Refusing to proceed — ${withAnomalies.length} member(s) have legacy true cells. Resolve those first (manually decide which year each maps to, or clear them if they're test data).`,
    );
    process.exit(1);
  }

  if (!EXECUTE) {
    console.log(
      `\n(dry run — pass --execute to apply. Re-run is idempotent.)`,
    );
    return;
  }

  if (toBackfill.length === 0) {
    console.log(`\n(Nothing to do — all members already have contribution rows.)`);
    return;
  }

  console.log(`\n→ Executing backfill for ${toBackfill.length} member(s)…`);
  let totalRows = 0;
  for (const m of toBackfill) {
    process.stdout.write(
      `  ${formatMemberNumber(m.memberNumber)} ${m.fullName.padEnd(28)} `,
    );
    const created = await generateMemberSchedule({
      memberId: m.recordId,
      memberNumber: m.memberNumber,
      plan: CONTRIBUTION_PLAN.standard,
    });
    totalRows += created.length;
    process.stdout.write(`${created.length} rows ✓\n`);
  }
  console.log(`\n✓ Done. Created ${totalRows} contribution rows total.`);
}

main().catch((err) => {
  console.error("\n✗ Backfill failed:", err);
  process.exit(1);
});
