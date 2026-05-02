import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/admin-auth";
import { listAllMembers } from "@/lib/airtable-admin";
import { AdminShell } from "@/components/lehumo/admin/AdminShell";
import { AdminMembersClient } from "@/components/lehumo/admin/AdminMembersClient";
import { AdminAddMemberCard } from "@/components/lehumo/admin/AdminAddMemberCard";
import { AdminPoolTracker } from "@/components/lehumo/admin/AdminPoolTracker";
import { AdminCommunityHealth } from "@/components/lehumo/admin/AdminCommunityHealth";
import { AdminBehindSnapshot } from "@/components/lehumo/admin/AdminBehindSnapshot";
import { computeAdminStats } from "@/lib/admin-stats";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/lehumo/portal/login");
  }

  const members = await listAllMembers().catch((err) => {
    console.error("Admin: failed to list members", err);
    return [];
  });

  const currentMonthIndex = new Date().getMonth();
  // All KPI / health-bar / behind-list math is centralised in
  // computeAdminStats so the page stays focused on layout. See
  // lib/admin-stats.ts for the full breakdown.
  const stats = computeAdminStats(members, currentMonthIndex);
  const { currentMonth } = stats;

  return (
    <AdminShell memberName={session.fullName || "Admin"}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#0B1933] mb-2">
              Admin Panel
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-[#0B0B0B]">
              Lehumo Member Management
            </h1>
            <p className="mt-1 text-sm text-[#6B7280]">
              Track contributions, KYC, and status for every member.
            </p>
          </div>
          <div className="text-xs text-[#9CA3AF]">
            Signed in as{" "}
            <span className="text-[#0B1933] font-medium">{session.email}</span>
          </div>
        </div>

        {/* Stat tiles — quick at-a-glance counts. Richer breakdowns sit
            in the Pool / Community Health / Behind cards below. */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
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
            sub={`${stats.kycComplete} verified`}
          />
          <StatTile
            label="Beneficiary Missing"
            value={stats.beneficiaryMissing.toString()}
            sub={`${stats.beneficiaryOnFile} on file`}
          />
        </div>

        {/* Pool tracking + community health — the two flagship monitoring
            cards. Side-by-side on lg, stacked on smaller so neither gets
            squashed into unreadable text. */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AdminPoolTracker stats={stats} />
          <AdminCommunityHealth stats={stats} />
        </div>

        {/* Falling-behind snapshot — full width. Surfaces the chase-up
            list without admins needing to scan the whole member table. */}
        <AdminBehindSnapshot stats={stats} />

        {/* Manual add-member — for prospects who emailed KYC docs without
            going through the public onboarding form. Creating here drops
            them straight into the review queue below. */}
        <AdminAddMemberCard />

        {/* Single client wrapper that owns `members` state for both the
            KYC review queue and the full member table. Lifting state
            up makes row-level actions (KYC approve/reject, beneficiary
            add/edit, status changes, contribution toggles) propagate
            between the two sections in the same render — without
            this, a beneficiary saved from the KYC row's block left
            the AdminMemberTable's beneficiary cell still showing
            "+ Add", inviting accidental overwrites.

            `key={members.length}` re-mounts the wrapper whenever a
            NEW member is added (AdminAddMemberCard → router.refresh
            → fresh member list), giving the wrapper's useState a
            chance to re-seed from the new initialMembers prop. */}
        <AdminMembersClient
          key={`members-${members.length}`}
          initialMembers={members}
          currentMonth={currentMonth}
        />

        {/* Pool settings placeholder */}
        <section className="rounded-[20px] border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h2 className="text-lg font-semibold text-[#0B0B0B] mb-1">
            Pool Interest Earned
          </h2>
          <p className="text-sm text-[#6B7280] mb-4">
            The dashboard&rsquo;s cumulative-interest number is currently driven by
            the{" "}
            <code className="rounded bg-[#F8F9FA] border border-[#E5E7EB] px-1.5 py-0.5 text-xs text-[#0B1933]">
              LEHUMO_INTEREST_EARNED_ZAR
            </code>{" "}
            and{" "}
            <code className="rounded bg-[#F8F9FA] border border-[#E5E7EB] px-1.5 py-0.5 text-xs text-[#0B1933]">
              LEHUMO_INTEREST_HISTORY_JSON
            </code>{" "}
            Vercel env vars. An in-dashboard editor backed by Airtable is on the
            next milestone.
          </p>
          <p className="text-xs text-[#9CA3AF]">
            To update now: Vercel → Project Settings → Environment Variables →
            edit the two variables above → redeploy.
          </p>
        </section>
      </div>
    </AdminShell>
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
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <p className="text-[11px] uppercase tracking-wider text-[#9CA3AF]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-[#0B1933] leading-none">
        {value}
      </p>
      {sub && (
        <p className="mt-1.5 text-[11px] text-[#6B7280] truncate">{sub}</p>
      )}
    </div>
  );
}
