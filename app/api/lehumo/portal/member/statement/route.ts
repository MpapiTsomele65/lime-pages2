import { NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { getMemberById } from "@/lib/airtable";
import { formatMemberNumber } from "@/lib/definitions";
import { toCsv } from "@/lib/csv";

/**
 * Member statement download — the signed-in member's own contribution
 * history as CSV. Self-audit reduces disputes, and it doubles as the
 * member's paper trail toward year-5 conversion.
 *
 * Auth: session cookie (the browser <a href> download carries it).
 * Members can only ever download THEIR OWN rows — the member id comes
 * from the session, never from the request.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await getMemberById(session.memberId);
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const rows = [...(member.contributionRows ?? [])].sort((a, b) =>
    a.period.localeCompare(b.period),
  );

  const csv = toCsv(
    [
      "Period", "Status", "Expected (R)", "Received (R)", "Source",
      "Reference", "Payment date", "Reconciled",
    ],
    rows.map((c) => [
      c.period,
      c.status,
      c.amountExpected ?? "",
      c.amountReceived ?? "",
      c.source ?? "",
      c.paymentReference ?? "",
      c.paymentDate ?? "",
      c.reconciled ? "yes" : "no",
    ]),
  );

  const num = formatMemberNumber(member.memberNumber);
  const stamp = new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Johannesburg",
  });
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lehumo-statement-${num}-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
