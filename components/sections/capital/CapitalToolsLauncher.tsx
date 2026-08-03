"use client";

/**
 * CapitalToolsLauncher — the front door to every interactive tool on
 * /capital.
 *
 * The tools were scattered across ~34 screens, so a visitor who arrived
 * wanting to *do* something (work out an RA contribution, see what an
 * extra R1,000 does to a home loan) had to scroll for it or already know
 * it existed. This surfaces all six in one screen near the top.
 *
 * Deliberately a launcher, not a container: each card jumps to the tool
 * where it already lives, beside the content that explains it. Moving
 * the tools into one block would strip that context and break the
 * read-then-try flow that makes them land.
 */

import { motion } from "framer-motion";
import {
  PiggyBank,
  Home,
  Gauge,
  Scale,
  BarChart3,
  Layers,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

import { Container } from "@/components/ui/Container";

/** Matches CapitalSectionNav's offset so a jump clears both fixed bars. */
const SCROLL_OFFSET = 124;

interface Tool {
  id: string;
  icon: LucideIcon;
  name: string;
  what: string;
  /** The concrete thing you walk away with — the reason to click. */
  outcome: string;
  kind: "Calculator" | "Quiz" | "Comparison";
}

const TOOLS: Tool[] = [
  {
    id: "ra-calculator",
    icon: PiggyBank,
    name: "Retirement Goal Calculator",
    what: "Set the monthly income you want in retirement and see what your current plan actually delivers.",
    outcome: "Your monthly shortfall + the SARS refund you're owed",
    kind: "Calculator",
  },
  {
    id: "home-loan-accelerator",
    icon: Home,
    name: "Home Loan Accelerator",
    what: "Add an extra amount to your bond repayment and watch the term collapse.",
    outcome: "Years saved and interest avoided",
    kind: "Calculator",
  },
  {
    id: "ra-comparison",
    icon: Scale,
    name: "RA Fee Benchmark",
    what: "Ten retirement annuities ranked by what they actually cost you, fees first.",
    outcome: "The cheapest credible RA for your situation",
    kind: "Comparison",
  },
  {
    id: "risk-profile",
    icon: Gauge,
    name: "Risk Profiler",
    what: "A two-minute scenario quiz on how you'd really react to a falling market.",
    outcome: "Your investor profile + ETFs that suit it",
    kind: "Quiz",
  },
  {
    id: "fund-performance",
    icon: BarChart3,
    name: "Fund Comparison",
    what: "South Africa's top unit trusts against global benchmarks over ten years.",
    outcome: "Real long-run numbers, not marketing ones",
    kind: "Comparison",
  },
  {
    id: "starter-baskets",
    icon: Layers,
    name: "Starter Baskets",
    what: "Ready-made portfolio starting points for different budgets and goals.",
    outcome: "A first portfolio you can actually build",
    kind: "Comparison",
  },
];

const KIND_STYLES: Record<Tool["kind"], string> = {
  Calculator: "bg-teal/12 text-teal",
  Quiz: "bg-navy/[0.07] text-navy",
  Comparison: "bg-capital/25 text-navy",
};

export default function CapitalToolsLauncher() {
  function jumpTo(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET,
      behavior: "smooth",
    });
    history.replaceState(null, "", `#${id}`);
  }

  return (
    <section id="tools" className="scroll-mt-[124px] bg-white py-14 sm:py-16">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-2xl mb-8"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal">
            Tools &amp; Calculators
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-navy leading-tight">
            Skip the reading. Run your own numbers.
          </h2>
          <p className="mt-3 text-[15px] text-subtle leading-relaxed">
            Six free tools on this page. Each one takes a couple of minutes
            and gives you a number you can act on.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {TOOLS.map((t, i) => {
            const Icon = t.icon;
            return (
              <motion.a
                key={t.id}
                href={`#${t.id}`}
                onClick={(e) => jumpTo(e, t.id)}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.42, delay: i * 0.05, ease: "easeOut" }}
                className="group flex flex-col rounded-2xl border border-border bg-white p-5 transition-all hover:border-teal/40 hover:-translate-y-0.5"
                style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.03)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal/12">
                    <Icon className="h-4.5 w-4.5 text-teal" />
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${KIND_STYLES[t.kind]}`}
                  >
                    {t.kind}
                  </span>
                </div>

                <h3 className="text-[15px] font-semibold text-navy leading-snug">
                  {t.name}
                </h3>
                <p className="mt-1.5 text-[13px] text-subtle leading-relaxed">
                  {t.what}
                </p>

                <div className="mt-auto pt-3.5">
                  <p className="text-[11.5px] text-subtle/90 leading-snug">
                    <span className="font-semibold text-navy">You get:</span>{" "}
                    {t.outcome}
                  </p>
                  <span className="mt-2.5 inline-flex items-center gap-1 text-[12.5px] font-semibold text-teal">
                    Open
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </motion.a>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
