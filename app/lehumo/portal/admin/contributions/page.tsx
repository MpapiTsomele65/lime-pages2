import { Suspense } from "react";

import { getAdminSession } from "@/lib/admin-auth";
import { listAllMembers } from "@/lib/airtable-admin";
import { listAllContributions } from "@/lib/contributions";
import {
  CONTRIBUTION_STATUS,
  LEHUMO_FIRST_DUE_PERIOD,
} from "@/lib/definitions";
import { AdminPageHeader } from "@/components/lehumo/admin/AdminPageHeader";
import { AdminContributionsClient } from "@/components/lehumo/admin/AdminContributionsClient";

export const dynamic = "force-dynamic";

/**
 * Admin → Finance → Contributions.
 *
 * The standalone cross-member contributions view. Surfaces:
 *   • Summary tiles for the current period (received / expected /
 *     gap / reconciliation pending)
 *   • LogManualDepositCard at the top (primary action — record an
 *     EFT / direct deposit against any member)
 *   • Filterable cross-member table beneath, with inline status
 *     edits and reconciliation
 *
 * Auth gated at the layout level (app/lehumo/portal/admin/layout.tsx).
 *
 * Wrapped in <Suspense> so the URL-driven filter state (useSearchParams
 * inside AdminContributionsClient) is allowed under Next.js 16's
 * static-rendering rules.
 */
