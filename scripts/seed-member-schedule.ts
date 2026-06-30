// Repair tool: seed the canonical 60-month schedule (Jun 2026 → May 2031)
// for a SINGLE member by record id. Mirrors the admin "Regenerate" button
// (ensureCanonicalMemberSchedule, no plan link) — idempotent: only inserts
// missing periods, never touches existing rows.
//
// Use when a member was added without their schedule seeded (so "Log EFT"
// throws "has no contribution rows — schedule not seeded").
//
// Run:
//   set -a && source .env.local && set +a
//   npx tsx --require ./scripts/server-only-stub.cjs scripts/seed-member-schedule.ts <recordId>            # dry run
//   npx tsx --require ./scripts/server-only-stub.cjs scripts/seed-member-schedule.ts <recordId> --execute  # apply

import {
  ensureCanonicalMemberSchedule,
  listContributionsForMember,
} from "@/lib/contributions";
import { getMemberById } from "@/lib/airtable";
import { formatMemberNumber } from "@/lib/definitions";

const recordId = process.argv[2];
const EXECUTE = process.argv.includes("--execute");

async function main() {
  if (!recordId || recordId.startsWith("--")) {
    throw new Error(
      "usage: tsx scripts/seed-member-schedule.ts <recordId> [--execute]",
    );
  }
  const member = await getMemberById(recordId);
  if (!member) throw new Error(`member ${recordId} not found`);

  const before = (await listContributionsForMember(member.memberNumber)).length;
  console.log(
    `Member: ${formatMemberNumber(member.memberNumber)} ${member.fullName} (${recordId})`,
  );
  console.log(`Existing contribution rows: ${before}`);

  if (!EXECUTE) {
    console.log("(dry run — pass --execute to seed the 60-month schedule)");
    return;
  }
  if (before > 0) {
    console.log("Already has rows — backfill will only fill gaps (idempotent).");
  }

  const res = await ensureCanonicalMemberSchedule({
    memberId: member.id,
    memberNumber: member.memberNumber,
  });
  if (!res.ok) {
    console.error(`✗ failed: ${res.error}`);
    process.exit(1);
  }
  const after = (await listContributionsForMember(member.memberNumber)).length;
  console.log(
    `✓ generated ${res.generated} rows — member now has ${after} rows`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
