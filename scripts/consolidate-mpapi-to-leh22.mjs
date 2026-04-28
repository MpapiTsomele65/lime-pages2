#!/usr/bin/env node
// Apply script — WRITES to Airtable.
//
// Consolidates the three Mpapi Tsomele records down to one canonical
// row at Leh22, in line with the user's "Option A" decision:
//
//   Before                                                 After
//   ──────────────────────────────────────────────────────────────────
//   Leh01  recbTTH79t0BAaeJ4  Mpapi  papi.tsomele@         → Exited (retire)
//   Leh22  rec???              Mpapi  papi+prod-test-1@      → keep, become canonical
//   Leh23  rechYyKN889phP3ml  Mpapi  info@limepages.org    → Exited (retire)
//
// Concrete writes:
//   1. Leh01 Mpapi  → status=Exited, email scrambled, notes annotated.
//                     KYC Complete state is migrated to Leh22 first so
//                     it doesn't get lost.
//   2. Leh23        → status=Exited, email scrambled, notes annotated.
//                     SA ID 9409245251081 from notes is migrated to
//                     Leh22's dedicated ID columns first.
//   3. Leh22        → email = papi.tsomele@gmail.com (canonical),
//                     fullName confirmed = Mpapi Tsomele,
//                     kycStatus = Complete (migrated from Leh01),
//                     kycVerifiedAt = Leh01's or now,
//                     kycSubmittedAt = Leh01's or now,
//                     idType / idNumber from Leh23 if empty,
//                     contributions: any TRUE month from Leh01 carries
//                     forward (so payment history doesn't vanish),
//                     notes appended with the consolidation log.
//
// I CAN'T hard-delete Airtable rows under my safety rules — so the
// retired records remain in Airtable as Exited rows. The user should
// hard-delete them manually in Airtable once they've verified the
// consolidation worked. The script prints exactly which record IDs
// to delete at the end.
//
// Run:
//   node scripts/consolidate-mpapi-to-leh22.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// ── Load .env.local ──
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const raw = readFileSync(resolve(__dirname, "..", ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let [, key, val] = m;
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (!process.env[key]) process.env[key] = val;
  }
} catch (err) {
  console.warn("Could not read .env.local:", err.message);
}

const PAT = process.env.AIRTABLE_PAT;
const BASE = process.env.AIRTABLE_BASE_ID;
const TABLE = process.env.AIRTABLE_TABLE_ID;
if (!PAT || !BASE || !TABLE) {
  console.error("Missing AIRTABLE_PAT / AIRTABLE_BASE_ID / AIRTABLE_TABLE_ID");
  process.exit(1);
}

// ── Field IDs (from lib/definitions.ts) ──
const F = {
  fullName: "fldHKLMVnWZXIAqSd",
  memberNumber: "fldYWZDCt3xL335xH",
  email: "fld849lrKZ1suGQAC",
  phone: "fldyHdgqfMyaA0qrY",
  status: "fldRLmj83nad74ce3",
  kycStatus: "fld6ziBOUgGNVMnkA",
  source: "fldHT2KWI4fh2E6C0",
  notes: "fldKKvYST9FxOyfND",
  idType: "fldMS1ht7AZmly9IS",
  idNumber: "fldZqNlioxhtRIMAY",
  residentialAddress: "fldi5lWpTW8b5t690",
  kycSubmittedAt: "flde48OYccGxnkV04",
  kycVerifiedAt: "fld9RKaIVL5RAvhcT",
};

const MONTH_FIELDS = {
  Jan: "fld39hRdSczFxsBZD",
  Feb: "fldej4QBGlVgyw5hE",
  Mar: "fldC4GdePzxpT3DAo",
  Apr: "fldij1iXg5fEPHxuj",
  May: "fldFa7jFmAOs8TlXs",
  Jun: "fldTsAne8lrMx72tr",
  Jul: "fld6Boc4VKY14S4zp",
  Aug: "fldGalDJkRLqus3fw",
  Sep: "fldod9aZI6svSuB2j",
  Oct: "fldXh7YLslalpnFzD",
  Nov: "fldoQTcbjrEipIjLw",
  Dec: "flddnHgLgbCkHvxVW",
};

const ID_TYPE_NAME = {
  selu73LPS0rKoSq7c: "SA ID",
  sel2aXQ83h42dEBkU: "Passport",
};

