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
import { ensureCanonicalMemberSchedule } from "@/lib/contributions";

/**
 * Stages of the onboard flow. We update `stage` before each `await` so
 * the outer catch knows exactly which call failed when something throws
 * — instead of returning an opaque "Internal server error" that gives
 * support no clue whether Airtable lookup, member-number assignment,
 * record creation, or anything else was the culprit.
 *
 * The stage code is mirrored in the 500 response (`code` field) and
 * the server log line, both keyed by the same short request id, so
 * users can quote the ref when reporting a failure and we can grep
 * Vercel logs to see exactly which step blew up.
 */
type Stage =
  | "parse_body"
  | "validate_input"
  | "lookup_existing"
  | "update_existing"
  | "assign_member_number"
  | "create_member";

export async function POST(request: NextRequest) {
  // Short request id (8 hex chars) — log-friendly, user-quotable. Long
  // enough to be unique within the support window, short enough that a
  // member can read it back over WhatsApp without typos.
  const requestId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  let stage: Stage = "parse_body";

  try {
    stage = "parse_body";
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      // Malformed JSON is a client error, not a server fault — surface
      // a 400 instead of letting it tumble into the 500 path.
      return NextResponse.json(
        { error: "Invalid JSON body", code: "BAD_JSON", requestId },
        { status: 400 },
      );
    }

    stage = "validate_input";
    const parsed = OnboardingFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsed.error.flatten().fieldErrors,
          code: "INVALID_INPUT",
          requestId,
        },
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

    stage = "lookup_existing";
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
            requestId,
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

      stage = "update_existing";
      const updated = await updateMember(existing.id, updateFields);

      // Welcome email only on the first transition into Onboarding —
      // resumed members already received it, no need to spam.
      // Detached on purpose: a Resend hiccup (or a missing API key) must
      // not roll back a successful Airtable update. The async function's
      // own .catch handles any rejection, including a sync throw from
      // getResend() when RESEND_API_KEY is unset — async functions
      // convert sync throws into rejected promises by definition.
      if (existing.status === "Prospect") {
        sendWelcomeEmail({
          to: updated.email,
          fullName: updated.fullName,
          memberNumber: updated.memberNumber,
        }).catch((err) =>
          console.error(`[onboard][${requestId}] welcome email failed:`, err),
        );
      }

      // Canonical schedule invariant: every member must have all 60
      // contribution rows (Jun 2026 → May 2031). Idempotent — backfills
      // only the missing periods, never touches existing rows.
      //
      // Detached on purpose: if Airtable hiccups during schedule
      // generation we don't want to roll back a successful member
      // update. The admin Contributions rollup will surface the gap
      // via the warning chip + Regenerate button if this slipped.
      ensureCanonicalMemberSchedule({
        memberId: updated.id,
        memberNumber: updated.memberNumber,
      })
        .then((r) => {
          if (r.ok && r.generated > 0) {
            console.log(
              `[onboard][${requestId}] schedule backfilled — generated ${r.generated} rows for member ${updated.memberNumber}`,
            );
          }
        })
        .catch((err) =>
          console.error(
            `[onboard][${requestId}] schedule backfill threw:`,
            err,
          ),
        );

      return NextResponse.json({
        memberId: updated.id,
        memberNumber: updated.memberNumber,
        email: updated.email,
        resumed: existing.status === "Onboarding",
        requestId,
      });
    }

    // ── New member ──
    stage = "assign_member_number";
    const memberNumber = await getNextMemberNumber();

    stage = "create_member";
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

    // Send welcome email (non-blocking — see note above on existing-member path).
    sendWelcomeEmail({
      to: record.email,
      fullName: record.fullName,
      memberNumber: record.memberNumber,
    }).catch((err) =>
      console.error(`[onboard][${requestId}] welcome email failed:`, err),
    );

    // Generate the full Jun 2026 → May 2031 contribution schedule.
    // Same detached-on-purpose pattern as the resume branch (see
    // the longer comment up there). Without this, a brand-new
    // member ends up with zero contribution rows, which throws off
    // the admin rollup totals + paid/expected denominator.
    ensureCanonicalMemberSchedule({
      memberId: record.id,
      memberNumber: record.memberNumber,
    })
      .then((r) => {
        if (r.ok && r.generated > 0) {
          console.log(
            `[onboard][${requestId}] schedule seeded — generated ${r.generated} rows for new member ${record.memberNumber}`,
          );
        }
      })
      .catch((err) =>
        console.error(
          `[onboard][${requestId}] schedule seed threw:`,
          err,
        ),
      );

    return NextResponse.json({
      memberId: record.id,
      memberNumber: record.memberNumber,
      email: record.email,
      requestId,
    });
  } catch (error) {
    // Single source of truth for 500 reporting. Both halves matter:
    //   - The console line is what we grep in Vercel function logs.
    //     It carries the requestId, the failing stage, the error class,
    //     and the underlying message (which often includes the Airtable
    //     status code + body — invaluable for diagnosing prod issues).
    //   - The JSON response gives the user a quotable ref + a stage code
    //     so support / dev can correlate without needing the underlying
    //     message (which can leak internal column ids and is too noisy
    //     to put in a user-facing string).
    const message = error instanceof Error ? error.message : String(error);
    const errorClass = error instanceof Error ? error.constructor.name : "UnknownError";

    console.error(
      `[onboard][${requestId}] failed at stage="${stage}" class="${errorClass}": ${message}`,
      error,
    );

    return NextResponse.json(
      {
        error: `Something went wrong creating your account. Please try again — if it keeps happening, email lehumo@limepages.co.za with ref ${requestId} and we'll get you sorted.`,
        code: `STAGE_${stage.toUpperCase()}_FAILED`,
        stage,
        requestId,
      },
      { status: 500 },
    );
  }
}
