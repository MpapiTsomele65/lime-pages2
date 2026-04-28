#!/usr/bin/env node
// Audit script — read-only.
//
// Lists every Lehumo member, parses legacy KYC fields out of the notes
// blob (pre-Tier-2A format), and surfaces:
//   1. Members where dedicated KYC columns are empty but legacy data
//      exists in `notes` — these are backfill candidates.
//   2. Duplicate member numbers — the underlying cause of "login takes
//      long" (the lookup hits multiple records and has to disambiguate).
//
// Run:
//   node scripts/audit-members.mjs
//
// Reads from .env.local automatically; emits to stdout. Makes ZERO
// writes — pair with a separate apply script when ready.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// ── tiny .env.local loader ──
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");
try {
  const raw = readFileSync(envPath, "utf8");
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

// ── Field IDs (mirror lib/definitions.ts) ──
const F = {
  fullName: "fldHKLMVnWZXIAqSd",
  memberNumber: "fldYWZDCt3xL335xH",
  email: "fld849lrKZ1suGQAC",
  status: "fldRLmj83nad74ce3",
  kycStatus: "fld6ziBOUgGNVMnkA",
  notes: "fldKKvYST9FxOyfND",
  idType: "fldMS1ht7AZmly9IS",
  idNumber: "fldZqNlioxhtRIMAY",
  residentialAddress: "fldi5lWpTW8b5t690",
};

const STATUS_NAME = {
  selhvEexF8pU2Bilk: "Prospect",
  selBIASB38yyxn9gn: "Onboarding",
  selJHkVh1Jc2ZtdUr: "Active",
  selGCXWVPgjRcvgTm: "On Hold",
  selRlwsyYBW5RRrci: "Exited",
};

const ID_TYPE_NAME = {
  selu73LPS0rKoSq7c: "SA ID",
  sel2aXQ83h42dEBkU: "Passport",
};

function resolveSelect(value, map) {
  if (value == null) return "";
  if (typeof value === "string") return map[value] ?? value;
  if (typeof value === "object" && "name" in value) return value.name;
  return "";
}

// ── Parse legacy notes blob ──
//
// Format (pre-Tier-2A): "Intent: ... | Commitment: ... | Plan: ... |
//                       Source of Funds: ... | SA ID: 1234... |
//                       Address: 123 Main St"
//
// We only care about ID + address bits. Returns { idType, idNumber,
// address } with empty strings for missing.
function parseNotes(notes) {
  const out = { idType: "", idNumber: "", address: "" };
  if (!notes) return out;
  const parts = notes.split(/\s*\|\s*/);
  for (const part of parts) {
    const trimmed = part.trim();
    let m;
    if ((m = trimmed.match(/^SA\s*ID\s*:\s*(.+)$/i))) {
      out.idType = "sa_id";
      out.idNumber = m[1].trim();
    } else if ((m = trimmed.match(/^Passport\s*:\s*(.+)$/i))) {
      out.idType = "passport";
      out.idNumber = m[1].trim();
    } else if ((m = trimmed.match(/^Address\s*:\s*(.+)$/i))) {
      out.address = m[1].trim();
    }
  }
  return out;
}

// ── Fetch all members (paginated) ──
async function listAllMembers() {
  const out = [];
  let offset;
  do {
    const params = new URLSearchParams({
      pageSize: "100",
      returnFieldsByFieldId: "true",
    });
    if (offset) params.set("offset", offset);
    const url = `https://api.airtable.com/v0/${BASE}/${TABLE}?${params}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${PAT}` },
    });
    if (!res.ok) {
      console.error("Airtable error:", res.status, await res.text());
      process.exit(1);
    }
    const data = await res.json();
    for (const r of data.records ?? []) out.push(r);
    offset = data.offset;
  } while (offset);
  return out;
}

// ── Main ──
const records = await listAllMembers();

const rows = records.map((r) => {
  const f = r.fields;
  const notes = f[F.notes] || "";
  const fromNotes = parseNotes(notes);
  return {
    id: r.id,
    memberNumber: f[F.memberNumber] || 0,
    fullName: f[F.fullName] || "",
    email: f[F.email] || "",
    status: resolveSelect(f[F.status], STATUS_NAME),
    kycStatus: resolveSelect(f[F.kycStatus], {}),
    existingIdType: resolveSelect(f[F.idType], ID_TYPE_NAME),
    existingIdNumber: f[F.idNumber] || "",
    existingAddress: f[F.residentialAddress] || "",
    notes,
    fromNotes,
  };
});

