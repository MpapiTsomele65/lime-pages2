import HomeHero from "@/components/sections/home/HomeHero";
import { Marquee } from "@/components/sections/home/Marquee";
import { LehumoTeaser } from "@/components/sections/home/LehumoTeaser";
import { LimeCapitalTeaser } from "@/components/sections/home/LimeCapitalTeaser";
import WhatWeDo from "@/components/sections/home/WhatWeDo";
import { AdvisoryPreview } from "@/components/sections/home/AdvisoryPreview";
import { CtaBanner } from "@/components/sections/home/CtaBanner";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <Marquee />
      {/* Core objectives lead the page: Lehumo (collective investment +
          community) then Lime Capital (alternative investment solutions). */}
      <LehumoTeaser />
      <LimeCapitalTeaser />
      <WhatWeDo />
      <AdvisoryPreview />
      <CtaBanner />
    </>
  );
}
