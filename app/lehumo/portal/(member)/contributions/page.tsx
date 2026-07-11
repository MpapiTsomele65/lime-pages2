import { getSession } from "@/lib/session";
import { getMemberById } from "@/lib/airtable";
import { isBeforeLaunch } from "@/lib/definitions";
import { getSastCurrentPeriod } from "@/lib/member-contributions-view";
import { ContributionsSection } from "@/components/lehumo/portal/sections/ContributionsSection";
import { MemberNotFound } from "@/components/lehumo/portal/MemberNotFound";

/** Manage my contributions — payments, schedule, stake projection, plan,
 *  bank details. URL `/lehumo/portal/contributions`. */
export default async function ContributionsPage() {
  const session = await getSession();
  if (!session) return null;

  const member = await getMemberById(session.memberId);
  if (!member) return <MemberNotFound />;

  return (
    <ContributionsSection
      member={member}
      currentPeriod={getSastCurrentPeriod()}
      beforeLaunch={isBeforeLaunch()}
    />
  );
}
