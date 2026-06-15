import "server-only";

import {
  LEHUMO_DEFAULT_ALLOCATION,
  LEHUMO_FUND_SETTINGS_TABLE_ID,
  MONTH_NAMES,
  type FundPortfolio,
  type FundPortfolioInput,
  type PortfolioSlice,
} from "./definitions";

/**
 * Fund-level settings store — the singleton "portfolio" row in the
 * Lehumo Fund Settings table (one row, Key="portfolio"). Holds the
 * current portfolio allocation, investment-strategy note, and the
 * manually-entered pool interest earned — all surfaced on the member
 * portal and edited from the admin Portfolio page.
 *
 * Accessed by FIELD NAME (not field-ID) — it's a small self-contained
 * config table. Deliberately self-contained (its own Airtable auth
 * header) rather than importing from lib/airtable, so lib/airtable can
 * import THIS module for the interest config without a circular import.
 *
 * server-only: importing from a client component fails at build time.
 */

const SINGLETON_KEY = "portfolio";

function getHeaders() {
  const pat = process.env.AIRTABLE_PAT;
  if (!pat) throw new Error("AIRTABLE_PAT is not set");
  return {
    Authorization: `Bearer ${pat}`,
    "Content-Type": "application/json",
  };
}

function getSettingsUrl(recordId?: string): string {
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!baseId) throw new Error("AIRTABLE_BASE_ID is not set");
  const base = `https://api.airtable.com/v0/${baseId}/${LEHUMO_FUND_SETTINGS_TABLE_ID}`;
  return recordId ? `${base}/${recordId}` : base;
}

