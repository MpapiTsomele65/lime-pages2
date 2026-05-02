import { NextRequest, NextResponse } from "next/server";

import { listAllMembers } from "@/lib/airtable-admin";
import { listContributionsForPeriod } from "@/lib/contributions";
import {
  sendContributionReminderEmail,
  sendContributionFinalReminderEmail,
} from "@/lib/email";
import type { MemberPlan } from "@/lib/definitions";

// ─── Plan → monthly amount ─────────────────────────────────────────
// Mirrors SetUpPaymentsCard's PLAN_DETAILS so the reminder copy and
// the portal show the same number. If a member's plan can't be
// resolved (legacy data, missing notes), we fall through to Standard
// which is the recommended default tier.
const PLAN_AMOUNTS_ZAR: Record<MemberPlan, number> = {
  basic: 1000,
  standard: 1020, // R1,000 + 2% service fee
  vip: 1050, // R1,000 + 5% service fee
};

// ─── SAST period helper ─────────────────────────────────────────────
// Cron fires from Vercel's infra (UTC); we want the period in SAST
// because that's how Lehumo's contribution calendar is anchored.
// en-CA gives a YYYY-MM-DD-shaped local date string; slice the first
// seven chars to get YYYY-MM.
function getSastPeriod(now: Date = new Date()): string {
  const ymd = now.toLocaleDateString("en-CA", {
    timeZone: "Africa/Johannesburg",
  });
  return ymd.slice(0, 7);
}

// ─── Display copy for the period ────────────────────────────────────
// Renders "June" or "June 2026" depending on whether the period is
// this calendar year. Used in the subject line + body of the
// reminder email — bare month name reads more humanly than YYYY-MM
// for the in-year case, and disambiguates with year for cross-year
// edge cases (a January reminder for a December period etc.).
function formatPeriodLabel(period: string, now: Date = new Date()): string {
  const m = /^(\d{4})-(\d{2})$/.exec(period);
  if (!m) return period;
  const year = m[1];
  const monthIdx = Number(m[2]) - 1;
  const monthName = new Date(2000, monthIdx, 1).toLocaleString("en-ZA", {
    month: "long",
  });
  const sastYear = now
    .toLocaleDateString("en-CA", { timeZone: "Africa/Johannesburg" })
    .slice(0, 4);
  return year === sastYear ? monthName : `${monthName} ${year}`;
}

/**
 * Contribution reminder cron.
 *
 * Fires twice a month (per vercel.json):
 *   - 15th SAST 9am → kind=first (gentle nudge)
 *   - 25th SAST 9am → kind=final (last automated reminder)
 *
 * For each Active member who has NOT paid the current SAST period,
 * we send the appropriate reminder template. Paid members never see
 * the email. Non-Active members (Prospect / Onboarding / On Hold /
 * Exited) are skipped — Onboarding members haven't set up payments
 * yet (the SetUpPaymentsCard handles that surface), and Exited
 * members shouldn't be chased.
 *
 * Auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` with
 * each scheduled invocation. We reject anything else with 401 so
 * the route can't be triggered manually by random callers.
 *
 * Returns a summary { kind, period, sent, skipped, errors } so the
 * Vercel function logs are diagnosable — admins can grep `[cron]`
 * for the per-run breakdown.
 */
export async function GET(request: NextRequest) {
  // ── Auth gate ──────────────────────────────────────────────────
  const authHeader = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    console.warn("[cron contribution-reminder] unauthorized invocation");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse `kind` query param (first | final) ──────────────────
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  if (kind !== "first" && kind !== "final") {
    return NextResponse.json(
      { error: "kind must be 'first' or 'final'" },
      { status: 400 },
    );
  }

  const period = getSastPeriod();
  const monthLabel = formatPeriodLabel(period);
  const reqId = `${Date.now()}:${Math.random().toString(16).slice(2, 8)}`;
  console.log(
    `[cron contribution-reminder ${reqId}] starting kind=${kind} period=${period}`,
  );

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  try {
    // ── Fetch the universe of members + this period's contributions ──
    // One round-trip each. Computing the "unpaid Active" set in-memory
    // is faster than per-member lookups against Airtable's 5 req/sec
    // rate limit, especially as the founding cohort grows past 30.
    const [members, contribs] = await Promise.all([
      listAllMembers(),
      listContributionsForPeriod(period),
    ]);

    const paidMemberIds = new Set(
      contribs
        .filter((c) => c.status === "Paid")
        .map((c) => c.memberId),
    );

    // ── Iterate Active members, skip the ones who've paid ───────
    // Send sequentially rather than Promise.all'ing the lot — Resend
    // has a 10 req/sec rate limit on the free tier and we'd rather
    // pay an extra ~0.3s of cron runtime than risk a partial blast
    // where half the cohort gets emailed and half gets a 429.
    for (const member of members) {
      if (member.status !== "Active") {
        skipped++;
        continue;
      }
      if (paidMemberIds.has(member.id)) {
        skipped++;
        continue;
      }
      if (!member.email) {
        skipped++;
        continue;
      }

      const plan = member.plan ?? "standard";
      const amountZar = PLAN_AMOUNTS_ZAR[plan];

      try {
        const fn =
          kind === "first"
            ? sendContributionReminderEmail
            : sendContributionFinalReminderEmail;
        await fn({
          to: member.email,
          fullName: member.fullName,
          memberNumber: member.memberNumber,
          monthLabel,
          amountZar,
        });
        sent++;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`${member.id}: ${message}`);
        console.error(
          `[cron contribution-reminder ${reqId}] send failed for ${member.id} (${member.email}):`,
          err,
        );
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[cron contribution-reminder ${reqId}] fatal error:`,
      err,
    );
    return NextResponse.json(
      { error: `Cron failed: ${message}`, reqId, kind, period },
      { status: 500 },
    );
  }

  console.log(
    `[cron contribution-reminder ${reqId}] done kind=${kind} period=${period} sent=${sent} skipped=${skipped} errors=${errors.length}`,
  );
  return NextResponse.json({
    ok: true,
    kind,
    period,
    monthLabel,
    sent,
    skipped,
    errors: errors.length,
    reqId,
  });
}
