import "server-only";

import { listAllMembers } from "./airtable-admin";
import { listContributionsForMember } from "./contributions";

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