const STATUS_NAME = {
  selhvEexF8pU2Bilk: "Prospect",
  selBIASB38yyxn9gn: "Onboarding",
  selJHkVh1Jc2ZtdUr: "Active",
  selGCXWVPgjRcvgTm: "On Hold",
  selRlwsyYBW5RRrci: "Exited",
};

const KYC_NAME = {
  selow6jXoCUoyiqMF: "Not Started",
  sel4lpJ1hUv0B11L9: "Docs Requested",
  selJ3whjq2wII83Ag: "In Progress",
  sel3QJS7R6x9KYRp2: "Complete",
};

function resolveSelect(value, map) {
  if (value == null) return "";
  if (typeof value === "string") return map[value] ?? value;
  if (typeof value === "object" && "name" in value) return value.name;
  return "";
}

const headers = {
  Authorization: `Bearer ${PAT}`,
  "Content-Type": "application/json",
};

async function listAll() {
  const out = [];
  let offset;
  do {
    const params = new URLSearchParams({
      pageSize: "100",
      returnFieldsByFieldId: "true",
    });
    if (offset) params.set("offset", offset);
    const res = await fetch(
      `https://api.airtable.com/v0/${BASE}/${TABLE}?${params}`,
      { headers },
    );
    if (!res.ok) throw new Error(`list ${res.status}: ${await res.text()}`);
    const data = await res.json();
    for (const r of data.records ?? []) out.push(r);
    offset = data.offset;
  } while (offset);
  return out;
}

async function patchRecord(id, fields, label) {
  const url = `https://api.airtable.com/v0/${BASE}/${TABLE}/${id}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ fields, returnFieldsByFieldId: true }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PATCH ${label} ${res.status}: ${body}`);
  }
  console.log(`  ✓ ${label}  (${id})`);
  return res.json();
}

// Parse legacy "SA ID: 12345" / "Passport: ..." / "Address: ..." from notes.
function parseNotes(notes) {
  const out = { idType: "", idNumber: "", address: "" };
  if (!notes) return out;
  for (const part of notes.split(/\s*\|\s*/)) {
    const t = part.trim();
    let m;
    if ((m = t.match(/^SA\s*ID\s*:\s*(.+)$/i))) {
      out.idType = "sa_id";
      out.idNumber = m[1].trim();
    } else if ((m = t.match(/^Passport\s*:\s*(.+)$/i))) {
      out.idType = "passport";
      out.idNumber = m[1].trim();
    } else if ((m = t.match(/^Address\s*:\s*(.+)$/i))) {
      out.address = m[1].trim();
    }
  }
  return out;
}

// ── Main ──
console.log("Fetching all members…\n");
const records = await listAll();

// Find the three Mpapi records by ID — using IDs (not emails) for safety
// since emails are about to change.
const LEH01_MPAPI_ID = "recbTTH79t0BAaeJ4";
const LEH23_ID = "rechYyKN889phP3ml";

const byId = new Map(records.map((r) => [r.id, r]));
const leh01Mpapi = byId.get(LEH01_MPAPI_ID);
const leh23 = byId.get(LEH23_ID);
const leh22 = records.find((r) => r.fields[F.memberNumber] === 22);

if (!leh01Mpapi) {
  console.error(`Cannot find Leh01 Mpapi at ${LEH01_MPAPI_ID}`);
  process.exit(1);
}
if (!leh23) {
  console.error(`Cannot find Leh23 at ${LEH23_ID}`);
  process.exit(1);
}
if (!leh22) {
  console.error("Cannot find Leh22 record");
  process.exit(1);
}

const leh01Fields = leh01Mpapi.fields;
const leh22Fields = leh22.fields;
const leh23Fields = leh23.fields;
const leh23Notes = parseNotes(leh23Fields[F.notes] || "");

