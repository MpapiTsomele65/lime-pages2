import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAdminSession } from "@/lib/admin-auth";
import {
  getBaseUrl,
  getCommunityPoolStats,
  getHeaders,
  parseRecord,
} from "@/lib/airtable";
import {
  renderPreLaunchEmailHtml,
  sendPreLaunchEmail,
  type PreLaunchStats,
} from "@/lib/email";
import { type LehumoMember } from "@/lib/definitions";

/**
 * One-off admin endpoint for the pre-launch broadcast email.
 *
 * Three modes:
 *
 *   1. `mode: "test"` — send a single test email to the supplied
 *      address (or default to the admin's own email if `testTo` is
 *      omitted). Used to review the rendered email in your own inbox
 *      before broadcasting. Always safe to fire.
 *
 *   2. `mode: "preview"` — return the live cohort stats + recipient
 *      list shape (count + sample) WITHOUT sending. Used as the
 *      sanity-check step right before broadcast: confirm the numbers
 *      look right and the recipient count matches your expectation.
 *
 *   3. `mode: "broadcast"` — fire the actual broadcast. Requires the
 *      caller to pass `expectedCount` matching the live recipient
 *      count exactly. Defends against "I clicked the wrong button"
 *      mistakes — if the live count drifted (a member opted out,
 *      a new lead was added) the request is rejected with the
 *      current count surfaced so the admin can re-confirm.
 *
 * Auth: admin session required (matches isAdminEmail allowlist).
 *
 * Recipients (broadcast):
 *   - All Members where Status !== "Exited" AND email is set
 *   - All Leads where email is set
 *   - Deduped by lowercased email
 *
 * Sender + BCC matches every other transactional send:
 * `Lehumo <lehumo@limepages.co.za>` from, lehumo@limepages.co.za BCC.
 */

// Hardcoded leads table ID (matches lib/airtable-leads.ts fallback).
// Living here lets this route stay leads-table aware without a public
// helper export.
const LEADS_TABLE_ID = "tbl4o2jZW5cdc9HOb";

// Governance committee volunteer state — user-supplied (not yet
// tracked in Airtable). Update here when the count changes; the
// portal flow we sketched for later will replace this with a live
// query.
const GOVERNANCE_VOLUNTEERS = 3;
const GOVERNANCE_TARGET = 6;

// Cohort target — matches the portal's TotalFoundingSlots.
const COHORT_TARGET = 30;

const BodySchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("test"),
    testTo: z.string().email().optional(),
  }),
  z.object({ mode: z.literal("preview") }),
  z.object({
    mode: z.literal("broadcast"),
    expectedCount: z
      .number()
      .int()
      .nonnegative("expectedCount must be a non-negative integer"),
  }),
]);

interface Recipient {
  email: string;
  firstName: string;
  source: "member" | "lead";
}

