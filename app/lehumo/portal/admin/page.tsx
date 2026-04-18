import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/admin-auth";
import { listAllMembers } from "@/lib/airtable-admin";
import { PortalShell } from "@/components/lehumo/portal/PortalShell";
import { AdminMemberTable } from "@/components/lehumo/admin/AdminMemberTable";
import { MONTH_NAMES } from "@/lib/definitions";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getAdminSession();

  if (!session) {
    // Not signed in, or signed in but not an admin email — bounce to login.
    // We could show a dedicated "Forbidden" page but login is simpler and
    // doesn't leak whether the /admin route exists.
    redirect("/lehumo/portal/login");
  }

  const members = await listAllMembers().catch((err) => {
    console.error("Admin: failed to list members", err);
    return [];
  });

  const currentMonthIndex = new Date().getMonth();
  const currentMonth = MONTH_NAMES[currentMonthIndex] ?? "Jan";

  const activeCount = members.filter((m) => m.status === "Active").length;
  const paidThisMonth = members.filter((m) => m.contributions[currentMonth]).length;
  const pendingKyc = members.filter(
    (m) => m.kycStatus !== "Complete" && m.status !== "Exited",
  ).length;

  return (
    <PortalShell memberName={session.fullName || "Admin"}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#B8FF00]/80 mb-2">
              Admin Panel
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Lehumo Member Management
            </h1>
            <p className="mt-1 text-sm text-white/50">
              Track contributions, KYC, and status for every member.
            </p>
          </div>
          <div className="text-xs text-white/40">
            Signed in as <span className="text-white/70">{session.email}</span>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatTile label="Total Members" value={members.length.toString()} />
          <StatTile label="Active" value={activeCount.toString()} />
          <StatTile
            label={`Paid (${currentMonth})`}
            value={paidThisMonth.toString()}
          />
          <StatTile label="KYC Pending" value={pendingKyc.toString()} />
        </div>

        {/* Member table */}
        <AdminMemberTable initialMembers={members} currentMonth={currentMonth} />

        {/* Pool settings placeholder */}
        <section className="rounded-[20px] border border-white/[0.06] bg-[#0F2040] p-6">
          <h2 className="text-lg font-semibold text-white mb-1">
            Pool Interest Earned
          </h2>
          <p className="text-sm text-white/50 mb-4">
            The dashboard&rsquo;s cumulative-interest number is currently driven by
            the <code className="text-[#B8FF00]">LEHUMO_INTEREST_EARNED_ZAR</code>{" "}
            and <code className="text-[#B8FF00]">LEHUMO_INTEREST_HISTORY_JSON</code>{" "}
            Vercel env vars. An in-dashboard editor backed by Airtable is on the
            next milestone.
          </p>
          <p className="text-xs text-white/40">
            To update now: Vercel → Project Settings → Environment Variables →
            edit the two variables above → redeploy.
          </p>
        </section>
      </div>
    </PortalShell>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0F2040] p-4">
      <p className="text-[11px] uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
