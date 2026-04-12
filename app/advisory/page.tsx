import type { Metadata } from "next";
import { AdvisoryHero } from "@/components/sections/advisory/AdvisoryHero";
import { AdvisoryChatbotSection } from "@/components/advisory/AdvisoryChatbotSection";
import { ServiceJsonLd } from "@/components/shared/JsonLd";

export const metadata: Metadata = {
  title: "Lime Advisory — Sessions & Services | Lime Pages",
  description:
    "Practical, plain-language financial advisory for individuals, entrepreneurs, and young professionals. Free AI guidance + paid sessions. 24-hour refund guarantee.",
};

export default function AdvisoryPage() {
  return (
    <div className="pt-[70px]">
      <ServiceJsonLd />
      <AdvisoryHero />
      <AdvisoryChatbotSection />
    </div>
  );
}