/** SAST (Africa/Johannesburg) ISO 8601 with +02:00 offset. */
function nowSastIso(): string {
  const sastMs = Date.now() + 2 * 60 * 60 * 1000;
  const d = new Date(sastMs);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}+02:00`
  );
}

/**
 * Parse + sanitise the stored Allocation JSON. Anything malformed
 * falls back to the default allocation so the member card never
 * renders broken.
 */
function parseAllocation(raw: unknown): PortfolioSlice[] {
  if (typeof raw !== "string" || !raw.trim()) return LEHUMO_DEFAULT_ALLOCATION;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return LEHUMO_DEFAULT_ALLOCATION;
    }
    const slices: PortfolioSlice[] = [];
    for (const row of parsed) {
      if (
        row &&
        typeof row.label === "string" &&
        typeof row.pct === "number" &&
        typeof row.color === "string"
      ) {
        slices.push({ label: row.label, pct: row.pct, color: row.color });
      }
    }
    return slices.length > 0 ? slices : LEHUMO_DEFAULT_ALLOCATION;
  } catch {
    return LEHUMO_DEFAULT_ALLOCATION;
  }
}

/** Find the raw singleton record (id + fields), or null if none. */
async function fetchPortfolioRecord(): Promise<{
  id: string;
  fields: Record<string, unknown>;
} | null> {
  const url = `${getSettingsUrl()}?filterByFormula=${encodeURIComponent(
    `{Key}="${SINGLETON_KEY}"`,
  )}&maxRecords=1`;
  const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
  if (!res.ok) {
    throw new Error(
      `Airtable getFundPortfolio error: ${res.status} — ${await res
        .text()
        .catch(() => "")}`,
    );
  }
  const data = await res.json();
  const record = data.records?.[0];
  return record ? { id: record.id, fields: record.fields ?? {} } : null;
}

/**
 * Read the current fund settings. Always resolves to a renderable
 * shape — falls back to the default allocation + zero interest when no
 * record exists yet or the JSON is unparseable.
 */
export async function getFundPortfolio(): Promise<FundPortfolio> {
  let record: Awaited<ReturnType<typeof fetchPortfolioRecord>> = null;
  try {
    record = await fetchPortfolioRecord();
  } catch (err) {
    console.error("[getFundPortfolio] read failed, using default:", err);
  }

  if (!record) {
    return {
      allocation: LEHUMO_DEFAULT_ALLOCATION,
      strategyNote: "",
      asAt: null,
      interestEarned: 0,
      updatedAt: null,
      updatedBy: null,
    };
  }

  const f = record.fields;
  return {
    allocation: parseAllocation(f["Allocation"]),
    strategyNote: typeof f["Strategy Note"] === "string" ? f["Strategy Note"] : "",
    asAt: typeof f["As At"] === "string" ? f["As At"] : null,
    interestEarned:
      typeof f["Interest Earned"] === "number" ? f["Interest Earned"] : 0,
    updatedAt: typeof f["Updated At"] === "string" ? f["Updated At"] : null,
    updatedBy: typeof f["Updated By"] === "string" ? f["Updated By"] : null,
  };
}

/**
 * Partial write to the singleton — only the provided fields are
 * touched, plus the Updated At/By audit. Creates the row on first
 * save, PATCHes thereafter. Shared by the allocation + interest save
 * paths so each edits its own fields without clobbering the other.
 */
async function writeSettings(
  fields: Record<string, unknown>,
  adminEmail: string,
): Promise<FundPortfolio> {
  const payload: Record<string, unknown> = {
    ...fields,
    Key: SINGLETON_KEY,
    "Updated At": nowSastIso(),
    "Updated By": adminEmail,
  };

  const existing = await fetchPortfolioRecord();

  const res = existing
    ? await fetch(getSettingsUrl(existing.id), {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ fields: payload }),
      })
    : await fetch(getSettingsUrl(), {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ records: [{ fields: payload }] }),
      });

  if (!res.ok) {
    throw new Error(
      `Airtable writeSettings error: ${res.status} — ${await res
        .text()
        .catch(() => "")}`,
    );
  }

  return getFundPortfolio();
}

/**
 * Upsert the portfolio allocation + strategy + as-at. Validated input
 * is expected (the admin action runs FundPortfolioSchema first).
 */
export async function upsertFundPortfolio(
  input: FundPortfolioInput,
  adminEmail: string,
): Promise<FundPortfolio> {
  const fields: Record<string, unknown> = {
    Allocation: JSON.stringify(input.allocation),
    "Strategy Note": input.strategyNote,
  };
  if (input.asAt) fields["As At"] = input.asAt;
  return writeSettings(fields, adminEmail);
}

/**
 * Upsert just the manually-entered pool interest. Independent of the
 * allocation save so the two Portfolio-page cards don't overwrite each
 * other.
 */
export async function upsertFundInterest(
  interestEarned: number,
  adminEmail: string,
): Promise<FundPortfolio> {
  return writeSettings({ "Interest Earned": interestEarned }, adminEmail);
}

/**
 * Interest config for getCommunityPoolStats — mirrors the legacy
 * env-based loadInterestConfig shape ({ total, monthly[] }) but sourced
 * from the admin-entered Fund Settings value. The cumulative total is
 * distributed linearly across elapsed calendar months so the dashboard
 * pool chart renders a smooth interest curve. Returns total=0 when no
 * interest has been entered, letting the caller fall back to the env
 * var during the transition.
 */
export async function getFundInterestConfig(
  currentMonthIndex: number,
): Promise<{ total: number; monthly: number[] }> {
  let total = 0;
  try {
    const { interestEarned } = await getFundPortfolio();
    total = interestEarned;
  } catch (err) {
    console.error("[getFundInterestConfig] read failed:", err);
  }

  if (total <= 0 || currentMonthIndex < 0) {
    return { total: 0, monthly: MONTH_NAMES.map(() => 0) };
  }
  const elapsed = currentMonthIndex + 1;
  const perMonth = total / elapsed;
  const monthly = MONTH_NAMES.map((_, i) =>
    i <= currentMonthIndex ? perMonth : 0,
  );
  return { total, monthly };
}
