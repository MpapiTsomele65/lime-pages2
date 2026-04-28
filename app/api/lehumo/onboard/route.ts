import { NextRequest, NextResponse } from "next/server";

import {
  findMemberByEmail,
  getNextMemberNumber,
  createMember,
  updateMember,
} from "@/lib/airtable";
import {
  OnboardingFormSchema,
  AIRTABLE_FIELDS,
  idTypeToAirtable,
} from "@/lib/definitions";
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

    const {
      fullName,
      email,
      phone,
      source,
      intent,
      commitment,
      plan,
      sourceOfFunds,
      idType,
      idNumber,
      residentialAddress,
    } = parsed.data;

    // Build a notes string for fields that don't yet have dedicated
    // Airtable columns (intent, commitment, plan, source-of-funds). The
    // pipe-delimited format is human-readable and round-trippable when
    // we eventually migrate plan / SoF to proper columns.
    //
    // ID type, ID number, and residential address WERE in this notes
    // blob before Tier 2A (Apr 2026) — they now live in dedicated
    // Airtable columns and flow through `setMemberKyc` / `createMember`.
    const noteParts: string[] = [];
    if (intent) noteParts.push(`Intent: ${intent}`);
    if (commitment) noteParts.push(`Commitment: ${commitment}`);
    if (plan) noteParts.push(`Plan: ${plan}`);
    if (sourceOfFunds) noteParts.push(`Source of Funds: ${sourceOfFunds}`);
    const notesValue = noteParts.length > 0 ? noteParts.join(" | ") : "";

    const existing = await findMemberByEmail(email);

    if (existing) {
      // Block users who are fully onboarded or in a non-resumable state.
      // Onboarding (KYC done, payment pending) IS resumable — those users
      // should land back on the Payment step instead of being turned away.
      if (
        existing.status === "Active" ||
        existing.status === "On Hold" ||
        existing.status === "Exited"
      ) {
        return NextResponse.json(
          {
            error: "Already onboarded",
            code: "ALREADY_ONBOARDED",
            status: existing.status,
          },
          { status: 409 },
        );
      }

      // Prospect → Onboarding (first KYC), or Onboarding → Onboarding (resume).
      // In both cases we refresh their record with the latest form values
      // and return the existing member identity so payment ties back to the
      // same Airtable row + member number.
      const updateFields: Record<string, unknown> = {
        [AIRTABLE_FIELDS.fullName]: fullName,
        [AIRTABLE_FIELDS.phone]: phone,
        [AIRTABLE_FIELDS.source]: source,
        [AIRTABLE_FIELDS.status]: "Onboarding",
        [AIRTABLE_FIELDS.kycStatus]: "Docs Requested",
      };
      if (notesValue) updateFields[AIRTABLE_FIELDS.notes] = notesValue;
      // Tier 2A: ID type / ID number / address now live in dedicated cols.
      // We patch them in the same updateMember call so the resume path
      // also gets fresh values without an extra round-trip.
      if (idType) updateFields[AIRTABLE_FIELDS.idType] = idTypeToAirtable(idType);
      if (idNumber !== undefined) updateFields[AIRTABLE_FIELDS.idNumber] = idNumber;
      if (residentialAddress !== undefined) {
        updateFields[AIRTABLE_FIELDS.residentialAddress] = residentialAddress;
      }

      const updated = await updateMember(existing.id, updateFields);

      // Welcome email only on the first transition into Onboarding —
      // resumed members already received it, no need to spam.
      if (existing.status === "Prospect") {
        sendWelcomeEmail({
          to: updated.email,
          fullName: updated.fullName,
          memberNumber: updated.memberNumber,
        }).catch((err) => console.error("Welcome email failed:", err));
      }

      return NextResponse.json({
        memberId: updated.id,
        memberNumber: updated.memberNumber,
        email: updated.email,
        resumed: existing.status === "Onboarding",
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
      // Tier 2A: write Step-3 KYC captures to dedicated Airtable columns
      // (idType / idNumber / residentialAddress) instead of stuffing them
      // into the notes blob.
      idType,
      idNumber,
      residentialAddress,
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
