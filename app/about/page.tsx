import type { Metadata } from "next";
import { BrandPurpose } from "@/components/sections/home/BrandPurpose";
import { WhoWeAre } from "@/components/sections/home/WhoWeAre";
import { PhotoQuote } from "@/components/sections/home/PhotoQuote";

export const metadata: Metadata = {
  title: "About — Our Story | Lime Pages",
  description: "Lime Pages exists because the financial system was not designed to serve most South Africans. 7+ years in financial services. Building wealth together.",
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
