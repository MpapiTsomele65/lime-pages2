import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin-auth";
import { PortalShell } from "@/components/lehumo/portal/PortalShell";

/**
 * Member portal route-group layout.
 *
 * Single source of truth for the member auth gate + the shell chrome
 * (header + persistent left sidebar). Lives in the `(member)` route
 * group so it wraps every member section — Overview, Contributions,
 * Emergency Loans, Community, Profile, KYC, Learn, Security — but NOT
 * the login / forgot pages (which sit outside the group).
 *
 * The shell stays mounted across client-side section navigations, so
 * the sidebar's active item swaps without a re-render flash. Chrome
 * only needs the session (name + admin flag); each section page does
 * its own member fetch.
 */
export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/lehumo/portal/login");
  }

  return (
    <PortalShell
      memberName={session.fullName || "Member"}
      isAdmin={isAdminEmail(session.email)}
    >
      {children}
    </PortalShell>
  );
}
