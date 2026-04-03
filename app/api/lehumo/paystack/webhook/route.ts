import { NextRequest, NextResponse } from "next/server";

import { validateWebhookSignature, getCurrentMonth } from "@/lib/paystack";
import { checkMonthPayment, setMemberActive } from "@/lib/airtable";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-paystack-signature") || "";

    if (!validateWebhookSignature(rawBody, signature)) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 },
      );
    }

    const payload = JSON.parse(rawBody);

    if (payload.event === "charge.success") {
      const memberRecordId = payload.data?.metadata?.memberRecordId as string;

      if (memberRecordId) {
        const month = getCurrentMonth();
        await checkMonthPayment(memberRecordId, month);
        await setMemberActive(memberRecordId);
      }
    }

    // Paystack requires a 200 response quickly
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook error:", error);
    // Still return 200 to prevent Paystack retries on server errors
    return NextResponse.json({ received: true });
  }
}
