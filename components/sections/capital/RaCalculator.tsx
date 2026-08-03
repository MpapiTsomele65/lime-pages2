"use client";

/**
 * RaCalculator — goal-based retirement-annuity planner for /capital.
 *
 * You tell it the monthly income you want in retirement (in today's
 * money) and it works backwards: what your current plan actually
 * produces, the monthly contribution that would close the gap, the SARS
 * refund your contributions earn, and — the part this whole section
 * exists for — what your fee costs you over the full term.
 *
 * All maths lives in lib/retirement-annuities.ts so it stays testable
 * and this file stays presentational. Mirrors BondCalculator's
 * two-column card, Field inputs and quick-pick buttons so the two
 * calculators read as siblings.
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PiggyBank, TrendingDown, Info } from "lucide-react";

import { Container } from "@/components/ui/Container";
import {
  projectRetirement,
  feeImpact,
  RA_DEDUCTION_CAP_ZAR,
  TAX_YEAR_LABEL,
  EARLIEST_RETIREMENT_AGE,
  SAFE_WITHDRAWAL_RATE,
  type RetirementInputs,
} from "@/lib/retirement-annuities";

const fmtThousands = (n: number) =>
  Math.round(n).toLocaleString("en-ZA").replace(/,/g, " ");

/** Compact rand for headline numbers that can reach eight figures. */
const fmtZARShort = (n: number) => {
  if (n >= 1_000_000) return `R${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `R${Math.round(n / 1_000)}k`;
  return `R${Math.round(n)}`;
};

const parseNum = (s: string) => Number(s.replace(/[^\d.]/g, "")) || 0;

/** The two verified end-points of the ready-made table, used for the fee demo. */
const CHEAPEST_FEE_PCT = 0.9;
const DEAREST_FEE_PCT = 1.94;

export default function RaCalculator() {
  const [currentAge, setCurrentAge] = useState("32");
  const [retirementAge, setRetirementAge] = useState("65");
  const [currentSavings, setCurrentSavings] = useState("150 000");
  const [monthly, setMonthly] = useState(2500);
  const [targetIncome, setTargetIncome] = useState("25 000");
  const [annualIncome, setAnnualIncome] = useState("600 000");
  const [feePct, setFeePct] = useState(CHEAPEST_FEE_PCT);

  const inputs: RetirementInputs = useMemo(
    () => ({
      currentAge: parseNum(currentAge) || 30,
      retirementAge: parseNum(retirementAge) || 65,
      currentSavingsZar: parseNum(currentSavings),
      monthlyContributionZar: monthly,
      targetMonthlyIncomeZar: parseNum(targetIncome),
      grossReturnPct: 11,
      feePct,
      inflationPct: 5,
      annualIncomeZar: parseNum(annualIncome),
    }),
    [currentAge, retirementAge, currentSavings, monthly, targetIncome, annualIncome, feePct],
  );

  const result = useMemo(() => projectRetirement(inputs), [inputs]);
  const fees = useMemo(
    () => feeImpact(inputs, CHEAPEST_FEE_PCT, DEAREST_FEE_PCT),
    [inputs],
  );

  const tooYoung = inputs.retirementAge < EARLIEST_RETIREMENT_AGE;

  return (
    <section
      className="scroll-mt-[124px] bg-snow py-16 sm:py-20 lg:py-24"
      id="ra-calculator"
    >
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="max-w-3xl mb-10 lg:mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal/10 border border-teal/25 mb-4">
            <PiggyBank className="w-3.5 h-3.5 text-teal" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal">
              Retirement Goal Calculator
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-navy leading-[1.05]">
            What income will your RA actually buy you?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-subtle leading-relaxed">
            Set the monthly income you want in retirement &mdash; in
            today&rsquo;s money, so it means something &mdash; and see what
            your current plan delivers, what the gap costs to close, and how
            much SARS gives back along the way.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] rounded-2xl bg-white border border-border overflow-hidden"
          style={{
            boxShadow:
              "0 1px 0 rgba(0,0,0,0.04), 0 18px 40px -24px rgba(11,25,51,0.18)",
          }}
        >
          {/* ─── LEFT: Inputs ─── */}
          <div className="p-6 sm:p-7 flex flex-col gap-5 lg:border-r lg:border-border border-b lg:border-b-0">
            <div>
              <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-subtle">
                Step 01 &mdash; where you are
              </p>
              <h3 className="mt-1 text-2xl font-semibold tracking-tight text-navy leading-[1.1]">
                Your position today.
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Your age" hint="years" value={currentAge} onChange={setCurrentAge} />
              <Field
                label="Retire at"
                hint="years"
                value={retirementAge}
                onChange={setRetirementAge}
              />
            </div>

            {tooYoung && (
              <p className="text-[11.5px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
                You can&rsquo;t retire from an RA before {EARLIEST_RETIREMENT_AGE}{" "}
                (except on permanent disability). The projection still runs, but
                the money wouldn&rsquo;t be accessible yet.
              </p>
            )}

            <Field
              label="Already saved"
              hint="current RA value"
              prefix="R"
              value={currentSavings}
              onChange={setCurrentSavings}
            />

            <Field
              label="Your annual income"
              hint="sets your tax refund"
              prefix="R"
              value={annualIncome}
              onChange={setAnnualIncome}
            />

            <Field
              label="Income you want in retirement"
              hint="per month, today's money"
              prefix="R"
              value={targetIncome}
              onChange={setTargetIncome}
            />

            {/* Monthly contribution */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-baseline text-[12.5px] text-subtle">
                <span>Monthly contribution</span>
                <span className="font-mono text-[10.5px] opacity-80">
                  R{fmtThousands(monthly * 12)}/yr
                </span>
              </div>
              <div className="bg-snow border border-border rounded-xl p-3.5 flex flex-col gap-2.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[12.5px] text-subtle">Every month</span>
                  <span className="text-2xl font-semibold tracking-tight text-teal">
                    R{fmtThousands(monthly)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30000}
                  step={250}
                  value={monthly}
                  onChange={(e) => setMonthly(parseInt(e.target.value, 10))}
                  aria-label="Monthly contribution"
                  className="w-full h-[4px] rounded-full bg-border outline-none appearance-none"
                  style={{ accentColor: "var(--color-teal)" }}
                />
                <div className="flex gap-1.5 flex-wrap">
                  {[1000, 2500, 5000, 10000].map((v) => (
                    <QuickButton
                      key={v}
                      active={monthly === v}
                      onClick={() => setMonthly(v)}
                    >
                      R{fmtThousands(v)}
                    </QuickButton>
                  ))}
                </div>
              </div>
            </div>

            {/* Fee selector — the lever this section is about */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-baseline text-[12.5px] text-subtle">
                <span>Annual fee</span>
                <span className="font-mono text-[10.5px] opacity-80">
                  {feePct.toFixed(2)}% p.a.
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={3.5}
                step={0.05}
                value={feePct}
                onChange={(e) => setFeePct(parseFloat(e.target.value))}
                aria-label="Annual fee percentage"
                className="w-full h-[4px] rounded-full bg-border outline-none appearance-none"
                style={{ accentColor: "var(--color-teal)" }}
              />
              <div className="flex gap-1.5 flex-wrap pt-1">
                <QuickButton active={feePct === 0.9} onClick={() => setFeePct(0.9)}>
                  0.90% cheapest
                </QuickButton>
                <QuickButton active={feePct === 1.8} onClick={() => setFeePct(1.8)}>
                  1.80% active
                </QuickButton>
                <QuickButton active={feePct === 3.5} onClick={() => setFeePct(3.5)}>
                  3.50% legacy
                </QuickButton>
              </div>
            </div>

            <p className="text-[11.5px] text-subtle leading-relaxed mt-auto pt-3 border-t border-border">
              Assumes 11% a year before fees and 5% inflation. Sustainable
              income uses the {(SAFE_WITHDRAWAL_RATE * 100).toFixed(0)}% rule.
            </p>
          </div>

          {/* ─── RIGHT: Results ─── */}
          <div className="p-6 sm:p-7 flex flex-col gap-5">
            <div>
              <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-subtle">
                Step 02 &mdash; where that lands you
              </p>
              <h3 className="mt-1 text-2xl font-semibold tracking-tight text-navy leading-[1.1]">
                Your retirement, projected.
              </h3>
            </div>

            <div>
              <div className="text-[12.5px] font-mono text-subtle tracking-wider uppercase mb-1">
                Monthly income this buys
              </div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-[2.75rem] font-bold tracking-tight text-navy leading-none">
                  <span className="text-[0.45em] text-subtle font-medium mr-1 align-baseline">
                    R
                  </span>
                  {fmtThousands(result.sustainableMonthlyIncomeZar)}
                </span>
                <span className="text-[12.5px] text-subtle">
                  /month in today&rsquo;s money
                </span>
              </div>
              <div
                className={`mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold ${
                  result.onTrack
                    ? "bg-teal/10 text-teal border border-teal/25"
                    : "bg-amber-50 text-amber-800 border border-amber-200"
                }`}
              >
                {result.onTrack ? (
                  <>
                    On track &mdash; R
                    {fmtThousands(Math.abs(result.monthlySurplusZar))} above your
                    goal
                  </>
                ) : (
                  <>
                    Short by R
                    {fmtThousands(Math.abs(result.monthlySurplusZar))} a month
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Stat
                label="Fund value at retirement"
                value={fmtZARShort(result.projectedValueZar)}
                sub={`${fmtZARShort(result.projectedValueTodayZar)} in today's money`}
              />
              <Stat
                label="To hit your goal"
                value={`R${fmtThousands(result.requiredMonthlyZar)}`}
                sub={
                  result.requiredMonthlyZar > monthly
                    ? `R${fmtThousands(result.requiredMonthlyZar - monthly)} more a month`
                    : "Your current contribution covers it"
                }
                accent={result.requiredMonthlyZar > monthly}
              />
              <Stat
                label={`Tax back this year (${TAX_YEAR_LABEL})`}
                value={`R${fmtThousands(result.annualTaxRefundZar)}`}
                sub={`At your ${(result.marginalRate * 100).toFixed(0)}% marginal rate`}
              />
              <Stat
                label="You contribute"
                value={fmtZARShort(result.totalContributedZar)}
                sub={`Over ${result.yearsToRetirement} years`}
              />
            </div>

            {result.exceedsDeductionLimit && (
              <p className="text-[12px] text-navy bg-capital-light border border-capital/40 rounded-lg px-3.5 py-2.5 leading-relaxed">
                <Info className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
                You&rsquo;re contributing more than the deductible limit of R
                {fmtThousands(result.deductibleLimitZar)} (27.5% of income,
                capped at R{fmtThousands(RA_DEDUCTION_CAP_ZAR)}). The excess
                isn&rsquo;t lost &mdash; it carries forward and reduces tax
                later.
              </p>
            )}

            {/* Fee drag — the argument for the tables below */}
            <div className="mt-auto pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-2.5">
                <TrendingDown className="w-4 h-4 text-teal" />
                <span className="text-[12.5px] font-mono text-subtle tracking-wider uppercase">
                  What the fee costs you
                </span>
              </div>
              <p className="text-[13px] text-subtle leading-relaxed">
                Same contributions, same returns &mdash; only the fee changes.
                At <strong className="text-navy">0.90%</strong> you retire with{" "}
                <strong className="text-navy">
                  {fmtZARShort(fees.lowFeeValueZar)}
                </strong>
                . At <strong className="text-navy">1.94%</strong> you retire
                with{" "}
                <strong className="text-navy">
                  {fmtZARShort(fees.highFeeValueZar)}
                </strong>
                .
              </p>
              <p className="mt-2.5 text-[15px] font-semibold text-navy leading-snug">
                That one percentage point costs you{" "}
                <span className="text-teal">
                  {fmtZARShort(fees.differenceZar)}
                </span>
                {result.projectedValueZar > 0 && (
                  <span className="text-subtle font-normal text-[13px]">
                    {" "}
                    &mdash;{" "}
                    {(
                      (fees.differenceZar / fees.lowFeeValueZar) *
                      100
                    ).toFixed(0)}
                    % of your fund.
                  </span>
                )}
              </p>
            </div>
          </div>
        </motion.div>

        <p className="mt-5 text-[11.5px] text-subtle leading-relaxed max-w-3xl">
          Estimates only, for education. Returns are assumed, not guaranteed,
          and real markets don&rsquo;t deliver a smooth 11% a year. At
          retirement two-thirds of your RA must buy an annuity, so the income
          shown is a planning approximation rather than a quote. Lime Pages is
          not a licensed financial services provider &mdash; speak to an FSP-
          licensed adviser before acting.
        </p>
      </Container>
    </section>
  );
}

