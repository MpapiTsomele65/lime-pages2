"use client";

/**
 * RetirementAnnuityGuide — the "how to choose an RA" explainer on /capital.
 *
 * Sits above the calculator and the benchmark tables and makes the case
 * they rest on: fees are the one variable you control and can know in
 * advance, so they deserve to be the first question, not the last.
 *
 * Written for a first-time saver. Every rule quoted (deduction cap,
 * two-pot split, de minimis, access age) comes from
 * lib/retirement-annuities.ts, which is sourced to Treasury/SARS/FSCA
 * documents — so the copy and the calculator can never drift apart.
 */

import { motion } from "framer-motion";
import {
  Landmark,
  Receipt,
  Lock,
  Layers3,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

import { Container } from "@/components/ui/Container";
import {
  RA_DEDUCTION_CAP_ZAR,
  RA_DEDUCTION_PCT,
  TAX_YEAR_LABEL,
  EARLIEST_RETIREMENT_AGE,
  DE_MINIMIS_ZAR,
  TWO_POT_MIN_WITHDRAWAL_ZAR,
  RA_TAX_SOURCE,
} from "@/lib/retirement-annuities";

const fmtZAR = (n: number) => `R${n.toLocaleString("en-ZA").replace(/,/g, " ")}`;

const CHECKLIST = [
  {
    icon: Receipt,
    title: "Start with the fee, not the returns",
    body: `The fee is the only number you know for certain before you sign. Over a 30-year term the difference between 0.9% and 1.9% a year is roughly a quarter of your final pot — not a rounding error, but the difference between retiring and nearly retiring. Ask for the Effective Annual Cost, which providers must publish, and make sure it includes platform admin, the fund's own charges and any adviser fee.`,
  },
  {
    icon: Landmark,
    title: "Reg 28 is a floor everyone shares",
    body: `Every South African RA must comply with Regulation 28 of the Pension Funds Act — max 75% equities, max 45% offshore, no crypto. So "Reg 28 compliant" tells you nothing about whether a product is good. It caps how concentrated your money can get. National Treasury is explicit that it does not, by itself, protect your investment.`,
  },
  {
    icon: Layers3,
    title: "Decide if you want to choose funds at all",
    body: `A ready-made RA puts you in one balanced fund and quotes a single all-in fee — one decision, done. A self-directed platform charges a lower headline fee but you pick the funds and pay their charges on top, and you carry the responsibility for staying Reg 28 compliant. Neither is better; a cheap platform fee just isn't the same number as a cheap all-in fee.`,
  },
  {
    icon: Lock,
    title: "Check the exit before the entrance",
    body: `Modern RAs let you stop, restart or move without penalty. Older life-wrapped products can charge causal-event penalties when you reduce contributions, and some force an annual contribution increase you can't switch off. Ask one question in writing: what does it cost me to stop contributing, and what does it cost me to transfer out?`,
  },
];

export default function RetirementAnnuityGuide() {
  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24" id="ra-guide">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal/10 border border-teal/25 mb-4">
            <Landmark className="w-3.5 h-3.5 text-teal" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal">
              Choosing a Retirement Annuity
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-navy leading-[1.05]">
            The government pays you to save. The fee decides how much you
            keep.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-subtle leading-relaxed">
            A retirement annuity is the most tax-efficient way to save for
            retirement in South Africa &mdash; SARS refunds tax on every rand
            you put in, and nothing inside the fund is taxed while it grows.
            The catch is that RAs are sold, not bought, and the gap between the
            cheapest and dearest costs you years of retirement.
          </p>
        </motion.div>

        {/* Tax benefit callout */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mt-10 rounded-2xl bg-navy p-6 sm:p-8 grid md:grid-cols-3 gap-6"
        >
          <div className="md:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-capital">
              The {TAX_YEAR_LABEL} tax break
            </p>
            <h3 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-white leading-tight">
              Up to {fmtZAR(RA_DEDUCTION_CAP_ZAR)} a year off your taxable
              income.
            </h3>
            <p className="mt-3 text-[14.5px] text-white/70 leading-relaxed">
              You can deduct {(RA_DEDUCTION_PCT * 100).toFixed(1)}% of the
              greater of your remuneration or taxable income, capped at{" "}
              {fmtZAR(RA_DEDUCTION_CAP_ZAR)} &mdash; raised from R350 000 on 1
              March 2026, the first increase since 2016. At a 39% marginal rate,
              a {fmtZAR(5000)}-a-month contribution hands back about{" "}
              {fmtZAR(23400)} a year. Contribute more than the limit and nothing
              is lost: the excess carries forward and reduces your tax later.
            </p>
            <a
              href={RA_TAX_SOURCE}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-capital hover:underline"
            >
              National Treasury &mdash; Budget 2026 Tax Guide
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="flex flex-col justify-center gap-3 md:border-l md:border-white/10 md:pl-6">
            <Rule
              label="Access from"
              value={`Age ${EARLIEST_RETIREMENT_AGE}`}
              note="Earlier only on permanent disability"
            />
            <Rule
              label="Cash out fully below"
              value={fmtZAR(DE_MINIMIS_ZAR)}
              note="Otherwise two-thirds buys an annuity"
            />
          </div>
        </motion.div>

        {/* Two-pot */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mt-6 rounded-2xl border border-border bg-snow p-6 sm:p-7"
        >
          <h3 className="text-[17px] font-semibold text-navy">
            Two-pot: you are no longer locked out until 55
          </h3>
          <p className="mt-2 text-[14px] text-subtle leading-relaxed max-w-3xl">
            Since 1 September 2024, every rand you contribute splits in two. A
            third goes to a <strong className="text-navy">savings
            component</strong> you can draw from once per tax year (minimum{" "}
            {fmtZAR(TWO_POT_MIN_WITHDRAWAL_ZAR)}, taxed at your marginal rate).
            Two-thirds goes to a{" "}
            <strong className="text-navy">retirement component</strong> that
            stays locked until you retire. Anything you had before September
            2024 sits in a vested component under the old rules.
          </p>
          <p className="mt-3 text-[13.5px] text-subtle leading-relaxed max-w-3xl">
            It is genuine flexibility, and an expensive habit. A withdrawal is
            taxed at your full marginal rate rather than the friendlier
            retirement tables, and the compounding you give up is permanent.
          </p>
        </motion.div>

        {/* Checklist */}
        <div className="mt-10 grid md:grid-cols-2 gap-4">
          {CHECKLIST.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: i * 0.06, ease: "easeOut" }}
                className="rounded-2xl border border-border bg-white p-5 sm:p-6"
              >
                <div className="flex items-center gap-2.5 mb-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal/12">
                    <Icon className="w-4 h-4 text-teal" />
                  </span>
                  <span className="text-[10.5px] font-mono text-subtle">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="text-[16px] font-semibold text-navy leading-snug">
                  {item.title}
                </h3>
                <p className="mt-2 text-[13.5px] text-subtle leading-relaxed">
                  {item.body}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Questions to ask */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mt-10 rounded-2xl border border-capital/40 bg-capital-light p-6 sm:p-7"
        >
          <h3 className="text-[17px] font-semibold text-navy">
            Five questions before you sign anything
          </h3>
          <ul className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
            {[
              "What is the Effective Annual Cost, all in?",
              "Does that include the adviser fee, and is it negotiable?",
              "What does it cost me to stop contributing?",
              "What does it cost me to transfer out?",
              "Is there a compulsory annual contribution increase?",
            ].map((q) => (
              <li key={q} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal shrink-0 mt-0.5" />
                <span className="text-[13.5px] text-navy leading-relaxed">
                  {q}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[12px] text-subtle leading-relaxed">
            If a provider won&rsquo;t answer these in writing, that is itself
            the answer.
          </p>
        </motion.div>
      </Container>
    </section>
  );
}

function Rule({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/50">
        {label}
      </p>
      <p className="mt-0.5 text-[20px] font-semibold tracking-tight text-white">
        {value}
      </p>
      <p className="text-[11.5px] text-white/60 leading-snug">{note}</p>
    </div>
  );
}
