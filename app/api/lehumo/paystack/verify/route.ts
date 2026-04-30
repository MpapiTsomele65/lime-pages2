import { NextRequest, NextResponse } from "next/server";

import { verifyTransaction, getCurrentMonth } from "@/lib/paystack";
import {
  checkMonthPayment,
  setMemberActive,
  getMemberById,
} from "@/lib/airtable";
import { sendPaymentSuccessEmail } from "@/lib/email";

// ─── Paystack callback verification ─────────────────────────────────
// Hit by the Confirmation step on every page load when the user lands
// back on /lehumo/onboard?step=confirm&reference=xxx after Paystack
// hosted checkout. This route confirms the charge with Paystack, marks
// the current month paid, flips the member to Active, and (on the first
// transition only) fires the activation email.
//
// IMPORTANT: this endpoint MUST return memberNumber + fullName so the
// Confirmation step can render the "Your Member ID = LehXX" card.
// Paystack's redirect is a fresh page load that wipes the wizard's
// React state, so the frontend has nothing to display unless we hand
// the identity back.

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

    // Look up the member BEFORE flipping status so we can detect the
    // first-time transition and only fire the activation email once.
    const memberBefore = memberRecordId
      ? await getMemberById(memberRecordId)
      : null;
    const wasAlreadyActive = memberBefore?.status === "Active";

    if (memberRecordId) {
      await checkMonthPayment(memberRecordId, month, {
        // Paystack amount returns in kobo (cents); convert to ZAR for
        // the new Contributions table's Amount Received column.
        amountReceived: result.amount / 100,
        source: "Paystack",
        paymentReference: reference,
        memberId: memberBefore?.id,
        memberNumber: memberBefore?.memberNumber,
      });
      await setMemberActive(memberRecordId);
    }

    if (memberBefore && !wasAlreadyActive) {
      // Fire-and-forget — activation email shouldn't block the verify
      // response. Errors are logged but never surfaced to the user.
      sendPaymentSuccessEmail({
        to: memberBefore.email,
        fullName: memberBefore.fullName,
        memberNumber: memberBefore.memberNumber,
        amountZar: result.amount / 100, // Paystack returns kobo (cents)
        month,
      }).catch((err) =>
        console.error("Activation email failed:", err),
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
