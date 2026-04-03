import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { getMemberById } from "@/lib/airtable";
import { PortalShell } from "@/components/lehumo/portal/PortalShell";
import { DashboardOverview } from "@/components/lehumo/portal/DashboardOverview";

export default async function PortalDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/lehumo/portal/login");
  }

  const member = await getMemberById(session.memberId);
  const memberName = member?.fullName ?? session.fullName ?? "Member";

  if (!member) {
    return (
      <PortalShell memberName={memberName}>
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

  return (
    <PortalShell memberName={memberName}>
      <DashboardOverview member={member} />
    </PortalShell>
  );
}
