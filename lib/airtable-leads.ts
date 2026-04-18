import "server-only";

/**
 * Lehumo Leads table — lightweight store for visitors who express interest
 * via the referral/waitlist form OR who start onboarding but drop off before
 * the member record is created at the KYC step.
 *
 * Table: "Lehumo Leads" (tbl4o2jZW5cdc9HOb)
 */

export const LEADS_FIELDS = {
  fullName: "fldN9W1I1rfPmiZyn",
  email: "fldyRUZVCqUIx7Utf",
  phone: "fld2iUXNwdrlGGk0J",
  source: "fld3LeAG7ctg7eOtM",
  status: "fldvdBCcztOqKlhDw",
  referredByName: "fldJ0nsek3P13WPZj",
  planInterest: "fldurIe1GuLXB9kL5",
  notes: "fldDmWG1eoW6q0IYU",
  lastContacted: "fldhF1EijvKNoC9dK",
} as const;

export type LeadSource =
  | "Onboarding — Step 1"
  | "Referral Form"
  | "Waitlist"
  | "Other";

export type LeadStatus = "New" | "Contacted" | "Converted" | "Dropped";

export type LeadPlanInterest = "basic" | "standard" | "vip" | "unsure";

export interface CreateLeadInput {
  fullName: string;
  email: string;
  phone?: string;
  source: LeadSource;
  referredByName?: string;
  planInterest?: LeadPlanInterest;
  notes?: string;
}

function getLeadsBaseUrl() {
  const baseId = process.env.AIRTABLE_BASE_ID;
  // Fallback to the known table ID created via MCP. Overridable via env var
  // in case the table is ever re-created / re-scoped.
  const tableId =
    process.env.AIRTABLE_LEADS_TABLE_ID ?? "tbl4o2jZW5cdc9HOb";
  if (!baseId) throw new Error("AIRTABLE_BASE_ID not set");
  return `https://api.airtable.com/v0/${baseId}/${tableId}`;
}

function getLeadsHeaders() {
  const pat = process.env.AIRTABLE_PAT;
  if (!pat) throw new Error("AIRTABLE_PAT not set");
  return {
    Authorization: `Bearer ${pat}`,
    "Content-Type": "application/json",
  };
}

function escapeFormulaString(v: string) {
  return v.replace(/'/g, "\\'");
}

/**
 * Return true if a lead with this email + source pair already exists. Used
 * to keep the onboarding auto-save idempotent (a single abandoned journey
 * shouldn't create 5 leads if the visitor pokes Step 1 five times).
 */
async function leadExists(email: string, source: LeadSource): Promise<boolean> {
  try {
    const formula = `AND(LOWER({Email})='${escapeFormulaString(
      email.toLowerCase(),
    )}',{Source}='${escapeFormulaString(source)}')`;
    const url = `${getLeadsBaseUrl()}?filterByFormula=${encodeURIComponent(
      formula,
    )}&maxRecords=1`;
    const res = await fetch(url, {
      headers: getLeadsHeaders(),
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = await res.json();
    return (data.records ?? []).length > 0;
  } catch {
    return false;
  }
}

/**
 * Create a lead. Throws on Airtable failure — caller decides whether to
 * surface or swallow the error.
 */
export async function createLead(input: CreateLeadInput): Promise<string> {
  const fields: Record<string, unknown> = {
    [LEADS_FIELDS.fullName]: input.fullName,
    [LEADS_FIELDS.email]: input.email,
    [LEADS_FIELDS.source]: input.source,
    [LEADS_FIELDS.status]: "New",
  };
  if (input.phone) fields[LEADS_FIELDS.phone] = input.phone;
  if (input.referredByName) {
    fields[LEADS_FIELDS.referredByName] = input.referredByName;
  }
  if (input.planInterest) {
    fields[LEADS_FIELDS.planInterest] = input.planInterest;
  }
  if (input.notes) fields[LEADS_FIELDS.notes] = input.notes;

  const res = await fetch(getLeadsBaseUrl(), {
    method: "POST",
    headers: getLeadsHeaders(),
    body: JSON.stringify({ fields, typecast: true }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Leads create error: ${res.status} — ${txt}`);
  }
  const data = await res.json();
  return data.id as string;
}

/**
 * Idempotent: create the lead only if no prior lead exists for this
 * (email, source) pair. Swallows errors (never throws) — callers use this
 * for fire-and-forget flows like the onboarding Step 1 auto-save, where
 * the lead is a nice-to-have and must not block the main wizard.
 */
export async function createLeadIfNew(input: CreateLeadInput): Promise<void> {
  try {
    if (await leadExists(input.email, input.source)) return;
    await createLead(input);
  } catch (err) {
    console.error("createLeadIfNew failed (swallowed):", err);
  }
}
