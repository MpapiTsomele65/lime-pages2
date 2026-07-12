import "server-only";

/**
 * Admin audit log — append-only trail of admin actions on member /
 * contribution records, written to the "Admin Activity Log" table in the
 * Lehumo base.
 *
 * Every money-mutating admin action calls `logAdminAction` AFTER its write
 * succeeds. The log write itself is fire-and-forget: an audit hiccup
 * (Airtable rate limit, transient network) must never fail or slow the
 * action that already landed — we log the failure to the server console
 * instead. This gives "who changed what, when, before → after" provenance
 * for a trust holding members' money without adding latency anywhere.
 */

export const LEHUMO_AUDIT_TABLE_ID = "tbldqXe5v6gleZdCI";

export interface AuditEntry {
  /** Admin email that performed the action. */
  actor: string;
  /** Short verb — "log-eft", "void", "reallocate", "edit",
   *  "status-change", "reconcile", "backfill-schedule", "month-reopen"… */
  action: string;
  /** What it acted on — contribution key ("Leh22-2026-07"), member
   *  number, or a record id when nothing friendlier exists. */
  target: string;
  /** Human-readable summary + before/after values. */
  details?: string;
}

/** ISO 8601 timestamp in Africa/Johannesburg (matches the codebase's
 *  SAST-anchored bookkeeping). */
function nowSastIso(): string {
  const now = new Date();
  const sast = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  return sast.toISOString().replace("Z", "+02:00");
}

/**
 * Append one entry to the audit table. Returns immediately — the write
 * happens in the background and failures are console-logged only.
 */
export function logAdminAction(entry: AuditEntry): void {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const pat = process.env.AIRTABLE_PAT;
  if (!baseId || !pat) {
    console.error("[audit] missing Airtable env — entry dropped:", entry.action);
    return;
  }

  const ts = nowSastIso();
  void fetch(`https://api.airtable.com/v0/${baseId}/${LEHUMO_AUDIT_TABLE_ID}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pat}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      records: [
        {
          fields: {
            Entry: `${ts.slice(0, 16)} · ${entry.action} · ${entry.target}`,
            Timestamp: ts,
            Actor: entry.actor,
            Action: entry.action,
            Target: entry.target,
            Details: entry.details ?? "",
          },
        },
      ],
    }),
  })
    .then(async (res) => {
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error(`[audit] write failed ${res.status}: ${body}`);
      }
    })
    .catch((err) => {
      console.error("[audit] write failed:", err);
    });
}
