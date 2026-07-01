import { NextRequest, NextResponse } from "next/server";

import { scanContributionLinks } from "@/lib/contribution-integrity";
import { sendOrphanScanAlert } from "@/lib/email";

/**
 * Orphan-scan cron.
 *
 * Runs on a schedule (per vercel.json). Scans every member's contribution
 * rows for a blank or mis-linked Member record — rows that exist by member #
 * but are invisible to the admin rollup, silently distorting the pool totals.
 * When any are found it emails the admin a summary so they can repair with
 * scripts/repair-orphan-links.ts.
 *
 * Read-only: never mutates data. Auto-repair is deliberately manual because
 * mis-linked (vs blank) rows need human judgement (cf. the Katlego/Trinity
 * cross-member case).
 *
 * Auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`; anything
 * else gets 401 so the route can't be triggered by random callers.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    console.warn("[cron orphan-scan] unauthorized invocation");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reqId = `${Date.now()}:${Math.random().toString(16).slice(2, 8)}`;
  try {
    const scan = await scanContributionLinks();
    console.log(
      `[cron orphan-scan ${reqId}] scanned ${scan.scannedMembers} members · ` +
        `${scan.affected.length} affected · ${scan.totalBlank} blank · ` +
        `${scan.totalMismatched} mis-linked`,
    );

    if (scan.affected.length > 0) {
      await sendOrphanScanAlert(scan).catch((err) =>
        console.error(`[cron orphan-scan ${reqId}] alert email failed:`, err),
      );
    }

    return NextResponse.json({
      ok: true,
      scannedMembers: scan.scannedMembers,
      affectedMembers: scan.affected.length,
      totalBlank: scan.totalBlank,
      totalMismatched: scan.totalMismatched,
      affected: scan.affected,
    });
  } catch (err) {
    console.error(`[cron orphan-scan ${reqId}] failed:`, err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "scan failed" },
      { status: 500 },
    );
  }
}
