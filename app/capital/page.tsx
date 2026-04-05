"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { TrendingUp, Users, ShieldCheck, ArrowRight } from "lucide-react";
import MarketSnapshot from "@/components/sections/capital/MarketSnapshot";
import VCInsights from "@/components/sections/capital/VCInsights";
import SectorBreakdown from "@/components/sections/capital/SectorBreakdown";
import FundingJourney from "@/components/sections/capital/FundingJourney";
import FounderToolkit from "@/components/sections/capital/FounderToolkit";
import FounderGuide from "@/components/sections/capital/FounderGuide";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const features = [
  { icon: TrendingUp, title: "Growth Capital", desc: "Access funding to scale your business, fulfil purchase orders, and take on bigger projects." },
  { icon: Users, title: "Community-Backed", desc: "Capital powered by the Lehumo community — investment that comes with built-in support and accountability." },
  { icon: ShieldCheck, title: "Regulated Partners", desc: "All capital is managed through FSP-licensed, regulated Black-owned investment managers." },
];

export default function CapitalPage() {
  return (
    <div className="pt-[70px]">
      {/* Hero */}
      <section className="bg-navy py-24 relative overflow-hidden">
        <Image src="/images/ali-mkumbwa-VhYvF2XaRuI-unsplash.jpg" alt="Street food vendor representing entrepreneurship" fill className="object-cover" />
        <div className="absolute inset-0 bg-navy/75 z-[1]" />
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(193,255,114,0.15),transparent_70%)] blur-[70px] pointer-events-none z-[2]" />
        <div className="absolute bottom-[5%] right-[10%] w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(193,255,114,0.1),transparent_70%)] blur-[70px] pointer-events-none z-[2]" />

        <Container className="relative z-[3] text-center">
          <motion.div {...fadeUp}>
            <div className="inline-flex items-center gap-2 bg-capital/15 border border-capital/35 rounded-full px-[18px] py-[7px] mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-capital" />
              <span className="text-[11px] font-semibold text-capital tracking-[1.2px] uppercase">Capital &amp; Insights</span>
            </div>
            <h1 className="text-[clamp(2.4rem,6vw,4.5rem)] font-extrabold text-white leading-[1.07] tracking-tight mb-6">
              Lime <span className="text-capital">Capital</span>
            </h1>
            <p className="text-lg text-white/55 leading-[1.8] max-w-[600px] mx-auto mb-10">
              Free insights on SA&apos;s private capital and venture capital landscape. Data-driven resources for founders looking to raise funding or grow.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="#insights" className="inline-flex items-center gap-2 bg-capital text-navy px-9 py-4 rounded-full font-extrabold text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(193,255,114,0.3)] transition-all">
                Explore Insights <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/lehumo#join" className="inline-flex items-center gap-2 text-white px-9 py-4 rounded-full font-semibold text-sm border-2 border-white/20 hover:bg-white/[0.07] hover:border-capital/40 transition-all">
                Join the Waitlist
              </Link>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * i, ease: "easeOut" as const }}
                className="bg-white rounded-[20px] border border-border shadow-sm p-9 hover:-translate-y-1 hover:shadow-md hover:border-capital/40 transition-all"
              >
                <div className="w-12 h-12 rounded-[14px] bg-capital/15 flex items-center justify-center mb-5">
                  <f.icon className="w-6 h-6 text-navy" />
                </div>
                <h3 className="text-lg font-bold text-ink mb-3">{f.title}</h3>
                <p className="text-sm text-muted leading-[1.75]">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* — Insights Sections — */}
      <div id="insights">
        <MarketSnapshot />
        <VCInsights />
        <FundingJourney />
        <FounderToolkit />
        <SectorBreakdown />
        <FounderGuide />
      </div>

      {/* Image Strip */}
      <section className="relative h-[300px] overflow-hidden">
        <Image src="/images/ali-mkumbwa-AEz70PS5eSU-unsplash.jpg" alt="Modern payment transaction" fill className="object-cover" />
        <div className="absolute inset-0 bg-navy/60 z-[1]" />
        <div className="relative z-[2] h-full flex items-center justify-center text-center px-6">
          <div>
            <p className="text-white text-lg font-semibold tracking-wide mb-2">Capital that understands your hustle.</p>
            <p className="text-white/50 text-sm">Waitlist opening soon for growth funding.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
