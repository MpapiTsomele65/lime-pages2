import { getAdminSession } from "@/lib/admin-auth";
import { listAllMembers } from "@/lib/airtable-admin";
import { AdminPrelaunchEmailCard } from "@/components/lehumo/admin/AdminPrelaunchEmailCard";
import { AdminCampaignTracker } from "@/components/lehumo/admin/AdminCampaignTracker";
import { computeCampaignReports } from "@/lib/campaign-analytics";
import { AdminPageHeader } from "@/components/lehumo/admin/AdminPageHeader";

export const dynamic = "force-dynamic";

/**
 * Admin → Communications.
 *
 * Tooling for member-facing comms:
 *   • Pre-launch broadcast email (preview / test / broadcast with
 *     typed-count safety) — lives here so the launch-day comms
 *     surface is one click from the sidebar
 *   • Campaign conversion tracker — same component that surfaces
 *     on Overview, included here for the dedicated comms view
 *
 * Auth is gated at the layout level.
 */
export default async function AdminCommsPage() {
  const session = await getAdminSession();
  const email = session?.email ?? "Admin";

  const members = await listAllMembers().catch((err) => {
    console.error("Admin Comms: failed to list members", err);
    return [];
  });

  const campaignReports = computeCampaignReports(members);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Admin · Comms"
        title="Communications"
        subtitle="Broadcast email tooling and campaign conversion reports."
        rightChip={email}
      />

      <AdminPrelaunchEmailCard defaultTestEmail={email} />

      <AdminCampaignTracker reports={campaignReports} />
    </div>
  );
}
