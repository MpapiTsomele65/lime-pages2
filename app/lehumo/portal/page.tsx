import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { getCommunityPoolStats, getMemberById } from "@/lib/airtable";
import { isAdminEmail } from "@/lib/admin-auth";
import { getSastMonthInfo, isBeforeLaunch } from "@/lib/definitions";
import { getSastCurrentPeriod } from "@/lib/member-contributions-view";
import { PortalShell } from "@/components/lehumo/portal/PortalShell";
import { DashboardOverview } from "@/components/lehumo/portal/DashboardOverview";

export default async function PortalDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/lehumo/portal/login");
  }

  const [member, communityStats] = await Promise.all([
    getMemberById(session.memberId),
    getCommunityPoolStats().catch((err) => {
      // Community stats are non-critical — don't break the dashboard if Airtable
      // returns an error for the list endpoint (e.g. permissions change).
      console.error("Failed to load community pool stats:", err);
      return null;
    }),
  ]);

  const memberName = member?.fullName ?? session.fullName ?? "Member";
  const isAdmin = isAdminEmail(session.email);

  if (!member) {
    return (
      <PortalShell memberName={memberName} isAdmin={isAdmin}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-[#0F2040] rounded-[20px] border border-white/[0.06] p-8 text-center max-w-md">
            <h2 className="text-xl font-semibold text-white mb-2">
              Member Not Found
            </h2>
            <p className="text-white/50 text-sm">
              We could not load your profile. Please contact support or try
              signing in again.
            </p>
          </div>
        </div>
      </PortalShell>
    );
  }

  // Compute SAST current-month + days-left server-side so the
  // contribution reminder card renders correctly on first paint and
  // doesn't rely on a useEffect to settle (which would flash the wrong
  // month for two hours either side of UTC midnight).
  const { monthCode: currentMonth, daysLeftInMonth } = getSastMonthInfo();

  // Period (YYYY-MM) is what the new Contributions table indexes on. Past
  // Phase 4 the reminder/grid use this to disambiguate Jun 2026 from Jun
  // 2027 etc — the legacy `currentMonth` (just "Jun") is ambiguous after
  // year 1.
  const currentPeriod = getSastCurrentPeriod();

  // Lehumo collections start 1 Jun 2026. Members onboarding before that
  // shouldn't see "Next due: Jan" / past-month catch-up prompts — gate
  // payment-prompt UI on this flag, computed server-side so SSR matches
  // the client.
  const beforeLaunch = isBeforeLaunch();

  return (
    <PortalShell memberName={memberName} isAdmin={isAdmin}>
      <DashboardOverview
        member={member}
        communityStats={communityStats}
        isAdmin={isAdmin}
        currentMonth={currentMonth}
        currentPeriod={currentPeriod}
        daysLeftInMonth={daysLeftInMonth}
        beforeLaunch={beforeLaunch}
      />
    </PortalShell>
  );
}
