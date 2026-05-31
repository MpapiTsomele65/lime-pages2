import { NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin-auth";

/**
 * Admin diagnostic endpoint — surfaces the state that the broadcast
 * + password endpoints depend on so an admin can verify "why isn't
 * my test send arriving?" without having to read function logs.
 *
 * Returns a flat JSON of:
 *   - Whether a session cookie is present + decodes
 *   - The session's email (only if it's an admin email — otherwise
 *     we redact, since admin emails are sensitive)
 *   - Whether the session passes the admin allowlist
 *   - Whether RESEND_API_KEY is set (boolean only, never the value)
 *   - Whether the broadcast/test endpoint's required env vars are
 *     set (AIRTABLE_*, SESSION_SECRET, NEXT_PUBLIC_SITE_URL)
 *
 * Gated by admin session so this can't leak env-presence bits to
 * random visitors. Returns 403 to non-admins (same as the broadcast
 * endpoint).
 */
export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        stage: "no_session",
        message:
          "No lehumo_session cookie present. Sign in at /lehumo/portal/login first.",
      },
      { status: 401 },
    );
  }

  const isAdmin = isAdminEmail(session.email);
  if (!isAdmin) {
    return NextResponse.json(
      {
        ok: false,
        stage: "not_admin",
        sessionEmail: session.email,
        message:
          "Your session email is NOT in LEHUMO_ADMIN_EMAILS on Vercel. Add it there to access admin endpoints.",
      },
      { status: 403 },
    );
  }

  // Full diagnostic — only returned once admin gate passes.
  return NextResponse.json({
    ok: true,
    session: {
      email: session.email,
      fullName: session.fullName,
      memberNumber: session.memberNumber,
      isAdmin: true,
    },
    env: {
      RESEND_API_KEY: Boolean(process.env.RESEND_API_KEY),
      AIRTABLE_PAT: Boolean(process.env.AIRTABLE_PAT),
      AIRTABLE_BASE_ID: Boolean(process.env.AIRTABLE_BASE_ID),
      AIRTABLE_TABLE_ID: Boolean(process.env.AIRTABLE_TABLE_ID),
      SESSION_SECRET: Boolean(process.env.SESSION_SECRET),
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? null,
      LEHUMO_ADMIN_EMAILS: Boolean(process.env.LEHUMO_ADMIN_EMAILS),
      PAYSTACK_PLAN_CODE_STANDARD: Boolean(
        process.env.PAYSTACK_PLAN_CODE_STANDARD,
      ),
      PAYSTACK_SECRET_KEY: Boolean(process.env.PAYSTACK_SECRET_KEY),
    },
    runtime: {
      nodeEnv: process.env.NODE_ENV ?? null,
      vercelEnv: process.env.VERCEL_ENV ?? null,
      vercelRegion: process.env.VERCEL_REGION ?? null,
      now: new Date().toISOString(),
    },
  });
}
