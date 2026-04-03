import { NextRequest, NextResponse } from "next/server";

import { verifyTransaction, getCurrentMonth } from "@/lib/paystack";
import { checkMonthPayment, setMemberActive } from "@/lib/airtable";

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

    if (result.status === "success") {
      const memberRecordId = result.metadata.memberRecordId as string;
      const month = getCurrentMonth();

      await checkMonthPayment(memberRecordId, month);
      await setMemberActive(memberRecordId);

      return NextResponse.json({
        status: result.status,
        amount: result.amount,
        month,
      });
    }

    return NextResponse.json({
      status: result.status,
      amount: result.amount,
      month: null,
    });
  } catch (error) {
    console.error("Paystack verify error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
