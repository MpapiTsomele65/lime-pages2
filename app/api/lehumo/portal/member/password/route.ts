import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { getMemberByIdLite, updateMember } from "@/lib/airtable";
import {
  AIRTABLE_FIELDS,
  PasswordChangeSchema,
  formatMemberNumber,
  splicePasswordHashIntoNotes,
} from "@/lib/definitions";
import {
  checkPasswordStrength,
  hashPassword,
  verifyPassword,
} from "@/lib/password";
import { sendPasswordChangedEmail } from "@/lib/email";

/**
 * Member portal — manage the optional self-service password.
 *
 * POST — set / change / remove the password.
 *   Body: { current?: string, next: string | null }
 *
 *   - If the member already has a password (`member.passwordHash` set),
 *     `current` is required and must verify. Defends against a stolen
 *     session silently rotating the credential.
 *   - `next: string` (8+ chars) sets or rotates the password.
 *   - `next: null` removes the password (member opts back into the
 *     legacy email + member-number login path only).
 *
 * Auth: member session required.
 * Persistence: pipe-delimited `PwHash: <saltHex>:<keyHex>` segment in
 * the member's `notes` field (see splicePasswordHashIntoNotes). No
 * Airtable schema change.
 *
 * Notification: deliberately no email is sent. The user is logged in
 * when they make this change, so they already know they did it. Adding
 * an email here would just create noise on every rotation.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as unknown;
    const parsed = PasswordChangeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { current, next } = parsed.data;

    const member = await getMemberByIdLite(session.memberId);
    if (!member) {
      // Session looked valid (JWT verified) but the record is gone —
      // treat as unauthorized rather than 404 so the client redirects
      // back to login.
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Re-auth: if a password is already on file, the current one must
    // be supplied AND verify. This applies to both rotate (next: string)
    // and remove (next: null) — both rotate the security state and
    // both deserve the extra check.
    if (member.passwordHash) {
      if (!current) {
        return NextResponse.json(
          {
            error:
              "Enter your current password to confirm the change.",
            code: "CURRENT_REQUIRED",
          },
          { status: 400 },
        );
      }
      const ok = await verifyPassword(current, member.passwordHash);
      if (!ok) {
        return NextResponse.json(
          {
            error: "Current password is incorrect.",
            code: "CURRENT_WRONG",
          },
          { status: 400 },
        );
      }
    }

    // Apply.
    let hashToStore: string | null = null;
    if (next !== null) {
      const strengthError = checkPasswordStrength(
        next,
        formatMemberNumber(member.memberNumber),
      );
      if (strengthError) {
        return NextResponse.json(
          { error: strengthError, code: "WEAK_PASSWORD" },
          { status: 400 },
        );
      }
      hashToStore = await hashPassword(next);
    }

    const newNotes = splicePasswordHashIntoNotes(
      member.notes ?? "",
      hashToStore,
    );
    await updateMember(member.id, {
      [AIRTABLE_FIELDS.notes]: newNotes,
    });

    // Fire-and-forget security notification. Three transition kinds:
    //   - no prior hash + new hash       → "set"
    //   - prior hash + new hash          → "changed"
    //   - prior hash + null (opt-out)    → "removed"
    // Resend failures are logged but do NOT bubble up — the user's
    // credential state is already persisted, and blocking the
    // response on email delivery would surface "your password was
    // saved but the page errored" which is worse than a missed alert.
    const kind =
      hashToStore === null
        ? "removed"
        : member.passwordHash
          ? "changed"
          : "set";
    sendPasswordChangedEmail({
      to: member.email,
      fullName: member.fullName,
      memberNumber: member.memberNumber,
      kind,
    }).catch((err) =>
      console.error("sendPasswordChangedEmail failed:", err),
    );

    return NextResponse.json({
      success: true,
      hasPassword: hashToStore !== null,
    });
  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
