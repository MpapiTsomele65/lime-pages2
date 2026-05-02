// TEMPORARY DIAGNOSTIC — remove after KYC/portal Airtable 403 is fixed.
//
// Reads the Vercel runtime's view of the AIRTABLE_PAT env var, performs
// a single GET against a known-good Airtable record, and returns the
// PAT signature + Airtable's response code/body. Lets us compare:
//   • what env var Vercel actually loads
//   • what Airtable returns when called from Vercel's IP range
// against the equivalent values from a local curl, to localise where
// the 403 originates (corrupted env var vs Airtable IP gating vs PAT
// scope drift, etc).
//
// No auth gate by design — the only sensitive output is a 6-char
// prefix of the PAT, which is non-credential by Airtable's design.

import { NextRequest, NextResponse } from "next/server";

const DEFAULT_TEST_RECORD_ID = "rec9yXOXGcAXfdVEE"; // Leh01

export async function GET(request: NextRequest) {
  const baseId = process.env.AIRTABLE_BASE_ID ?? "";
  const tableId = process.env.AIRTABLE_TABLE_ID ?? "";
  const pat = process.env.AIRTABLE_PAT ?? "";

  // Allow per-record probing so we can test specific session.memberIds.
  const queryRecordId = request.nextUrl.searchParams.get("rec");
  const recordId =
    queryRecordId && /^rec[A-Za-z0-9]{14}$/.test(queryRecordId)
      ? queryRecordId
      : DEFAULT_TEST_RECORD_ID;

  const url = `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}?returnFieldsByFieldId=true`;

  let status = 0;
  let bodyText = "";
  let fetchError: string | null = null;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${pat}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    status = res.status;
    bodyText = (await res.text()).slice(0, 500);
  } catch (err) {
    fetchError = err instanceof Error ? err.message : String(err);
  }

  // ── Probe 2: Contributions table — listContributionsForMember(1) ──
  // Same call shape `hydrateContributionsFromNewTable` makes on every
  // dashboard load. If this 403s but the Members GET above succeeds,
  // the PAT lacks scope on the Contributions table specifically.
  const contribTableId = "tblN9IO7pgfaMRE2f"; // Contributions
  const contribFormula = encodeURIComponent(`FIND('Leh01-', {Contribution Key})=1`);
  const contribUrl =
    `https://api.airtable.com/v0/${baseId}/${contribTableId}` +
    `?filterByFormula=${contribFormula}` +
    `&sort%5B0%5D%5Bfield%5D=Period&sort%5B0%5D%5Bdirection%5D=asc` +
    `&pageSize=100&returnFieldsByFieldId=true`;

  let contribStatus = 0;
  let contribBodyText = "";
  let contribFetchError: string | null = null;
  try {
    const res = await fetch(contribUrl, {
      headers: {
        Authorization: `Bearer ${pat}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    contribStatus = res.status;
    contribBodyText = (await res.text()).slice(0, 500);
  } catch (err) {
    contribFetchError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({
    env: {
      baseIdLen: baseId.length,
      baseIdPrefix: baseId.slice(0, 6),
      tableIdLen: tableId.length,
      tableIdPrefix: tableId.slice(0, 6),
      patLen: pat.length,
      patPrefix: pat.slice(0, 8),
      patSuffix: pat.slice(-4),
      // Detect any whitespace / escape contamination in the PAT,
      // similar to the NEXT_PUBLIC_SITE_URL "\n" bug fixed earlier.
      patHasTrailingNewline: pat.endsWith("\n"),
      patHasTrailingCR: pat.endsWith("\r"),
      patHasLiteralBackslashN: pat.includes("\\n"),
      patHasWhitespace: /\s/.test(pat),
    },
    request: {
      url,
      recordId,
    },
    response: {
      status,
      bodyText,
      fetchError,
    },
    contributionsProbe: {
      url: contribUrl,
      status: contribStatus,
      bodyText: contribBodyText,
      fetchError: contribFetchError,
    },
    runtime: {
      // Vercel's region for this function (e.g. "iad1"). Helps spot
      // whether the 403 is region-specific.
      region: process.env.VERCEL_REGION ?? null,
      vercelEnv: process.env.VERCEL_ENV ?? null,
      // Node version the function is running.
      nodeVersion: process.version,
    },
  });
}
