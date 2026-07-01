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

function formatPeriodLong(period: string): string {
  const [year, m] = period.split("-");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const monthIdx = Number(m) - 1;
  return `${months[monthIdx] ?? m} ${year}`;
}
