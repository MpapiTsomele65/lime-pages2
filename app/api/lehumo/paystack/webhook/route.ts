import { NextRequest, NextResponse } from "next/server";

import { validateWebhookSignature } from "@/lib/paystack";
import {
  checkMonthPayment,
  setMemberActive,
  getMemberById,
  updateMember,
} from "@/lib/airtable";
import { getContributionByKey } from "@/lib/contributions";
import {
  sendPaymentSuccessEmail,
  sendContributionReceiptEmail,
} from "@/lib/email";
import {
  AIRTABLE_FIELDS,
  buildContributionKey,
  spliceSubscriptionIntoNotes,
} from "@/lib/definitions";
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

    // ── subscription lifecycle events ─────────────────────────────────
    // When a member's debit-order is first created (Standard plan card
    // setup), Paystack fires `subscription.create` with the subscription
    // code we need to disable it later. Capture it onto the member's
    // notes blob so the plan-switch flow can auto-cancel without
    // admin coordination.
    if (payload.event === "subscription.create") {
      const subscriptionCode = payload.data?.subscription_code as
        | string
        | undefined;
      const customerEmail = (payload.data?.customer?.email as string)
        ?.toLowerCase()
        .trim();

      if (subscriptionCode && customerEmail) {
        try {
          // Resolve member by email — we don't get memberRecordId on
          // subscription events, only customer.email. The customer was
          // created with the email we use as the member's primary ID
          // on init, so this lookup is reliable.
          const lookupRes = await fetch(
            `${process.env.AIRTABLE_API_BASE ?? "https://api.airtable.com/v0"}/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_ID}?filterByFormula=${encodeURIComponent(
              `LOWER({Email})="${customerEmail}"`,
            )}&maxRecords=1`,
            {
              headers: {
                Authorization: `Bearer ${process.env.AIRTABLE_PAT}`,
              },
            },
          );
          const lookupData = await lookupRes.json();
          const record = lookupData.records?.[0];
          if (record) {
            const newNotes = spliceSubscriptionIntoNotes(
              record.fields?.[AIRTABLE_FIELDS.notes] ?? "",
              { code: subscriptionCode },
            );
            await updateMember(record.id, {
              [AIRTABLE_FIELDS.notes]: newNotes,
            });
            console.log(
              `[paystack webhook] captured subscription_code=${subscriptionCode} for member=${record.id} (${customerEmail})`,
            );
          } else {
            console.warn(
              `[paystack webhook] subscription.create for unknown email=${customerEmail} sub=${subscriptionCode}`,
            );
          }
        } catch (err) {
          console.error(
            `[paystack webhook] failed to capture subscription_code for ${customerEmail}:`,
            err,
          );
        }
      }
    }

    // Mirror cleanup path — when Paystack signals a subscription has
    // been cancelled (admin used dashboard / Paystack-side cancellation
    // / our own disable call), wipe the stored code and any "Cancel
    // Pending" admin flag so the portal + admin dashboard reflect the
    // resolved state on next refresh.
    if (payload.event === "subscription.disable") {
      const subscriptionCode = payload.data?.subscription_code as
        | string
        | undefined;
      const customerEmail = (payload.data?.customer?.email as string)
        ?.toLowerCase()
        .trim();

      if (subscriptionCode && customerEmail) {
        try {
          const lookupRes = await fetch(
            `${process.env.AIRTABLE_API_BASE ?? "https://api.airtable.com/v0"}/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_ID}?filterByFormula=${encodeURIComponent(
              `LOWER({Email})="${customerEmail}"`,
            )}&maxRecords=1`,
            {
              headers: {
                Authorization: `Bearer ${process.env.AIRTABLE_PAT}`,
              },
            },
          );
          const lookupData = await lookupRes.json();
          const record = lookupData.records?.[0];
          if (record) {
            const newNotes = spliceSubscriptionIntoNotes(
              record.fields?.[AIRTABLE_FIELDS.notes] ?? "",
              { code: null, action: null },
            );
            await updateMember(record.id, {
              [AIRTABLE_FIELDS.notes]: newNotes,
            });
            console.log(
              `[paystack webhook] cleared subscription state for member=${record.id} (${customerEmail}) on subscription.disable`,
            );
          }
        } catch (err) {
          console.error(
            `[paystack webhook] failed to clear subscription state for ${customerEmail}:`,
            err,
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
