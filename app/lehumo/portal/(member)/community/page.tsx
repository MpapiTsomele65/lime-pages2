import { getSession } from "@/lib/session";
import { getCommunityPoolStats, getMemberById } from "@/lib/airtable";
import { getFundPortfolio } from "@/lib/fund-settings";
import { isBeforeLaunch } from "@/lib/definitions";
import { derivePortalMemberView } from "@/lib/portal-member-view";
import { CommunitySection } from "@/components/lehumo/portal/sections/CommunitySection";
import { MemberNotFound } from "@/components/lehumo/portal/MemberNotFound";

/** Lehumo community — pool, leaderboard, allocation, governance.
 *  URL `/lehumo/portal/community`. */
export default async function CommunityPage() {
  const session = await getSession();
  if (!session) return null;

  const [member, communityStats, fundPortfolio] = await Promise.all([
    getMemberById(session.memberId),
    getCommunityPoolStats().catch((err) => {
      console.error("Failed to load community pool stats:", err);
      return null;
    }),
    getFundPortfolio().catch((err) => {
      console.error("Failed to load fund portfolio:", err);
      return null;
    }),
  ]);

  if (!member) return <MemberNotFound />;

  const { myContributed } = derivePortalMemberView(member);

  return (
    <CommunitySection
      member={member}
      communityStats={communityStats}
      fundPortfolio={fundPortfolio}
      myContributed={myContributed}
      beforeLaunch={isBeforeLaunch()}
    />
  );
}
