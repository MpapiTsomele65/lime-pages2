import { NextRequest, NextResponse } from "next/server";

import { listAllMembers } from "@/lib/airtable-admin";
import { listAllContributions } from "@/lib/contributions";
import { sendBackupEmail } from "@/lib/email";
import { formatMemberNumber } from "@/lib/definitions";
import { toCsv } from "@/lib/csv";

/**
 * Weekly backup cron.
 *
 * Airtable is the trust's system of record — one bad script or accidental
 * table delete would otherwise lose the financial history. This exports
 * Members + Contributions as CSV and emails them to the admin mailbox as
 * attachments (per vercel.json, Mondays 04:00 UTC).
 *
 * Read-only. Auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    console.warn("[cron backup] unauthorized invocation");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reqId = `${Date.now()}:${Math.random().toString(16).slice(2, 8)}`;
  try {
    const [members, contributions] = await Promise.all([
      listAllMembers(),
      listAllContributions(),
    ]);

    const membersCsv = toCsv(
      [
        "Member #", "Full name", "Email", "Status", "KYC status", "Plan",
        "Risk profile", "Record id",
      ],
      members.map((m) => [
        formatMemberNumber(m.memberNumber),
        m.fullName,
        m.email,
        m.status ?? "",
        m.kycStatus ?? "",
        m.plan ?? "",
        m.riskProfile ?? "",
        m.id,
      ]),
    );

    const contributionsCsv = toCsv(
      [
        "Key", "Period", "Status", "Expected (R)", "Received (R)", "Source",
        "Reference", "Payment date", "Reconciled", "Reconciled by",
        "Member record id", "Record id",
      ],
      contributions.map((c) => [
        c.contributionKey,
        c.period,
        c.status,
        c.amountExpected ?? "",
        c.amountReceived ?? "",
        c.source ?? "",
        c.paymentReference ?? "",
        c.paymentDate ?? "",
        c.reconciled ? "yes" : "no",
        c.reconciledBy ?? "",
        c.memberId ?? "",
        c.id,
      ]),
    );

    await sendBackupEmail({
      membersCsv,
      contributionsCsv,
      memberCount: members.length,
      contributionCount: contributions.length,
    });

    console.log(
      `[cron backup ${reqId}] emailed snapshot · ${members.length} members · ` +
        `${contributions.length} contribution rows`,
    );
    return NextResponse.json({
      ok: true,
      members: members.length,
      contributions: contributions.length,
    });
  } catch (err) {
    console.error(`[cron backup ${reqId}] failed:`, err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "backup failed" },
      { status: 500 },
    );
  }
}

