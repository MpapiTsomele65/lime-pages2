import { NextRequest, NextResponse } from "next/server";

import { validateWebhookSignature, getCurrentMonth } from "@/lib/paystack";
import {
  checkMonthPayment,
  setMemberActive,
  getMemberById,
} from "@/lib/airtable";
import { sendPaymentSuccessEmail } from "@/lib/email";

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
      const amount = (payload.data?.amount as number) ?? 0;

      if (memberRecordId) {
        const month = getCurrentMonth();

        // Read first to detect the first-time activation. The verify
        // endpoint usually wins this race (it runs in the user's
        // browser session right after the redirect), but if the user
        // closes their tab before the redirect completes the webhook
        // is the only path that fires the activation email.
        const memberBefore = await getMemberById(memberRecordId);
        const wasAlreadyActive = memberBefore?.status === "Active";

        await checkMonthPayment(memberRecordId, month);
        await setMemberActive(memberRecordId);

        if (memberBefore && !wasAlreadyActive) {
          sendPaymentSuccessEmail({
            to: memberBefore.email,
            fullName: memberBefore.fullName,
            memberNumber: memberBefore.memberNumber,
            amountZar: amount / 100,
            month,
          }).catch((err) =>
            console.error("Activation email (webhook) failed:", err),
          );
        }
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