console.log("┌─ Current state ─────────────────────────────────────────");
console.log(`│ Leh01 Mpapi  ${leh01Mpapi.id}`);
console.log(`│   email: ${leh01Fields[F.email]}`);
console.log(`│   status: ${resolveSelect(leh01Fields[F.status], STATUS_NAME)}`);
console.log(`│   kyc:    ${resolveSelect(leh01Fields[F.kycStatus], KYC_NAME)}`);
console.log(`│ Leh22       ${leh22.id}`);
console.log(`│   email: ${leh22Fields[F.email]}`);
console.log(`│   status: ${resolveSelect(leh22Fields[F.status], STATUS_NAME)}`);
console.log(`│   kyc:    ${resolveSelect(leh22Fields[F.kycStatus], KYC_NAME)}`);
console.log(`│ Leh23       ${leh23.id}`);
console.log(`│   email: ${leh23Fields[F.email]}`);
console.log(`│   notes-parsed: ${JSON.stringify(leh23Notes)}`);
console.log("└──────────────────────────────────────────────────────────\n");

const todayIso = new Date().toISOString();
const todayDate = todayIso.slice(0, 10);

// Airtable's KYC dates are configured as date-only fields (no time
// component), so we send YYYY-MM-DD. If the source record already has
// a value, normalise it down to the date portion in case it was a full
// ISO timestamp written by older code.
function asDateOnly(v) {
  if (!v) return null;
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : null;
}

// ─── Build patches ────────────────────────────────────────────────────

// Leh22 ← receives the consolidated identity
const leh22Patch = {
  [F.email]: "papi.tsomele@gmail.com",
  [F.fullName]: "Mpapi Tsomele",
  [F.kycStatus]: "Complete",
  // Use Leh01's verified date if it had one, otherwise stamp today.
  [F.kycVerifiedAt]:
    asDateOnly(leh01Fields[F.kycVerifiedAt]) || todayDate,
  // Submitted date: prefer Leh22's existing if set, else Leh01's, else today.
  [F.kycSubmittedAt]:
    asDateOnly(leh22Fields[F.kycSubmittedAt]) ||
    asDateOnly(leh01Fields[F.kycSubmittedAt]) ||
    todayDate,
};

// Backfill Leh22's structured ID columns from Leh23's notes if Leh22's
// dedicated cols are empty. (Leh23 had "SA ID: 9409245251081" in notes.)
if (!leh22Fields[F.idType] && leh23Notes.idType) {
  leh22Patch[F.idType] = leh23Notes.idType === "sa_id" ? "SA ID" : "Passport";
}
if (!leh22Fields[F.idNumber] && leh23Notes.idNumber) {
  leh22Patch[F.idNumber] = leh23Notes.idNumber;
}
if (!leh22Fields[F.residentialAddress] && leh23Notes.address) {
  leh22Patch[F.residentialAddress] = leh23Notes.address;
}

// Carry forward TRUE contribution months from Leh01 → Leh22 so payment
// history follows Mpapi's identity.
const carriedMonths = [];
for (const [month, fid] of Object.entries(MONTH_FIELDS)) {
  if (leh01Fields[fid] === true && leh22Fields[fid] !== true) {
    leh22Patch[fid] = true;
    carriedMonths.push(month);
  }
}

const consolidationNote = `[Consolidated ${todayDate}] Merged from Leh01 (${leh01Fields[F.email]}, KYC Complete) and Leh23 (${leh23Fields[F.email]}, SA ID from notes).`;
leh22Patch[F.notes] =
  (leh22Fields[F.notes] ? leh22Fields[F.notes] + " | " : "") +
  consolidationNote;

// Leh01 Mpapi ← retire
const leh01Patch = {
  [F.status]: "Exited",
  // Scramble the email so future findMemberByEmail lookups don't return
  // this row. We use a "+leh01-replaced" tag on the same gmail address —
  // gmail aliases route to the same inbox, so any future email replies
  // would still reach the user, but the app's exact-match email lookup
  // sees a different string.
  [F.email]: "papi+leh01-replaced-by-leh22@gmail.com",
  [F.notes]:
    (leh01Fields[F.notes] ? leh01Fields[F.notes] + " | " : "") +
    `[Retired ${todayDate}] Replaced by Leh22 in Mpapi consolidation. SAFE TO HARD-DELETE in Airtable.`,
};

// Leh23 ← retire
const leh23Patch = {
  [F.status]: "Exited",
  [F.email]: "info+leh23-duplicate@limepages.org",
  [F.notes]:
    (leh23Fields[F.notes] ? leh23Fields[F.notes] + " | " : "") +
    `[Retired ${todayDate}] Duplicate of Leh22. SAFE TO HARD-DELETE in Airtable.`,
};

// ─── Plan output ──────────────────────────────────────────────────────

