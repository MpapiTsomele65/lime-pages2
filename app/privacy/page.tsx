"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="pt-[70px]">
      {/* Header */}
      <section className="bg-navy py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute top-[10%] left-[15%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(193,255,114,0.1),transparent_70%)] blur-[60px] pointer-events-none" />
        <Container className="relative z-[1]">
          <motion.div {...fadeUp} className="text-center">
            <div className="inline-flex items-center gap-2 bg-capital/15 border border-capital/30 rounded-full px-4 py-1.5 mb-6">
              <Shield className="w-3.5 h-3.5 text-capital" />
              <span className="text-[11px] font-semibold text-capital tracking-[1.2px] uppercase">
                Your Privacy Matters
              </span>
            </div>
            <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-extrabold text-white leading-[1.1] tracking-tight mb-4">
              Privacy Policy
            </h1>
            <p className="text-white/50 text-base max-w-[500px] mx-auto">
              How we collect, use, and protect your personal information in
              compliance with POPIA.
            </p>
          </motion.div>
        </Container>
      </section>

      {/* Content */}
      <section className="py-16 sm:py-20 bg-white">
        <Container>
          <motion.div
            {...fadeUp}
            className="max-w-[720px] mx-auto prose-container"
          >
            <div className="mb-6">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-navy/60 hover:text-navy font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            </div>

            <p className="text-xs text-[#9CA3AF] font-medium mb-8">
              Last updated: 12 April 2026
            </p>

            <div className="space-y-10 text-[#3F3F46] leading-[1.8] text-[15px]">
              <section>
                <h2 className="text-xl font-bold text-ink mb-3">
                  1. Introduction
                </h2>
                <p>
                  Lime Pages (Pty) Ltd (&ldquo;Lime Pages&rdquo;,
                  &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;)
                  is committed to protecting your personal information. This
                  Privacy Policy explains how we collect, use, store, and
                  share your data when you use our website at limepages.co.za
                  and any related services.
                </p>
                <p className="mt-3">
                  We comply with the Protection of Personal Information Act 4
                  of 2013 (&ldquo;POPIA&rdquo;) and the General Data
                  Protection Regulation (&ldquo;GDPR&rdquo;) where applicable.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-ink mb-3">
                  2. Information We Collect
                </h2>
                <p className="mb-3">
                  We may collect the following categories of personal
                  information:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Identity information:</strong> Full name, ID
                    number (for Lehumo Trust membership only), and date of
                    birth.
                  </li>
                  <li>
                    <strong>Contact information:</strong> Email address, phone
                    number, and physical address.
                  </li>
                  <li>
                    <strong>Financial information:</strong> Bank account
                    details and payment records related to advisory fees or
                    Lehumo Trust contributions.
                  </li>
                  <li>
                    <strong>Business information:</strong> Company name,
                    registration number, and industry details for advisory
                    clients.
                  </li>
                  <li>
                    <strong>Technical information:</strong> IP address, browser
                    type, device information, and website usage data collected
                    through cookies and analytics tools.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-ink mb-3">
                  3. How We Use Your Information
                </h2>
                <p className="mb-3">
                  We use your personal information for the following purposes:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    To provide and manage our advisory services, Lehumo
                    Collective Investment Trust, Lime Capital, and Lime
                    Connect offerings.
                  </li>
                  <li>
                    To process payments through our payment partner, Paystack.
                  </li>
                  <li>
                    To communicate with you about your account, bookings, and
                    service updates.
                  </li>
                  <li>
                    To improve our website, services, and user experience
                    through aggregated analytics.
                  </li>
                  <li>
                    To comply with legal and regulatory obligations.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-ink mb-3">
                  4. Legal Basis for Processing
                </h2>
                <p>
                  Under POPIA and GDPR, we process your personal information
                  based on one or more of the following lawful grounds:
                  consent you have provided, performance of a contract with
                  you, compliance with a legal obligation, or our legitimate
                  interests in operating and improving our services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-ink mb-3">
                  5. Third-Party Sharing
                </h2>
                <p className="mb-3">
                  We do not sell your personal information. We may share your
                  data with the following categories of third parties:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Payment processors:</strong> Paystack, for secure
                    payment processing.
                  </li>
                  <li>
                    <strong>Hosting providers:</strong> Vercel, for website
                    hosting and delivery.
                  </li>
                  <li>
                    <strong>Analytics providers:</strong> For understanding
                    website usage patterns (anonymised data only).
                  </li>
                  <li>
                    <strong>Professional advisors:</strong> Accountants,
                    auditors, and legal counsel as required.
                  </li>
                  <li>
                    <strong>Regulatory authorities:</strong> When required by
                    law or regulation.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-ink mb-3">
                  6. Data Retention
                </h2>
                <p>
                  We retain your personal information only for as long as
                  necessary to fulfil the purposes outlined in this policy, or
                  as required by law. Advisory client records are retained for
                  a minimum of five (5) years. Lehumo Trust membership
                  records are retained for the duration of the trust plus five
                  (5) years after dissolution. Website analytics data is
                  anonymised and retained indefinitely.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-ink mb-3">
                  7. Your Rights Under POPIA
                </h2>
                <p className="mb-3">
                  As a data subject under POPIA, you have the right to:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    Access and request a copy of your personal information
                    held by us.
                  </li>
                  <li>
                    Request correction of inaccurate or incomplete personal
                    information.
                  </li>
                  <li>
                    Request deletion of your personal information, subject to
                    legal retention requirements.
                  </li>
                  <li>
                    Object to the processing of your personal information.
                  </li>
                  <li>
                    Withdraw consent at any time, where processing is based on
                    consent.
                  </li>
                  <li>
                    Lodge a complaint with the Information Regulator of South
                    Africa.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-ink mb-3">
                  8. Cookies
                </h2>
                <p>
                  Our website uses essential cookies to ensure proper
                  functionality and analytics cookies to understand how
                  visitors interact with our site. You can control cookie
                  preferences through your browser settings. Disabling certain
                  cookies may affect your experience on our website.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-ink mb-3">
                  9. Data Security
                </h2>
                <p>
                  We implement appropriate technical and organisational
                  measures to protect your personal information against
                  unauthorised access, loss, destruction, or alteration. These
                  measures include SSL encryption, secure hosting
                  infrastructure, access controls, and regular security
                  reviews.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-ink mb-3">
                  10. Children&apos;s Privacy
                </h2>
                <p>
                  Our services are not directed at individuals under 18 years
                  of age. We do not knowingly collect personal information
                  from children. If you believe we have inadvertently
                  collected a child&apos;s information, please contact us
                  immediately.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-ink mb-3">
                  11. Changes to This Policy
                </h2>
                <p>
                  We may update this Privacy Policy from time to time. Changes
                  will be posted on this page with an updated revision date.
                  We encourage you to review this policy periodically.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-ink mb-3">
                  12. Contact Us
                </h2>
                <p>
                  For any questions about this Privacy Policy or to exercise
                  your rights under POPIA, please contact us:
                </p>
                <div className="mt-3 bg-snow rounded-[16px] border border-border p-6">
                  <p className="font-bold text-ink mb-1">
                    Lime Pages (Pty) Ltd
                  </p>
                  <p>Information Officer: Mpapi Tsomele</p>
                  <p>
                    Email:{" "}
                    <a
                      href="mailto:hello@limepages.co.za"
                      className="text-navy font-medium hover:text-teal transition-colors"
                    >
                      hello@limepages.co.za
                    </a>
                  </p>
                  <p className="mt-3 text-sm text-[#9CA3AF]">
                    Information Regulator (South Africa):{" "}
                    <a
                      href="https://inforegulator.org.za"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-navy/60 hover:text-navy transition-colors"
                    >
                      inforegulator.org.za
                    </a>
                  </p>
                </div>
              </section>
            </div>
          </motion.div>
        </Container>
      </section>
    </div>
  );
}
