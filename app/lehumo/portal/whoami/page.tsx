import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin-auth";
import { getMemberById, getMemberByIdLite } from "@/lib/airtable";
import { listContributionsForMember } from "@/lib/contributions";

export const dynamic = "force-dynamic";

/**
 * Diagnostic page for admin-gating issues. Shows the current session email
 * and whether it's recognised as an admin. Safe to keep around — it only
 * exposes YOUR own session data (nobody else's) and never the env var value.
 */
export default async function WhoAmIPage() {
  const session = await getSession();
  if (!session) redirect("/lehumo/portal/login");

  const admin = isAdminEmail(session.email);
  const envConfigured = Boolean(process.env.LEHUMO_ADMIN_EMAILS);
  const adminEmailCount = (process.env.LEHUMO_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean).length;

  // ── Probe the dashboard's actual call path so we can see whether
  //    member fetch + contribution hydration are succeeding for THIS
  //    session, not just for a hardcoded test record. ──
  let liteResult = "(not run)";
  let fullResult = "(not run)";
  let contribResult = "(not run)";
  let contribCount = 0;

  try {
    const lite = await getMemberByIdLite(session.memberId);
    liteResult = lite
      ? `OK — fullName="${lite.fullName}" memberNumber=${lite.memberNumber}`
      : "null (404)";
  } catch (err) {
    liteResult = `THREW: ${err instanceof Error ? err.message : String(err)}`;
  }

  try {
    const full = await getMemberById(session.memberId);
    if (full) {
      contribCount = full.contributionRows?.length ?? 0;
      fullResult = `OK — contributionRows=${contribCount} contributions(legacy)=${
        Object.values(full.contributions).filter(Boolean).length
      }/${Object.keys(full.contributions).length}`;
    } else {
      fullResult = "null (404)";
    }
  } catch (err) {
    fullResult = `THREW: ${err instanceof Error ? err.message : String(err)}`;
  }

  try {
    // Probe listContributionsForMember directly using the session's
    // memberNumber. If full.fullResult succeeded, we can derive it.
    const lite = await getMemberByIdLite(session.memberId).catch(() => null);
    if (lite) {
      const rows = await listContributionsForMember(lite.memberNumber);
      contribResult = `OK — ${rows.length} rows for Leh${String(lite.memberNumber).padStart(2, "0")}`;
    } else {
      contribResult = "skipped — memberLite null";
    }
  } catch (err) {
    contribResult = `THREW: ${err instanceof Error ? err.message : String(err)}`;
  }

  return (
    <div className="min-h-screen bg-[#0B1933] text-white p-8">
      <div className="mx-auto max-w-xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#B8FF00]/70">
            Portal Diagnostic
          </p>
          <h1 className="text-2xl font-bold mt-1">Who am I?</h1>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#0F2040] p-6 space-y-4">
          <Row label="Session email" value={session.email} />
          <Row label="Full name" value={session.fullName} />
          <Row label="Member record id" value={session.memberId} mono />
          <Row
            label="LEHUMO_ADMIN_EMAILS set"
            value={envConfigured ? `yes (${adminEmailCount} entr${adminEmailCount === 1 ? "y" : "ies"})` : "no — not configured"}
            tone={envConfigured ? "good" : "bad"}
          />
          <Row
            label="Admin access"
            value={admin ? "GRANTED" : "DENIED"}
            tone={admin ? "good" : "bad"}
          />
        </div>

        {/* Phase-4-debug: probe the dashboard's actual data fetches so we can
            see whether the user's session-scoped getMemberById +
            hydration are succeeding. Remove once portal stabilizes. */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0F2040] p-6 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#46CDCF]/70">
              Data Fetch Probe
            </p>
            <p className="text-[11px] text-white/40 mt-0.5">
              Same calls the dashboard makes for this session.
            </p>
          </div>
          <Row label="getMemberByIdLite" value={liteResult} />
          <Row label="getMemberById (with hydration)" value={fullResult} />
          <Row label="listContributionsForMember" value={contribResult} />
        </div>

        {!admin && (
          <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-5 text-sm text-yellow-100/80 space-y-2">
            <p className="font-semibold text-yellow-200">Not admin yet?</p>
            <p>
              Make sure <code className="text-[#B8FF00]">LEHUMO_ADMIN_EMAILS</code> in
              Vercel Production contains exactly this email (case-insensitive):
            </p>
            <p className="font-mono bg-black/30 rounded px-3 py-2">
              {session.email}
            </p>
            <p className="text-yellow-100/60 text-xs">
              After saving the env var you must redeploy (Vercel →
              Deployments → latest → ⋯ → Redeploy) for it to take effect.
            </p>
          </div>
        )}

        <a
          href="/lehumo/portal"
          className="inline-block text-sm text-white/50 hover:text-white underline"
        >
          ← Back to dashboard
        </a>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  tone,
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: "good" | "bad";
}) {
  const toneCls =
    tone === "good"
      ? "text-[#B8FF00]"
      : tone === "bad"
        ? "text-red-400"
        : "text-white";
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-white/50">{label}</span>
      <span className={`${toneCls} ${mono ? "font-mono text-xs" : "font-medium"} text-right break-all`}>
        {value}
      </span>
    </div>
  );
}
