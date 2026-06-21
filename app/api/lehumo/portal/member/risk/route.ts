import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { updateMember } from "@/lib/airtable";
import { AIRTABLE_FIELDS, todayDate } from "@/lib/definitions";
import {
  PORTAL_QUESTIONS,
  scorePortalAnswers,
  portalProfileFor,
} from "@/lib/lehumo-risk";

/**
 * Member-portal risk-profile save.
 *
 * The member completes the 6-scenario quiz client-side and confirms the
 * result ("yes, that's me"). This route receives the chosen option
 * indices, re-scores them server-side (so the stored profile can't be
 * spoofed past what the questions allow), and writes the resulting tier
 * + raw score + assessed date to the member's dedicated Airtable columns
 * (Risk Profile / Risk Score / Risk Assessed).
 *
 * Idempotent by nature — re-taking simply overwrites the three columns.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as {
      answers?: unknown;
    } | null;
    const answers = body?.answers;

    const valid =
      Array.isArray(answers) &&
      answers.length === PORTAL_QUESTIONS.length &&
      answers.every(
        (a, i) =>
          typeof a === "number" &&
          Number.isInteger(a) &&
          a >= 0 &&
          a < PORTAL_QUESTIONS[i].options.length,
      );

    if (!valid) {
      return NextResponse.json(
        {
          error: `answers must be an array of ${PORTAL_QUESTIONS.length} valid option indices`,
        },
        { status: 400 },
      );
    }

    const nums = answers as number[];
    const profile = portalProfileFor(nums);
    const score = scorePortalAnswers(nums);
    const assessed = todayDate(); // YYYY-MM-DD (SAST)

    await updateMember(session.memberId, {
      [AIRTABLE_FIELDS.riskProfile]: profile.name,
      [AIRTABLE_FIELDS.riskScore]: score,
      [AIRTABLE_FIELDS.riskAssessed]: assessed,
    });

    return NextResponse.json({
      ok: true,
      profile: {
        id: profile.id,
        name: profile.name,
        tagline: profile.tagline,
        blurb: profile.blurb,
        horizon: profile.horizon,
        lean: profile.lean,
        leanLabel: profile.leanLabel,
      },
      score,
      assessed,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Risk profile save error:", err);
    return NextResponse.json(
      { error: `Could not save your risk profile: ${message}` },
      { status: 500 },
    );
  }
}
