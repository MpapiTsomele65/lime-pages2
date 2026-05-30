import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

import { findMemberByEmail } from "@/lib/airtable";
import { sendPasswordResetEmail } from "@/lib/email";
import { PasswordForgotSchema } from "@/lib/definitions";
import {
  checkRateLimit,
  recordFailure,
  rateLimitKeyForEmail,
} from "@/lib/rate-limit";
import { siteUrl } from "@/lib/site-url";

/**
 * Request a password-reset magic link.
 *
 * Flow:
 *   1. Member fills email + memberNumber on `/lehumo/portal/login/forgot`
 *   2. We look up the member by email and check the member number
 *      matches what's on file. Both checks must pass to issue a link —
 *      this mirrors the user-chosen design ("email magic link + must
 *      re-enter member number").
 *   3. We mint a short-lived JWT (15 minutes) carrying the member's
 *      record ID + a `purpose: "lehumo-password-reset"` claim, signed
 *      with SESSION_SECRET (reused — same trust boundary as the
 *      session cookie).
 *   4. We email the link with a BCC to lehumo@limepages.co.za.
 *
 * For privacy, we ALWAYS return success — even if the email doesn't
 * match a member, or the member number is wrong. That stops an
 * attacker probing "does this email exist" / "what's their member
 * number". The user sees "Check your email" either way.
 */

const RESET_TOKEN_TTL_MIN = 15;

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = PasswordForgotSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Please check your email and member number.",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { email, memberNumber } = parsed.data;

    // Rate-limit by email — shares the same in-memory window as the
    // login route, so an attacker can't spam both endpoints to amplify
    // the limit. The "always return success" privacy posture below
    // still holds, so a successful rate-limit response is the only
    // information leak (which we deem acceptable: the alternative is
    // silent enumeration + cost-attack on Resend).
    const limitKey = rateLimitKeyForEmail(`forgot:${email}`);
    const gate = checkRateLimit(limitKey);
    if (!gate.ok) {
      const minutes = Math.ceil(gate.retryAfterSec / 60);
      return NextResponse.json(
        {
          error: `Too many reset attempts. Try again in ~${minutes} minute${minutes === 1 ? "" : "s"}, or email lehumo@limepages.co.za if you're locked out.`,
          code: "RATE_LIMITED",
          retryAfterSec: gate.retryAfterSec,
        },
        {
          status: 429,
          headers: { "Retry-After": String(gate.retryAfterSec) },
        },
      );
    }
    // Count every call against the limit — including the "no such
    // member" case below — so an attacker can't probe through the
    // 6th+ request once they've burned 5 known-good emails.
    recordFailure(limitKey);

    const member = await findMemberByEmail(email);

    // Privacy: same "success" response regardless of whether the
    // email exists or the member number matches. Never leak which
    // half failed. We still SHORT-CIRCUIT (don't send the email)
    // when validation fails — only happy-path callers get the link.
    if (!member || member.memberNumber !== memberNumber) {
      return NextResponse.json({ success: true });
    }

    const token = await new SignJWT({
      sub: member.id,
      purpose: "lehumo-password-reset",
      // Bind the token to the email+number that requested it so a
      // leaked token from one member can't be replayed against
      // another (defence-in-depth alongside the 15-min TTL).
      em: member.email,
      mn: member.memberNumber,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${RESET_TOKEN_TTL_MIN}m`)
      .sign(getSecretKey());

    const resetUrl = `${siteUrl()}/lehumo/portal/login/reset?token=${encodeURIComponent(token)}`;

    await sendPasswordResetEmail({
      to: member.email,
      fullName: member.fullName,
      memberNumber: member.memberNumber,
      resetUrl,
      expiresInMinutes: RESET_TOKEN_TTL_MIN,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password forgot error:", error);
    // Even on internal failure we hide the cause — surfacing "Resend
    // is down" or "Airtable timed out" only helps an attacker map our
    // infra. The member will retry; admin sees the real error in
    // logs.
    return NextResponse.json(
      {
        error:
          "Something went wrong. Please try again or email lehumo@limepages.co.za.",
      },
      { status: 500 },
    );
  }
}
