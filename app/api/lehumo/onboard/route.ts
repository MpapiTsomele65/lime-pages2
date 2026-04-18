import { NextRequest, NextResponse } from "next/server";

import {
  findMemberByEmail,
  getNextMemberNumber,
  createMember,
  updateMember,
} from "@/lib/airtable";
import { OnboardingFormSchema, AIRTABLE_FIELDS } from "@/lib/definitions";
import { sendWelcomeEmail } from "@/lib/email";

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

    const { fullName, email, phone, source, intent, plan, sourceOfFunds } = parsed.data;

    // Build a notes string with extra fields until dedicated Airtable columns exist
    const noteParts: string[] = [];
    if (intent) noteParts.push(`Intent: ${intent}`);
    if (plan) noteParts.push(`Plan: ${plan}`);
    if (sourceOfFunds) noteParts.push(`Source of Funds: ${sourceOfFunds}`);
    const notesValue = noteParts.length > 0 ? noteParts.join(" | ") : "";

    const existing = await findMemberByEmail(email);

    if (existing && existing.status !== "Prospect") {
      return NextResponse.json(
        { error: "Already onboarded" },
        { status: 409 },
      );
    }

    if (existing) {
      // Existing prospect — update their record
      const updateFields: Record<string, unknown> = {
        [AIRTABLE_FIELDS.fullName]: fullName,
        [AIRTABLE_FIELDS.phone]: phone,
        [AIRTABLE_FIELDS.source]: source,
        [AIRTABLE_FIELDS.status]: "Onboarding",
        [AIRTABLE_FIELDS.kycStatus]: "Docs Requested",
      };
      if (notesValue) updateFields[AIRTABLE_FIELDS.notes] = notesValue;

      const updated = await updateMember(existing.id, updateFields);

      // Send welcome email (non-blocking)
      sendWelcomeEmail({
        to: updated.email,
        fullName: updated.fullName,
        memberNumber: updated.memberNumber,
      }).catch((err) => console.error("Welcome email failed:", err));

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
      notes: notesValue,
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail({
      to: record.email,
      fullName: record.fullName,
      memberNumber: record.memberNumber,
    }).catch((err) => console.error("Welcome email failed:", err));

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
