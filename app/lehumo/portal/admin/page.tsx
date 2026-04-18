import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/admin-auth";
import { listAllMembers } from "@/lib/airtable-admin";
import { AdminShell } from "@/components/lehumo/admin/AdminShell";
import { AdminMemberTable } from "@/components/lehumo/admin/AdminMemberTable";
import { MONTH_NAMES } from "@/lib/definitions";

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
  const currentMonth = MONTH_NAMES[currentMonthIndex] ?? "Jan";

  const activeCount = members.filter((m) => m.status === "Active").length;
  const paidThisMonth = members.filter((m) => m.contributions[currentMonth]).length;
  const pendingKyc = members.filter(
    (m) => m.kycStatus !== "Complete" && m.status !== "Exited",
  ).length;

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

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <p className="text-[11px] uppercase tracking-wider text-[#9CA3AF]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-[#0B1933]">{value}</p>
    </div>
  );
}
