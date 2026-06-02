import { getAdminSession } from "@/lib/admin-auth";
import { listAllMembers } from "@/lib/airtable-admin";
import { AdminKycClient } from "@/components/lehumo/admin/AdminKycClient";
import { AdminPageHeader } from "@/components/lehumo/admin/AdminPageHeader";

export const dynamic = "force-dynamic";

/**
 * Admin → KYC Review.
 *
 * Dedicated view of the KYC review queue — members in "Docs
 * Requested" / "In Progress" / similar pre-Complete states, with
 * the inline approve / reject / chase-up affordances.
 *
 * Previously this lived inside AdminMembersClient alongside the
 * full member table; the split into separate pages means each
 * queue manages its own client state.
 *
 * Auth is gated at the layout level.
 */
export default async function AdminKycPage() {
  const session = await getAdminSession();
  const email = session?.email ?? "Admin";

  const members = await listAllMembers().catch((err) => {
    console.error("Admin KYC: failed to list members", err);
    return [];
  });

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Admin · KYC"
        title="KYC Review Queue"
        subtitle="Members waiting on document review or chase-up."
        rightChip={email}
      />

      <AdminKycClient
        key={`kyc-${members.length}`}
        initialMembers={members}
      />
    </div>
  );
}
