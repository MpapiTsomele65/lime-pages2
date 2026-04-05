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

export default function LehumoPage() {
  return (
    <div className="bg-navy text-white">
      <LehumoHero />
      <LehumoMarquee />
      <WhatIsLehumo />
      <InvestmentStrategy />
      <Benefits />
      <CommunityGrowth />
      <FiveYearRoadmap />
      <Cost />
      <WealthPhotoBlock />
      <BiggerMission />
      <StokvelComparison />
      <CommunityStrip />
      <JoinCta />
    </div>
  );
}
