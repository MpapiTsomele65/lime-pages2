"use client";

/**
 * RaComparison — the fee-first retirement-annuity benchmark on /capital.
 *
 * Two deliberately separate tables:
 *
 *   1. Ready-made RAs — one Reg 28 fund inside the wrapper, so the cost
 *      quoted is genuinely all-in and the rows compare like with like.
 *   2. Self-directed platforms — you pick the funds, so the number is
 *      the PLATFORM fee only and your total lands higher.
 *
 * Ranking one table against the other would be misleading: a 0.40%
 * platform fee is not "cheaper" than a 0.90% all-in fund, it just
 * excludes the fund you still have to buy. Keeping them apart is the
 * single most important honesty decision in this component.
 *
 * Sorted by fees first, performance second (see rankByFeesThenPerformance).
 * Every row carries its source and as-at date; unpublished figures render
 * as "not published" rather than a plausible-looking guess.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Scale, ShieldCheck, AlertTriangle, ExternalLink } from "lucide-react";

import { Container } from "@/components/ui/Container";
import {
  READY_MADE_RAS,
  SELF_DIRECTED_RAS,
  HIGH_COST_WATCHLIST,
  REG_28_LIMITS,
  REG_28_SOURCE,
  DATA_REVIEWED_AT,
  rankByFeesThenPerformance,
  type RaProduct,
} from "@/lib/retirement-annuities";

const readyMade = rankByFeesThenPerformance(READY_MADE_RAS);
const selfDirected = rankByFeesThenPerformance(SELF_DIRECTED_RAS);

const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

export default function RaComparison() {
  const [openId, setOpenId] = useState<string | null>(readyMade[0]?.id ?? null);

  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24" id="ra-comparison">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="max-w-3xl mb-8 lg:mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal/10 border border-teal/25 mb-4">
            <Scale className="w-3.5 h-3.5 text-teal" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal">
              RA Benchmark
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-navy leading-[1.05]">
            Every major RA, ranked by what it costs you.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-subtle leading-relaxed">
            Fees first, performance second &mdash; because you can know the fee
            before you sign and nobody can know the return. Every figure below
            came off the provider&rsquo;s own fee schedule or fund factsheet,
            with the date it was published.
          </p>
        </motion.div>

        {/* Reg 28 explainer — corrects the common misconception up front */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="rounded-2xl border border-border bg-snow p-5 sm:p-6 mb-10"
        >
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-teal shrink-0 mt-0.5" />
            <div>
              <h3 className="text-[15px] font-semibold text-navy">
                All of them are Regulation 28 compliant &mdash; that&rsquo;s the
                law, not a feature
              </h3>
              <p className="mt-1.5 text-[13.5px] text-subtle leading-relaxed">
                Every retirement annuity in South Africa must follow Regulation
                28 of the Pension Funds Act, so compliance can never be a reason
                to pick one over another. What it does is cap how concentrated
                your money can get. It limits risk; it doesn&rsquo;t promise a
                good outcome.
              </p>
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {REG_28_LIMITS.map((l) => (
                  <span
                    key={l.assetClass}
                    title={l.note}
                    className="inline-flex items-baseline gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1 text-[11.5px]"
                  >
                    <span className="text-subtle">{l.assetClass}</span>
                    <span className="font-semibold text-navy tabular-nums">
                      {l.limitPct === 0 ? "not allowed" : `max ${l.limitPct}%`}
                    </span>
                  </span>
                ))}
              </div>
              <a
                href={REG_28_SOURCE}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium text-teal hover:underline"
              >
                National Treasury, Regulation 28
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </motion.div>

        {/* ─── Table 1: ready-made ─── */}
        <TableBlock
          eyebrow="Ready-made — one fund, one all-in fee"
          title="Directly comparable"
          blurb="A single Reg 28 balanced fund inside the RA. The cost shown is everything: platform admin plus the fund's own charges. These rows compare like with like."
          products={readyMade}
          openId={openId}
          setOpenId={setOpenId}
        />

        {/* ─── Table 2: self-directed ─── */}
        <div className="mt-12">
          <TableBlock
            eyebrow="Self-directed — you choose the funds"
            title="Platform fee only"
            blurb="These are platforms, not funds. The percentage is what the platform charges to hold your RA — whatever fund you pick charges on top, so your real all-in cost is higher than the number shown. Never compare these figures directly against the table above."
            products={selfDirected}
            openId={openId}
            setOpenId={setOpenId}
            platformOnly
          />
        </div>

        {/* ─── Watchlist ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mt-12 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 sm:p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4.5 h-4.5 text-amber-700" />
            <h3 className="text-[15px] font-semibold text-navy">
              Ask hard questions about these
            </h3>
          </div>
          <p className="text-[13.5px] text-subtle leading-relaxed mb-4">
            Not ranked with the rest &mdash; these are legacy-structured
            products whose published charges are far above everything above.
            If you hold one, it is worth asking what you are paying for.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {HIGH_COST_WATCHLIST.map((w) => (
              <div
                key={w.productName}
                className="rounded-xl border border-amber-200 bg-white p-4"
              >
                <p className="text-[13.5px] font-semibold text-navy">
                  {w.provider}
                </p>
                <p className="text-[12px] text-subtle mt-0.5">{w.productName}</p>
                <p className="mt-2 text-[13px] font-semibold text-amber-800">
                  {w.headlineCost}
                </p>
                <p className="mt-2 text-[12.5px] text-subtle leading-relaxed">
                  {w.why}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        <p className="mt-6 text-[11.5px] text-subtle leading-relaxed max-w-3xl">
          Data last reviewed {fmtDate(DATA_REVIEWED_AT)}. Fees and returns
          change &mdash; always confirm against the provider&rsquo;s current
          documents before investing. Returns are historical, annualised and
          net of fees, and do not predict future performance; where products
          report to different dates their returns are not strictly comparable,
          so each row shows its own. This is factual product information for
          education, not advice. Lime Pages is not a licensed financial
          services provider and receives no commission from any provider
          listed.
        </p>
      </Container>
    </section>
  );
}

function TableBlock({
  eyebrow,
  title,
  blurb,
  products,
  openId,
  setOpenId,
  platformOnly,
}: {
  eyebrow: string;
  title: string;
  blurb: string;
  products: RaProduct[];
  openId: string | null;
  setOpenId: (id: string | null) => void;
  platformOnly?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-subtle">
        {eyebrow}
      </p>
      <h3 className="mt-1 text-2xl font-semibold tracking-tight text-navy">
        {title}
      </h3>
      <p className="mt-2 mb-5 text-[13.5px] text-subtle leading-relaxed max-w-2xl">
        {blurb}
      </p>

      <div className="rounded-2xl border border-border overflow-hidden">
        {/* Header row — hidden on mobile, where each card stacks instead */}
        <div className="hidden md:grid grid-cols-[1.15fr_2fr_0.9fr_1.15fr_0.75fr] gap-4 px-5 py-3 bg-snow border-b border-border">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-subtle">
            Provider
          </span>
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-subtle">
            {platformOnly ? "Fund choice" : "Fund"}
          </span>
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-subtle text-right">
            {platformOnly ? "Platform fee" : "All-in cost"}
          </span>
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-subtle text-right">
            Returns p.a.
          </span>
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-subtle text-right">
            Min/month
          </span>
        </div>

        {products.map((p, i) => {
          const open = openId === p.id;
          return (
            <div
              key={p.id}
              className={i > 0 ? "border-t border-border" : undefined}
            >
              <button
                type="button"
                onClick={() => setOpenId(open ? null : p.id)}
                aria-expanded={open}
                className="w-full text-left px-5 py-4 hover:bg-snow/70 transition-colors md:grid md:grid-cols-[1.15fr_2fr_0.9fr_1.15fr_0.75fr] md:gap-4 md:items-center flex flex-col gap-2"
              >
                {/* Provider */}
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy text-[11px] font-bold text-capital tabular-nums">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14.5px] font-semibold text-navy leading-tight">
                      {p.provider}
                    </p>
                    <p className="text-[11.5px] text-subtle leading-snug mt-0.5 md:hidden">
                      {p.productName}
                    </p>
                  </div>
                </div>

                {/* Fund — the exact registered name, so it can be searched */}
                <div className="pl-9 md:pl-0 min-w-0">
                  {p.fundName ? (
                    <>
                      <p className="text-[13px] font-medium text-navy leading-snug">
                        {p.fundName}
                      </p>
                      <p className="hidden md:block text-[11px] text-subtle leading-snug mt-0.5">
                        {p.productName}
                      </p>
                    </>
                  ) : (
                    <p className="text-[12.5px] text-subtle leading-snug italic">
                      No default fund &mdash; you choose from the platform&rsquo;s
                      range
                    </p>
                  )}
                </div>

                {/* Cost */}
                <div className="md:text-right pl-9 md:pl-0">
                  <span className="text-[1.35rem] font-semibold tracking-tight text-navy tabular-nums">
                    {p.allInPct.toFixed(2)}%
                  </span>
                  {p.feeConfidence === "partial" && (
                    <span className="block text-[10.5px] text-amber-700 leading-tight">
                      + fund fees
                    </span>
                  )}
                </div>

                {/* Returns */}
                <div className="md:text-right pl-9 md:pl-0">
                  {p.returns ? (
                    <>
                      <span className="text-[13px] font-medium text-navy tabular-nums">
                        {p.returns.tenYear !== null
                          ? `${p.returns.tenYear.toFixed(1)}% 10yr`
                          : p.returns.fiveYear !== null
                            ? `${p.returns.fiveYear.toFixed(1)}% 5yr`
                            : "—"}
                      </span>
                      <span className="block text-[10.5px] text-subtle leading-tight">
                        to {fmtDate(p.returns.asAt)}
                      </span>
                    </>
                  ) : (
                    <span className="text-[12px] text-subtle">
                      {p.shape === "self-directed"
                        ? "depends on your funds"
                        : "not published"}
                    </span>
                  )}
                </div>

                {/* Minimum */}
                <div className="md:text-right pl-9 md:pl-0">
                  <span className="text-[13px] text-navy tabular-nums">
                    {p.minMonthlyZar !== null
                      ? `R${p.minMonthlyZar.toLocaleString("en-ZA")}`
                      : p.id === "easyequities-ra"
                        ? "none"
                        : "not published"}
                  </span>
                </div>
              </button>

              {open && (
                <div className="px-5 pb-5 pt-1 bg-snow/60 border-t border-border/60">
                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3.5 pt-3">
                    <Detail label="What makes up the fee" value={p.feeBreakdown} />
                    <Detail
                      label="Reg 28"
                      value="Compliant — mandatory for every SA retirement annuity"
                    />
                    <Detail label="Best for" value={p.bestFor} />
                    <Detail
                      label="Penalties"
                      value={p.penalties ?? "Not stated by the provider — ask before signing"}
                    />
                    {p.returns?.benchmarkNote && (
                      <Detail label="Versus peers" value={p.returns.benchmarkNote} />
                    )}
                    {p.watchOut && (
                      <Detail label="Watch out" value={p.watchOut} warn />
                    )}
                  </div>
                  <a
                    href={p.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1 text-[11.5px] font-medium text-teal hover:underline"
                  >
                    Source &mdash; {p.provider}, figures as at {fmtDate(p.asAt)}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function Detail({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-subtle">
        {label}
      </p>
      <p
        className={`mt-1 text-[12.5px] leading-relaxed ${
          warn ? "text-amber-800" : "text-navy"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