rows.sort((a, b) => a.memberNumber - b.memberNumber);

// ─── Section 1: KYC backfill candidates ───────────────────────────────
console.log("\n══════════════════════════════════════════════════════════");
console.log("  KYC BACKFILL CANDIDATES (from notes → dedicated cols)");
console.log("══════════════════════════════════════════════════════════\n");

let backfillCount = 0;
for (const r of rows) {
  const willWriteIdType = !r.existingIdType && r.fromNotes.idType;
  const willWriteIdNum = !r.existingIdNumber && r.fromNotes.idNumber;
  const willWriteAddr = !r.existingAddress && r.fromNotes.address;
  if (!willWriteIdType && !willWriteIdNum && !willWriteAddr) continue;

  backfillCount++;
  const num = `Leh${String(r.memberNumber).padStart(2, "0")}`;
  console.log(`▸ ${num}  ${r.fullName}  <${r.email}>  [${r.status} · ${r.kycStatus}]`);
  console.log(`  record: ${r.id}`);
  if (willWriteIdType)
    console.log(`  idType:    "" → "${r.fromNotes.idType === "sa_id" ? "SA ID" : "Passport"}"`);
  if (willWriteIdNum)
    console.log(`  idNumber:  "" → "${r.fromNotes.idNumber}"`);
  if (willWriteAddr)
    console.log(`  address:   "" → "${r.fromNotes.address}"`);
  console.log();
}
if (backfillCount === 0) {
  console.log("(none — all members either already have dedicated cols filled, or no legacy data in notes)\n");
}
console.log(`Total backfill candidates: ${backfillCount}\n`);

// ─── Section 2: Members with notes but NOT backfillable ──────────────
console.log("══════════════════════════════════════════════════════════");
console.log("  MEMBERS WITH KYC ALREADY POPULATED (skipped — already done)");
console.log("══════════════════════════════════════════════════════════\n");
let alreadyDone = 0;
for (const r of rows) {
  if (r.existingIdType || r.existingIdNumber || r.existingAddress) {
    alreadyDone++;
    const num = `Leh${String(r.memberNumber).padStart(2, "0")}`;
    console.log(
      `  ${num}  ${r.fullName.padEnd(28)}  idType:${r.existingIdType || "-"}  idNum:${r.existingIdNumber || "-"}  addr:${r.existingAddress ? "(set)" : "-"}`,
    );
  }
}
if (alreadyDone === 0) console.log("(none)");
console.log();

// ─── Section 3: Duplicate member numbers ──────────────────────────────
console.log("══════════════════════════════════════════════════════════");
console.log("  DUPLICATE MEMBER NUMBERS (cause of slow login)");
console.log("══════════════════════════════════════════════════════════\n");
const byNumber = new Map();
for (const r of rows) {
  if (!byNumber.has(r.memberNumber)) byNumber.set(r.memberNumber, []);
  byNumber.get(r.memberNumber).push(r);
}
let dupCount = 0;
for (const [num, group] of [...byNumber.entries()].sort((a, b) => a[0] - b[0])) {
  if (group.length < 2) continue;
  dupCount++;
  console.log(`▸ Leh${String(num).padStart(2, "0")}  (${group.length} records)`);
  for (const r of group) {
    console.log(`    ${r.id}  ${r.fullName.padEnd(28)}  <${r.email}>  [${r.status} · ${r.kycStatus}]`);
  }
  console.log();
}
if (dupCount === 0) console.log("(no duplicates — every member number is unique)\n");

// ─── Section 4: Full member roster ──────────────────────────────────
console.log("══════════════════════════════════════════════════════════");
console.log("  FULL ROSTER");
console.log("══════════════════════════════════════════════════════════\n");
console.log(
  "Num     Name                           Email                                    Status        KYC",
);
console.log("-".repeat(130));
for (const r of rows) {
  const num = `Leh${String(r.memberNumber).padStart(2, "0")}`.padEnd(7);
  const name = r.fullName.padEnd(30).slice(0, 30);
  const email = r.email.padEnd(40).slice(0, 40);
  const status = r.status.padEnd(13);
  console.log(`${num} ${name} ${email} ${status} ${r.kycStatus}`);
}
console.log(`\nTotal members: ${rows.length}\n`);
