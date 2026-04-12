"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

export default function TermsOfServicePage() {
  return (
    <div className="pt-[70px]">
      {/* Header */}
      <section className="bg-navy py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute bottom-[5%] right-[10%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(70,205,207,0.1),transparent_70%)] blur-[60px] pointer-events-none" />
        <Container className="relative z-[1]">
          <motion.div {...fadeUp} className="text-center">
            <div className="inline-flex items-center gap-2 bg-capital/15 border border-capital/30 rounded-full px-4 py-1.5 mb-6">
              <FileText className="w-3.5 h-3.5 text-capital" />
              <span className="text-[11px] font-semibold text-capital tracking-[1.2px] uppercase">
                Legal
              </span>
            </div>
            <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-extrabold text-white leading-[1.1] tracking-tight mb-4">
              Terms of Service
            </h1>
            <p className="text-white/50 text-base max-w-[500px] mx-auto">
              The terms and conditions governing your use of Lime Pages
              services.
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
                  1. Agreement to Terms
                </h2>
                <p>
                  By accessing or using the Lime Pages website
                  (limepages.co.za) and any services offered by Lime Pages
                  (Pty) Ltd (&ldquo;Lime Pages&rdquo;, &ldquo;we&rdquo;,
                  &ldquo;our&rdquo;, or &ldquo;us&rdquo;), you agree to be
                  bound by these Terms of Service. If you do not agree to
                  these terms, please do not use our services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-ink mb-3">
                  2. Services Overview
                </h2>
                <p className="mb-3">Lime Pages offers:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Lime Advisory:</strong> Business advisory,
                    growth strategy, and consulting services for individuals,
                    SMMEs, and startups.
                  </li>
                  <li>
                    <strong>Lehumo Collective Investment Trust:</strong> A
                    community-based collective investment vehicle for
                    qualifying members.
                  </li>
                  <li>
                    <strong>Lime Capital:</strong> Investment education
                    content covering public and private capital markets.
                  </li>
                  <li>
                    <strong>Lime Connect:</strong> A professional networking
                    and business directory platform.
                  </li>
                  <li>
                    <strong>Lemonade Station:</strong> Resources and tools
                    for founders and SMMEs.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-ink mb-3">
                  3. Not Financial Advice
                </h2>
                <div className="bg-snow rounded-[16px] border border-border p-6 mb-4">
                  <p className="font-bold text-ink mb-2">
                    #ThisIsNotFinancialAdvice
                  </p>
                  <p>
                    All content provided through Lime Pages, including but
                    not limited to articles, educational materials, fund
                    comparisons, and investment guides on the Lime Capital
                    page, is for educational and informational purposes only.
                    Nothing on this website constitutes financial advice,
                    investment advice, tax advice, or any other form of
                    professional advice.
                  </p>
                </div>
                <p>
                  You should consult a qualified, registered financial
                  advisor before making any investment decisions. Past
                  performance data shown on our website does not guarantee
                  future results. Lime Pages is not a registered Financial
                  Services Provider (FSP) under the Financial Advisory and
                  Intermediary Services (FAIS) Act.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-ink mb-3">
                  4. Advisory Services
                </h2>
                <p className="mb-3">
                  When you engage our advisory services:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    Advisory packages are billed as described on the
                    Advisory page. Prices are in South African Rand (ZAR)
                    and include VAT where applicable.
                  </li>
                  <li>
                    Advisory sessions are subject to availability and
                    scheduled via our booking system.
                  </li>
                  <li>
                    We offer a 24-hour satisfaction guarantee. If you are not
                    satisfied with your advisory session, you may request a
                    full refund within 24 hours of your session.
                  </li>
                  <li>
                    Deliverables and timelines will be agreed upon at the
                    start of each engagement.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-ink mb-3">
                  5. Lehumo Collective Investment Trust
                </h2>
                <p className="mb-3">
                  Membership in the Lehumo Trust is subject to separate
                  trust-specific terms and conditions, including:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    A minimum monthly contribution of R1,000 is required.
                  </li>
                  <li>
                    Membership is subject to a 5-year lock-in period.
                  </li>
                  <li>
                    The trust is governed by its Trust Deed and applicable
                    South African trust law.
                  </li>
                  <li>
                    Membership is limited and subject to approval by the
                    Trust Committee.
                  </li>
                  <li>
                    Investment returns are not guaranteed. The value of your
                    investment may go up or down.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-ink mb-3">
                  6. Payments
                </h2>
                <p>
                  All payments are processed securely through Paystack. By
                  making a payment, you agree to Paystack&apos;s terms of
                  service. We do not store your credit card or bank account
                  details on our servers. Refund requests must be submitted
                  within the applicable refund period to{" "}
                  <a
                    href="mailto:hello@limepages.co.za"
                    className="text-navy font-medium hover:text-teal transition-colors"
                  >
                    hello@limepages.co.za
                  </a>
                  .
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-ink mb-3">
                  7. User Conduct
                </h2>
                <p className="mb-3">When using our services, you agree to:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    Provide accurate and truthful information in all forms
                    and communications.
                  </li>
                  <li>
                    Not use our services for any unlawful purpose or in
                    violation of any applicable laws.
                  </li>
                  <li>
                    Not attempt to gain unauthorised access to our systems or
                    other users&apos; accounts.
                  </li>
                  <li>
                    Not reproduce, distribute, or create derivative works
                    from our content without written permission.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-ink mb-3">
                  8. Intellectual Property
                </h2>
                <p>
                  All content on the Lime Pages website, including text,
                  graphics, logos, icons, images, and software, is the
                  property of Lime Pages (Pty) Ltd or its content suppliers
                  and is protected by South African and international
                  copyright laws. The Lime Pages name, logo, and all related
                  marks are trademarks of Lime Pages (Pty) Ltd.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-ink mb-3">
                  9. Third-Party Content and Links
                </h2>
                <p>
                  Our website may contain links to third-party websites and
                  references to third-party products, funds, and services.
                  These are provided for informational purposes only and do
                  not constitute an endorsement. Fund performance data and
                  company logos displayed on our site belong to their
                  respective owners. We are not responsible for the accuracy
                  or availability of third-party content.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-ink mb-3">
                  10. Limitation of Liability
                </h2>
                <p>
                  To the maximum extent permitted by South African law, Lime
                  Pages shall not be liable for any indirect, incidental,
                  special, consequential, or punitive damages arising from
                  your use of our services, including but not limited to
                  loss of profits, data, or investment returns. Our total
                  liability for any claim shall not exceed the amount you
                  paid to us for the specific service giving rise to the
                  claim.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-ink mb-3">
                  11. Disclaimer of Warranties
                </h2>
                <p>
                  Our services are provided &ldquo;as is&rdquo; and
                  &ldquo;as available&rdquo; without warranties of any kind,
                  whether express or implied. We do not warrant that our
                  website will be uninterrupted, error-free, or free of
                  viruses or other harmful components.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-ink mb-3">
                  12. Governing Law
                </h2>
                <p>
                  These terms are governed by and construed in accordance
                  with the laws of the Republic of South Africa. Any disputes
                  arising from these terms or your use of our services shall
                  be subject to the exclusive jurisdiction of the courts of
                  South Africa.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-ink mb-3">
                  13. Changes to These Terms
                </h2>
                <p>
                  We reserve the right to modify these Terms of Service at
                  any time. Changes will be effective immediately upon
                  posting to this page. Your continued use of our services
                  after changes are posted constitutes acceptance of the
                  revised terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-ink mb-3">
                  14. Contact Us
                </h2>
                <p>
                  For any questions about these Terms of Service, please
                  contact us:
                </p>
                <div className="mt-3 bg-snow rounded-[16px] border border-border p-6">
                  <p className="font-bold text-ink mb-1">
                    Lime Pages (Pty) Ltd
                  </p>
                  <p>
                    Email:{" "}
                    <a
                      href="mailto:hello@limepages.co.za"
                      className="text-navy font-medium hover:text-teal transition-colors"
                    >
                      hello@limepages.co.za
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
