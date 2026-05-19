"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ArrowRight, FileText, ScrollText, Users } from "lucide-react";

import { Container } from "@/components/ui/Container";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

/**
 * Lehumo Legal Hub — public-facing landing for the trust's governance
 * documents. Members reach this from their portal (LegalDocsCard);
 * prospective members can also reach it directly before joining.
 *
 * Two anchor documents at launch:
 *   1. Member Agreement — the contract between a Member and the Trust.
 *      Substantially final, ready for sign-off.
 *   2. Terms of Reference (TOR) — governance rules being co-created by
 *      the cohort + Steering Committee. Initial scaffold; sections
 *      finalised at the Kick-off QGM (Thu 11 Jun 2026).
 */
export default function LehumoLegalHubPage() {
  return (
    <div className="pt-[70px]">
      {/* Hero */}
      <section className="bg-navy py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute top-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(193,255,114,0.10),transparent_70%)] blur-[60px] pointer-events-none" />
        <Container className="relative z-[1]">
          <motion.div {...fadeUp} className="text-center">
            <div className="inline-flex items-center gap-2 bg-capital/15 border border-capital/30 rounded-full px-4 py-1.5 mb-6">
              <ScrollText className="w-3.5 h-3.5 text-capital" />
              <span className="text-[11px] font-semibold text-capital tracking-[1.2px] uppercase">
                Lehumo · Legal
              </span>
            </div>
            <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-extrabold text-white leading-[1.1] tracking-tight mb-4">
              Member documents
            </h1>
            <p className="text-white/55 text-base max-w-[600px] mx-auto leading-relaxed">
              Everything governing your membership in the Lehumo
              Collective Investment Trust. Read the Member Agreement
              before joining; the Terms of Reference are being
              co-created with the founding cohort and finalised at the
              Kick-off QGM on 11 June 2026.
            </p>
          </motion.div>
        </Container>
      </section>

      {/* Document cards */}
      <section className="py-16 sm:py-20 bg-white">
        <Container>
          <motion.div {...fadeUp} className="max-w-[800px] mx-auto">
            <div className="mb-8">
              <Link
                href="/lehumo"
                className="inline-flex items-center gap-2 text-sm text-navy/60 hover:text-navy font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Lehumo
              </Link>
            </div>

            <div className="space-y-5">
              <DocCard
                href="/lehumo/legal/member-agreement"
                icon={<FileText className="w-5 h-5" />}
                eyebrow="Anchor document"
                title="Member Agreement"
                description="The contract between you and the Lehumo Trust — contribution obligations, plan tiers, emergency access, beneficiary, withdrawal, risk disclosures, and the Trust's investment strategy."
                lastUpdated="14 May 2026"
                status="Active"
                statusTone="lime"
              />
              <DocCard
                href="/lehumo/legal/terms-of-reference"
                icon={<Users className="w-5 h-5" />}
                eyebrow="Governance"
                title="Terms of Reference"
                description="Rules of engagement for the Executive Steering Governance Committee — purpose, composition, term length, meeting cadence, decision-making, and amendments. Co-created with the founding cohort."
                lastUpdated="14 May 2026"
                status="Draft · finalised at Kick-off QGM"
                statusTone="teal"
              />
            </div>

            <p className="mt-12 text-xs text-[#9CA3AF] leading-relaxed">
              Documents are versioned via the public git repository.
              Material amendments are circulated to members by email
              and announced at the nearest Quarterly General Meeting.
              For questions about either document, contact{" "}
              <a
                href="mailto:lehumo@limepages.co.za"
                className="text-[#46CDCF] hover:underline"
              >
                lehumo@limepages.co.za
              </a>
              .
            </p>
          </motion.div>
        </Container>
      </section>
    </div>
  );
}

function DocCard({
  href,
  icon,
  eyebrow,
  title,
  description,
  lastUpdated,
  status,
  statusTone,
}: {
  href: string;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  lastUpdated: string;
  status: string;
  statusTone: "lime" | "teal";
}) {
  const toneClasses =
    statusTone === "lime"
      ? "bg-[#B8FF00]/10 border-[#B8FF00]/30 text-[#3F5A00]"
      : "bg-[#46CDCF]/10 border-[#46CDCF]/30 text-[#0E7C8A]";

  return (
    <Link
      href={href}
      className="group block rounded-[20px] border border-[#E5E7EB] bg-white p-6 sm:p-7 hover:border-navy/30 hover:shadow-[0_8px_28px_-8px_rgba(11,25,51,0.12)] transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy/[0.04] text-navy">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9CA3AF]">
              {eyebrow}
            </p>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${toneClasses}`}
            >
              {status}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-ink tracking-tight">
            {title}
          </h3>
          <p className="mt-2 text-[14px] text-[#6B7280] leading-relaxed">
            {description}
          </p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-[11.5px] text-[#9CA3AF]">
              Last updated · {lastUpdated}
            </p>
            <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-navy group-hover:translate-x-0.5 transition-transform">
              Read
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
