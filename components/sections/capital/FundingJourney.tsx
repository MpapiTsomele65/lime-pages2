"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import {
  FileText,
  Send,
  Presentation,
  Users,
  Search,
  HandshakeIcon,
  Rocket,
  ArrowRight,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Prepare Your Raise",
    timeframe: "2 – 4 weeks",
    description:
      "Before you approach anyone, get your house in order. This is where most first-time founders underinvest.",
    actions: [
      "Build a 10-15 slide pitch deck",
      "Prepare a 2-page executive summary",
      "Create a financial model (3-year projections)",
      "Set up a data room (Google Drive is fine)",
      "Know your unit economics cold",
      "Define your ask: how much, for what, and what it unlocks",
    ],
    founderTip:
      "Investors decide in the first 3 minutes. Lead with the problem, your traction, and the market size — not your life story.",
  },
  {
    number: "02",
    icon: Send,
    title: "Outreach & Applications",
    timeframe: "2 – 6 weeks",
    description:
      "Target the right investors for your stage and sector. A warm intro is 10x more effective than a cold email.",
    actions: [
      "Research VCs and angels who fund your stage and sector",
      "Get warm introductions via founders they've backed",
      "Apply through VC platforms and open calls",
      "Attend demo days and pitch events",
      "Build a target list of 30-50 investors",
      "Track every conversation in a simple CRM",
    ],
    founderTip:
      "Don't spray and pray. 50 targeted, researched approaches beat 200 generic cold emails. Know why each investor is a fit before you reach out.",
  },
  {
    number: "03",
    icon: Presentation,
    title: "Pitch & First Screen",
    timeframe: "1 – 3 weeks",
    description:
      "Your first meeting with the investor. They're checking mandate fit — does your startup match what they invest in?",
    actions: [
      "15-20 min pitch followed by Q&A",
      "Investor checks stage, sector, and geography fit",
      "Share your deck and executive summary",
      "Be ready for tough questions on market and traction",
      "You'll hear 'no' more than 'yes' — that's normal",
      "Ask about their process and typical timeline",
    ],
    founderTip:
      "This is a two-way street. Ask them: what's your typical cheque size? How do you support founders post-investment? What's your decision timeline?",
  },
  {
    number: "04",
    icon: Users,
    title: "Investor Deep Dive",
    timeframe: "2 – 4 weeks",
    description:
      "If they're interested, your deal gets shared with the broader investment committee or angel group for review.",
    actions: [
      "Detailed presentation to the full investment team",
      "Term sheet discussion begins (non-binding)",
      "Lead investor identified and roles assigned",
      "Expect follow-up questions and data requests",
      "Reference checks — they'll talk to your customers",
      "Co-investors may be brought in at this stage",
    ],
    founderTip:
      "Don't go exclusive too early. Keep other conversations warm. Having multiple interested investors creates healthy tension and better terms.",
  },
  {
    number: "05",
    icon: Search,
    title: "Due Diligence",
    timeframe: "4 – 8 weeks",
    description:
      "The most intensive stage. Investors verify everything — team, market, financials, legal. Most deals that fail, fail here.",
    actions: [
      "Team background checks and references",
      "Financial audit and model validation",
      "Legal review (IP, contracts, compliance)",
      "Market and competitive analysis",
      "Customer and partner interviews",
      "DD report with items flagged for resolution",
    ],
    founderTip:
      "Have your data room ready before DD starts. Missing documents slow the process and signal disorganisation. Transparency builds trust — don't hide problems.",
  },
  {
    number: "06",
    icon: HandshakeIcon,
    title: "Term Sheet & Close",
    timeframe: "2 – 6 weeks",
    description:
      "Negotiate the deal terms, sign legal documents, and get the funds in your account. Always get your own lawyer.",
    actions: [
      "Review and negotiate the term sheet",
      "Key terms: valuation, equity %, vesting, board seats",
      "Shareholders' agreement drafted and signed",
      "Subscription agreement and company resolutions",
      "Funds transferred — you're officially funded",
      "Announce the round (if appropriate)",
    ],
    founderTip:
      "Valuation is not the only thing that matters. Pay attention to liquidation preferences, anti-dilution clauses, and founder vesting. Get a lawyer who knows startup deals.",
  },
  {
    number: "07",
    icon: Rocket,
    title: "Post-Investment",
    timeframe: "Ongoing",
    description:
      "The real work begins. Your investor is now a partner — use their network, expertise, and capital strategically.",
    actions: [
      "Set up monthly investor updates (wins + challenges)",
      "Quarterly board meetings or advisory calls",
      "Leverage investor network for hiring and partnerships",
      "Strategic mentorship and governance support",
      "Plan for follow-on funding or next round",
      "Build towards exit: acquisition, secondary sale, or IPO",
    ],
    founderTip:
      "The best founder-investor relationships are built on honesty. Share bad news early. Investors who backed you want to help — but only if they know what's happening.",
  },
];

