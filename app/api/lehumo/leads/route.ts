import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  createLeadIfNew,
  type LeadPlanInterest,
  type LeadSource,
} from "@/lib/airtable-leads";

const SOURCES: [LeadSource, ...LeadSource[]] = [
  "Onboarding — Step 1",
  "Referral Form",
  "Waitlist",
  "Other",
];

const PLANS: [LeadPlanInterest, ...LeadPlanInterest[]] = [
  "basic",
  "standard",
  "vip",
  "unsure",
];

const BodySchema = z.object({
  fullName: z.string().min(2, "Please enter your full name").max(200),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().max(40).optional().or(z.literal("")),
  source: z.enum(SOURCES),
  referredByName: z.string().max(200).optional().or(z.literal("")),
  planInterest: z.enum(PLANS).optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

/**
 * Public endpoint. Writes a lead to the "Lehumo Leads" Airtable table.
 * Used by:
 *   - The referral form in the Lehumo public page
 *   - The onboarding wizard Step 1 auto-save (source = "Onboarding — Step 1")
 *
 * Intentionally lenient on failures (Airtable hiccup → still returns 200 to
 * the client) so that flows which depend on it don't visibly break.
 */
export async function POST(request: NextRequest) {
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const d = parsed.data;
    await createLeadIfNew({
      fullName: d.fullName.trim(),
      email: d.email.trim().toLowerCase(),
      phone: d.phone?.trim() || undefined,
      source: d.source,
      referredByName: d.referredByName?.trim() || undefined,
      planInterest: d.planInterest,
      notes: d.notes?.trim() || undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Leads POST error:", error);
    // Never surface a 500 to the referral-form user — silently accept so
    // they see the success state. We'll still see the error server-side.
    return NextResponse.json({ ok: true });
  }
}
