import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { getMemberByIdLite, updateMember } from "@/lib/airtable";
import { disableSubscription } from "@/lib/paystack";
import {
  AIRTABLE_FIELDS,
  extractSubscriptionFromNotes,
  spliceSubscriptionIntoNotes,
} from "@/lib/definitions";

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

    // Has the member already paid any contribution? Flag it for the
    // client — when downgrading from Standard (which had a live
    // Paystack subscription) to Basic, the UI surfaces an "email admin
    // to cancel auto-debit" message because we don't have the
    // subscription code stored to disable it programmatically yet.
    //
    // We deliberately DON'T block the switch on post-payment any more
    // (previously this branch 409'd with "email admin"). Members
    // asked for self-service control over how they pay — auto-debit
    // vs manual EFT — so the flip happens server-side and the
    // member's portal updates immediately. The Paystack subscription
    // (if any) is a separate coordination step surfaced to the user.
    const hasContributions =
      (member.contributionRows?.some((row) => row.status === "Paid") ??
        false) ||
      Object.values(member.contributions).some(Boolean);
    const previousPlan =
      member.plan === "basic" || member.plan === "standard" || member.plan === "vip"
        ? member.plan
        : null;
    const isStandardToBasicDowngrade =
      previousPlan === "standard" && newPlan === "basic" && hasContributions;

    // ── Standard → Basic downgrade: try to disable the Paystack
    //    subscription. If we have a stored subscription_code we call
    //    Paystack's disable endpoint directly; on success the auto-
    //    debit stops and we don't need admin help. If we don't have
    //    the code (legacy members onboarded before the webhook started
    //    capturing it) or the disable fails, we flag `SubAction:
    //    Cancel Pending` on the member so the admin dashboard surfaces
    //    them before the next billing cycle.
    let subscriptionAutoCancelled = false;
    let subscriptionPendingAdmin = false;
    let subscriptionPatch: {
      code?: string | null;
      action?: "Cancel Pending" | null;
    } | null = null;

    if (isStandardToBasicDowngrade) {
      const existing = extractSubscriptionFromNotes(member.notes ?? "");
      if (existing.code) {
        const result = await disableSubscription(existing.code);
        if (result.ok) {
          // Subscription disabled — clear both the code and any open
          // "Cancel Pending" action.
          subscriptionAutoCancelled = true;
          subscriptionPatch = { code: null, action: null };
        } else {
          // Disable failed (network blip, code stale, etc.). Surface
          // for admin attention; keep the code so admin can retry.
          console.error(
            `[plan switch] disableSubscription failed for member ${session.memberId}: ${result.error}`,
          );
          subscriptionPendingAdmin = true;
          subscriptionPatch = { action: "Cancel Pending" };
        }
      } else {
        // No code stored — legacy member, or onboarded before webhook
        // capture landed. Flag for admin.
        subscriptionPendingAdmin = true;
        subscriptionPatch = { action: "Cancel Pending" };
      }
    }

    // ── Splice the new "Plan: X" segment into the existing notes blob.
    //    Notes are pipe-delimited segments by convention. Strip any
    //    existing Plan: segment first so the splice replaces rather
    //    than duplicates. Subscription segments are layered on after
    //    via spliceSubscriptionIntoNotes (which preserves Plan + every
    //    other unrelated segment).
    const existingNotes = member.notes ?? "";
    const stripped = existingNotes
      .split("|")
      .map((s) => s.trim())
      .filter((s) => s && !/^Plan:\s*/i.test(s));
    stripped.push(`Plan: ${newPlan}`);
    let newNotes = stripped.join(" | ");
    if (subscriptionPatch) {
      newNotes = spliceSubscriptionIntoNotes(newNotes, subscriptionPatch);
    }

    const updated = await updateMember(session.memberId, {
      [AIRTABLE_FIELDS.notes]: newNotes,
    });

    return NextResponse.json({
      ok: true,
      plan: newPlan,
      previousPlan,
      // True if we attempted and succeeded at auto-cancelling the
      // Paystack subscription. The UI uses this to confirm to the
      // member that nothing else is required.
      subscriptionAutoCancelled,
      // True if the downgrade left a "Cancel Pending" flag for admin
      // (either no subscription_code stored, or Paystack disable
      // failed). UI surfaces the mailto fallback when this is set.
      requiresAdminCancelSubscription: subscriptionPendingAdmin,
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
