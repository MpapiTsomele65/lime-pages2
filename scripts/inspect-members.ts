// Read-only: dump scalar fields of members whose record matches a name
// substring. Used to inspect duplicates before a merge.
//   set -a && source .env.local && set +a
//   npx tsx --require ./scripts/server-only-stub.cjs scripts/inspect-members.ts Kgano

const NAME = (process.argv[2] ?? "").toLowerCase();

async function main() {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableId = process.env.AIRTABLE_TABLE_ID;
  const pat = process.env.AIRTABLE_PAT;
  if (!baseId || !tableId || !pat) throw new Error("Missing Airtable env vars");

  const out: Array<{ id: string; fields: Record<string, unknown> }> = [];
  let offset: string | undefined;
  do {
    const url = new URL(`https://api.airtable.com/v0/${baseId}/${tableId}`);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${pat}` } });
    if (!res.ok) throw new Error(`${res.status} — ${await res.text()}`);
    const data = (await res.json()) as {
      records: Array<{ id: string; fields: Record<string, unknown> }>;
      offset?: string;
    };
    for (const r of data.records) {
      if (JSON.stringify(r.fields).toLowerCase().includes(NAME)) out.push(r);
    }
    offset = data.offset;
  } while (offset);

  for (const r of out) {
    console.log(`\n=== ${r.id} ===`);
    for (const [k, v] of Object.entries(r.fields)) {
      if (["string", "number", "boolean"].includes(typeof v)) {
        console.log(`  ${k}: ${v}`);
      }
    }
  }
  console.log(`\n(${out.length} match${out.length === 1 ? "" : "es"})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
