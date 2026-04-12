import HomeHero from "@/components/sections/home/HomeHero";
import { Marquee } from "@/components/sections/home/Marquee";

import BuiltForYou from "@/components/sections/home/BuiltForYou";
import WhatWeDo from "@/components/sections/home/WhatWeDo";
import { LehumoTeaser } from "@/components/sections/home/LehumoTeaser";
import { AdvisoryPreview } from "@/components/sections/home/AdvisoryPreview";
import { CtaBanner } from "@/components/sections/home/CtaBanner";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <Marquee />
      <BuiltForYou />
      <WhatWeDo />
      <LehumoTeaser />
      <AdvisoryPreview />
      <CtaBanner />
    </>
  );
}
