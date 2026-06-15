import "server-only";

import { getHeaders } from "./airtable";
import {
  LEHUMO_DEFAULT_ALLOCATION,
  LEHUMO_FUND_SETTINGS_TABLE_ID,
  type FundPortfolio,
  type FundPortfolioInput,
  type PortfolioSlice,
} from "./definitions";

/**
 * Fund-level settings store — the singleton "portfolio" row in the
 * Lehumo Fund Settings table (one row, Key="portfolio"). Holds the
 * current portfolio allocation + investment-strategy narrative shown
 * on the member portal's "Where is our money now?" card, edited from
 * admin Settings.
 *
 * Accessed by FIELD NAME (not field-ID) — it's a small self-contained
 * config table, not the field-ID-keyed Contributions/Members tables.
 * Reuses the shared `getHeaders` auth from lib/airtable.
 *
 * server-only: importing from a client component fails at build time.
 */

const SINGLETON_KEY = "portfolio";

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
 * (missing field, wrong type, empty array) falls back to the default
 * allocation so the member card never renders broken.
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
 * Read the current fund portfolio. Always resolves to a renderable
 * shape — falls back to the default allocation + empty narrative when
 * no record exists yet or the JSON is unparseable.
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
      updatedAt: null,
      updatedBy: null,
    };
  }

  const f = record.fields;
  return {
    allocation: parseAllocation(f["Allocation"]),
    strategyNote: typeof f["Strategy Note"] === "string" ? f["Strategy Note"] : "",
    asAt: typeof f["As At"] === "string" ? f["As At"] : null,
    updatedAt: typeof f["Updated At"] === "string" ? f["Updated At"] : null,
    updatedBy: typeof f["Updated By"] === "string" ? f["Updated By"] : null,
  };
}

/**
 * Upsert the singleton portfolio config. Validated input is expected
 * (the admin action runs FundPortfolioSchema first). Creates the row
 * on first save, PATCHes thereafter. Returns the freshly-read shape.
 */
export async function upsertFundPortfolio(
  input: FundPortfolioInput,
  adminEmail: string,
): Promise<FundPortfolio> {
  const now = nowSastIso();
  const fields: Record<string, unknown> = {
    Key: SINGLETON_KEY,
    Allocation: JSON.stringify(input.allocation),
    "Strategy Note": input.strategyNote,
    "Updated At": now,
    "Updated By": adminEmail,
  };
  if (input.asAt) fields["As At"] = input.asAt;

  const existing = await fetchPortfolioRecord();

  const res = existing
    ? await fetch(getSettingsUrl(existing.id), {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ fields }),
      })
    : await fetch(getSettingsUrl(), {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ records: [{ fields }] }),
      });

  if (!res.ok) {
    throw new Error(
      `Airtable upsertFundPortfolio error: ${res.status} — ${await res
        .text()
        .catch(() => "")}`,
    );
  }

  return getFundPortfolio();
}
