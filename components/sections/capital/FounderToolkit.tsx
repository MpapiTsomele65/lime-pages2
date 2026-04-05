"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import {
  Download,
  FileText,
  Scale,
  ScrollText,
  Building2,
  BadgeCheck,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const stagger = {
  whileInView: { transition: { staggerChildren: 0.08 } },
  viewport: { once: true, amount: 0.1 },
};

const staggerChild = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: "easeOut" as const },
};

const resources = [
  {
    stage: "04",
    stageLabel: "Investor Deep Dive",
    docs: [
      {
        icon: FileText,
        title: "Term Sheet Template",
        description:
          "A standard term sheet outlining key deal terms — valuation, equity percentage, investor rights, and conditions. Use this to understand what investors will put in front of you.",
        filename: "term-sheet-template.docx",
        size: "85 KB",
        format: "DOCX",
      },
      {
        icon: BadgeCheck,
        title: "SAVCA Model Term Sheet",
        description:
          "The industry-standard term sheet drafted by SAVCA for the South African venture capital market. A trusted reference point for both founders and investors.",
        filename: "savca-model-term-sheet.docx",
        size: "85 KB",
        format: "DOCX",
      },
    ],
  },
  {
    stage: "06",
    stageLabel: "Term Sheet & Close",
    docs: [
      {
        icon: Building2,
        title: "Memorandum of Incorporation (MOI)",
        description:
          "Your company's constitutional document under the Companies Act. It defines the rules of governance, share classes, director powers, and shareholder rights. Required before investment.",
        filename: "memorandum-of-incorporation.docx",
        size: "155 KB",
        format: "DOCX",
      },
      {
        icon: Scale,
        title: "Shareholders Agreement",
        description:
          "Governs the relationship between founders and investors post-investment. Covers voting rights, board composition, drag-along/tag-along, anti-dilution, and exit provisions.",
        filename: "shareholders-agreement.docx",
        size: "73 KB",
        format: "DOCX",
      },
      {
        icon: ScrollText,
        title: "Subscription Agreement",
        description:
          "The contract through which investors subscribe for new shares in your company. Details the investment amount, share price, conditions precedent, and warranties.",
        filename: "subscription-agreement.docx",
        size: "84 KB",
        format: "DOCX",
      },
    ],
  },
];

export default function FounderToolkit() {
  return (
    <section className="py-24 bg-snow">
      <Container>
        <motion.div {...fadeUp} className="text-center mb-14">
          <div className="inline-block bg-capital rounded-full px-4 py-1.5 mb-5">
            <span className="text-[11px] font-bold tracking-[1.2px] uppercase text-navy">
              Free Resources
            </span>
          </div>
          <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-extrabold leading-[1.1] tracking-tight text-navy mb-4">
            Founder Toolkit
          </h2>
          <p className="text-muted leading-relaxed max-w-[560px] mx-auto">
            Download draft legal templates to familiarise yourself with the
            documents you will encounter during the fundraising process. Review
            these before you sit across from an investor.
          </p>
        </motion.div>

        <div className="space-y-12">
          {resources.map((group) => (
            <div key={group.stage}>
              {/* Stage label */}
              <motion.div
                {...fadeUp}
                className="flex items-center gap-3 mb-6"
              >
                <div className="w-9 h-9 rounded-full bg-navy flex items-center justify-center shrink-0">
                  <span className="text-capital font-extrabold text-xs">
                    {group.stage}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-navy/40 tracking-wide uppercase">
                    Step {group.stage}
                  </p>
                  <p className="text-base font-bold text-navy leading-tight">
                    {group.stageLabel}
                  </p>
                </div>
              </motion.div>

              {/* Document cards */}
              <motion.div
                {...stagger}
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {group.docs.map((doc) => (
                  <motion.a
                    key={doc.filename}
                    href={`/downloads/${doc.filename}`}
                    download
                    {...staggerChild}
                    className="group bg-white rounded-[20px] border border-border p-6 flex flex-col hover:-translate-y-1 hover:shadow-md hover:border-capital/40 transition-all cursor-pointer"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-capital/15 flex items-center justify-center shrink-0">
                        <doc.icon className="w-5 h-5 text-navy" />
                      </div>
                      <div className="w-9 h-9 rounded-full bg-navy/[0.06] flex items-center justify-center shrink-0 group-hover:bg-capital/20 transition-colors">
                        <Download className="w-4 h-4 text-navy/40 group-hover:text-navy transition-colors" />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-navy mb-2 group-hover:text-navy/80 transition-colors">
                      {doc.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-muted leading-relaxed mb-5 flex-1">
                      {doc.description}
                    </p>

                    {/* File meta */}
                    <div className="flex items-center gap-3">
                      <span className="bg-navy rounded-md px-2 py-0.5 text-[10px] font-bold text-capital tracking-wide">
                        {doc.format}
                      </span>
                      <span className="text-[11px] text-muted font-medium">
                        {doc.size}
                      </span>
                    </div>
                  </motion.a>
                ))}
              </motion.div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <motion.p
          {...fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" as const, delay: 0.2 }}
          className="text-center text-[11px] text-muted/60 mt-12 max-w-[560px] mx-auto leading-relaxed"
        >
          These are draft templates for educational purposes only. Always consult
          a qualified attorney before signing any legal documents.
          #ThisIsNotLegalAdvice
        </motion.p>
      </Container>
    </section>
  );
}
