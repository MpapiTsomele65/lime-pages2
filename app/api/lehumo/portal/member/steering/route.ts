import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/session";
import { getMemberByIdLite, updateMember } from "@/lib/airtable";
import {
  sendSteeringMemberAck,
  sendSteeringAdminNotification,
  sendSteeringWithdrawAdminNotification,
} from "@/lib/email";
import {
  AIRTABLE_FIELDS,
  formatMemberNumber,
  spliceSteeringIntoNotes,
  todayDate,
} from "@/lib/definitions";

/**
 * Steering Committee volunteer submission endpoint.
 *
 * POST  — record / update a member's volunteer entry. Idempotent: if
 *         the member already has a submission, this overwrites with
 *         the new values + bumps `SteeringSubmittedAt` to today.
 * DELETE — withdraw the submission. Clears all SteeringExpertise /
 *         Motivation / SubmittedAt segments from the member's notes.
 *
 * Both paths:
 *   • Auth: member session required (we use `session.memberId`).
 *   • Persistence: pipe-delimited segments in the member's `notes`
 *     field (see lib/definitions.ts spliceSteeringIntoNotes). Avoids
 *     an Airtable schema change.
 *   • Notification: emails the member (confirmation/ack) AND admin
 *     (lehumo@limepages.co.za) so the volunteer list can be tracked
 *     before the kick-off QGM.
 */

const SubmitSchema = z.object({
  expertise: z
    .string()
    .trim()
    .min(5, "Please describe the expertise you bring (at least a few words)")
    .max(1000, "Please keep your expertise summary under 1000 characters"),
  motivation: z
    .string()
    .trim()
    .max(2000, "Please keep your motivation under 2000 characters")
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as
      | { expertise?: unknown; motivation?: unknown }
      | null;
    const parsed = SubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Invalid input",
          code: "INVALID_INPUT",
        },
        { status: 400 },
      );
    }

    const member = await getMemberByIdLite(session.memberId);
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const submittedAt = todayDate(); // YYYY-MM-DD
    const expertise = parsed.data.expertise.trim();
    const motivation = (parsed.data.motivation ?? "").trim();
    const isUpdate = Boolean(member.steering?.submittedAt);

    const newNotes = spliceSteeringIntoNotes(member.notes ?? "", {
      expertise,
      motivation,
      submittedAt,
    });

    await updateMember(session.memberId, {
      [AIRTABLE_FIELDS.notes]: newNotes,
    });

    // Notifications are best-effort — don't block on email failures.
    // Both calls share the member's name + number + email so admin gets
    // a self-contained inbox record without a portal lookup.
    Promise.allSettled([
      sendSteeringMemberAck({
        to: member.email,
        fullName: member.fullName,
        memberNumber: member.memberNumber,
        expertise,
        motivation,
        isUpdate,
      }),
      sendSteeringAdminNotification({
        memberFullName: member.fullName,
        memberNumber: member.memberNumber,
        memberEmail: member.email,
        expertise,
        motivation,
        isUpdate,
      }),
    ]).then((results) => {
      results.forEach((r, i) => {
        if (r.status === "rejected") {
          console.error(
            `[steering submit] email ${i === 0 ? "member-ack" : "admin-notification"} failed:`,
            r.reason,
          );
        }
      });
    });

    return NextResponse.json({
      ok: true,
      steering: { expertise, motivation, submittedAt },
      memberRef: formatMemberNumber(member.memberNumber),
    });
  } catch (err) {
    console.error("[steering submit] failed:", err);
    return NextResponse.json(
      { error: "Could not save your submission. Please try again." },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const member = await getMemberByIdLite(session.memberId);
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    if (!member.steering) {
      // Already not volunteering — idempotent no-op.
      return NextResponse.json({ ok: true });
    }

    const newNotes = spliceSteeringIntoNotes(member.notes ?? "", null);
    await updateMember(session.memberId, {
      [AIRTABLE_FIELDS.notes]: newNotes,
    });

    // Best-effort admin notification so the volunteer list stays
    // accurate. No member-side email for withdrawals — they already
    // know they withdrew.
    sendSteeringWithdrawAdminNotification({
      memberFullName: member.fullName,
      memberNumber: member.memberNumber,
      memberEmail: member.email,
    }).catch((err) =>
      console.error("[steering withdraw] admin email failed:", err),
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[steering withdraw] failed:", err);
    return NextResponse.json(
      { error: "Could not withdraw your submission. Please try again." },
      { status: 500 },
    );
  }
}
