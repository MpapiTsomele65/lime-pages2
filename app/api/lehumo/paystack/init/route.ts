import { NextRequest, NextResponse } from "next/server";

import {
  initializeTransaction,
  getPlanCodeForPlan,
  getAmountForPlan,
} from "@/lib/paystack";
import { PaystackInitSchema } from "@/lib/definitions";
import { siteUrl } from "@/lib/site-url";

/**
 * Stages of the Paystack init flow. Same pattern as /api/lehumo/onboard
 * — we update `stage` before each await so the catch knows exactly
 * which call blew up. Surface the stage code + requestId in both the
 * server log and the 500 response so production failures are
 * triage-able instead of an opaque "Internal server error".
 */
type Stage =
  | "parse_body"
  | "validate_input"
  | "resolve_plan"
  | "initialize_transaction";

export async function POST(request: NextRequest) {
  // Short request id (8 hex chars). Matches the onboard route's format
  // so support sees a consistent ref shape regardless of which step
  // failed.
  const requestId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  let stage: Stage = "parse_body";

  try {
    stage = "parse_body";
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "BAD_JSON", requestId },
        { status: 400 },
      );
    }

    stage = "validate_input";
    const parsed = PaystackInitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsed.error.flatten().fieldErrors,
          code: "INVALID_INPUT",
          requestId,
        },
        { status: 400 },
      );
    }

    const { email, memberRecordId, plan, returnTo, oneOff } = parsed.data;

    // Resolve the plan code (only Standard uses subscriptions for now).
    // Basic = manual EFT (never hits this endpoint); VIP = coming soon.
    // One-off mode skips the plan code entirely — Paystack treats the
    // request as a single-transaction charge so we don't spawn a
    // duplicate subscription for members who already have one.
    stage = "resolve_plan";
    const planCode = oneOff ? null : plan ? getPlanCodeForPlan(plan) : null;

    if (!oneOff && plan === "standard" && !planCode) {
      // Subscription explicitly requested but the env var is missing —
      // surface a clear error rather than silently falling back to a
      // one-time charge at a guessed price.
      return NextResponse.json(
        {
          error:
            "Standard plan is not yet configured. Please contact support.",
          code: "PLAN_NOT_CONFIGURED",
          requestId,
        },
        { status: 503 },
      );
    }

    // Paystack requires `amount` on every initialize call, even when a plan
    // code is supplied (the plan still drives recurring billing). Use the
    // plan's known kobo amount; fall back to R1,000 for legacy one-time use.
    const amount = (plan && getAmountForPlan(plan)) || 100000;

    // Callback URL depends on where the payment was started. Portal
    // members (existing, already inside the dashboard) bounce back to
    // /lehumo/portal with a success flag so they see "Paid This Month"
    // light up where they expect. New onboarding traffic stays on the
    // wizard's Confirmation step. Default ("onboard") preserves the
    // legacy behaviour for any caller that doesn't pass the param.
    stage = "initialize_transaction";
    const callbackPath =
      returnTo === "portal"
        ? "/lehumo/portal?payment=success"
        : "/lehumo/onboard?step=confirm";

    const result = await initializeTransaction({
      email,
      amount,
      callbackUrl: `${siteUrl()}${callbackPath}`,
      metadata: {
        memberRecordId,
        plan: plan || "unknown",
        type: oneOff
          ? "one_off_advance_payment"
          : planCode
            ? "subscription_first_charge"
            : "one_time_contribution",
      },
      planCode: planCode || undefined,
    });

    return NextResponse.json({
      authorization_url: result.authorization_url,
      reference: result.reference,
      requestId,
    });
  } catch (error) {
    // Same error-reporting shape as /api/lehumo/onboard. The console
    // line carries everything dev/support need (requestId, stage,
    // error class, underlying message — typically the Paystack API
    // body); the JSON response keeps the surface lean (stage code +
    // ref) so users have a quotable handle without leaking internals.
    const message = error instanceof Error ? error.message : String(error);
    const errorClass = error instanceof Error ? error.constructor.name : "UnknownError";

    console.error(
      `[paystack-init][${requestId}] failed at stage="${stage}" class="${errorClass}": ${message}`,
      error,
    );

    return NextResponse.json(
      {
        error: `We couldn't start your payment (ref ${requestId}). Please try again — if it keeps happening, email lehumo@limepages.co.za with this ref and we'll sort it.`,
        code: `STAGE_${stage.toUpperCase()}_FAILED`,
        stage,
        requestId,
      },
      { status: 500 },
    );
  }
}
