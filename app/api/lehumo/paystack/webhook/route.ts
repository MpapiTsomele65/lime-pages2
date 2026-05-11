import { NextRequest, NextResponse } from "next/server";

import { validateWebhookSignature } from "@/lib/paystack";
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
import { buildContributionKey } from "@/lib/definitions";
import {
  getCreditMonthAndPeriod,
  getSastYear,
} from "@/lib/member-contributions-view";

// Paystack server-to-server webhook. Mirrors verify/route.ts on the
// idempotency + email-routing logic so both paths converge on the
// same end state regardless of which one wins the race for a given
// payment.

/** Display copy for the period subject lines etc — e.g. "Jun 2026".
 *  Uses the period (`YYYY-MM`) directly so pre-launch payments credited
 *  to 2026-06 are labelled "Jun 2026" rather than the current SAST
 *  calendar year. */
function formatMonthLabel(month: string, period: string): string {
  const year = period.slice(0, 4);
  return `${month} ${year || getSastYear()}`;
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
        // Pre-launch payments are credited to June 2026 (the official
        // first collection month) — no May 2026 ghost contributions
        // for recon to chase. Post-launch this falls through to the
        // SAST-current month. Mirrors the verify route's gate so both
        // paths produce identical Contribution Keys.
        const { month, period } = getCreditMonthAndPeriod();

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

        // Explicit `period` so the pre-launch override (2026-06) makes
        // it through to the Contribution Key — without it,
        // `checkMonthPayment` would re-derive the period from the SAST
        // year and the May/Jun ambiguity would resurface.
        await checkMonthPayment(memberRecordId, month, {
          period,
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
                  monthLabel: formatMonthLabel(month, period),
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