export default function FundingJourney() {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <Container>
        <motion.div {...fadeUp} className="mb-12">
          <div className="inline-block bg-capital rounded-full px-4 py-1.5 mb-5">
            <span className="text-[11px] font-bold tracking-[1.2px] uppercase text-navy">
              Fundraising Roadmap
            </span>
          </div>
          <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-extrabold leading-[1.1] tracking-tight text-navy mb-4">
            Your first funding round,
            <br />
            step by step
          </h2>
          <p className="text-muted leading-relaxed max-w-[560px]">
            What to expect from first pitch to funds in the bank. A
            founder-first guide to navigating the VC and angel investment
            process in South Africa.
          </p>
        </motion.div>
      </Container>

      {/* Horizontal scroll container */}
      <div className="relative">
        {/* Connecting line */}
        <div className="hidden lg:block absolute top-[82px] left-0 right-0 h-[3px] bg-border z-0" />

        <div className="overflow-x-auto scrollbar-hide pb-4">
          <div className="flex gap-5 px-[clamp(1.25rem,4vw,3.5rem)] lg:px-[max(calc((100vw-1200px)/2+1.25rem),1.25rem)] min-w-max">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: 0.06 * i,
                  ease: "easeOut" as const,
                }}
                className="w-[300px] shrink-0 flex flex-col"
              >
                {/* Step header with number and connector */}
                <div className="relative flex flex-col items-center mb-5 z-[1]">
                  {/* Number circle */}
                  <div className="w-14 h-14 rounded-full bg-navy flex items-center justify-center mb-2 ring-4 ring-white">
                    <span className="text-capital font-extrabold text-sm">
                      {step.number}
                    </span>
                  </div>
                  {/* Timeframe pill */}
                  <div className="bg-capital/15 rounded-full px-3 py-1">
                    <span className="text-[10px] font-bold text-navy/70 tracking-wide">
                      {step.timeframe}
                    </span>
                  </div>
                </div>

                {/* Card */}
                <div className="bg-white rounded-[20px] border border-border shadow-sm p-6 flex-1 flex flex-col hover:-translate-y-1 hover:shadow-md hover:border-capital/40 transition-all">
                  {/* Icon + Title */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-capital/15 flex items-center justify-center shrink-0">
                      <step.icon className="w-[18px] h-[18px] text-navy" />
                    </div>
                    <h3 className="text-base font-bold text-navy leading-tight">
                      {step.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted leading-relaxed mb-4">
                    {step.description}
                  </p>

                  {/* Action items */}
                  <ul className="space-y-1.5 mb-5 flex-1">
                    {step.actions.map((action, j) => (
                      <li
                        key={j}
                        className="flex items-start gap-2 text-[11px] text-navy/70 leading-snug"
                      >
                        <span className="w-1 h-1 rounded-full bg-capital mt-[5px] shrink-0" />
                        {action}
                      </li>
                    ))}
                  </ul>

                  {/* Founder tip */}
                  <div className="bg-navy rounded-[12px] p-3.5">
                    <p className="text-[10px] font-bold text-capital mb-1 tracking-wide uppercase">
                      Founder Tip
                    </p>
                    <p className="text-[11px] text-white/60 leading-relaxed">
                      {step.founderTip}
                    </p>
                  </div>
                </div>

                {/* Arrow connector (mobile/tablet only between cards) */}
                {i < steps.length - 1 && (
                  <div className="hidden" aria-hidden="true" />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <motion.div
          {...fadeUp}
          className="flex items-center justify-center gap-2 mt-6 text-muted lg:hidden"
        >
          <ArrowRight className="w-4 h-4" />
          <span className="text-xs font-medium">Scroll to explore all steps</span>
        </motion.div>
      </div>

      {/* Bottom summary bar */}
      <Container>
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" as const, delay: 0.2 }}
          className="mt-14 bg-capital rounded-[20px] p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        >
          <div>
            <p className="text-lg font-extrabold text-navy mb-1">
              Total timeline: 3 – 6 months
            </p>
            <p className="text-sm text-navy/60">
              From first pitch to funds in the bank. Every round is different — but knowing the process removes the guesswork.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <a
              href="/advisory"
              className="inline-flex items-center gap-2 bg-navy text-white px-6 py-3 rounded-full text-sm font-bold hover:-translate-y-0.5 transition-all"
            >
              Get Fundraising Help
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
