"use client";

/**
 * Bond Calculator — bond / mortgage amortisation tool for the Lime
 * Capital page.
 *
 * What it does:
 *   • Member enters loan amount, interest rate, term, and (optional)
 *     property value for a rates-and-taxes estimate.
 *   • A slider + quick-pick buttons let them try extra monthly
 *     contributions on top of the minimum repayment.
 *   • The amortisation runs month-by-month and surfaces the new
 *     payoff period, months/interest saved, total cost, and a
 *     balance-over-time SVG chart that compares "minimum only"
 *     against "with extra."
 *
 * Visual identity:
 *   • Snow surface with a white inner panel — sits cleanly between
 *     FundComparison and InvestorsLikeYou on /capital.
 *   • Teal accents for strong numbers + active controls (matches
 *     the rest of the Capital page's "financial accent" treatment).
 *   • Capital-green highlight backgrounds for celebratory state
 *     (the "you saved X" strip + the highlighted stat tile).
 *
 * Math: amortise() walks the loan month by month with extra
 * principal applied to each payment. Numbers in the chart are
 * downsampled to 60 bars regardless of term length so the SVG stays
 * lightweight on long loans.
 *
 * Rendering: pure React. SVG is declarative (no imperative innerHTML
 * like the prototype) so re-renders trigger naturally on state
 * changes, and refs aren't needed.
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calculator, TrendingDown, Info } from "lucide-react";
import { Container } from "@/components/ui/Container";

// ── Helpers ──────────────────────────────────────────────────────────
const TERM_YEAR_DEFAULT = 20;

function monthlyPayment(P: number, annualRate: number, years: number): number {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return P / n;
  return (P * r) / (1 - Math.pow(1 + r, -n));
}

interface AmortPoint {
  month: number;
  balance: number;
}

interface AmortResult {
  months: number;
  totalPaid: number;
  totalInterest: number;
  series: AmortPoint[];
  monthlyPayment: number;
  minMonthly: number;
}

/**
 * Walk the loan month-by-month with `extra` added to each payment.
 * Stops as soon as the balance hits zero. Capped at term + 12 months
 * so an extreme parameter set (0% rate, huge extra) can't loop.
 */
function amortise(
  P: number,
  annualRate: number,
  years: number,
  extra: number,
): AmortResult {
  const r = annualRate / 100 / 12;
  const baseMin = monthlyPayment(P, annualRate, years);
  const pay = baseMin + extra;
  const maxMonths = years * 12 + 12;
  let bal = P;
  let totalInt = 0;
  let totalPaid = 0;
  const series: AmortPoint[] = [{ month: 0, balance: P }];

  for (let m = 1; m <= maxMonths; m++) {
    const interest = bal * r;
    let principal = pay - interest;
    if (principal <= 0) principal = baseMin - interest;
    if (principal >= bal) {
      totalInt += interest;
      totalPaid += bal + interest;
      bal = 0;
      series.push({ month: m, balance: 0 });
      return {
        months: m,
        totalPaid,
        totalInterest: totalInt,
        series,
        monthlyPayment: pay,
        minMonthly: baseMin,
      };
    }
    bal -= principal;
    totalInt += interest;
    totalPaid += pay;
    series.push({ month: m, balance: bal });
  }
  return {
    months: maxMonths,
    totalPaid,
    totalInterest: totalInt,
    series,
    monthlyPayment: pay,
    minMonthly: baseMin,
  };
}

const fmtZAR = (n: number) =>
  "R" + Math.round(n).toLocaleString("en-ZA").replace(/,/g, " ");
const fmtZARShort = (n: number) => {
  if (Math.abs(n) >= 1e6) return "R" + (n / 1e6).toFixed(2) + "M";
  if (Math.abs(n) >= 1e3) return "R" + (n / 1e3).toFixed(0) + "k";
  return "R" + Math.round(n);
};
const fmtMonths = (m: number) => {
  const y = Math.floor(m / 12);
  const mo = m % 12;
  if (y === 0) return `${mo} mo`;
  if (mo === 0) return `${y} yr${y > 1 ? "s" : ""}`;
  return `${y}y ${mo}m`;
};
const fmtYears = (m: number) => (m / 12).toFixed(1) + " yrs";
const parseNum = (s: string) =>
  Number(String(s).replace(/[^\d.\-]/g, "")) || 0;