/* ─── Local UI pieces (mirrors BondCalculator) ─── */

function Field({
  label,
  hint,
  prefix,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  prefix?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-baseline text-[12.5px] text-subtle">
        <span>{label}</span>
        {hint && (
          <span className="font-mono text-[10.5px] opacity-80">{hint}</span>
        )}
      </div>
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3.5 font-mono text-[13px] text-subtle pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className={`w-full bg-snow border border-border rounded-xl py-3 text-[15px] font-medium text-navy outline-none focus:border-teal transition-colors ${
            prefix ? "pl-8 pr-3.5" : "px-3.5"
          }`}
        />
      </div>
    </div>
  );
}

function QuickButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-2.5 py-1 rounded-lg text-[11.5px] font-medium border transition-colors ${
        active
          ? "bg-teal text-white border-teal"
          : "bg-white text-subtle border-border hover:border-teal/40"
      }`}
    >
      {children}
    </button>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-snow border border-border rounded-xl p-3.5">
      <div className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-subtle leading-tight">
        {label}
      </div>
      <div
        className={`mt-1.5 text-[1.5rem] font-semibold tracking-tight leading-none ${
          accent ? "text-teal" : "text-navy"
        }`}
      >
        {value}
      </div>
      <div className="mt-1.5 text-[11.5px] text-subtle leading-snug">{sub}</div>
    </div>
  );
}
