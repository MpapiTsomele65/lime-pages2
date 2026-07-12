import { NextRequest, NextResponse } from "next/server";
import { findMemberByEmail } from "@/lib/airtable";
import { createSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin-auth";
import { sendAdminSignInAlert } from "@/lib/email";

/**
 * Google Sign-In callback.
 * Receives a Google ID token (credential), verifies it via Google's tokeninfo
 * endpoint, looks up the member by email, and creates a session.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credential } = body;

    if (!credential) {
      return NextResponse.json(
        { error: "Missing Google credential" },
        { status: 400 },
      );
    }

    // Verify the Google ID token
    const googleRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`,
    );

    if (!googleRes.ok) {
      return NextResponse.json(
        { error: "Invalid Google credential" },
        { status: 401 },
      );
    }

    const googleUser = await googleRes.json();
    const email = googleUser.email?.toLowerCase();
    const name = googleUser.name || "";

    if (!email || !googleUser.email_verified) {
      return NextResponse.json(
        { error: "Google account email not verified" },
        { status: 401 },
      );
    }

    // Look up member by email
    const member = await findMemberByEmail(email);

    if (!member) {
      // No account — redirect to onboarding with pre-filled data
      return NextResponse.json({
        action: "onboard",
        email,
        name,
      });
    }

    // Member found — create session
    await createSession(
      member.id,
      member.email,
      member.memberNumber,
      member.fullName,
    );

    // Admin accounts can edit money records — alert on every sign-in
    // (fire-and-forget; never blocks the login response).
    if (isAdminEmail(member.email)) {
      sendAdminSignInAlert({
        email: member.email,
        fullName: member.fullName,
        method: "google",
      }).catch((err) => console.error("admin sign-in alert failed:", err));
    }

    return NextResponse.json({
      action: "login",
      name: member.fullName,
      memberNumber: member.memberNumber,
      status: member.status,
    });
  } catch (error) {
    console.error("Google auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed. Please try again." },
      { status: 500 },
    );
  }
}
