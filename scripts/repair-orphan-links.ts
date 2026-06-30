// Scan (and optionally repair) contribution rows whose Member record link
// is BLANK while the row's member # still points at a real member — the
// orphaned-row bug that makes rows invisible to the admin rollup (which
// filters by record link) and drives the "Fix N" chip.
//
// Repair = reassignContribution back to the member's record (the sanctioned
// Edit-dialog path). Only BLANK links are auto-fixed; rows linked to a
// DIFFERENT record are reported for manual review, never auto-moved.
//
//   set -a && source .env.local && set +a
//   npx tsx --require ./scripts/server-only-stub.cjs scripts/repair-orphan-links.ts            # dry, all members
//   npx tsx --require ./scripts/server-only-stub.cjs scripts/repair-orphan-links.ts 3 --execute # fix member #3
//   npx tsx --require ./scripts/server-only-stub.cjs scripts/repair-orphan-links.ts --execute   # fix all

import {
  listContributionsForMember,
  reassignContribution,
} from "@/lib/contributions";
import { AIRTABLE_FIELDS, formatMemberNumber } from "@/lib/definitions";

const EXECUTE = process.argv.includes("--execute");
const ONLY = process.argv.slice(2).find((a) => /^\d+$/.test(a));

interface M {
  number: number;
  recordId: string;
  fullName: string;
}

async function listMembers(): Promise<M[]> {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableId = process.env.AIRTABLE_TABLE_ID;
  const pat = process.env.AIRTABLE_PAT;
  if (!baseId || !tableId || !pat) throw new Error("Missing Airtable env vars");
  const out: M[] = [];
  let offset: string | undefined;
  do {
    const url = new URL(`https://api.airtable.com/v0/${baseId}/${tableId}`);
    url.searchParams.set("returnFieldsByFieldId", "true");
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${pat}` } });
    if (!res.ok) throw new Error(`list members: ${res.status} — ${await res.text()}`);
    const data = (await res.json()) as {
      records: Array<{ id: string; fields: Record<string, unknown> }>;
      offset?: string;
    };
    for (const r of data.records) {
      const num = Number(r.fields[AIRTABLE_FIELDS.memberNumber] ?? 0);
      if (!num) continue;
      out.push({
        number: num,
        recordId: r.id,
        fullName: String(r.fields[AIRTABLE_FIELDS.fullName] ?? "(no name)"),
      });
    }
    offset = data.offset;
  } while (offset);
  return out.sort((a, b) => a.number - b.number);
}

async function main() {
  const members = await listMembers();
  let affected = 0;
  let totalBlanks = 0;

  for (const m of members) {
    if (ONLY && Number(ONLY) !== m.number) continue;
    const rows = await listContributionsForMember(m.number);
    const orphans = rows.filter((r) => r.memberId !== m.recordId);
    if (orphans.length === 0) continue;

    const blanks = orphans.filter((o) => !o.memberId);
    const mismatched = orphans.filter((o) => o.memberId);
    affected += 1;
    totalBlanks += blanks.length;

    console.log(
      `${formatMemberNumber(m.number)} ${m.fullName.padEnd(28)} ${blanks.length} blank-link${mismatched.length ? ` + ${mismatched.length} mismatched` : ""} -> relink to ${m.recordId}`,
    );
    if (mismatched.length) {
      console.log(
        `   review manually (linked elsewhere): ${mismatched.map((o) => `${o.period}->${o.memberId}`).join(", ")}`,
      );
    }
    if (EXECUTE && blanks.length) {
      for (const o of blanks) {
        await reassignContribution(o.id, m.recordId, m.number, o.period);
      }
      console.log(`   relinked ${blanks.length} blank row(s)`);
    }
  }

  console.log(
    `\n${affected} member(s) affected, ${totalBlanks} blank-link rows${EXECUTE ? " — FIXED" : " — (dry run, add --execute)"}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
