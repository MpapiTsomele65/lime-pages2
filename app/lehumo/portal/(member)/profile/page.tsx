import { getSession } from "@/lib/session";
import { getMemberById } from "@/lib/airtable";
import { ProfileSection } from "@/components/lehumo/portal/sections/ProfileSection";
import { MemberNotFound } from "@/components/lehumo/portal/MemberNotFound";

/** Profile — member details, investor risk profile, beneficiary.
 *  URL `/lehumo/portal/profile`. */
export default async function ProfilePage() {
  const session = await getSession();
  if (!session) return null;

  const member = await getMemberById(session.memberId);
  if (!member) return <MemberNotFound />;

  return <ProfileSection member={member} />;
}
