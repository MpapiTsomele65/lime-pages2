import { getCommunityPoolStats } from "@/lib/airtable";
import HomeHero from "@/components/sections/home/HomeHero";
import { AssuranceStrip } from "@/components/sections/home/AssuranceStrip";
import { LehumoTeaser } from "@/components/sections/home/LehumoTeaser";
import { LimeCapitalTeaser } from "@/components/sections/home/LimeCapitalTeaser";
import WhatWeDo from "@/components/sections/home/WhatWeDo";
import { AdvisoryPreview } from "@/components/sections/home/AdvisoryPreview";
import { CtaBanner } from "@/components/sections/home/CtaBanner";

// ISR — the hero's live founding-cohort stats (spots left, members
// contributed) refresh every 5 minutes. Keeps the home page cached/fast.
export const revalidate = 300;

export default async function HomePage() {
  // Non-critical: hero degrades to its no-stats form if Airtable is
  // unreachable at build or runtime.
  const stats = await getCommunityPoolStats().catch(() => null);
  const spotsLeft = stats
    ? Math.max(0, stats.totalFoundingSlots - stats.membersOnboarded)
    : null;

  return (
    <>
      <HomeHero />
      <AssuranceStrip />
      {/* Core objectives lead the page: Lehumo (collective investment +
          community) then Lime Capital (alternative investment solutions).
          The founding-member conversion block lives in the Lehumo section
          so the hero stays simple. */}
      <LehumoTeaser
        spotsLeft={spotsLeft}
        totalFoundingSlots={stats?.totalFoundingSlots ?? 30}
        membersContributed={stats?.membersContributedEver ?? null}
        totalContributed={stats?.totalContributed ?? null}
      />
      <LimeCapitalTeaser />
      <WhatWeDo />
      <AdvisoryPreview />
      <CtaBanner />
    </>
  );
}
