import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { findMemberByEmail } from "@/lib/airtable";

// ─── Resume Onboarding Lookup ───────────────────────────────────────
// When a returning visitor enters their email at Step 1, the wizard hits
// this endpoint to find out whether they already have an in-progress
// member record. If they're status="Onboarding" (KYC done, first payment
// not yet captured), the wizard skips Steps 2 + 3 and drops them straight
// onto the Payment step with their existing member identity.
//
// 200 → eligible for resume; payload includes memberId, memberNumber,
//       and the plan they previously selected (parsed from notes).
// 404 → no record at all (proceed through the full wizard).
// 409 → record exists but is in a state that can't be resumed (Active /
//       On Hold / Exited) — frontend points the user at login or support.

const ResumeSchema = z.object({
  email: z.string().email(),
});

/**
 * Notes are currently the catch-all for plan + KYC + intent metadata —
 * they look like "Plan: standard | Source of Funds: Salary | …".
 * Pluck the plan out without mis-matching the literal word "Plan" elsewhere.
 */
function extractPlanFromNotes(notes: string): "basic" | "standard" | "vip" | null {
  const match = notes.match(/Plan:\s*(basic|standard|vip)\b/i);
  if (!match) return null;
  return match[1].toLowerCase() as "basic" | "standard" | "vip";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ResumeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 },
      );
    }

    const member = await findMemberByEmail(parsed.data.email);
    if (!member) {
      return NextResponse.json(
        { error: "No record found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    // Active members already paid — resume isn't the right path; they
    // should sign in with their member number instead.
    if (member.status === "Active") {
      return NextResponse.json(
        {
          error: "You're already an active Lehumo member.",
          code: "ALREADY_ACTIVE",
          status: member.status,
        },
        { status: 409 },
      );
    }

    // On Hold / Exited members need manual support to come back.
    if (member.status === "On Hold" || member.status === "Exited") {
      return NextResponse.json(
        {
          error: "This account isn't eligible for self-service resume.",
          code: "NOT_RESUMABLE",
          status: member.status,
        },
        { status: 409 },
      );
    }

    // Prospect = lead only; the wizard should walk them through the full
    // flow (no Step 4 shortcut). Treat as "no resumable record".
    if (member.status === "Prospect") {
      return NextResponse.json(
        { error: "Onboarding not yet started", code: "NOT_RESUMABLE" },
        { status: 404 },
      );
    }

    // Status === "Onboarding" — the resume happy path.
    return NextResponse.json({
      memberId: member.id,
      memberNumber: member.memberNumber,
      fullName: member.fullName,
      phone: member.phone,
      source: member.source,
      plan: extractPlanFromNotes(member.notes),
    });
  } catch (error) {
    console.error("Resume lookup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