const fmtThousands = (n: number) =>
  n.toLocaleString("en-ZA").replace(/,/g, " ");

const QUICK_PICKS = [0, 200, 400, 1000, 2000, 5000];
const CHART_INCREMENTS = [0, 200, 400, 600, 1000, 2000, 3000, 5000];

// ── Component ────────────────────────────────────────────────────────
export default function BondCalculator() {
  // Inputs as strings so the user can backspace freely without the
  // value snapping to 0 mid-typing. We parse on every recalculation.
  const [loanStr, setLoanStr] = useState("1 800 000");
  const [rateStr, setRateStr] = useState("11.50");
  const [termStr, setTermStr] = useState("20");
  const [propertyStr, setPropertyStr] = useState("2 200 000");
  const [includeRates, setIncludeRates] = useState(false);
  const [extra, setExtra] = useState(0);

  // Parse + amortise. useMemo so the chart only recalculates when
  // inputs actually change — typing fast in the loan field doesn't
  // re-trigger an SVG rebuild every keystroke beyond the parse.
  const { baseline, accel, derived } = useMemo(() => {
    const loan = parseNum(loanStr);
    const rate = parseNum(rateStr);
    const term = parseNum(termStr) || TERM_YEAR_DEFAULT;
    const property = parseNum(propertyStr);

    const baseline = amortise(loan, rate, term, 0);
    const accel = amortise(loan, rate, term, extra);

    const ratesEst = Math.round((property * 0.007) / 12);
    const minMonthly = Math.round(baseline.minMonthly);
    const net = minMonthly + extra + (includeRates ? ratesEst : 0);
    const monthsSaved = baseline.months - accel.months;
    const interestSaved = baseline.totalInterest - accel.totalInterest;
    const firstMonthInterest = loan * (rate / 100 / 12);
    const extraPct = baseline.minMonthly
      ? (extra / baseline.minMonthly) * 100
      : 0;

    return {
      baseline,
      accel,
      derived: {
        loan,
        rate,
        term,
        ratesEst,
        minMonthly,
        net,
        monthsSaved,
        interestSaved,
        firstMonthInterest,
        extraPct,
      },
    };
  }, [loanStr, rateStr, termStr, propertyStr, includeRates, extra]);

  // ── Field handlers — thousand-space reformatting on blur ──
  function handleMoneyBlur(
    raw: string,
    setter: (s: string) => void,
  ) {
    const n = parseNum(raw);
    if (n > 0) setter(fmtThousands(n));
  }

  return (
    <section className="bg-snow py-16 sm:py-20 lg:py-24" id="home-loan-accelerator">
      <Container>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="max-w-3xl mb-10 lg:mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal/10 border border-teal/25 mb-4">
            <Calculator className="w-3.5 h-3.5 text-teal" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal">
              Home Loan Accelerator
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-navy leading-[1.05]">
            Pay your home loan off years earlier.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-subtle leading-relaxed">
            Run your home loan through the accelerator. Try an extra monthly
            contribution and watch the payoff term shorten &mdash; and how
            much interest you save by doing it.
          </p>
        </motion.div>

        {/* Calculator card */}
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
                Step 01 &mdash; your home loan
              </p>
              <h3 className="mt-1 text-2xl font-semibold tracking-tight text-navy leading-[1.1]">
                What does your home loan look like?
              </h3>
            </div>

            {/* Loan amount */}
            <Field
              label="Loan amount"
              hint="principal"
              prefix="R"
              value={loanStr}
              onChange={setLoanStr}
              onBlur={() => handleMoneyBlur(loanStr, setLoanStr)}
            />

            {/* Interest rate */}
            <Field
              label="Interest rate"
              hint="annual %"
              suffix="%"
              value={rateStr}
              onChange={setRateStr}
            />

            {/* Term */}
            <Field
              label="Loan term"
              hint="years"
              suffix="yrs"
              value={termStr}
              onChange={setTermStr}
            />

            {/* Property value */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-baseline text-[12.5px] text-subtle">
                <span>
                  Property value{" "}
                  <span className="text-subtle/80 font-normal">
                    (rates &amp; taxes est.)
                  </span>
                </span>
                <span className="font-mono text-[10.5px] opacity-80">
                  est. R{fmtThousands(derived.ratesEst)}/mo
                </span>
              </div>
              <FieldInput
                prefix="R"
                value={propertyStr}
                onChange={setPropertyStr}
                onBlur={() => handleMoneyBlur(propertyStr, setPropertyStr)}
              />
              <label className="flex items-center gap-2.5 pt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeRates}
                  onChange={(e) => setIncludeRates(e.target.checked)}
                  className="sr-only peer"
                />
                <span className="relative w-8 h-[18px] bg-border rounded-full transition-colors peer-checked:bg-teal shrink-0">
                  <span className="absolute top-[2px] left-[2px] w-[14px] h-[14px] bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-[14px]" />
                </span>
                <span className="text-[12.5px] text-subtle">
                  Include rates &amp; taxes in monthly total
                </span>
              </label>
            </div>

            {/* Extra contribution */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-baseline text-[12.5px] text-subtle">
                <span>Extra monthly contribution</span>
                <span className="font-mono text-[10.5px] opacity-80">
                  {derived.extraPct < 0.5
                    ? "0% of base"
                    : derived.extraPct.toFixed(0) + "% of base"}
                </span>
              </div>
              <div className="bg-snow border border-border rounded-xl p-3.5 flex flex-col gap-2.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[12.5px] text-subtle">
                    Beyond the minimum
                  </span>
                  <span className="text-2xl font-semibold tracking-tight text-teal">
                    R{fmtThousands(extra)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20000}
                  step={200}
                  value={extra}
                  onChange={(e) => setExtra(parseInt(e.target.value, 10))}
                  className="w-full h-[4px] rounded-full bg-border outline-none appearance-none accent-teal"
                  style={{ accentColor: "var(--color-teal)" }}
                />
                <div className="flex gap-1.5 flex-wrap">
                  {QUICK_PICKS.map((v) => (
                    <QuickButton
                      key={v}
                      active={extra === v}
                      onClick={() => setExtra(v)}
                    >
                      {v === 0 ? "R0" : `+R${fmtThousands(v)}`}
                    </QuickButton>
                  ))}
                </div>
              </div>
            </div>

            {/* Payment breakdown */}
            <div className="mt-auto pt-4 border-t border-border flex flex-col">
              <div className="text-[12.5px] font-mono text-subtle tracking-wider uppercase mb-2.5">
                Net monthly contribution
              </div>
              <PayRow label="Minimum repayment">
                <span className="font-semibold text-navy">
                  R{fmtThousands(derived.minMonthly)}
                </span>
              </PayRow>
              <PayRow label="Your extra contribution">
                <span className="font-semibold text-teal">
                  + R{fmtThousands(extra)}
                </span>
              </PayRow>
              {includeRates && (
                <PayRow label="Rates &amp; taxes (est.)">
                  <span className="font-semibold text-navy">
                    + R{fmtThousands(derived.ratesEst)}
                  </span>
                </PayRow>
              )}
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between items-baseline py-1.5">
                <span className="text-[13px] font-medium text-navy">
                  On-target monthly payment
                </span>
                <span className="text-[2.25rem] font-bold tracking-tight text-navy leading-none">
                  <span className="text-[0.5em] text-subtle font-medium mr-1 align-baseline">
                    R
                  </span>
                  {fmtThousands(derived.net)}
                </span>
              </div>
              <p className="text-[11.5px] font-mono text-subtle mt-2 tracking-wide">
                {extra <= 0 ? (
                  <>
                    Pays the home loan off in the original {derived.term}{" "}
                    years.
                  </>
                ) : derived.monthsSaved <= 0 ? (
                  <>Extra contribution applied each month.</>
                ) : (
                  <>
                    Pays the home loan off in{" "}
                    <strong className="text-navy">
                      {fmtYears(accel.months)}
                    </strong>{" "}
                    &mdash;{" "}
                    <strong className="text-teal">
                      {fmtMonths(derived.monthsSaved)} earlier
                    </strong>
                    .
                  </>
                )}
              </p>
            </div>
          </div>

          {/* ─── RIGHT: Results + chart ─── */}
          <div className="p-6 sm:p-7 flex flex-col gap-5">
            <div>
              <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-subtle">
                Step 02 &mdash; what changes
              </p>
              <h3 className="mt-1 text-2xl font-semibold tracking-tight text-navy leading-[1.1]">
                Your repayment, accelerated.
              </h3>
            </div>

            <div>
              <div className="text-[12.5px] font-mono text-subtle tracking-wider uppercase mb-1">
                New payoff period
              </div>
              <div className="text-5xl sm:text-[3.5rem] font-bold tracking-tight text-navy leading-none">
                {(accel.months / 12).toFixed(1)}
                <span className="text-[0.5em] text-subtle font-medium ml-1.5">
                  yrs
                </span>
              </div>
              <div
                className={`mt-3 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg transition-opacity ${
                  extra > 0 && derived.monthsSaved > 0
                    ? "bg-capital-light border border-capital/40 opacity-100"
                    : "bg-snow border border-border opacity-70"
                }`}
              >
                <TrendingDown
                  className={`w-3.5 h-3.5 ${
                    extra > 0 && derived.monthsSaved > 0
                      ? "text-navy"
                      : "text-subtle"
                  }`}
                />
                <span
                  className={`text-[13px] font-medium ${
                    extra > 0 && derived.monthsSaved > 0
                      ? "text-navy"
                      : "text-subtle"
                  }`}
                >
                  {extra <= 0 || derived.monthsSaved <= 0
                    ? "Add an extra contribution to see savings"
                    : `Pay off ${fmtMonths(derived.monthsSaved)} earlier · save ${fmtZAR(derived.interestSaved)} in interest`}
                </span>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-px bg-border rounded-xl overflow-hidden border border-border">
              <Stat label="Time saved">
                {derived.monthsSaved > 0
                  ? fmtMonths(derived.monthsSaved)
                  : "0 mo"}
              </Stat>
              <Stat label="Interest saved">
                {derived.interestSaved > 0
                  ? fmtZAR(derived.interestSaved)
                  : "R0"}
              </Stat>
              <Stat label="Total interest" highlight>
                {fmtZAR(accel.totalInterest)}
              </Stat>
              <Stat label="Total paid">{fmtZAR(accel.totalPaid)}</Stat>
              <Stat label="First-month interest">
                {fmtZAR(derived.firstMonthInterest)}
              </Stat>
              <Stat label="Effective rate">
                {derived.rate.toFixed(2)}%
              </Stat>
            </div>

            {/* Chart */}
            <div className="flex flex-col gap-3.5 flex-1">
              <div className="flex justify-between items-baseline flex-wrap gap-3">
                <h4 className="text-base font-semibold tracking-tight text-navy">
                  Balance over time
                </h4>
                <div className="flex gap-3.5 text-[12px] text-subtle items-center flex-wrap">
                  <Legend swatch="base">Minimum</Legend>
                  <Legend swatch="with-extra">With extra</Legend>
                  <Legend swatch="line">Payoff point</Legend>
                </div>
              </div>

              {/* Chart increments */}
              <div className="flex gap-1 flex-wrap">
                {CHART_INCREMENTS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setExtra(v)}
                    className={`px-2.5 py-1 rounded-md font-mono text-[11px] transition-colors border ${
                      extra === v
                        ? "bg-navy text-snow border-navy"
                        : "bg-transparent text-subtle border-border hover:text-navy hover:border-subtle"
                    }`}
                  >
                    {v === 0 ? "R0" : `+R${fmtThousands(v)}`}
                  </button>
                ))}
              </div>

              <Chart loan={derived.loan} extra={extra} base={baseline} accel={accel} />
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
            Estimates only. Rates &amp; taxes assume ~0.7% of property value
            per year. Your actual home loan instalment depends on your
            bank&rsquo;s offer, life cover, and any structured fees. Use
            this as a guide for what extra contributions could unlock, not
            as a binding quote.
          </span>
        </motion.p>
      </Container>
    </section>
  );
}

