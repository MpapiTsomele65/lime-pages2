/**
 * Minimal CSV writer shared by the backup cron and the member statement
 * download. Quotes every cell, escapes inner quotes, strips CRs — so
 * notes/references containing commas or newlines can't break rows.
 */
export function toCsv(
  header: string[],
  rows: (string | number | boolean)[][],
): string {
  const esc = (v: string | number | boolean) =>
    `"${String(v).replace(/\r/g, "").replace(/"/g, '""')}"`;
  return [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
}