export default async function AdminContributionsPage() {
  const session = await getAdminSession();
  const email = session?.email ?? "Admin";

  const [contributions, members] = await Promise.all([
    listAllContributions().catch((err) => {
      console.error("Admin Contributions: failed to list contributions", err);
      return [];
    }),
    listAllMembers().catch((err) => {
      console.error("Admin Contributions: failed to list members", err);
      return [];
    }),
  ]);

  // Current period for the summary tiles: SAST "now" rounded to YYYY-MM,
  // but never before LEHUMO_FIRST_DUE_PERIOD (pre-launch shows June 2026
  // as the upcoming period so the tiles aren't all zero).
  const sastNow = new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Johannesburg",
  });
  const sastPeriod = sastNow.slice(0, 7);
  const currentPeriod =
    sastPeriod < LEHUMO_FIRST_DUE_PERIOD ? LEHUMO_FIRST_DUE_PERIOD : sastPeriod;

  // Cohort summary — only periods >= launch + only Paid count
  // toward "received". Reconciliation pending = Paid + not reconciled.
  const currentPeriodRows = contributions.filter(
    (c) => c.period === currentPeriod,
  );
  const periodReceived = currentPeriodRows
    .filter((c) => c.status === CONTRIBUTION_STATUS.paid)
    .reduce((sum, c) => sum + (c.amountReceived ?? 0), 0);
  const periodExpected = currentPeriodRows.reduce(
    (sum, c) => sum + (c.amountExpected ?? 1000),
    0,
  );
  const periodGap = Math.max(0, periodExpected - periodReceived);
  const reconciliationPending = contributions.filter(
    (c) => c.status === CONTRIBUTION_STATUS.paid && !c.reconciled,
  ).length;

  // Cumulative pool — total contributions received to date across every
  // member and every month (all Paid rows, summed). The all-time
  // counterpart to the current-period "Received" tile.
  const totalPool = contributions
    .filter((c) => c.status === CONTRIBUTION_STATUS.paid)
    .reduce((sum, c) => sum + (c.amountReceived ?? 0), 0);

  // Monthly inflows ledger — received + running cumulative per month, so the
  // final cumulative reconciles exactly to the Total Pool. Covers every
  // elapsed month (launch → now, including any zero months) plus any month
  // that has a Paid row (e.g. a prepayment), so no cash is hidden.
  const paidPeriods = contributions
    .filter((c) => c.status === CONTRIBUTION_STATUS.paid)
    .map((c) => c.period);
  const ledgerPeriods = Array.from(
    new Set([
      ...enumeratePeriods(LEHUMO_FIRST_DUE_PERIOD, currentPeriod),
      ...paidPeriods,
    ]),
  ).sort();
  let runningPool = 0;
  const monthlyInflows = ledgerPeriods.map((period) => {
    const paid = contributions.filter(
      (c) => c.period === period && c.status === CONTRIBUTION_STATUS.paid,
    );
    const received = paid.reduce((s, c) => s + (c.amountReceived ?? 0), 0);
    runningPool += received;
    return { period, count: paid.length, received, cumulative: runningPool };
  });
  const totalContributions = monthlyInflows.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Admin · Finance"
        title="Contributions"
        subtitle="Track every contribution across the cohort. Log manual deposits, reconcile against bank statements, drill into a single member's history."
        rightChip={email}
      />

      {/* Summary tiles — cumulative pool + current period at a glance */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <SummaryTile
          label="Total Pool (all-time)"
          value={`R${totalPool.toLocaleString("en-ZA")}`}
          tone="pool"
        />
        <SummaryTile
          label={`Received (${formatPeriodLong(currentPeriod)})`}
          value={`R${periodReceived.toLocaleString("en-ZA")}`}
        />
        <SummaryTile
          label="Expected"
          value={`R${periodExpected.toLocaleString("en-ZA")}`}
        />
        <SummaryTile
          label="Gap"
          value={`R${periodGap.toLocaleString("en-ZA")}`}
          tone={periodGap > 0 ? "warn" : "neutral"}
        />
        <SummaryTile
          label="Reconciliation Pending"
          value={reconciliationPending.toString()}
          tone={reconciliationPending > 0 ? "warn" : "neutral"}
        />
      </div>

      {/* Monthly inflows ledger — each month's tally + running cumulative,
          reconciling up to the Total Pool. */}
      <MonthlyInflowsTable
        rows={monthlyInflows}
        total={totalPool}
        totalCount={totalContributions}
      />

      <Suspense fallback={<div className="h-16" />}>
        <AdminContributionsClient
          key={`contribs-${contributions.length}`}
          initialContributions={contributions}
          members={members}
        />
      </Suspense>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "warn" | "pool";
}) {
  const isPool = tone === "pool";
  return (
    <div
      className={`rounded-[20px] border p-4 ${
        isPool
          ? "border-[#CDEB9E] bg-gradient-to-b from-[#F4FFE0] to-white"
          : "border-[#EDEDED] bg-gradient-to-b from-white to-[#FCFCFD]"
      }`}
      style={{
        boxShadow:
          "inset 0 1px 0 0 rgba(255, 255, 255, 0.6), " +
          "0 1px 2px 0 rgba(0, 0, 0, 0.04), " +
          "0 4px 16px -4px rgba(0, 0, 0, 0.05)",
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">
        {label}
      </p>
      <p
        className={`mt-2 text-[26px] font-semibold leading-none tracking-tight tabular-nums ${
          tone === "warn" ? "text-[#92400E]" : "text-[#0B1933]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function MonthlyInflowsTable({
  rows,
  total,
  totalCount,
}: {
  rows: {
    period: string;
    count: number;
    received: number;
    cumulative: number;
  }[];
  total: number;
  totalCount: number;
}) {
  return (
    <div
      className="rounded-[20px] border border-[#EDEDED] bg-white p-4 md:p-5"
      style={{
        boxShadow:
          "inset 0 1px 0 0 rgba(255, 255, 255, 0.6), " +
          "0 1px 2px 0 rgba(0, 0, 0, 0.04), " +
          "0 4px 16px -4px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
          Monthly inflows
        </h2>
        <span className="text-[11px] text-[#9CA3AF]">
          Cumulative reconciles to Total Pool ·{" "}
          <span className="font-semibold text-[#5E7A00]">
            R{total.toLocaleString("en-ZA")}
          </span>
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[440px] text-[13px]">
          <thead>
            <tr className="border-b border-[#EDEDED] text-[10px] uppercase tracking-[0.1em] text-[#9CA3AF]">
              <th className="py-2 text-left font-semibold">Month</th>
              <th className="py-2 text-right font-semibold">Contributions</th>
              <th className="py-2 text-right font-semibold">Received</th>
              <th className="py-2 text-right font-semibold">Cumulative pool</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.period} className="border-b border-[#F3F4F6]">
                <td className="py-2.5 font-medium text-[#0B1933]">
                  {formatPeriodLong(r.period)}
                </td>
                <td className="py-2.5 text-right tabular-nums text-[#4B5563]">
                  {r.count}
                </td>
                <td className="py-2.5 text-right tabular-nums text-[#0B1933]">
                  R{r.received.toLocaleString("en-ZA")}
                </td>
                <td className="py-2.5 text-right font-semibold tabular-nums text-[#0B1933]">
                  R{r.cumulative.toLocaleString("en-ZA")}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[#E5E7EB]">
              <td className="pt-2.5 font-semibold text-[#0B1933]">All-time</td>
              <td className="pt-2.5 text-right font-semibold tabular-nums text-[#0B1933]">
                {totalCount}
              </td>
              <td className="pt-2.5 text-right font-semibold tabular-nums text-[#0B1933]">
                R{total.toLocaleString("en-ZA")}
              </td>
              <td className="pt-2.5 text-right font-semibold tabular-nums text-[#5E7A00]">
                R{total.toLocaleString("en-ZA")}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/** Enumerate YYYY-MM periods from `start` through `end`, inclusive. */
function enumeratePeriods(start: string, end: string): string[] {
  const [sy, sm] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  const out: string[] = [];
  let y = sy;
  let m = sm;
  while ((y < ey || (y === ey && m <= em)) && out.length < 240) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

function formatPeriodLong(period: string): string {
  const [year, m] = period.split("-");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const monthIdx = Number(m) - 1;
  return `${months[monthIdx] ?? m} ${year}`;
}
