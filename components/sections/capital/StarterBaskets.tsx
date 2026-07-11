"use client";

/**
 * Starter Baskets — curated Satrix ETF baskets per risk profile, browsable
 * without taking the quiz. Turns the risk profiler's result into a
 * standalone, explorable section: pick a profile (or arrive deep-linked
 * from the Lehumo portal's RiskProfileCard with `?profile=<id>`) and see
 * the funds that tend to suit it.
 *
 * ⚠️ Education only. The ETF list is ILLUSTRATIVE (lib/satrix-etfs.ts) —
 * Lime Pages is not an FSP and nothing here is financial advice.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Gauge, Info } from "lucide-react";
import { Container } from "@/components/ui/Container";
import {
  RISK_PROFILES,
  etfsForProfile,
  profileById,
  SATRIX_PRODUCTS_URL,
  type EtfCategory,
  type ProfileId,
} from "@/lib/satrix-etfs";

const CATEGORY: Record<EtfCategory, string> = {
  Income: "bg-teal/10 text-teal border-teal/25",
  Balanced: "bg-navy/[0.06] text-navy border-navy/20",
  Growth: "bg-capital/20 text-[#3d6b00] border-capital/40",
};

const PROFILE_IDS = new Set(RISK_PROFILES.map((p) => p.id));

export default function StarterBaskets() {
  const [selected, setSelected] = useState<ProfileId>("moderate");

  // Deep-link support: /capital?profile=<id>#starter-baskets (used by the
  // Lehumo portal's RiskProfileCard). Read from window.location on mount
  // instead of useSearchParams so the page keeps static generation without
  // a Suspense boundary.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("profile");
    if (q && PROFILE_IDS.has(q as ProfileId)) setSelected(q as ProfileId);
  }, []);

  const profile = profileById(selected);
  const basket = etfsForProfile(selected);

  return (
    <section className="py-16 sm:py-20 bg-white">
      <Container>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-2xl mb-8"
        >
          <span className="text-[11px] font-bold tracking-[1.4px] uppercase text-navy block mb-3">
            Starter Baskets
          </span>
          <h2 className="text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold text-ink leading-[1.12] tracking-tight mb-4">
            Your risk profile,{" "}
            <span className="text-navy">turned into a basket.</span>
          </h2>
          <p className="text-[15px] text-subtle leading-[1.8]">
            Pick a profile — or{" "}
            <a
              href="#risk-profile-section"
              className="font-semibold text-teal hover:underline"
            >
              take the 2-minute quiz
            </a>{" "}
            to find yours — and explore the Satrix ETFs that tend to suit it.
            A basket is a starting point for your own research, not a
            recommendation.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="rounded-2xl bg-white border border-border overflow-hidden"
          style={{
            boxShadow:
              "0 1px 0 rgba(0,0,0,0.04), 0 18px 40px -24px rgba(11,25,51,0.18)",
          }}
        >
          <div className="p-6 sm:p-8 lg:p-10">
            {/* Profile selector */}
            <div className="flex flex-wrap gap-2 mb-7">
              {RISK_PROFILES.map((p) => {
                const on = selected === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelected(p.id)}
                    aria-pressed={on}
                    className={`px-3.5 py-2 rounded-full text-[12.5px] font-semibold border transition-all ${
                      on
                        ? "bg-navy text-white border-navy"
                        : "bg-white text-subtle border-border hover:border-navy/40 hover:text-navy"
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>

            {/* Selected profile summary */}
            <div className="grid lg:grid-cols-[1fr_280px] gap-6 lg:gap-10 items-start mb-8">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-ink">
                  {profile.name}{" "}
                  <span className="font-semibold text-subtle">
                    · {profile.tagline}
                  </span>
                </h3>
                <p className="mt-2 text-[14px] text-subtle leading-[1.75] max-w-xl">
                  {profile.blurb}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full bg-snow border border-border text-navy">
                    Horizon: {profile.horizon}
                  </span>
                  <span className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full bg-snow border border-border text-navy">
                    Targets {profile.target}
                  </span>
                </div>
              </div>
              {/* Income ↔ growth lean */}
              <div className="w-full">
                <div className="flex items-center justify-between text-[11px] font-semibold text-subtle mb-2">
                  <span>Income</span>
                  <span className="text-navy">{profile.leanLabel}</span>
                  <span>Growth</span>
                </div>
                <div className="relative h-2.5 rounded-full bg-gradient-to-r from-teal via-navy/15 to-capital">
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-navy shadow"
                    initial={false}
                    animate={{ left: `${profile.lean}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>

            {/* The basket */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {basket.map((etf) => (
                <a
                  key={etf.ticker}
                  href={SATRIX_PRODUCTS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col rounded-xl border border-border bg-snow hover:bg-white hover:border-navy/25 hover:-translate-y-0.5 transition-all p-4"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-[13px] font-bold text-navy tracking-wide">
                      {etf.ticker}
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${CATEGORY[etf.category]}`}
                    >
                      {etf.category}
                    </span>
                  </div>
                  <span className="text-[14px] font-semibold text-navy leading-snug flex items-center gap-1">
                    {etf.name}
                    <ArrowUpRight className="w-3.5 h-3.5 text-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                  <span className="mt-1.5 text-[12.5px] text-subtle leading-relaxed">
                    {etf.blurb}
                  </span>
                </a>
              ))}
            </div>

            {/* Footer actions */}
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              <a
                href="#risk-profile-section"
                className="inline-flex items-center gap-2 text-[13px] font-bold text-teal hover:underline"
              >
                <Gauge className="w-4 h-4" />
                Not sure where you sit? Take the quiz
              </a>
              <a
                href={SATRIX_PRODUCTS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-subtle hover:text-navy transition-colors"
              >
                Browse all Satrix products
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </motion.div>

        {/* Disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-[12px] text-subtle leading-relaxed flex items-start gap-2 max-w-3xl"
        >
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-subtle" />
          <span>
            Educational only &mdash; this is not financial advice and Lime
            Pages is not a registered financial services provider (FSP). The
            baskets and Satrix ETF examples are illustrative; tickers and fund
            details must be verified on satrix.co.za, and you should speak to
            a licensed adviser before investing. #ThisIsNotFinancialAdvice
          </span>
        </motion.p>
      </Container>
    </section>
  );
}
