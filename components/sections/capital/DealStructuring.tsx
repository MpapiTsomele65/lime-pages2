"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import {
  FileText,
  RefreshCcw,
  CircleDollarSign,
  BarChart3,
  BookOpen,
  AlertTriangle,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, amount: 0.15 } as const,
  transition: { duration: 0.6, ease: "easeOut" as const } as const,
};

const dealTypes = [
  {
    title: "SAFE Note",
    subtitle: "Simple Agreement for Future Equity",
    accent: "#0B1933",
    icon: FileText,
    what: "An agreement where you invest money now in exchange for equity later, usually at a discount to the next funding round.",
    keyTerms: ["Valuation cap", "Discount rate (typically 15-25%)", "Conversion trigger"],
    bestFor: "Early-stage, pre-revenue startups",
    risk: "High — no guarantee of conversion",
    riskColor: "#ef4444",
  },
  {
    title: "Convertible Note",
    subtitle: "",
    accent: "#46CDCF",
    icon: RefreshCcw,
    what: "A loan that converts to equity at a future funding round, with interest accruing. Similar to a SAFE but structured as debt.",
    keyTerms: ["Interest rate", "Maturity date", "Conversion discount", "Valuation cap"],
    bestFor: "Pre-seed and seed stage",
    risk: "Medium-High — has debt protection but still startup risk",
    riskColor: "#f59e0b",
  },
  {
    title: "Equity Round",
    subtitle: "Priced Round",
    accent: "#C1FF72",
    icon: CircleDollarSign,
    what: "Direct purchase of shares at an agreed valuation. The company issues new shares and you become a shareholder immediately.",
    keyTerms: ["Pre-money valuation", "Post-money valuation", "Share price", "Dilution"],
    bestFor: "Series A and beyond",
    risk: "Medium — clearer terms but larger minimums",
    riskColor: "#f59e0b",
  },
  {
    title: "Revenue-Based Financing",
    subtitle: "",
    accent: "#6B7280",
    icon: BarChart3,
    what: "You invest capital in exchange for a percentage of future revenue until a return multiple is reached. No equity given up.",
    keyTerms: ["Revenue share %", "Return cap (typically 1.5-3x)", "Payment period"],
    bestFor: "Revenue-generating businesses",
    risk: "Medium — tied to actual revenue",
    riskColor: "#f59e0b",
  },
];

const glossaryTerms = [
  {
    term: "Valuation Cap",
    definition:
      "Maximum company valuation at which your investment converts to equity.",
  },
  {
    term: "Dilution",
    definition:
      "Reduction of your ownership percentage when new shares are issued.",
  },
  {
    term: "Due Diligence",
    definition:
      "The investigation process before making an investment decision.",
  },
  {
    term: "Term Sheet",
    definition:
      "A non-binding agreement outlining the key terms of an investment.",
  },
  {
    term: "Cap Table",
    definition:
      "A table showing the ownership stakes, equity dilution, and value of equity in each round.",
  },
  {
    term: "Liquidation Preference",
    definition:
      "Determines who gets paid first (and how much) when a company exits.",
  },
];

const riskBullets = [
  "Never invest more than you can afford to lose entirely",
  "Diversify across multiple deals — most startups fail",
  "Understand every term in the agreement before signing",
  "Ask for references and speak to other investors in the deal",
  "Verify the company is registered (CIPC) and founders are who they say they are",
];

