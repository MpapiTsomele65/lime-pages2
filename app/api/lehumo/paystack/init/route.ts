import { NextRequest, NextResponse } from "next/server";

import { initializeTransaction } from "@/lib/paystack";
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

    const { email, memberRecordId } = parsed.data;

    const result = await initializeTransaction({
      email,
      amount: 100000, // R1,000 in kobo
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/lehumo/onboard?step=confirm`,
      metadata: {
        memberRecordId,
        type: "monthly_contribution",
      },
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