// ── Sub-components ────────────────────────────────────────────────────

function Field({
  label,
  hint,
  prefix,
  suffix,
  value,
  onChange,
  onBlur,
}: {
  label: string;
  hint?: string;
  prefix?: string;
  suffix?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-baseline text-[12.5px] text-subtle">
        <span>{label}</span>
        {hint && (
          <span className="font-mono text-[10.5px] opacity-80">{hint}</span>
        )}
      </div>
      <FieldInput
        prefix={prefix}
        suffix={suffix}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
      />
    </div>
  );
}

function FieldInput({
  prefix,
  suffix,
  value,
  onChange,
  onBlur,
}: {
  prefix?: string;
  suffix?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
}) {
  return (
    <div className="relative flex items-center">
      {prefix && (
        <span className="absolute left-3.5 font-mono text-[13px] text-subtle pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`w-full bg-snow border border-border rounded-lg py-3.5 text-[18px] font-semibold tracking-tight text-navy outline-none transition-all focus:border-teal focus:bg-white focus:ring-2 focus:ring-teal/20 ${
          prefix ? "pl-8" : "pl-4"
        } ${suffix ? "pr-10" : "pr-4"}`}
      />
      {suffix && (
        <span className="absolute right-3.5 font-mono text-[13px] text-subtle pointer-events-none">
          {suffix}
        </span>
      )}
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
      className={`px-2.5 py-1.5 rounded-md font-mono text-[11px] transition-all border ${
        active
          ? "bg-teal text-white border-teal"
          : "bg-white text-navy border-border hover:border-teal hover:text-teal"
      }`}
    >
      {children}
    </button>
  );
}

function PayRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-baseline py-1.5">
      <span className="text-[13px] text-subtle">{label}</span>
      <span className="text-[16px] tracking-tight">{children}</span>
    </div>
  );
}

function Stat({
  label,
  children,
  highlight,
}: {
  label: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-3.5 flex flex-col gap-1 ${
        highlight ? "bg-capital-light" : "bg-white"
      }`}
    >
      <div className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-subtle">
        {label}
      </div>
      <div
        className={`text-[22px] font-semibold tracking-tight ${
          highlight ? "text-navy" : "text-navy"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function Legend({
  swatch,
  children,
}: {
  swatch: "base" | "with-extra" | "line";
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`rounded-sm ${
          swatch === "base"
            ? "w-3.5 h-2 bg-border"
            : swatch === "with-extra"
              ? "w-3.5 h-2 bg-teal"
              : "w-3.5 h-[2px] bg-navy"
        }`}
      />
      {children}
    </div>
  );
}

// ── SVG chart — declarative React render ──────────────────────────────
function Chart({
  loan,
  extra,
  base,
  accel,
}: {
  loan: number;
  extra: number;
  base: AmortResult;
  accel: AmortResult;
}) {
  const W = 800;
  const H = 300;
  const PAD_L = 64;
  const PAD_R = 18;
  const PAD_T = 14;
  const PAD_B = 32;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const maxMonths = Math.max(base.months, accel.months, 1);
  const safeLoan = loan || 1;

  const xScale = (m: number) => PAD_L + (m / maxMonths) * innerW;
  const yScale = (b: number) => PAD_T + (1 - b / safeLoan) * innerH;

  // Token colours pulled from the Tailwind theme. Hard-coded here
  // because reading computed styles inside SVG would require a layout
  // pass we don't need; these values mirror app/globals.css.
  const TEAL = "#46cdcf";
  const RULE = "#E5E7EB";
  const INK = "#0B1933";
  const INK_SOFT = "#6B7280";

  // ── Y-axis grid + labels (5 horizontal lines) ──
  const gridY: React.ReactNode[] = [];
  for (let i = 0; i <= 4; i++) {
    const v = (safeLoan / 4) * i;
    const y = yScale(v);
    gridY.push(
      <g key={`gy-${i}`}>
        <line
          x1={PAD_L}
          y1={y}
          x2={W - PAD_R}
          y2={y}
          stroke={RULE}
          strokeWidth={1}
        />
        <text
          x={PAD_L - 8}
          y={y + 4}
          textAnchor="end"
          fill={INK_SOFT}
          fontSize={11}
          fontFamily="ui-monospace, monospace"
        >
          {fmtZARShort(v)}
        </text>
      </g>,
    );
  }

  // ── X-axis year ticks ──
  const gridX: React.ReactNode[] = [];
  const totalYears = Math.ceil(maxMonths / 12);
  const tickStep = totalYears > 15 ? 5 : totalYears > 8 ? 2 : 1;
  for (let yr = 0; yr <= totalYears; yr += tickStep) {
    const x = xScale(yr * 12);
    gridX.push(
      <g key={`gx-${yr}`}>
        <line
          x1={x}
          y1={H - PAD_B}
          x2={x}
          y2={H - PAD_B + 4}
          stroke={INK_SOFT}
          strokeWidth={1}
        />
        <text
          x={x}
          y={H - PAD_B + 18}
          textAnchor="middle"
          fill={INK_SOFT}
          fontSize={11}
          fontFamily="ui-monospace, monospace"
        >
          {yr}y
        </text>
      </g>,
    );
  }

  // ── Bars — downsample to 60 to keep SVG light ──
  const barCount = 60;
  const barW = (innerW / barCount) * 0.8;
  const bars: React.ReactNode[] = [];
  for (let i = 0; i < barCount; i++) {
    const idx = Math.floor((i / barCount) * base.series.length);
    const pt = base.series[idx];
    if (!pt) continue;
    const m = pt.month;
    const baseB = pt.balance;
    const accIdx = Math.min(idx, accel.series.length - 1);
    const accB = accel.series[accIdx]?.balance ?? 0;
    const x = xScale(m) - barW / 2;
    bars.push(
      <g key={`b-${i}`}>
        <rect
          x={x}
          y={yScale(baseB)}
          width={barW}
          height={Math.max(0, H - PAD_B - yScale(baseB))}
          fill={RULE}
          rx={1}
        />
        <rect
          x={x}
          y={yScale(accB)}
          width={barW}
          height={Math.max(0, H - PAD_B - yScale(accB))}
          fill={TEAL}
          rx={1}
          opacity={accB < baseB ? 0.95 : 0.55}
        />
      </g>,
    );
  }

  // ── Payoff lines + savings annotation ──
  const baseEndX = xScale(base.months);
  const accEndX = xScale(accel.months);
  const savingsLines: React.ReactNode[] = [];
  savingsLines.push(
    <g key="payoff-base">
      <line
        x1={baseEndX}
        y1={PAD_T}
        x2={baseEndX}
        y2={H - PAD_B}
        stroke={INK_SOFT}
        strokeWidth={1}
        strokeDasharray="2 4"
      />
      <text
        x={baseEndX}
        y={PAD_T - 2}
        textAnchor="middle"
        fill={INK_SOFT}
        fontSize={10}
        fontFamily="ui-monospace, monospace"
      >
        min · {fmtYears(base.months)}
      </text>
    </g>,
  );

  if (accel.months < base.months) {
    const arrowY = H - PAD_B - 12;
    const midX = (accEndX + baseEndX) / 2;
    const lbl = "−" + fmtMonths(base.months - accel.months);
    const lblW = lbl.length * 7 + 16;

    savingsLines.push(
      <g key="payoff-accel">
        <line
          x1={accEndX}
          y1={PAD_T}
          x2={accEndX}
          y2={H - PAD_B}
          stroke={INK}
          strokeWidth={2}
        />
        <text
          x={accEndX}
          y={PAD_T - 2}
          textAnchor="middle"
          fill={INK}
          fontSize={10}
          fontWeight={600}
          fontFamily="ui-monospace, monospace"
        >
          +R{fmtThousands(extra)} · {fmtYears(accel.months)}
        </text>
        <line
          x1={accEndX}
          y1={arrowY}
          x2={baseEndX}
          y2={arrowY}
          stroke={TEAL}
          strokeWidth={2}
        />
        <polygon
          points={`${baseEndX},${arrowY} ${baseEndX - 6},${arrowY - 4} ${baseEndX - 6},${arrowY + 4}`}
          fill={TEAL}
        />
        <polygon
          points={`${accEndX},${arrowY} ${accEndX + 6},${arrowY - 4} ${accEndX + 6},${arrowY + 4}`}
          fill={TEAL}
        />
        <rect
          x={midX - lblW / 2}
          y={arrowY - 22}
          width={lblW}
          height={16}
          rx={3}
          fill={TEAL}
        />
        <text
          x={midX}
          y={arrowY - 10}
          textAnchor="middle"
          fill="white"
          fontSize={11}
          fontWeight={600}
          fontFamily="ui-monospace, monospace"
        >
          {lbl}
        </text>
      </g>,
    );
  }

  return (
    <div className="w-full h-[300px] bg-snow rounded-xl p-3.5 border border-border">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full h-full block overflow-visible"
      >
        {gridY}
        {gridX}
        {bars}
        {savingsLines}
      </svg>
    </div>
  );
}
