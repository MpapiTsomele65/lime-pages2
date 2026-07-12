import "server-only";

import { listAllMembers } from "./airtable-admin";
import { listContributionsForMember } from "./contributions";
import { CONTRIBUTION_STATUS } from "./definitions";

/**
 * Contribution-link integrity scan (read-only).
 *
 * Every contribution row must link to the Member record whose number it
 * carries. When a row's Member link is blank (e.g. Airtable cleared it after
 * the record was deleted/recreated, or the Paystack webhook wrote it before
 * the guardrail landed) or points at a different record, the row is invisible
 * to the admin rollup (which joins on the record link) and silently distorts
 * the pool totals. This surfaces those rows so they can be repaired with
 * scripts/repair-orphan-links.ts.
 */

export interface MemberLinkIssue {
  memberNumber: number;
  memberName: string;
  recordId: string;
  /** Rows whose Member link is empty — the common orphan. */
  blankCount: number;
  /** Rows linked to a different record than this member's. */
  mismatched: { period: string; linkedTo: string }[];
}

export interface ContributionLinkScan {
  scannedMembers: number;
  affected: MemberLinkIssue[];
  totalBlank: number;
  totalMismatched: number;
}

export async function scanContributionLinks(): Promise<ContributionLinkScan> {
  const members = await listAllMembers();
  const affected: MemberLinkIssue[] = [];
  let scanned = 0;

  // Sequential per member — stays within Airtable's 5 req/sec/base limit.
  for (const m of members) {
    if (!m.memberNumber) continue;
    scanned += 1;
    const rows = await listContributionsForMember(m.memberNumber);
    if (rows.length === 0) continue;

    const blankCount = rows.filter((r) => !r.memberId).length;
    const mismatched = rows
      .filter((r) => r.memberId && r.memberId !== m.id)
      .map((r) => ({ period: r.period, linkedTo: r.memberId }));

    if (blankCount > 0 || mismatched.length > 0) {
      affected.push({
        memberNumber: m.memberNumber,
        memberName: m.fullName,
        recordId: m.id,
        blankCount,
        mismatched,
      });
    }
  }

  return {
    scannedMembers: scanned,
    affected,
    totalBlank: affected.reduce((s, a) => s + a.blankCount, 0),
    totalMismatched: affected.reduce((s, a) => s + a.mismatched.length, 0),
  };
}

// ── Full integrity sweep ─────────────────────────────────────────────
//
// The nightly health check. Extends the link scan with the row-quality
// anomalies this project has actually been bitten by:
//
//   duplicate-period   two rows for the same (member, period) — double-
//                      counts a month in every rollup and the pool total
//   paid-no-reference  Paid with no payment reference — unreconcilable
//                      against a bank statement
//   paid-no-date       Paid with no payment date — invisible to the
//                      leaderboard's who-paid-first ranking
//   paid-underpaid     Paid but received < expected — a partial that was
//                      marked fully paid
//   paid-no-amount     Paid with no/zero received amount — status says
//                      money landed but none is recorded
//
// Read-only, like the link scan. Sequential per member to respect
// Airtable's rate limit.

export type IntegrityFindingKind =
  | "duplicate-period"
  | "paid-no-reference"
  | "paid-no-date"
  | "paid-underpaid"
  | "paid-no-amount";

export interface IntegrityFinding {
  memberNumber: number;
  memberName: string;
  kind: IntegrityFindingKind;
  period: string;
  detail: string;
}

export interface IntegritySweep {
  scannedMembers: number;
  /** Member-link issues (the original orphan scan). */
  links: ContributionLinkScan;
  /** Row-quality anomalies. */
  findings: IntegrityFinding[];
  totalIssues: number;
}

export async function runIntegritySweep(): Promise<IntegritySweep> {
  const members = await listAllMembers();
  const affected: MemberLinkIssue[] = [];
  const findings: IntegrityFinding[] = [];
  let scanned = 0;

  for (const m of members) {
    if (!m.memberNumber) continue;
    scanned += 1;
    const rows = await listContributionsForMember(m.memberNumber);
    if (rows.length === 0) continue;

    // ── Link checks (same as scanContributionLinks) ──
    const blankCount = rows.filter((r) => !r.memberId).length;
    const mismatched = rows
      .filter((r) => r.memberId && r.memberId !== m.id)
      .map((r) => ({ period: r.period, linkedTo: r.memberId }));
    if (blankCount > 0 || mismatched.length > 0) {
      affected.push({
        memberNumber: m.memberNumber,
        memberName: m.fullName,
        recordId: m.id,
        blankCount,
        mismatched,
      });
    }

    // ── Duplicate periods ──
    const byPeriod = new Map<string, number>();
    for (const r of rows) {
      byPeriod.set(r.period, (byPeriod.get(r.period) ?? 0) + 1);
    }
    for (const [period, count] of byPeriod) {
      if (count > 1) {
        findings.push({
          memberNumber: m.memberNumber,
          memberName: m.fullName,
          kind: "duplicate-period",
          period,
          detail: `${count} rows exist for ${period} — the month is being double-counted`,
        });
      }
    }

    // ── Paid-row quality ──
    for (const r of rows) {
      if (r.status !== CONTRIBUTION_STATUS.paid) continue;
      const received = r.amountReceived ?? 0;
      const expected = r.amountExpected ?? 1000;
      if (!r.paymentReference) {
        findings.push({
          memberNumber: m.memberNumber,
          memberName: m.fullName,
          kind: "paid-no-reference",
          period: r.period,
          detail: "Paid but no payment reference on file",
        });
      }
      if (!r.paymentDate) {
        findings.push({
          memberNumber: m.memberNumber,
          memberName: m.fullName,
          kind: "paid-no-date",
          period: r.period,
          detail: "Paid but no payment date on file",
        });
      }
      if (received <= 0) {
        findings.push({
          memberNumber: m.memberNumber,
          memberName: m.fullName,
          kind: "paid-no-amount",
          period: r.period,
          detail: "Paid but received amount is empty/zero",
        });
      } else if (received < expected) {
        findings.push({
          memberNumber: m.memberNumber,
          memberName: m.fullName,
          kind: "paid-underpaid",
          period: r.period,
          detail: `Paid but received R${received.toLocaleString("en-ZA")} < expected R${expected.toLocaleString("en-ZA")}`,
        });
      }
    }
  }

  const links: ContributionLinkScan = {
    scannedMembers: scanned,
    affected,
    totalBlank: affected.reduce((s, a) => s + a.blankCount, 0),
    totalMismatched: affected.reduce((s, a) => s + a.mismatched.length, 0),
  };

  return {
    scannedMembers: scanned,
    links,
    findings,
    totalIssues:
      links.totalBlank + links.totalMismatched + findings.length,
  };
}