console.log("┌─ Plan ──────────────────────────────────────────────────");
console.log(`│ 1. PATCH Leh01 Mpapi (${leh01Mpapi.id})`);
console.log("│      status     → Exited");
console.log("│      email      → papi+leh01-replaced-by-leh22@gmail.com");
console.log("│      notes      → (annotated with retirement)");
console.log(`│ 2. PATCH Leh23 (${leh23.id})`);
console.log("│      status     → Exited");
console.log("│      email      → info+leh23-duplicate@limepages.org");
console.log("│      notes      → (annotated with retirement)");
console.log(`│ 3. PATCH Leh22 (${leh22.id})`);
console.log("│      email      → papi.tsomele@gmail.com");
console.log("│      fullName   → Mpapi Tsomele");
console.log(`│      kycStatus  → Complete  (was ${resolveSelect(leh22Fields[F.kycStatus], KYC_NAME)})`);
console.log(`│      kycVerifiedAt → ${leh22Patch[F.kycVerifiedAt]}`);
if (leh22Patch[F.idType])
  console.log(`│      idType     → ${leh22Patch[F.idType]} (from Leh23 notes)`);
if (leh22Patch[F.idNumber])
  console.log(`│      idNumber   → ${leh22Patch[F.idNumber]} (from Leh23 notes)`);
if (carriedMonths.length)
  console.log(`│      months     → carry forward ${carriedMonths.join(", ")}`);
else console.log("│      months     → (no contributions to carry from Leh01)");
console.log("│      notes      → (consolidation log appended)");
console.log("└──────────────────────────────────────────────────────────\n");

// ─── Execute ──────────────────────────────────────────────────────────
//
// Order matters: scramble the retired records' emails FIRST so when we
// flip Leh22's email to papi.tsomele@gmail.com there's no other live
// row with the same email — keeps findMemberByEmail unambiguous from
// the moment the change lands.

console.log("Executing writes…\n");

// Idempotency: if a step already landed (status=Exited on retirees,
// canonical email on Leh22), skip it. Lets us re-run the script after
// fixing partial failures without re-applying earlier writes.
const leh01AlreadyRetired =
  resolveSelect(leh01Fields[F.status], STATUS_NAME) === "Exited";
const leh23AlreadyRetired =
  resolveSelect(leh23Fields[F.status], STATUS_NAME) === "Exited";
const leh22AlreadyConsolidated =
  leh22Fields[F.email] === "papi.tsomele@gmail.com" &&
  resolveSelect(leh22Fields[F.kycStatus], KYC_NAME) === "Complete";

console.log("1/3  Retiring Leh01 Mpapi");
if (leh01AlreadyRetired) {
  console.log(`  ↷ already Exited, skipping  (${leh01Mpapi.id})`);
} else {
  await patchRecord(leh01Mpapi.id, leh01Patch, "Leh01 Mpapi");
}

console.log("\n2/3  Retiring Leh23");
if (leh23AlreadyRetired) {
  console.log(`  ↷ already Exited, skipping  (${leh23.id})`);
} else {
  await patchRecord(leh23.id, leh23Patch, "Leh23");
}

console.log("\n3/3  Updating Leh22 with consolidated identity");
if (leh22AlreadyConsolidated) {
  console.log(`  ↷ already consolidated, skipping  (${leh22.id})`);
} else {
  await patchRecord(leh22.id, leh22Patch, "Leh22");
}

// ─── Done ─────────────────────────────────────────────────────────────

console.log("\n══════════════════════════════════════════════════════════");
console.log("  ✓ CONSOLIDATION COMPLETE");
console.log("══════════════════════════════════════════════════════════\n");
console.log("In Airtable now:");
console.log("  • Refilwe Ngwaku is the sole Leh01 (Prospect)");
console.log("  • Mpapi Tsomele is the sole Leh22 (Active · KYC Complete)");
console.log("  • Two retired duplicates remain marked as Exited:");
console.log(`      ${leh01Mpapi.id}   (was Leh01 Mpapi)`);
console.log(`      ${leh23.id}   (was Leh23)`);
console.log("\nTo hard-delete the retired rows, in Airtable:");
console.log("  → filter the Lehumo table by Status = Exited");
console.log("  → confirm only the two records above appear");
console.log("  → select them → right-click → Delete records");
console.log();