async function listAllMembers(): Promise<LehumoMember[]> {
  const baseUrl = getBaseUrl();
  const headers = getHeaders();
  const all: LehumoMember[] = [];
  let offset: string | undefined;
  do {
    const params = new URLSearchParams({
      pageSize: "100",
      returnFieldsByFieldId: "true",
    });
    if (offset) params.set("offset", offset);
    const res = await fetch(`${baseUrl}?${params.toString()}`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Members list ${res.status}`);
    const data = await res.json();
    for (const r of data.records ?? []) all.push(parseRecord(r));
    offset = data.offset;
  } while (offset);
  return all;
}

async function listAllLeads(): Promise<
  Array<{ email: string; fullName: string }>
> {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const pat = process.env.AIRTABLE_PAT;
  if (!baseId || !pat) throw new Error("Airtable env missing");
  const url = `https://api.airtable.com/v0/${baseId}/${LEADS_TABLE_ID}`;
  const headers = { Authorization: `Bearer ${pat}` };
  const all: Array<{ email: string; fullName: string }> = [];
  let offset: string | undefined;
  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (offset) params.set("offset", offset);
    const res = await fetch(`${url}?${params.toString()}`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Leads list ${res.status}`);
    const data = await res.json();
    for (const r of data.records ?? []) {
      const f = r.fields ?? {};
      const email = String(f["Email"] ?? "").trim();
      const fullName = String(f["Full Name"] ?? f["Name"] ?? "").trim();
      if (email) all.push({ email, fullName });
    }
    offset = data.offset;
  } while (offset);
  return all;
}

async function buildRecipientList(): Promise<Recipient[]> {
  const [members, leads] = await Promise.all([
    listAllMembers(),
    listAllLeads(),
  ]);

  const seen = new Set<string>();
  const recipients: Recipient[] = [];

  // Members first — exclude Exited (they explicitly left).
  for (const m of members) {
    if (!m.email) continue;
    if (m.status === "Exited") continue;
    const key = m.email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    recipients.push({
      email: m.email,
      firstName: m.fullName.split(" ")[0] || "Founder",
      source: "member",
    });
  }

  // Leads second — anyone in members already wins, so dedupe by
  // the same lowercased key. Leads who never converted still get
  // the launch update.
  for (const l of leads) {
    const key = l.email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    recipients.push({
      email: l.email,
      firstName: l.fullName.split(" ")[0] || "Founder",
      source: "lead",
    });
  }

  return recipients;
}

/**
 * Resolve cohort stats from the same source of truth the portal +
 * admin surfaces use — `getCommunityPoolStats`. Reusing it here means
 * the email broadcast can never drift from what members see when
 * they open the portal: same onboarded definition (KYC started + plan
 * picked + not Exited), same monthly goal math, same net-to-pool
 * received figure (rows × R1,000, not the gross Paystack debit).
 */
async function computeStats(): Promise<PreLaunchStats> {
  const pool = await getCommunityPoolStats();
  const onboardedCount = pool.membersOnboarded;
  const juneGoal = pool.monthlyGoalAmount;
  const juneReceived = pool.monthlyReceivedAmount;
  return {
    onboardedCount,
    onboardedPct: Math.round((onboardedCount / COHORT_TARGET) * 100),
    juneReceived,
    juneGoal,
    juneReceivedPct:
      juneGoal > 0 ? Math.round((juneReceived / juneGoal) * 100) : 0,
    governanceVolunteers: GOVERNANCE_VOLUNTEERS,
    governanceTarget: GOVERNANCE_TARGET,
  };
}

/**
 * GET — render the email body as HTML directly into the browser so an
 * admin can preview the live design + numbers without firing a send.
 *
 * Admin-gated identical to POST so this URL can't leak the cohort
 * dashboard to random visitors.
 *
 * Query params:
 *   - `firstName` (optional) — override the recipient name in the
 *     greeting. Defaults to the admin's first name so the preview
 *     reads like their own copy will.
 *
 * The HTML returned is the exact same body sent to recipients — both
 * paths call `renderPreLaunchEmailHtml`, so what you see is what
 * they'll get.
 */
export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const firstNameOverride = url.searchParams.get("firstName");
    const stats = await computeStats();
    const firstName =
      firstNameOverride?.trim() ||
      session.fullName.split(" ")[0] ||
      "there";
    const html = renderPreLaunchEmailHtml({ firstName, stats });
    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        // No cache — live stats should reflect the moment the admin
        // hits refresh, not whatever was cached at first load.
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[prelaunch-email][preview]", err);
    return new Response(
      `<pre>Preview failed: ${err instanceof Error ? err.message : String(err)}</pre>`,
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    );
  }
}

export async function POST(request: NextRequest) {
  // Short request id so multiple concurrent calls don't tangle in
  // function logs. Same shape as the onboard / paystack-init routes.
  const reqId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  console.log(`[prelaunch-email][${reqId}] POST received`);

  // Admin gate. getAdminSession returns null unless the caller's
  // session belongs to an isAdminEmail allowlist entry — same
  // pattern as every other admin server action.
  const session = await getAdminSession();
  if (!session) {
    console.warn(
      `[prelaunch-email][${reqId}] rejected — no admin session`,
    );
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  console.log(
    `[prelaunch-email][${reqId}] admin session ok: ${session.email}`,
  );

  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    console.warn(
      `[prelaunch-email][${reqId}] invalid body:`,
      parsed.error.flatten().fieldErrors,
    );
    return NextResponse.json(
      {
        error: "Invalid input",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }
  const data = parsed.data;
  console.log(`[prelaunch-email][${reqId}] mode=${data.mode}`);

  try {
    if (data.mode === "test") {
      const stats = await computeStats();
      const to = data.testTo ?? session.email;
      const firstName = session.fullName.split(" ")[0] || "there";
      console.log(
        `[prelaunch-email][${reqId}] test: calling Resend with to="${to}" firstName="${firstName}"`,
      );
      const sendStart = Date.now();
      await sendPreLaunchEmail({ to, firstName, stats });
      console.log(
        `[prelaunch-email][${reqId}] test: Resend returned in ${Date.now() - sendStart}ms`,
      );
      return NextResponse.json({
        success: true,
        mode: "test",
        sentTo: to,
        firstName,
        reqId,
        stats,
      });
    }

    if (data.mode === "preview") {
      const [stats, recipients] = await Promise.all([
        computeStats(),
        buildRecipientList(),
      ]);
      return NextResponse.json({
        success: true,
        mode: "preview",
        stats,
        recipientCount: recipients.length,
        sample: recipients.slice(0, 5).map((r) => ({
          email: r.email,
          firstName: r.firstName,
          source: r.source,
        })),
        breakdown: {
          members: recipients.filter((r) => r.source === "member").length,
          leads: recipients.filter((r) => r.source === "lead").length,
        },
      });
    }

    // data.mode === "broadcast"
    const [stats, recipients] = await Promise.all([
      computeStats(),
      buildRecipientList(),
    ]);

    if (recipients.length !== data.expectedCount) {
      return NextResponse.json(
        {
          error:
            "Recipient count drifted since you last checked. Re-run preview and re-confirm.",
          code: "COUNT_MISMATCH",
          expectedCount: data.expectedCount,
          actualCount: recipients.length,
        },
        { status: 409 },
      );
    }

    // Sequential sends so we don't slam Resend with 30+ parallel
    // requests + so a partial failure doesn't leave the admin
    // wondering which recipients got through. Resend's per-request
    // latency is ~200ms so 34 recipients = ~7s total.
    const results: Array<{
      email: string;
      ok: boolean;
      error?: string;
    }> = [];
    for (const r of recipients) {
      try {
        await sendPreLaunchEmail({
          to: r.email,
          firstName: r.firstName,
          stats,
        });
        results.push({ email: r.email, ok: true });
      } catch (err) {
        results.push({
          email: r.email,
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const sentCount = results.filter((r) => r.ok).length;
    const failedCount = results.length - sentCount;

    return NextResponse.json({
      success: true,
      mode: "broadcast",
      stats,
      totalAttempted: results.length,
      sentCount,
      failedCount,
      failures: results.filter((r) => !r.ok),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : String(err);
    const errorClass =
      err instanceof Error ? err.constructor.name : "UnknownError";
    console.error(
      `[prelaunch-email][${reqId}] FAILED class="${errorClass}": ${message}`,
      err,
    );
    return NextResponse.json(
      {
        error: message,
        errorClass,
        reqId,
      },
      { status: 500 },
    );
  }
}
