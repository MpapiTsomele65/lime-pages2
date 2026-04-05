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
import { PhotoBreak } from "@/components/sections/lehumo/PhotoBreak";
import { WealthPhotoBlock } from "@/components/sections/lehumo/WealthPhotoBlock";

export default function LehumoPage() {
  return (
    <div className="bg-navy text-white">
      <LehumoHero />
      <LehumoMarquee />
      <WhatIsLehumo />
      <PhotoBreak
        src="/images/matt-aylward-Nmh-pEBRt2Y-unsplash.jpg"
        alt="Golf at sunset"
        overlay="navy"
        objectPosition="top"
      />
      <StokvelComparison />
      <InvestmentStrategy />
      <Benefits />
      <PhotoBreak
        src="/images/microsoft-copilot-txZv4HQJRpE-unsplash.jpg"
        alt="Planning financial future"
        overlay="navy-mid"
        objectPosition="top"
      />
      <CommunityGrowth />
      <FiveYearRoadmap />
      <Cost />
      <WealthPhotoBlock />
      <BiggerMission />
      <CommunityStrip />
      <JoinCta />
    </div>
  );
}
