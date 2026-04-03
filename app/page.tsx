import HomeHero from "@/components/sections/home/HomeHero";
import { Marquee } from "@/components/sections/home/Marquee";
import StatsBar from "@/components/sections/home/StatsBar";
import BuiltForYou from "@/components/sections/home/BuiltForYou";
import WhatWeDo from "@/components/sections/home/WhatWeDo";
import { LehumoTeaser } from "@/components/sections/home/LehumoTeaser";
import { AdvisoryPreview } from "@/components/sections/home/AdvisoryPreview";
import { PhotoQuote } from "@/components/sections/home/PhotoQuote";
import { BrandPurpose } from "@/components/sections/home/BrandPurpose";
import { WhoWeAre } from "@/components/sections/home/WhoWeAre";
import { CtaBanner } from "@/components/sections/home/CtaBanner";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <Marquee />
      <StatsBar />
      <BuiltForYou />
      <WhatWeDo />
      <LehumoTeaser />
      <AdvisoryPreview />
      <PhotoQuote />
      <BrandPurpose />
      <WhoWeAre />
      <CtaBanner />
    </>
  );
}
