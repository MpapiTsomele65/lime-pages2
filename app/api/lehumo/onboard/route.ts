import { NextRequest, NextResponse } from "next/server";

import {
  findMemberByEmail,
  getNextMemberNumber,
  createMember,
  updateMember,
} from "@/lib/airtable";
import { OnboardingFormSchema, AIRTABLE_FIELDS } from "@/lib/definitions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = OnboardingFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { fullName, email, phone, source } = parsed.data;

    const existing = await findMemberByEmail(email);

    if (existing && existing.status !== "Prospect") {
      return NextResponse.json(
        { error: "Already onboarded" },
        { status: 409 },
      );
    }

    if (existing) {
      // Existing prospect — update their record
      const updated = await updateMember(existing.id, {
        [AIRTABLE_FIELDS.fullName]: fullName,
        [AIRTABLE_FIELDS.phone]: phone,
        [AIRTABLE_FIELDS.source]: source,
        [AIRTABLE_FIELDS.status]: "Onboarding",
        [AIRTABLE_FIELDS.kycStatus]: "Docs Requested",
      });

      return NextResponse.json({
        memberId: updated.id,
        memberNumber: updated.memberNumber,
        email: updated.email,
      });
    }

    // New member
    const memberNumber = await getNextMemberNumber();
    const record = await createMember({
      fullName,
      email,
      phone,
      source,
      memberNumber,
    });

    return NextResponse.json({
      memberId: record.id,
      memberNumber: record.memberNumber,
      email: record.email,
    });
  } catch (error) {
    console.error("Onboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
