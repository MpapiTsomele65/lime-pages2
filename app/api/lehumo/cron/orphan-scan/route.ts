import { NextRequest, NextResponse } from "next/server";

import { runIntegritySweep } from "@/lib/contribution-integrity";
import { sendIntegrityAlert } from "@/lib/email";

/**
 * Nightly integrity sweep (grew out of the original orphan scan — the
 * route path stays /orphan-scan so the vercel.json cron doesn't change).
 *
 * Read-only health check across every member's contribution rows:
 *   • blank / mis-linked Member records (the orphan class)
 *   • duplicate rows for the same (member, period)
 *   • Paid rows missing a reference, date, or amount
 *   • Paid rows received < expected (partial marked fully paid)
 *
 * Emails the admin a grouped summary when anything is found; silent when
 * clean. Never mutates data — repairs stay deliberate (one-click actions
 * in Admin → Contributions, or scripts/repair-orphan-links.ts for links).
 *
 * Auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`; anything
 * else gets 401 so the route can't be triggered by random callers.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    console.warn("[cron integrity-sweep] unauthorized invocation");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reqId = `${Date.now()}:${Math.random().toString(16).slice(2, 8)}`;
  try {
    const sweep = await runIntegritySweep();
    console.log(
      `[cron integrity-sweep ${reqId}] scanned ${sweep.scannedMembers} members · ` +
        `${sweep.totalIssues} issue(s) · ${sweep.links.totalBlank} blank · ` +
        `${sweep.links.totalMismatched} mis-linked · ${sweep.findings.length} row anomalies`,
    );

    if (sweep.totalIssues > 0) {
      await sendIntegrityAlert(sweep).catch((err) =>
        console.error(`[cron integrity-sweep ${reqId}] alert email failed:`, err),
      );
    }

    return NextResponse.json({
      ok: true,
      scannedMembers: sweep.scannedMembers,
      totalIssues: sweep.totalIssues,
      links: {
        affectedMembers: sweep.links.affected.length,
        totalBlank: sweep.links.totalBlank,
        totalMismatched: sweep.links.totalMismatched,
      },
      findings: sweep.findings,
    });
  } catch (err) {
    console.error(`[cron integrity-sweep ${reqId}] failed:`, err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "sweep failed" },
      { status: 500 },
    );
  }
}
