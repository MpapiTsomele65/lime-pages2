import { NextRequest, NextResponse } from "next/server";

import { validateWebhookSignature, getCurrentMonth } from "@/lib/paystack";
import {
  checkMonthPayment,
  setMemberActive,
  getMemberById,
} from "@/lib/airtable";
import { getContributionByKey } from "@/lib/contributions";
import {
  sendPaymentSuccessEmail,
  sendContributionReceiptEmail,
} from "@/lib/email";
import { buildContributionKey, MONTH_NAMES } from "@/lib/definitions";
import { getSastYear } from "@/lib/member-contributions-view";

// Paystack server-to-server webhook. Mirrors verify/route.ts on the
// idempotency + email-routing logic so both paths converge on the
// same end state regardless of which one wins the race for a given
// payment.

function monthToPeriod(month: string): string {
  const idx = MONTH_NAMES.indexOf(month);
  if (idx < 0) throw new Error(`Invalid month: ${month}`);
  return `${getSastYear()}-${String(idx + 1).padStart(2, "0")}`;
}

function formatMonthLabel(month: string): string {
  return `${month} ${getSastYear()}`;
}

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
      const paystackRef = (payload.data?.reference as string) ?? "";
      // `paid_at` is ISO 8601 from Paystack, e.g. "2026-06-01T08:13:42.000Z".
      const paidAtIso = (payload.data?.paid_at as string) ?? "";

      if (memberRecordId) {
        const month = getCurrentMonth();
        const period = monthToPeriod(month);

        // Read first to detect first-time activation + idempotency.
        // Verify usually wins the race (it runs in the user's browser
        // session right after the redirect), but if the user closes
        // their tab before the redirect completes, the webhook is the
        // only path that fires the email. Either way, this read +
        // the wasPeriodAlreadyPaid gate make the payment write +
        // email send safely idempotent across both routes.
        const memberBefore = await getMemberById(memberRecordId);
        const wasAlreadyActive = memberBefore?.status === "Active";
        const memberNumber = memberBefore?.memberNumber;

        let wasPeriodAlreadyPaid = false;
        if (memberNumber !== undefined) {
          const existing = await getContributionByKey(
            buildContributionKey(memberNumber, period),
          );
          wasPeriodAlreadyPaid = existing?.status === "Paid";
        }

        if (wasPeriodAlreadyPaid) {
          console.log(
            `[paystack webhook] idempotent hit — ${paystackRef} for ${memberRecordId} period=${period} already Paid; skipping`,
          );
          return NextResponse.json({ received: true, idempotent: true });
        }

        await checkMonthPayment(memberRecordId, month, {
          // Paystack amount comes back in kobo; convert to ZAR for the
          // Contributions table's Amount Received column.
          amountReceived: amount / 100,
          source: "Paystack",
          paymentReference: paystackRef,
          paymentDate: paidAtIso ? paidAtIso.slice(0, 10) : undefined,
          memberId: memberBefore?.id,
          memberNumber,
        });
        await setMemberActive(memberRecordId);

        if (memberBefore) {
          const amountZar = amount / 100;
          const emailFn = !wasAlreadyActive
            ? () =>
                sendPaymentSuccessEmail({
                  to: memberBefore.email,
                  fullName: memberBefore.fullName,
                  memberNumber: memberBefore.memberNumber,
                  amountZar,
                  month,
                })
            : () =>
                sendContributionReceiptEmail({
                  to: memberBefore.email,
                  fullName: memberBefore.fullName,
                  memberNumber: memberBefore.memberNumber,
                  amountZar,
                  monthLabel: formatMonthLabel(month),
                  paymentReference: paystackRef,
                });
          emailFn().catch((err) =>
            console.error(
              `[paystack webhook] email failed (active=${wasAlreadyActive}):`,
              err,
            ),
          );
        }
      }
    }

    // Paystack requires a quick 200 response — anything else gets retried.
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook error:", error);
    // Still return 200 to prevent Paystack retries on server errors —
    // the verify path will catch up if the user redirects, and we'd
    // rather log + investigate than thrash on retries.
    return NextResponse.json({ received: true });
  }
}
