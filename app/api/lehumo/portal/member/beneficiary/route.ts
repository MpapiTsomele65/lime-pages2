import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { getMemberById, setMemberBeneficiary } from "@/lib/airtable";
import { BeneficiaryFormSchema } from "@/lib/definitions";

/**
 * Member-portal beneficiary update.
 *
 * Flow:
 *   1. Auth via session cookie.
 *   2. Validate payload with BeneficiaryFormSchema. The schema enforces
 *      required (firstName, surname, relationship) and the "at least one
 *      contact channel" rule (phone || email || address).
 *   3. Confirm the member exists & belongs to this session — guards
 *      against a stale cookie pointing at a deleted record.
 *   4. Patch beneficiary fields on the member's Airtable row and stamp
 *      `beneficiaryUpdatedAt` with today's date.
 *   5. Return the freshly-fetched member so the client can re-render.
 *
 * No status side-effects (unlike the KYC upload route, which auto-flips
 * kycStatus). Beneficiary detail is independent metadata — admins don't
 * need a queue here, just a "last updated" timestamp.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json().catch(() => null);
    if (!json) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const parsed = BeneficiaryFormSchema.safeParse(json);
    if (!parsed.success) {
      // Surface the first issue to the client so the form can highlight it.
      const firstIssue =
        parsed.error.issues[0]?.message ?? "Invalid beneficiary details";
      return NextResponse.json({ error: firstIssue }, { status: 400 });
    }

    const data = parsed.data;

    // Confirm the session points at a real record before we PATCH.
    const existing = await getMemberById(session.memberId);
    if (!existing) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const updated = await setMemberBeneficiary(session.memberId, {
      firstName: data.firstName,
      surname: data.surname,
      relationship: data.relationship,
      phone: data.phone,
      email: data.email,
      address: data.address,
    });

    return NextResponse.json({ member: updated });
  } catch (error) {
    console.error("Beneficiary update error:", error);
    return NextResponse.json(
      { error: "Could not save beneficiary. Please try again." },
      { status: 500 },
    );
  }
}
