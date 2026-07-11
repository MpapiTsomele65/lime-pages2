import { getSession } from "@/lib/session";
import { getMemberById } from "@/lib/airtable";
import { EmergencySection } from "@/components/lehumo/portal/sections/EmergencySection";
import { MemberNotFound } from "@/components/lehumo/portal/MemberNotFound";

/** Emergency Loans — the 20% self-loan safety net.
 *  URL `/lehumo/portal/emergency`. */
export default async function EmergencyPage() {
  const session = await getSession();
  if (!session) return null;

  const member = await getMemberById(session.memberId);
  if (!member) return <MemberNotFound />;

  return <EmergencySection member={member} />;
}
