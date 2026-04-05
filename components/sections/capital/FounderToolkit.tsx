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
  ArrowRight,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const docs = [
  {
    icon: FileText,
    step: "04",
    stepLabel: "Investor Deep Dive",
    title: "Term Sheet Template",
    what: "A non-binding first offer — it sets out how much the investor puts in, what equity they get, and the key conditions.",
    purpose:
      "Aligns expectations early before expensive legal drafting begins. Prevents surprises later.",
    filename: "term-sheet-template.docx",
    size: "85 KB",
    format: "DOCX",
  },
  {
    icon: BadgeCheck,
    step: "04",
    stepLabel: "Investor Deep Dive",
    title: "SAVCA Model Term Sheet",
    what: "The industry-standard term sheet by SAVCA — widely used as a fair starting point for VC negotiations in South Africa.",
    purpose:
      "A balanced benchmark to compare against any term sheet you receive and flag unusual clauses.",
    filename: "savca-model-term-sheet.docx",
    size: "85 KB",
    format: "DOCX",
  },
  {
    icon: Building2,
    step: "06",
    stepLabel: "Term Sheet & Close",
    title: "Memorandum of Incorporation (MOI)",
    what: "Your company\u2019s constitution under the Companies Act. It defines governance rules, share classes, and shareholder rights.",
    purpose:
      "Without an MOI, you can\u2019t issue different share classes or grant investor rights. Must be in place before any deal closes.",
    filename: "memorandum-of-incorporation.docx",
    size: "155 KB",
    format: "DOCX",
  },
  {
    icon: Scale,
    step: "06",
    stepLabel: "Term Sheet & Close",
    title: "Shareholders Agreement",
    what: "A private contract between founders and investors governing decisions, disputes, and exits after the money lands.",
    purpose:
      "Sets clear rules upfront — voting, information sharing, and what happens if someone wants out. Prevents disputes.",
    filename: "shareholders-agreement.docx",
    size: "73 KB",
    format: "DOCX",
  },
  {
    icon: ScrollText,
    step: "06",
    stepLabel: "Term Sheet & Close",
    title: "Subscription Agreement",
    what: "The contract where the investor formally subscribes for new shares. This is the document that actually moves the money.",
    purpose:
      "Legally formalises the deal — binds the investor to transfer funds and your company to issue shares. No deal without it.",
    filename: "subscription-agreement.docx",
    size: "84 KB",
    format: "DOCX",
  },
];

export default function FounderToolkit() {
  return (
    <section className="py-24 bg-snow overflow-hidden">
      <Container>
        <motion.div {...fadeUp} className="mb-12">
          <div className="inline-block bg-capital rounded-full px-4 py-1.5 mb-5">
            <span className="text-[11px] font-bold tracking-[1.2px] uppercase text-navy">
              Free Resources
            </span>
          </div>
          <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-extrabold leading-[1.1] tracking-tight text-navy mb-4">
            Founder Toolkit
          </h2>
          <p className="text-muted leading-relaxed max-w-[560px]">
            Download draft legal templates to familiarise yourself with the
            documents you&apos;ll encounter during fundraising. Review these
            before you sit across from an investor.
          </p>
        </motion.div>
      </Container>

      {/* Horizontal scroll carousel */}
      <div className="overflow-x-auto scrollbar-hide pb-4">
        <div className="flex gap-5 px-[clamp(1.25rem,4vw,3.5rem)] lg:px-[max(calc((100vw-1200px)/2+1.25rem),1.25rem)] min-w-max">
          {docs.map((doc, i) => (
            <motion.a
              key={doc.filename}
              href={`/downloads/${doc.filename}`}
              download
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: 0.06 * i,
                ease: "easeOut" as const,
              }}
              className="group w-[290px] shrink-0 bg-white rounded-[20px] border border-border shadow-sm p-6 flex flex-col hover:-translate-y-1 hover:shadow-md hover:border-capital/40 transition-all cursor-pointer"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-capital/15 flex items-center justify-center shrink-0">
                  <doc.icon className="w-5 h-5 text-navy" />
                </div>
                <div className="w-9 h-9 rounded-full bg-navy/[0.06] flex items-center justify-center shrink-0 group-hover:bg-capital/20 transition-colors">
                  <Download className="w-4 h-4 text-navy/40 group-hover:text-navy transition-colors" />
                </div>
              </div>

              {/* Step badge */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-navy flex items-center justify-center">
                  <span className="text-capital font-extrabold text-[9px]">
                    {doc.step}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-navy/40 tracking-wide">
                  {doc.stepLabel}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-[15px] font-bold text-navy mb-3 leading-tight group-hover:text-navy/80 transition-colors">
                {doc.title}
              </h3>

              {/* What is this? */}
              <div className="bg-capital/10 border border-capital/25 rounded-xl px-3 py-2.5 mb-2.5">
                <p className="text-[9px] font-bold text-navy/45 uppercase tracking-wide mb-0.5">
                  What is this?
                </p>
                <p className="text-[11px] text-navy/75 leading-relaxed">
                  {doc.what}
                </p>
              </div>

              {/* Purpose */}
              <div className="bg-navy/[0.03] border border-navy/[0.08] rounded-xl px-3 py-2.5 mb-4">
                <p className="text-[9px] font-bold text-navy/45 uppercase tracking-wide mb-0.5">
                  Purpose
                </p>
                <p className="text-[11px] text-navy/75 leading-relaxed">
                  {doc.purpose}
                </p>
              </div>

              {/* File meta — pushed to bottom */}
              <div className="flex items-center gap-3 mt-auto">
                <span className="bg-navy rounded-md px-2 py-0.5 text-[10px] font-bold text-capital tracking-wide">
                  {doc.format}
                </span>
                <span className="text-[11px] text-muted font-medium">
                  {doc.size}
                </span>
              </div>
            </motion.a>
          ))}
        </div>
      </div>

      {/* Scroll hint */}
      <motion.div
        {...fadeUp}
        className="flex items-center justify-center gap-2 mt-6 text-muted lg:hidden"
      >
        <ArrowRight className="w-4 h-4" />
        <span className="text-xs font-medium">
          Scroll to explore all templates
        </span>
      </motion.div>

      {/* Disclaimer */}
      <Container>
        <motion.p
          {...fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" as const, delay: 0.2 }}
          className="text-center text-[11px] text-muted/60 mt-10 max-w-[560px] mx-auto leading-relaxed"
        >
          These are draft templates for educational purposes only. Always consult
          a qualified attorney before signing any legal documents.
          #ThisIsNotLegalAdvice
        </motion.p>
      </Container>
    </section>
  );
}
