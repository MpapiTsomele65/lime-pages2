import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { getMemberByIdLite, updateMember } from "@/lib/airtable";
import { AIRTABLE_FIELDS } from "@/lib/definitions";

/**
 * Member-portal plan switcher.
 *
 * Lets a member change their plan tier (basic / standard / vip)
 * before they've made their first contribution. Use case: someone
 * picked Standard during onboarding, sees the 2% service fee
 * on the SetUpPaymentsCard, decides they'd rather DIY via EFT to
 * save the fee. Or a Basic-plan member wants the convenience of
 * automated debit and switches to Standard.
 *
 * The plan is stored as a `Plan: <tier>` segment in the member's
 * `notes` field (no dedicated column yet — see extractPlanFromNotes
 * in lib/definitions.ts for the read path). This endpoint updates
 * just that segment, leaving every other note part (Intent,
 * Commitment, Source of Funds) untouched.
 *
 * Guarded against post-payment switches — once the member has paid
 * any month, this route 409s and tells them to email lehumo@... to
 * coordinate the change. Live plan changes require coordinating
 * with the existing Paystack subscription if there is one, and
 * that's out of scope here for v1.
 */

const VALID_PLANS = new Set(["basic", "standard", "vip"]);

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as {
      plan?: unknown;
    } | null;
    if (!body || typeof body.plan !== "string" || !VALID_PLANS.has(body.plan)) {
      return NextResponse.json(
        { error: "plan must be 'basic', 'standard', or 'vip'" },
        { status: 400 },
      );
    }
    const newPlan = body.plan as "basic" | "standard" | "vip";

    // Read the current member to (a) compose the new notes blob,
    // (b) gate against post-payment switches.
    const member = await getMemberByIdLite(session.memberId);
    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 },
      );
    }

    // Has the member already paid any contribution? If so, switching
    // plans needs admin help — there's a live Paystack subscription
    // (potentially) and historical contributions tagged with the old
    // plan. Block the switch and surface an actionable email path.
    const hasContributions =
      (member.contributionRows?.some((row) => row.status === "Paid") ??
        false) ||
      Object.values(member.contributions).some(Boolean);
    if (hasContributions) {
      return NextResponse.json(
        {
          error:
            "Plan changes after your first contribution need to go through admin — drop us a line at lehumo@limepages.co.za and we'll coordinate.",
          code: "POST_PAYMENT_SWITCH",
        },
        { status: 409 },
      );
    }

    // Splice the new "Plan: X" segment into the existing notes blob.
    // Notes are pipe-delimited segments by convention (set by the
    // onboard route). Strip any existing Plan: segment (regardless of
    // case / spacing variations) before appending the canonical one.
    const existingNotes = member.notes ?? "";
    const stripped = existingNotes
      .split("|")
      .map((s) => s.trim())
      .filter((s) => s && !/^Plan:\s*/i.test(s));
    stripped.push(`Plan: ${newPlan}`);
    const newNotes = stripped.join(" | ");

    const updated = await updateMember(session.memberId, {
      [AIRTABLE_FIELDS.notes]: newNotes,
    });

    return NextResponse.json({
      ok: true,
      plan: newPlan,
      memberId: updated.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Plan switch error:", err);
    return NextResponse.json(
      { error: `Plan switch failed: ${message}` },
      { status: 500 },
    );
  }
}
