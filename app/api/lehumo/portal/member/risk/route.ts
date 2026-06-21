import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { updateMember } from "@/lib/airtable";
import { AIRTABLE_FIELDS, todayDate } from "@/lib/definitions";
import { PORTAL_QUESTIONS, scoreLehumoSurvey } from "@/lib/lehumo-risk";

/**
 * Member-portal risk + wealth profile save.
 *
 * The member completes the Lehumo scenario quiz client-side and confirms
 * the result. This route receives the chosen option indices, re-scores
 * them server-side into the two dimensions — risk tier + wealth
 * preference + favoured asset class — so the stored values can't be
 * spoofed, and writes them to the member's dedicated Airtable columns
 * (Risk Profile / Risk Score / Risk Assessed / Wealth Preference /
 * Preferred Asset Class).
 *
 * Idempotent — re-taking simply overwrites the columns.
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

    const result = scoreLehumoSurvey(answers as number[]);
    const assessed = todayDate(); // YYYY-MM-DD (SAST)

    await updateMember(session.memberId, {
      [AIRTABLE_FIELDS.riskProfile]: result.riskTier.name,
      [AIRTABLE_FIELDS.riskScore]: result.riskScore,
      [AIRTABLE_FIELDS.riskAssessed]: assessed,
      [AIRTABLE_FIELDS.wealthPreference]: result.wealthPref.name,
      ...(result.assetClass
        ? { [AIRTABLE_FIELDS.preferredAssetClass]: result.assetClass }
        : {}),
    });

    return NextResponse.json({
      ok: true,
      riskProfile: result.riskTier.name,
      wealthPreference: result.wealthPref.name,
      assetClass: result.assetClass,
      assessed,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Risk profile save error:", err);
    return NextResponse.json(
      { error: `Could not save your profile: ${message}` },
      { status: 500 },
    );
  }
}
