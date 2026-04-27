import { NextRequest, NextResponse } from "next/server";

import {
  initializeTransaction,
  getPlanCodeForPlan,
  getAmountForPlan,
} from "@/lib/paystack";
import { PaystackInitSchema } from "@/lib/definitions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = PaystackInitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { email, memberRecordId, plan } = parsed.data;

    // Resolve the plan code (only Standard uses subscriptions for now).
    // Basic = manual EFT (never hits this endpoint); VIP = coming soon.
    const planCode = plan ? getPlanCodeForPlan(plan) : null;

    if (plan === "standard" && !planCode) {
      // Subscription explicitly requested but the env var is missing —
      // surface a clear error rather than silently falling back to a
      // one-time charge at a guessed price.
      return NextResponse.json(
        {
          error:
            "Standard plan is not yet configured. Please contact support.",
        },
        { status: 503 },
      );
    }

    // Paystack requires `amount` on every initialize call, even when a plan
    // code is supplied (the plan still drives recurring billing). Use the
    // plan's known kobo amount; fall back to R1,000 for legacy one-time use.
    const amount = (plan && getAmountForPlan(plan)) || 100000;

    const result = await initializeTransaction({
      email,
      amount,
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/lehumo/onboard?step=confirm`,
      metadata: {
        memberRecordId,
        plan: plan || "unknown",
        type: planCode ? "subscription_first_charge" : "one_time_contribution",
      },
      planCode: planCode || undefined,
    });

    return NextResponse.json({
      authorization_url: result.authorization_url,
      reference: result.reference,
    });
  } catch (error) {
    console.error("Paystack init error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
