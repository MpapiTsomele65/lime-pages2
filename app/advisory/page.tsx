import type { Metadata } from "next";
import { AdvisoryPreview } from "@/components/sections/home/AdvisoryPreview";

export const metadata: Metadata = {
  title: "Lime Advisory — Sessions & Services | Lime Pages",
  description: "Practical, plain-language financial advisory for individuals, entrepreneurs, and young professionals. Sessions from R500. 24-hour refund guarantee.",
};

export default function AdvisoryPage() {
  return (
    <div className="pt-[70px]">
      <AdvisoryPreview />
    </div>
  );
}
