import { getAdminSession } from "@/lib/admin-auth";
import { listAllMembers } from "@/lib/airtable-admin";
import { getSubscriptionDetails } from "@/lib/paystack";
import { AdminPoolTracker } from "@/components/lehumo/admin/AdminPoolTracker";
import { AdminCommunityHealth } from "@/components/lehumo/admin/AdminCommunityHealth";
import { AdminBehindSnapshot } from "@/components/lehumo/admin/AdminBehindSnapshot";
import { AdminPendingActions } from "@/components/lehumo/admin/AdminPendingActions";
import { AdminCampaignTracker } from "@/components/lehumo/admin/AdminCampaignTracker";
import { computeAdminStats } from "@/lib/admin-stats";
import { computeCampaignReports } from "@/lib/campaign-analytics";
import { getKycDeadlineInfo } from "@/lib/definitions";
import { AdminPageHeader } from "@/components/lehumo/admin/AdminPageHeader";

export const dynamic = "force-dynamic";

/**
 * Admin → Overview.
 *
 * The lean dashboard you land on when you sign in as an admin.
 * High-level signal only — KPI tiles, pool / community-health
 * charts, behind-snapshot, plus any time-sensitive pending actions
 * (subscription cancellations etc.). Drilling into specific
 * workflows happens via the sidebar — Members, KYC Review,
 * Communications, Settings.
 *
 * Auth gate now lives in app/lehumo/portal/admin/layout.tsx — no
 * need to re-check getAdminSession() here. We still pull the
 * session for the signed-in chip in the header.
 */
export default async function AdminOverviewPage() {
  // Layout already gated on getAdminSession returning a session, so
  // this call is guaranteed to return one. Used for the "Signed in
  // as" chip in the page header.
  const session = await getAdminSession();
  const email = session?.email ?? "Admin";

  const members = await listAllMembers().catch((err) => {
    console.error("Admin Overview: failed to list members", err);
    return [];
  });

  const currentMonthIndex = new Date().getMonth();
  const stats = computeAdminStats(members, currentMonthIndex);
  const { currentMonth } = stats;
  const campaignReports = computeCampaignReports(members);
  const kycDeadline = getKycDeadlineInfo();

  // Pending Paystack subscription cancellations — fetched in parallel
  // so the dashboard isn't blocked on N sequential billing-date
  // lookups. See AdminPendingActions for how the data is rendered.
  const subscriptionDetails = await Promise.all(
    stats.subscriptionCancelPending.map(async (m) => {
      if (!m.subscriptionCode) return { memberId: m.id, details: null };
      const details = await getSubscriptionDetails(m.subscriptionCode);
      return { memberId: m.id, details };
    }),
  );
  const subscriptionDetailsByMember = Object.fromEntries(
    subscriptionDetails.map((entry) => [
      entry.memberId,
      entry.details
        ? {
            nextPaymentDate: entry.details.nextPaymentDate,
            status: entry.details.status,
          }
        : null,
    ]),
  );

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Admin"
        title="Overview"
        subtitle="KPIs, pool tracking, and time-sensitive pending actions."
        rightChip={email}
      />

      {/* Pending actions — self-hides when the queue is empty. */}
      <AdminPendingActions
        pending={stats.subscriptionCancelPending}
        subscriptionDetailsByMember={subscriptionDetailsByMember}
      />

      {/* Cohort email-blast conversion. Self-hides when no campaigns. */}
      <AdminCampaignTracker reports={campaignReports} />

      {/* Stat tiles — 2/3/6 responsive grid. */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        <StatTile
          label="Total Members"
          value={stats.totalMembers.toString()}
          sub={
            stats.exitedCount > 0
              ? `${stats.exitedCount} exited`
              : undefined
          }
        />
        <StatTile
          label="Active"
          value={stats.activeCount.toString()}
          sub={
            stats.onboardingCount > 0
              ? `+${stats.onboardingCount} onboarding`
              : undefined
          }
        />
        <StatTile
          label={`Paid (${currentMonth})`}
          value={stats.activePaidThisMonth.toString()}
          sub={`${stats.thisMonthRate}% of active`}
        />
        <StatTile
          label="KYC Pending"
          value={stats.kycPending.toString()}
          sub={
            kycDeadline.isPast
              ? `${stats.kycComplete} verified · Overdue!`
              : `${kycDeadline.daysRemaining} days to 15 Aug deadline`
          }
        />
        <StatTile
          label="Beneficiary Missing"
          value={stats.beneficiaryMissing.toString()}
          sub={`${stats.beneficiaryOnFile} on file`}
        />
        <StatTile
          label="Password Set"
          value={stats.passwordProtected.toString()}
          sub={
            stats.pipelineCount > 0
              ? `${stats.passwordProtectedPct}% of ${stats.pipelineCount} active`
              : undefined
          }
        />
      </div>

      {/* Pool tracking + community health side-by-side on lg+. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AdminPoolTracker stats={stats} />
        <AdminCommunityHealth stats={stats} />
      </div>

      {/* Falling-behind snapshot — chase-up list without scanning the
          full member table. */}
      <AdminBehindSnapshot stats={stats} />
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div
      className="rounded-[20px] border border-[#EDEDED] bg-gradient-to-b from-white to-[#FCFCFD] p-4 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-[1px] hover:border-[#E0E0E0]"
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
      <p className="mt-2 text-[26px] font-semibold text-[#0B1933] leading-none tracking-tight tabular-nums">
        {value}
      </p>
      {sub && (
        <p className="mt-2 text-[11px] text-[#6B7280] truncate">{sub}</p>
      )}
    </div>
  );
}