export default function DealStructuring() {
  return (
    <section className="bg-white py-24 md:py-32">
      <Container>
        {/* ── Header ── */}
        <motion.div {...fadeUp} className="max-w-2xl mb-16">
          <span
            className="inline-block text-[11px] font-bold uppercase tracking-[0.15em] mb-4"
            style={{ color: "#0B1933" }}
          >
            Deal Structuring
          </span>
          <h2
            className="text-3xl md:text-4xl font-extrabold mb-4"
            style={{ color: "#0B1933" }}
          >
            How startup investments work.
          </h2>
          <p className="text-base md:text-lg" style={{ color: "#3F3F46" }}>
            From angel rounds to Series A — understanding deal structures is
            essential for anyone looking to invest in high-growth ventures.
          </p>
        </motion.div>

        {/* ── Deal Types Grid ── */}
        <div className="grid md:grid-cols-2 gap-5 mb-20">
          {dealTypes.map((deal, i) => {
            const Icon = deal.icon;
            return (
              <motion.div
                key={deal.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.6,
                  ease: "easeOut",
                  delay: i * 0.1,
                }}
                className="rounded-[20px] border border-gray-100 overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Colored top bar */}
                <div
                  className="h-1"
                  style={{ backgroundColor: deal.accent }}
                />

                <div className="p-6 md:p-8">
                  {/* Icon + Title */}
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${deal.accent}15` }}
                    >
                      <Icon
                        size={20}
                        style={{ color: deal.accent === "#C1FF72" ? "#0B1933" : deal.accent }}
                      />
                    </div>
                    <div>
                      <h3
                        className="text-lg font-bold"
                        style={{ color: "#0B1933" }}
                      >
                        {deal.title}
                      </h3>
                      {deal.subtitle && (
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "#3F3F46" }}
                        >
                          {deal.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* What */}
                  <p
                    className="text-sm leading-relaxed mb-5"
                    style={{ color: "#18181B" }}
                  >
                    {deal.what}
                  </p>

                  {/* Key Terms pills */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {deal.keyTerms.map((term) => (
                      <span
                        key={term}
                        className="inline-block text-[11px] font-medium px-3 py-1 rounded-full"
                        style={{
                          backgroundColor: `${deal.accent}12`,
                          color:
                            deal.accent === "#C1FF72"
                              ? "#0B1933"
                              : deal.accent === "#6B7280"
                                ? "#0B0B0B"
                                : deal.accent,
                          border: `1px solid ${deal.accent}30`,
                        }}
                      >
                        {term}
                      </span>
                    ))}
                  </div>

                  {/* Best For + Risk */}
                  <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[11px] font-semibold uppercase tracking-wide"
                        style={{ color: "#3F3F46" }}
                      >
                        Best for:
                      </span>
                      <span
                        className="text-sm"
                        style={{ color: "#18181B" }}
                      >
                        {deal.bestFor}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[11px] font-semibold uppercase tracking-wide"
                        style={{ color: "#3F3F46" }}
                      >
                        Risk:
                      </span>
                      <span
                        className="text-sm font-medium"
                        style={{ color: deal.riskColor }}
                      >
                        {deal.risk}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Glossary ── */}
        <motion.div {...fadeUp} className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "#46CDCF15" }}
            >
              <BookOpen size={20} style={{ color: "#46CDCF" }} />
            </div>
            <div>
              <span
                className="inline-block text-[11px] font-bold uppercase tracking-[0.15em]"
                style={{ color: "#0B1933" }}
              >
                Key Terms
              </span>
              <h3
                className="text-2xl font-bold"
                style={{ color: "#0B1933" }}
              >
                Glossary
              </h3>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {glossaryTerms.map((item, i) => (
              <motion.div
                key={item.term}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.6,
                  ease: "easeOut",
                  delay: i * 0.08,
                }}
                className="rounded-[20px] border border-gray-100 p-6 bg-gray-50/50"
              >
                <h4
                  className="text-sm font-bold mb-1"
                  style={{ color: "#0B1933" }}
                >
                  {item.term}
                </h4>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "#3F3F46" }}
                >
                  {item.definition}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Risk Awareness Banner ── */}
        <motion.div
          {...fadeUp}
          className="rounded-[20px] overflow-hidden"
          style={{ backgroundColor: "#0B1933" }}
        >
          <div
            className="h-1"
            style={{ backgroundColor: "#C1FF72" }}
          />
          <div className="p-8 md:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "#C1FF7220" }}
              >
                <AlertTriangle size={20} style={{ color: "#C1FF72" }} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white">
                Before You Invest
              </h3>
            </div>

            <ul className="space-y-3">
              {riskBullets.map((bullet, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{
                    duration: 0.5,
                    ease: "easeOut",
                    delay: i * 0.08,
                  }}
                  className="flex items-start gap-3"
                >
                  <span
                    className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: "#C1FF72" }}
                  />
                  <span
                    className="text-sm md:text-base leading-relaxed"
                    style={{ color: "#ffffffcc" }}
                  >
                    {bullet}
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
