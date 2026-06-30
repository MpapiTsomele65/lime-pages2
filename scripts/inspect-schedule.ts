// Read-only: dump a member's contribution-schedule periods so we can see
// gaps / duplicates before repairing.
//   set -a && source .env.local && set +a
//   npx tsx --require ./scripts/server-only-stub.cjs scripts/inspect-schedule.ts 24

import { listContributionsForMember } from "@/lib/contributions";

const memberNumber = Number(process.argv[2]);

async function main() {
  if (!memberNumber) throw new Error("usage: inspect-schedule.ts <memberNumber>");
  const rows = await listContributionsForMember(memberNumber);
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.period] = (counts[r.period] ?? 0) + 1;

  const distinct = Object.keys(counts);
  const dupes = Object.entries(counts).filter(([, c]) => c > 1);

  console.log(`member ${memberNumber}: ${rows.length} rows · ${distinct.length} distinct periods`);
  console.log(
    `July 2026 present: ${distinct.some((p) => p.toLowerCase().includes("jul") || p.includes("2026-07"))}`,
  );
  console.log(`duplicates: ${dupes.map(([p, c]) => `${p}×${c}`).join(", ") || "(none)"}`);
  // Group by linked memberId record — a mismatched link is invisible to
  // the rollup (which filters by memberId) but visible to this number lookup.
  const byMid: Record<string, string[]> = {};
  for (const r of rows) (byMid[r.memberId] ??= []).push(r.period);
  console.log("\nmemberId (record link) → periods:");
  for (const [mid, ps] of Object.entries(byMid)) {
    const full = ps.length === 60;
    console.log(`  ${mid}: ${ps.length} periods${full ? " (full)" : " → " + ps.sort().join(", ")}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
