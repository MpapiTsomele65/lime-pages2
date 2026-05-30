import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

import { getMemberByIdLite, updateMember } from "@/lib/airtable";
import {
  AIRTABLE_FIELDS,
  PasswordResetSchema,
  formatMemberNumber,
  splicePasswordHashIntoNotes,
} from "@/lib/definitions";
import { sendPasswordChangedEmail } from "@/lib/email";
import { checkPasswordStrength, hashPassword } from "@/lib/password";

/**
 * Consume a password-reset magic link.
 *
 * Body: { token: string (from `?token=` query), next: string (new pw) }
 *
 * Verification steps (every one must pass):
 *   1. JWT signature + expiry — `jwtVerify` rejects forged or stale.
 *   2. `purpose: "lehumo-password-reset"` claim — guards against
 *      replaying a session JWT (or any other future signed token) as
 *      a reset token.
 *   3. The member referenced by `sub` still exists.
 *   4. The member's email + memberNumber in Airtable still match the
 *      ones baked into the token. Rotated email or re-numbered member
 *      → token is voided. Belt and braces.
 *   5. The new password passes the strength check (same rules as the
 *      portal Security card).
 *
 * On success: hash + splice into notes + persist + return success.
 * We do NOT create a session here — the user lands back on the login
 * page and signs in with their new password. That ensures the new
 * credential is verifiable end-to-end before they're "in".
 */

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = PasswordResetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Please pick a password of at least 8 characters.",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { token, next } = parsed.data;

    let payload: {
      sub?: string;
      purpose?: string;
      em?: string;
      mn?: number;
    };
    try {
      const verified = await jwtVerify(token, getSecretKey(), {
        algorithms: ["HS256"],
      });
      payload = verified.payload as typeof payload;
    } catch {
      // Any verify failure — bad signature, expired, malformed —
      // surfaces as the same user-facing copy. Detailed reasons stay
      // in server logs (this catch swallows them; the outer try-catch
      // would log them if we re-threw, but we want a friendly message
      // here, so we don't).
      return NextResponse.json(
        {
          error:
            "This reset link has expired or is invalid. Please request a new one.",
          code: "TOKEN_INVALID",
        },
        { status: 400 },
      );
    }

    if (payload.purpose !== "lehumo-password-reset" || !payload.sub) {
      return NextResponse.json(
        {
          error:
            "This reset link is invalid. Please request a new one.",
          code: "TOKEN_PURPOSE",
        },
        { status: 400 },
      );
    }

    const member = await getMemberByIdLite(payload.sub);
    if (!member) {
      return NextResponse.json(
        {
          error: "We couldn't find your account. Please email lehumo@limepages.co.za.",
          code: "MEMBER_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    // Tie the token to the member's identity at issue-time. If either
    // half drifted (admin re-numbered them, they changed email), the
    // token no longer applies.
    if (
      typeof payload.em === "string" &&
      payload.em.toLowerCase() !== member.email.toLowerCase()
    ) {
      return NextResponse.json(
        {
          error:
            "This reset link no longer matches your account. Please request a new one.",
          code: "TOKEN_MISMATCH",
        },
        { status: 400 },
      );
    }
    if (
      typeof payload.mn === "number" &&
      payload.mn !== member.memberNumber
    ) {
      return NextResponse.json(
        {
          error:
            "This reset link no longer matches your account. Please request a new one.",
          code: "TOKEN_MISMATCH",
        },
        { status: 400 },
      );
    }

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

    const hash = await hashPassword(next);
    const newNotes = splicePasswordHashIntoNotes(member.notes ?? "", hash);
    await updateMember(member.id, {
      [AIRTABLE_FIELDS.notes]: newNotes,
    });

    // Fire-and-forget security notification. The magic-link reset is
    // exactly the flow an attacker would use after compromising
    // someone's email, so this email is the highest-value canary in
    // the whole system: if the real owner sees "your password was
    // changed" without having done it, they can react before further
    // damage. Always sent as "changed" (the member already had a
    // password — that's why they're hitting reset). Failures are
    // logged but don't block the response since the credential state
    // is already persisted.
    sendPasswordChangedEmail({
      to: member.email,
      fullName: member.fullName,
      memberNumber: member.memberNumber,
      kind: "changed",
    }).catch((err) =>
      console.error("sendPasswordChangedEmail (reset) failed:", err),
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      {
        error:
          "Something went wrong. Please try again or email lehumo@limepages.co.za.",
      },
      { status: 500 },
    );
  }
}
