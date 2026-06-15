import { getCommunityPoolStats } from "@/lib/airtable";
import { LehumoHero } from "@/components/sections/lehumo/LehumoHero";
import { LehumoMarquee } from "@/components/sections/lehumo/LehumoMarquee";
import { WhatIsLehumo } from "@/components/sections/lehumo/WhatIsLehumo";
import { CommunityStrip } from "@/components/sections/lehumo/CommunityStrip";
import { StokvelComparison } from "@/components/sections/lehumo/StokvelComparison";
import { InvestmentStrategy } from "@/components/sections/lehumo/InvestmentStrategy";
import { Benefits } from "@/components/sections/lehumo/Benefits";
import { CommunityGrowth } from "@/components/sections/lehumo/CommunityGrowth";
import { FiveYearRoadmap } from "@/components/sections/lehumo/FiveYearRoadmap";
import { Cost } from "@/components/sections/lehumo/Cost";
import { BiggerMission } from "@/components/sections/lehumo/BiggerMission";
import { JoinCta } from "@/components/sections/lehumo/JoinCta";
import { WealthPhotoBlock } from "@/components/sections/lehumo/WealthPhotoBlock";
import { MemberPortalPreview } from "@/components/sections/lehumo/MemberPortalPreview";
import { ReferralCta } from "@/components/sections/lehumo/ReferralCta";
import { LehumoFAQ } from "@/components/sections/lehumo/LehumoFAQ";
import { ReadingProgressBar } from "@/components/ui/ReadingProgressBar";

// ISR — the hero's live conversion stats (founding spots left, members
// contributed, total contributed) refresh every 5 minutes. Keeps the
// marketing page fast + cached rather than hitting Airtable per visit.
export const revalidate = 300;

export default async function LehumoPage() {
  // Non-critical: if the stats read fails (or Airtable is unreachable at
  // build), the hero falls back to its static form (scarcity + social
  // proof lines hidden) rather than breaking the page.
  const stats = await getCommunityPoolStats().catch(() => null);
  const spotsLeft = stats
    ? Math.max(0, stats.totalFoundingSlots - stats.membersOnboarded)
    : null;

  return (
    <div className="bg-navy text-white">
      <ReadingProgressBar />
      <LehumoHero
        spotsLeft={spotsLeft}
        totalFoundingSlots={stats?.totalFoundingSlots ?? 30}
        membersContributed={stats?.membersContributedEver ?? null}
        totalContributed={stats?.totalContributed ?? null}
      />
      <LehumoMarquee />
      <WhatIsLehumo />
      <CommunityGrowth />
      <ReferralCta />
      <Cost />
      <InvestmentStrategy />
      <FiveYearRoadmap />
      <Benefits />
      <WealthPhotoBlock />
      <BiggerMission />
      <StokvelComparison />
      <CommunityStrip />
      <MemberPortalPreview />
      <LehumoFAQ />
      <JoinCta />
    </div>
  );
}
