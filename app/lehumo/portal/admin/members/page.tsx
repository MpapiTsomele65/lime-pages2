import { getAdminSession } from "@/lib/admin-auth";
import { listAllMembers } from "@/lib/airtable-admin";
import { AdminMembersClient } from "@/components/lehumo/admin/AdminMembersClient";
import { AdminAddMemberCard } from "@/components/lehumo/admin/AdminAddMemberCard";
import { AdminPageHeader } from "@/components/lehumo/admin/AdminPageHeader";

export const dynamic = "force-dynamic";

/**
 * Admin → Members.
 *
 * The identity-focused view of every member: name, contact, status,
 * KYC, beneficiary, plan, loan position, and password state.
 *
 * Contribution tracking lives on /admin/contributions — each member
 * row carries a "Contributions" deep-link that lands on the
 * Contributions page filtered to that member.
 *
 * Auth is gated at the layout level (app/lehumo/portal/admin/layout.tsx).
 */
export default async function AdminMembersPage() {
  const session = await getAdminSession();
  const email = session?.email ?? "Admin";

  const members = await listAllMembers().catch((err) => {
    console.error("Admin Members: failed to list members", err);
    return [];
  });

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Admin · Members"
        title="Lehumo Member Management"
        subtitle="Member identity, status, KYC, beneficiary, and password state. For contribution tracking, use the Contributions chip on each row."
        rightChip={email}
      />

      {/* Manual add-member — for prospects who emailed KYC docs without
          going through the public onboarding form. Lives at the top
          here because it kicks off the workflow that fills the table
          below. */}
      <AdminAddMemberCard />

      {/* Member table client wrapper. `key={members.length}` re-mounts
          the wrapper whenever a NEW member is added (AdminAddMemberCard
          → router.refresh → fresh server-side members list with one
          extra row). Without this, the wrapper's useState would
          ignore the new prop and the new member wouldn't appear in
          the table until a manual refresh. */}
      <AdminMembersClient
        key={`members-${members.length}`}
        initialMembers={members}
      />
    </div>
  );
}
