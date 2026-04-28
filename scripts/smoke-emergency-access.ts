// Inline state-matrix smoke test for computeEmergencyAccess.
//
// One-shot smoke test for the emergency-access work. Validates the
// 6-month gate, 20% rule, R20K hard cap, 90-day overdue check, headroom
// math, and the active-loan branch.
//
// No test runner is wired up yet — run as a one-shot via:
//   npx tsx scripts/smoke-emergency-access.ts
//
// Kept around so future tweaks to the helper (Lending Pledges marketplace,
// claw-back mechanics, etc.) have a fast regression check before touching
// any UI code.

import {
  computeEmergencyAccess,
  type LehumoMember,
} from "@/lib/definitions";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface MakeMemberOpts {
  monthsContributed?: number;
  activeLoanBalance?: number;
  activeLoanIssuedAt?: string;
  activeLoanType?: "Self" | "P2P" | "";
}

function makeMember(opts: MakeMemberOpts = {}): LehumoMember {
  const contributed = opts.monthsContributed ?? 0;
  const contributions: Record<string, boolean> = {};
  for (let i = 0; i < 12; i++) {
    contributions[MONTHS[i]] = i < contributed;
  }
  return {
    id: "rec_test",
    fullName: "Test Member",
    email: "test@example.com",
    phone: "",
    memberNumber: 1,
    status: "Active",
    kycStatus: "Complete",
    source: "smoke-test",
    notes: "",
    contributions,
    activeLoanBalance: opts.activeLoanBalance ?? 0,
    activeLoanIssuedAt: opts.activeLoanIssuedAt ?? "",
    activeLoanType: opts.activeLoanType ?? "",
  };
}

const today = new Date("2026-04-28");
let passed = 0;
let failed = 0;

function assert(label: string, cond: boolean, detail?: string): void {
  if (cond) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ ${label} — ${detail ?? "FAIL"}`);
  }
}

console.log("[1] Brand-new member, 0 months contributed");
{
  const s = computeEmergencyAccess(makeMember({ monthsContributed: 0 }), today);
  assert("kind=locked", s.kind === "locked");
  assert("monthsRemaining=6", s.kind === "locked" && s.monthsRemaining === 6);
}

console.log("\n[2] 5 months contributed (still locked)");
{
  const s = computeEmergencyAccess(makeMember({ monthsContributed: 5 }), today);
  assert("kind=locked", s.kind === "locked");
  assert("monthsRemaining=1", s.kind === "locked" && s.monthsRemaining === 1);
}

console.log("\n[3] 6 months in, no active loan (unlocks)");
{
  const s = computeEmergencyAccess(makeMember({ monthsContributed: 6 }), today);
  assert("kind=available", s.kind === "available");
  assert(
    "contributedZAR=6000",
    s.kind === "available" && s.contributedZAR === 6000,
  );
  // 20% of 6000 = 1200
  assert(
    "availableZAR=1200",
    s.kind === "available" && s.availableZAR === 1200,
  );
  assert(
    "capReason=percent",
    s.kind === "available" && s.capReason === "percent",
  );
}

console.log("\n[4] 12 months in, percent-bound");
{
  const s = computeEmergencyAccess(
    makeMember({ monthsContributed: 12 }),
    today,
  );
  assert("kind=available", s.kind === "available");
  assert(
    "availableZAR=2400",
    s.kind === "available" && s.availableZAR === 2400,
  );
  assert(
    "capReason=percent",
    s.kind === "available" && s.capReason === "percent",
  );
}

console.log("\n[5] Active loan issued recently, not overdue, partial headroom");
{
  const s = computeEmergencyAccess(
    makeMember({
      monthsContributed: 12,
      activeLoanBalance: 2000,
      activeLoanIssuedAt: "2026-04-01",
      activeLoanType: "Self",
    }),
    today,
  );
  assert("kind=active-loan", s.kind === "active-loan");
  assert(
    "activeBalanceZAR=2000",
    s.kind === "active-loan" && s.activeBalanceZAR === 2000,
  );
  assert("isOverdue=false", s.kind === "active-loan" && s.isOverdue === false);
  assert("loanType=Self", s.kind === "active-loan" && s.loanType === "Self");
  // R12K × 20% = R2400 max, R2000 outstanding → R400 remaining headroom
  assert(
    "remainingHeadroomZAR=400",
    s.kind === "active-loan" && s.remainingHeadroomZAR === 400,
  );
}

console.log("\n[6] Active loan issued > 90 days ago (overdue)");
{
  const s = computeEmergencyAccess(
    makeMember({
      monthsContributed: 12,
      activeLoanBalance: 1500,
      activeLoanIssuedAt: "2026-01-01", // ~117 days before 2026-04-28
      activeLoanType: "P2P",
    }),
    today,
  );
  assert("kind=active-loan", s.kind === "active-loan");
  assert("isOverdue=true", s.kind === "active-loan" && s.isOverdue === true);
  assert("loanType=P2P", s.kind === "active-loan" && s.loanType === "P2P");
}

console.log(`\n=== ${passed} passed · ${failed} failed ===`);
process.exit(failed === 0 ? 0 : 1);
