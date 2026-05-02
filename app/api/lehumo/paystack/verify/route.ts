import { NextRequest, NextResponse } from "next/server";

import { verifyTransaction, getCurrentMonth } from "@/lib/paystack";
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

// ─── Paystack callback verification ─────────────────────────────────
// Hit by the Confirmation step on every page load when the user lands
// back on /lehumo/onboard?step=confirm&reference=xxx after Paystack
// hosted checkout. This route confirms the charge with Paystack, marks
// the current month paid, flips the member to Active, and fires the
// right email (first-activation vs ongoing receipt).
//
// Idempotency: webhook + verify both fire for the same payment in
// real life (the user redirects → verify hits, AND Paystack's server
// independently calls webhook). Both paths read the contribution row
// for the period before writing — if it's already Paid we
// short-circuit. That prevents duplicate receipts even when both
// paths win the race for a given payment.
//
// IMPORTANT: this endpoint MUST return memberNumber + fullName so the
// Confirmation step can render the "Your Member ID = LehXX" card.
// Paystack's redirect is a fresh page load that wipes the wizard's
// React state, so the frontend has nothing to display unless we hand
// the identity back.

/** Build the YYYY-MM period from a 3-letter month name (Jan, Feb, …). */
function monthToPeriod(month: string): string {
  const idx = MONTH_NAMES.indexOf(month);
  if (idx < 0) throw new Error(`Invalid month: ${month}`);
  return `${getSastYear()}-${String(idx + 1).padStart(2, "0")}`;
}

/** Display copy for the period subject lines etc — e.g. "Jun 2026". */
function formatMonthLabel(month: string): string {
  return `${month} ${getSastYear()}`;
}

export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get("reference");

    if (!reference) {
      return NextResponse.json(
        { error: "Missing reference parameter" },
        { status: 400 },
      );
    }

    const result = await verifyTransaction(reference);

    if (result.status !== "success") {
      return NextResponse.json({
        status: result.status,
        amount: result.amount,
        month: null,
      });
    }

    const memberRecordId = result.metadata.memberRecordId as string;
    const month = getCurrentMonth();
    const period = monthToPeriod(month);

    if (!memberRecordId) {
      return NextResponse.json({
        status: result.status,
        amount: result.amount,
        month,
      });
    }

    // Read pre-write state — both for the activation-email gate (was
    // the member already Active?) and the idempotency gate (is this
    // period already Paid?).
    const memberBefore = await getMemberById(memberRecordId);
    const wasAlreadyActive = memberBefore?.status === "Active";
    const memberNumber = memberBefore?.memberNumber;

    // Idempotency check — if a duplicate verify hits (user refreshes
    // the confirm page) or the webhook beat us to it, the contribution
    // row is already Paid. Short-circuit so we don't double-send the
    // receipt email or rewrite the same row.
    let wasPeriodAlreadyPaid = false;
    if (memberNumber !== undefined) {
      const existing = await getContributionByKey(
        buildContributionKey(memberNumber, period),
      );
      wasPeriodAlreadyPaid = existing?.status === "Paid";
    }

    if (wasPeriodAlreadyPaid) {
      console.log(
        `[paystack verify] idempotent hit — ${reference} for ${memberRecordId} period=${period} already Paid; skipping`,
      );
      return NextResponse.json({
        status: result.status,
        amount: result.amount,
        month,
        memberNumber: memberBefore?.memberNumber,
        fullName: memberBefore?.fullName,
        idempotent: true,
      });
    }

    // Persist + flip to Active in lockstep. setMemberActive is a no-op
    // if the member's already Active, so the second branch (recurring
    // payment) is harmless.
    await checkMonthPayment(memberRecordId, month, {
      // Paystack amount returns in kobo (cents); convert to ZAR for
      // the Contributions table's Amount Received column.
      amountReceived: result.amount / 100,
      source: "Paystack",
      paymentReference: reference,
      memberId: memberBefore?.id,
      memberNumber,
    });
    await setMemberActive(memberRecordId);

    if (memberBefore) {
      const amountZar = result.amount / 100;
      // First-time activation email vs recurring receipt — picked by
      // the pre-write member status. !wasAlreadyActive means this is
      // the very first contribution that's flipping them Active, so
      // they get the welcome-flavoured copy. Subsequent months get
      // the leaner monthly receipt.
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
              paymentReference: reference,
            });
      // Fire-and-forget — email errors must never block the verify
      // response (the user is staring at a loading spinner).
      emailFn().catch((err) =>
        console.error(
          `[paystack verify] email failed (active=${wasAlreadyActive}):`,
          err,
        ),
      );
    }

    return NextResponse.json({
      status: result.status,
      amount: result.amount,
      month,
      memberNumber: memberBefore?.memberNumber,
      fullName: memberBefore?.fullName,
    });
  } catch (error) {
    console.error("Paystack verify error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
