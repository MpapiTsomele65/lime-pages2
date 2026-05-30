import { NextRequest, NextResponse } from "next/server";

import {
  findMemberByEmail,
  findMemberByEmailAndNumber,
} from "@/lib/airtable";
import { createSession } from "@/lib/session";
import { LoginFormSchema } from "@/lib/definitions";
import { verifyPassword } from "@/lib/password";

/**
 * Portal login.
 *
 * Two credential shapes, validated by `LoginFormSchema` (one or the
 * other, never both):
 *   1. email + memberNumber  → legacy / default path. Works ONLY for
 *                              members who have NOT set a password.
 *                              Once a member opts in to a password,
 *                              the member-number path is retired for
 *                              that member — it's no longer a valid
 *                              second factor.
 *   2. email + password      → required for any member who set a
 *                              password on the /security page. The
 *                              member-number path is rejected for
 *                              them with a `MUST_USE_PASSWORD` hint
 *                              so the UI can swap modes.
 *
 * Why "password supersedes member-number" rather than "either works":
 *   member numbers (Leh01, Leh02 …) are sequential and predictable, so
 *   anyone who learns a member's email could guess their number. The
 *   point of the password layer is to close that. If both paths
 *   stayed open for password-setters, the weak path would still work
 *   and the password would be defence-in-depth only on members
 *   actively choosing to use it every time. Promoting the password to
 *   "the second factor" once set gives real protection.
 *
 * Privacy posture: we accept some enumeration (attacker can learn
 * "this email has a password set" by trying both paths) in exchange
 * for a clear error path. Lehumo is a tight 30-member cohort; the
 * enumeration value is near zero and the UX gain is substantial.
 * Wrong-credential failures still return a uniform 401.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = LoginFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { email, memberNumber, password } = parsed.data;

    // ── Password path ────────────────────────────────────────────────
    if (password !== undefined) {
      const member = await findMemberByEmail(email);

      // No such email — same 401 as a wrong password, so the response
      // shape doesn't distinguish "email exists" from "password wrong".
      if (!member) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 },
        );
      }

      // Member exists but never set a password. Tell them so they can
      // switch back to member-number mode. This DOES leak that the
      // email exists, but the alternative ("Invalid credentials") would
      // leave them stuck in password mode forever, fighting their
      // wrong assumption. Clear error wins for this audience.
      if (!member.passwordHash) {
        return NextResponse.json(
          {
            error:
              "This account doesn't have a password set. Sign in with your member number instead.",
            code: "MUST_USE_MEMBER_NUMBER",
          },
          { status: 401 },
        );
      }

      const ok = await verifyPassword(password, member.passwordHash);
      if (!ok) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 },
        );
      }

      await createSession(
        member.id,
        member.email,
        member.memberNumber,
        member.fullName,
      );
      return NextResponse.json({
        name: member.fullName,
        memberNumber: member.memberNumber,
        status: member.status,
      });
    }

    // ── Member-number path (legacy / default) ───────────────────────
    if (memberNumber === undefined) {
      // Schema's refine should prevent reaching here. Belt-and-braces.
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const member = await findMemberByEmailAndNumber(email, memberNumber);
    if (!member) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Member-number matched, but they've set a password — the
    // member-number path is retired for them. Surface a clear hint
    // so the UI can swap to the password input.
    if (member.passwordHash) {
      return NextResponse.json(
        {
          error:
            "This account uses password sign-in. Switch to password mode below to continue.",
          code: "MUST_USE_PASSWORD",
        },
        { status: 401 },
      );
    }

    await createSession(
      member.id,
      member.email,
      member.memberNumber,
      member.fullName,
    );
    return NextResponse.json({
      name: member.fullName,
      memberNumber: member.memberNumber,
      status: member.status,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
