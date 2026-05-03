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
        {/* Header — refined typography to match the portal facelift.
            Eyebrow / headline / sub-line stack with tracking-tight on
            the headline; signed-in chip moves to the right with a
            subtle pill background to match the new chrome system. */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0B1933] mb-1.5">
              Admin Panel
            </p>
            <h1 className="text-[28px] md:text-[34px] font-semibold tracking-tight text-[#0B0B0B] leading-[1.1]">
              Lehumo Member Management
            </h1>
            <p className="mt-2 text-[14px] text-[#6B7280]">
              Track contributions, KYC, and status for every member.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-[#E5E7EB] bg-white/60 px-3 py-1.5 text-[11px] text-[#6B7280] backdrop-blur-sm">
            Signed in as{" "}
            <span className="text-[#0B1933] font-semibold">{session.email}</span>
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
        <section
          className="rounded-[24px] border border-[#EDEDED] bg-gradient-to-b from-white to-[#FCFCFD] p-7"
          style={{
            boxShadow:
              "inset 0 1px 0 0 rgba(255, 255, 255, 0.6), " +
              "0 1px 2px 0 rgba(0, 0, 0, 0.04), " +
              "0 4px 16px -4px rgba(0, 0, 0, 0.05)",
          }}
        >
          <h2 className="text-[17px] font-semibold tracking-tight text-[#0B0B0B] mb-1">
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
