import { NextRequest, NextResponse } from "next/server";
import { findMemberByEmail } from "@/lib/airtable";
import { sendMemberNumberEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email || "").trim().toLowerCase();

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    const member = await findMemberByEmail(email);

    // Always return success to prevent email enumeration
    if (!member) {
      return NextResponse.json({ success: true });
    }

    await sendMemberNumberEmail({
      to: member.email,
      fullName: member.fullName,
      memberNumber: member.memberNumber,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot member number error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
