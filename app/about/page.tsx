import type { Metadata } from "next";
import { BrandPurpose } from "@/components/sections/home/BrandPurpose";
import { WhoWeAre } from "@/components/sections/home/WhoWeAre";
import { PhotoQuote } from "@/components/sections/home/PhotoQuote";

export const metadata: Metadata = {
  title: "Behind the Pages — Our Story | Lime Pages",
  description:
    "Lime Pages exists to close the gap between South Africa's two economies. Democratising information, capital, and networks for ambitious first-generation builders.",
};

export default function AboutPage() {
  return (
    <div className="pt-[70px]">
      <BrandPurpose />
      <PhotoQuote />
      <WhoWeAre />
    </div>
  );
}
