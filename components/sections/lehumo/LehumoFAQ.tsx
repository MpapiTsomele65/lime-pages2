"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, HelpCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/ui/Container";

interface FaqItem {
  q: string;
  a: ReactNode;
}

/**
 * Recurring questions distilled from the two prospective-member info
 * sessions (21 & 23 April 2026). Phrased in the founder's voice; copy
 * trimmed to what was actually clarified on the calls — no aspirational
 * promises about returns. Order roughly mirrors the buyer journey:
 * frame → money in → returns → money out → safety → governance → joining.
 */
const FAQ: FaqItem[] = [
  {
    q: "How is Lehumo different from a typical stokvel?",
    a: (
      <>
        <p>
          Three things, and they all compound:
        </p>
        <ul className="mt-3 space-y-2 text-white/70">
          <li className="flex gap-3">
            <span className="text-lime shrink-0">●</span>
            <span>
              Most stokvels{" "}
              <span className="text-white font-semibold">
                pay out cash every 12 months
              </span>
              , so the money never gets a chance to compound. We lock
              contributions for{" "}
              <span className="text-white font-semibold">60 months</span> so
              they can sit in productive, regulated investments that actually
              grow.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-lime shrink-0">●</span>
            <span>
              You don&rsquo;t lose access to your money during the lock-up.
              Internal lending lets you draw{" "}
              <span className="text-white font-semibold">up to 20%</span> of
              your contributions, plus peer-to-peer beyond that — so a
              short-term cash need doesn&rsquo;t force you to pull out
              entirely.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-lime shrink-0">●</span>
            <span>
              The model is{" "}
              <span className="text-white font-semibold">
                built as scalable infrastructure
              </span>
              . After year 5 the same playbook can be cloned for other
              communities and stokvels — it&rsquo;s designed to scale, not
              wind down.
            </span>
          </li>
        </ul>
      </>
    ),
  },
  {
    q: "Will my monthly contribution increase automatically each year?",
    a: (
      <>
        <p>
          No. Your contribution stays flat by default for the full 60-month
          accumulation period. We won&rsquo;t bump it up annually unless the
          group decides to.
        </p>
        <p className="mt-3">
          You can voluntarily contribute more at any point — that earns you
          proportionally larger shareholding and voting power when we convert
          into Phase 2 at the end of year five. A group-wide increase would
          require a member vote.
        </p>
      </>
    ),
  },
  {
    q: "What's the minimum I need to contribute to qualify for the conversion?",
    a: (
      <>
        <p>
          You&rsquo;ll need to reach <span className="text-lime font-semibold">R40,000 in
          total contributions</span> over the 60 months to convert into Phase 2
          (the registered company). The lowest monthly tier of R500/month gets
          you there with consistent contributions.
        </p>
        <p className="mt-3">
          Members can also &ldquo;lever up&rdquo; — contribute more — for
          additional voting weight at conversion.
        </p>
      </>
    ),
  },
  {
    q: "Can I switch contribution tiers during the 60 months?",
    a: (
      <>
        <p>
          Yes — you&rsquo;re not locked to whatever you started on. You can
          move <span className="text-white font-semibold">up</span> to a higher
          tier whenever you want (more shareholding at conversion), or move{" "}
          <span className="text-white font-semibold">down</span> if your
          circumstances change.
        </p>
        <p className="mt-3">
          The only hard constraint is the{" "}
          <span className="text-lime font-semibold">R40,000 floor at year 5</span>.
          If you spend a chunk of the term on a lower tier, you&rsquo;ll need
          to catch up — either by increasing the monthly amount or topping up
          directly — to clear the conversion threshold.
        </p>
        <p className="mt-3">
          The member portal keeps your running total visible so you always
          know how far ahead or behind you are versus the floor.
        </p>
      </>
    ),
  },
  {
    q: "Are there any fees on top of my R1,000 contribution?",
    a: (
      <>
        <p>
          It depends on the plan, but{" "}
          <span className="text-white font-semibold">100% of your R1,000</span>{" "}
          always goes into the investment pool. Plan fees sit on top of your
          contribution, never deducted from it.
        </p>
        <p className="mt-3">
          <span className="text-white font-semibold">Basic</span> charges
          zero fees — you transfer R1,000 manually each month, and emergency
          loan access unlocks at month 12.{" "}
          <span className="text-white font-semibold">Standard</span> adds a{" "}
          <span className="text-lime font-semibold">R19.90/mo collection fee</span>{" "}
          for the Paystack debit-order automation, portal hosting, KYC
          processing and reconciliation — and unlocks emergency loan access
          six months earlier (month 6).
        </p>
        <p className="mt-3">
          The <span className="text-white font-semibold">R100 VIP tier</span>{" "}
          is still in refinement — value proposition isn&rsquo;t finalised
          yet, so it&rsquo;s flagged as <em>coming soon</em> on the plans
          page. The current thinking is private WhatsApp, Lime Connect
          listing, priority support, and earlier visibility on sandbox ideas.
          We&rsquo;ll only roll it out if there&rsquo;s genuine demand from
          the founding 30 — and it would be additive, never a paywall on
          existing benefits.
        </p>
      </>
    ),
  },
  {
    q: "Where will my money actually sit, and who manages it?",
    a: (
      <>
        <p>
          Contributions land in a dedicated{" "}
          <span className="text-white font-semibold">LimePages bank account</span>,
          then we deploy across three buckets:
        </p>
        <ul className="mt-3 space-y-2 text-white/70">
          <li className="flex gap-3">
            <span className="text-lime shrink-0">●</span>
            <span>~40% held as reserves &amp; savings (liquidity for loans &amp; emergencies)</span>
          </li>
          <li className="flex gap-3">
            <span className="text-lime shrink-0">●</span>
            <span>~40% deployed via{" "}
              <span className="text-white font-semibold">Samman Investments</span>{" "}
              (registered FSP focused on SME lending)</span>
          </li>
          <li className="flex gap-3">
            <span className="text-lime shrink-0">●</span>
            <span>10–20% allocated to a second asset manager (SV Capital — tentative)</span>
          </li>
        </ul>
        <p className="mt-3">
          Every third-party manager is FSCA-regulated, which is why we run
          full KYC and FICA on every member.
        </p>
      </>
    ),
  },
  {
    q: "Do members have any say in how the money is invested?",
    a: (
      <>
        <p>
          Yes — within the strategy. The bulk (~80–90%) follows the agreed
          allocation through{" "}
          <span className="text-white font-semibold">
            FSCA-registered managers
          </span>
          , which is what gives the strategy its consistency.
        </p>
        <p className="mt-3">
          But{" "}
          <span className="text-lime font-semibold">~10% is a
          member-influenced bucket</span>{" "}
          — a sandbox for the group to vote on. It can go into non-traditional
          ideas (livestock, equities, a new lending product) provided we can
          articulate the recovery mechanism. We treat it as a testing ground:
          if a sandbox model proves out, it can graduate to the main strategy
          in a future cycle.
        </p>
        <p className="mt-3">
          Strategic-allocation changes go to a steering-committee vote so
          everyone has a clear voice on direction.
        </p>
      </>
    ),
  },
  {
    q: "What kind of returns are you targeting?",
    a: (
      <>
        <p>
          The strategy deliberately avoids heavy stock-market exposure. ~90%
          of capital is deployed into SME-loan products through registered FSPs
          with strong collection mechanisms — diversified across multiple
          stokvels and borrowers to spread default risk.
        </p>
        <p className="mt-3">
          We&rsquo;re targeting average net returns of{" "}
          <span className="text-lime font-semibold">15–17% after fees</span>.
        </p>
        <p className="mt-3 text-[13px] text-white/40">
          Past performance never guarantees future results — this is the
          strategy, not a fixed return promise. #ThisIsNotFinancialAdvice
        </p>
      </>
    ),
  },
  {
    q: "Can I borrow against my own contributions if I need cash?",
    a: (
      <>
        <p>
          Yes. You can access{" "}
          <span className="text-white font-semibold">up to 20% of your
          contributions</span> at any point (capped at R20,000). No interest is
          charged within that 20% — it&rsquo;s your own money.
        </p>
        <p className="mt-3">
          If you need more than 20%, the committee can facilitate a peer-to-peer
          loan from members who haven&rsquo;t used their full allowance.
          Interest only kicks in above the 20% threshold, and the rate is set
          by the lending member within group guidelines.
        </p>
        <p className="mt-3">
          Unrepaid borrowed amounts (plus interest) are clawed back from your
          remaining contributions at the 5-year mark before capital is
          deployed.
        </p>
      </>
    ),
  },
  {
    q: "How does interest work on a peer-to-peer loan above the 20% threshold?",
    a: (
      <>
        <p>
          Inside your 20% allowance there&rsquo;s{" "}
          <span className="text-white font-semibold">no interest</span> — it&rsquo;s
          your own money. Interest only enters the picture when you need to
          borrow <span className="text-white font-semibold">above</span> that
          threshold and another member fronts the difference.
        </p>
        <p className="mt-3">
          On a peer-to-peer loan, the{" "}
          <span className="text-white font-semibold">
            lending member sets the rate
          </span>{" "}
          within group-agreed guidelines (a floor and ceiling adopted by the
          steering committee). The committee facilitates the match and the
          paperwork; the borrower repays both principal and interest within
          the agreed term.
        </p>
        <p className="mt-3">
          If a P2P borrower defaults, the unpaid principal{" "}
          <span className="text-lime font-semibold">plus the agreed interest</span>{" "}
          is recovered from their remaining contributions before the pool is
          deployed at year 5 — so the lender is made whole at conversion, not
          left exposed.
        </p>
      </>
    ),
  },
  {
    q: "What happens if I borrow against my contributions and can't pay it back?",
    a: (
      <>
        <p>
          You don&rsquo;t lose the money outright. The unrepaid amount (plus
          any interest charged above the 20% threshold) is recovered from
          your contributions at the 5-year mark — but the bigger consequence
          is what it does to your{" "}
          <span className="text-white font-semibold">
            ownership at Phase 2
          </span>
          .
        </p>
        <p className="mt-3">
          A lower contribution balance means a smaller share of the pool when
          we convert into the company. As a concrete example: a member who
          would normally enter Phase 2 with{" "}
          <span className="text-white font-semibold">
            3 shares and 3 votes
          </span>{" "}
          might enter with{" "}
          <span className="text-white font-semibold">
            2 shares and 2 votes
          </span>{" "}
          instead — fewer voting rights, and a proportionally smaller share
          of future dividends.
        </p>
        <p className="mt-3">
          The structure is built so the cost of default is{" "}
          <span className="text-white font-semibold">
            proportional and transparent
          </span>
          , not punitive. How you manage the loan during the 60 months
          shapes your ownership at conversion.
        </p>
      </>
    ),
  },
  {
    q: "What happens if I miss a few months of contributions?",
    a: (
      <>
        <p>
          You get a{" "}
          <span className="text-white font-semibold">6-month grace period</span>{" "}
          to catch up — extendable up to 12 months for genuine hardship like
          job loss. After that, the steering subcommittee reviews your case.
        </p>
        <p className="mt-3">
          If you don&rsquo;t reach the R40,000 minimum by year 5, your
          membership may be reduced (e.g. half a vote instead of full
          shareholding) — but you never lose the capital you&rsquo;ve already
          contributed.
        </p>
      </>
    ),
  },
  {
    q: "What if other members drop out — does the pool break?",
    a: (
      <>
        <p>
          A single member dropping out at year 5 has minimal impact on the
          overall pool. On a{" "}
          <span className="text-white font-semibold">~R2M target pool</span>,
          one R60k exit is well within the buffer the strategy is built
          around — the remaining 29 contributors still hit conversion
          comfortably.
        </p>
        <p className="mt-3">
          The structure only needs re-evaluating if{" "}
          <span className="text-white font-semibold">
            ~5 members drop out simultaneously
          </span>
          . If that ever happened, the playbook is straightforward: existing
          members can &ldquo;lever up&rdquo;, we open seats to the waitlist,
          or we oversubscribe to maintain conversion economics. Resilience
          is built in by design, not luck.
        </p>
      </>
    ),
  },
  {
    q: "What if I want to leave, or genuinely can't continue contributing?",
    a: (
      <>
        <p>
          You receive your{" "}
          <span className="text-white font-semibold">
            contributed capital back
          </span>{" "}
          — but you forfeit any accrued interest and returns earned by the
          pool while you were a member.
        </p>
        <p className="mt-3">
          Your seat then opens up: it can be re-allocated to an existing
          member who wants to &ldquo;double up&rdquo; (contributing the
          equivalent share for an extra vote) or to someone on the founding
          waitlist.
        </p>
      </>
    ),
  },
  {
    q: "What happens to my money if something happens to me?",
    a: (
      <>
        <p>
          We collect{" "}
          <span className="text-white font-semibold">
            next-of-kin and beneficiary details
          </span>{" "}
          as part of KYC, before Phase 2 begins. If something happens, your
          beneficiaries inherit your contributed capital plus any interest
          earned.
        </p>
        <p className="mt-3">
          Once we convert into the trust structure post-Phase 2, beneficiaries
          are formally mandated — meaning the assets and dividends transfer
          legally and automatically to your next of kin.
        </p>
      </>
    ),
  },
  {
    q: "How is the scheme governed? Who actually makes the decisions?",
    a: (
      <>
        <p>
          A{" "}
          <span className="text-white font-semibold">steering committee
          capped at six members</span>, with terms of reference drafted upfront
          so everyone knows the rules of engagement.
        </p>
        <p className="mt-3">
          Voting weight is tied to your contribution level — more skin in the
          game, more say. Major decisions (rule changes, new members beyond
          90, large allocations) go to a full-member vote. We&rsquo;ll be
          inviting volunteers from the founding 30 to subscribe for committee
          roles.
        </p>
      </>
    ),
  },
  {
    q: "What documents do I need to provide for KYC?",
    a: (
      <>
        <p>Three things, all standard:</p>
        <ul className="mt-3 space-y-2 text-white/70">
          <li className="flex gap-3">
            <span className="text-lime shrink-0">●</span>
            <span>
              <span className="text-white font-semibold">Full ID number</span>{" "}
              — SA ID or passport (we auto-detect on the form)
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-lime shrink-0">●</span>
            <span>
              <span className="text-white font-semibold">
                Proof of residential address
              </span>{" "}
              — utility bill, lease, or bank statement &lt; 3 months old
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-lime shrink-0">●</span>
            <span>
              <span className="text-white font-semibold">
                Source-of-funds declaration
              </span>{" "}
              — a quick dropdown (salary, business income, etc.)
            </span>
          </li>
        </ul>
        <p className="mt-3">
          You can upload your ID copy and proof of address through the
          member portal once your account is activated, or email them to{" "}
          <span className="text-white font-semibold">
            lehumo@limepages.co.za
          </span>
          .
        </p>
        <p className="mt-3">
          KYC and FICA compliance is required because our asset managers
          (Samman Investments, SV Capital) are FSCA-registered FSPs —
          they can&rsquo;t deploy capital from an unverified member.
        </p>
      </>
    ),
  },
  {
    q: "How will I know what's happening with my money?",
    a: (
      <>
        <p>
          You&rsquo;ll get{" "}
          <span className="text-white font-semibold">quarterly statements</span>{" "}
          as standard, with optional monthly statements available on request.
        </p>
        <p className="mt-3">
          The LimePages member portal gives you a live dashboard showing your
          contributions, the total pool, and aggregated investment positions —
          so you always know where you stand and where the collective stands.
        </p>
        <p className="mt-3">
          On top of that we&rsquo;ll run quarterly virtual update sessions
          plus an annual in-person meeting if there&rsquo;s appetite. An
          auditor will be engaged ahead of conversion.
        </p>
      </>
    ),
  },
  {
    q: "Why isn't this a trust from day one?",
    a: (
      <>
        <p>
          Trusts are{" "}
          <span className="text-white font-semibold">
            expensive to set up and admin-heavy
          </span>{" "}
          when you&rsquo;re still in capital-accumulation mode. We&rsquo;d
          spend a meaningful chunk of early contributions on legal and
          compliance overheads with very little working capital to show for
          it.
        </p>
        <p className="mt-3">
          So we phase the structure:
        </p>
        <ul className="mt-3 space-y-2 text-white/70">
          <li className="flex gap-3">
            <span className="text-teal font-bold shrink-0">Phase 1</span>
            <span>Collective accumulation (60 months)</span>
          </li>
          <li className="flex gap-3">
            <span className="text-teal font-bold shrink-0">Phase 2</span>
            <span>Register as a company once we have meaningful capital</span>
          </li>
          <li className="flex gap-3">
            <span className="text-teal font-bold shrink-0">Phase 3</span>
            <span>Possible conversion to a trust thereafter</span>
          </li>
        </ul>
        <p className="mt-3">
          This keeps overheads low while we build the pool — and the path is
          designed up-front, not retrofitted.
        </p>
      </>
    ),
  },
  {
    q: "What's the long-term vision beyond year 5 — is this just a 5-year scheme?",
    a: (
      <>
        <p>
          No. Year 5 is the conversion point, not the finish line. After that,
          three things compound:
        </p>
        <ul className="mt-3 space-y-2 text-white/70">
          <li className="flex gap-3">
            <span className="text-lime shrink-0">●</span>
            <span>
              The pool keeps deploying — same SME-loan strategy, now inside a
              registered company (and eventually a trust) with formal
              shareholder mechanics.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-lime shrink-0">●</span>
            <span>
              The infrastructure we&rsquo;re building (KYC pipeline, member
              portal, reporting, reconciliation) is{" "}
              <span className="text-white font-semibold">designed to be cloned</span>.
              Other communities and stokvels can adopt the same playbook
              without rebuilding it from scratch.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-lime shrink-0">●</span>
            <span>
              Over 10–15 years, the ambition is to grow this into a full{" "}
              <span className="text-white font-semibold">
                financial services business
              </span>{" "}
              — validating a sustainable peer-to-peer lending model and a
              wealth-creation framework that historically hasn&rsquo;t been
              built for our communities.
            </span>
          </li>
        </ul>
        <p className="mt-3 text-[13px] text-white/40">
          Phase 2 is real and contractually defined; phase 3+ is direction,
          not a guarantee. The founding 30 are deciding the first step — the
          rest is built with you, not for you.
        </p>
      </>
    ),
  },
  {
    q: "Can I still join if I missed the founding cohort?",
    a: (
      <>
        <p>
          The hard cap is{" "}
          <span className="text-white font-semibold">90 members</span> —
          made up of the founding 30, plus each member&rsquo;s two invitees.
          If those slots fill, you&rsquo;ll go on a waitlist for the next
          cohort.
        </p>
        <p className="mt-3">
          We deliberately keep numbers tight to preserve trust, decision
          quality, and the per-member economics. Quality over quantity is the
          point.
        </p>
      </>
    ),
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, amount: 0.15 } as const,
  transition: { duration: 0.6, ease: "easeOut" as const } as const,
};

interface QuestionRowProps {
  item: FaqItem;
  index: number;
}

/**
 * Per-question disclosure. Mirrors the design language of CollapsibleBlock
 * (Plus icon that rotates 45°, lime/teal accents, framer-motion height
 * animation) but compressed to a single-row layout suitable for stacking
 * many questions.
 */
function QuestionRow({ item, index }: QuestionRowProps) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, delay: 0.04 * index, ease: "easeOut" as const }}
      className={`border-b border-white/[0.08] ${index === 0 ? "border-t" : ""}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`${open ? "Collapse" : "Expand"} answer to: ${item.q}`}
        className="group w-full flex items-center justify-between gap-6 text-left cursor-pointer py-6"
      >
        <span className="flex-1 text-[16px] md:text-[17px] font-bold text-white leading-snug pr-4">
          {item.q}
        </span>
        <div
          className={`shrink-0 h-9 w-9 rounded-full border flex items-center justify-center transition-all ${
            open
              ? "bg-lime/15 border-lime/40 text-lime"
              : "bg-white/[0.04] border-white/[0.1] text-white/60 group-hover:bg-lime/10 group-hover:border-lime/30 group-hover:text-lime"
          }`}
        >
          <motion.span
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex"
          >
            <Plus className="h-4 w-4" />
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="pb-7 pr-12 text-[15px] text-white/70 leading-[1.75]">
              {item.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function LehumoFAQ() {
  return (
    <section className="py-20 md:py-28 bg-navy relative overflow-hidden">
      {/* Subtle glow orbs to match adjacent sections */}
      <div className="absolute top-[20%] -left-[10%] w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(70,205,207,0.07),transparent_70%)] blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[10%] -right-[10%] w-[380px] h-[380px] rounded-full bg-[radial-gradient(circle,rgba(184,255,0,0.05),transparent_70%)] blur-[80px] pointer-events-none" />

      <Container className="relative z-[1]">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-16 items-start">
          {/* Left: Header */}
          <motion.div {...fadeUp} className="lg:sticky lg:top-28">
            <div className="inline-flex items-center gap-2.5 bg-teal/10 border border-teal/25 rounded-full px-[18px] py-1.5 mb-5">
              <HelpCircle className="w-3.5 h-3.5 text-teal" />
              <span className="text-[11px] font-bold text-teal tracking-[1.2px] uppercase">
                Frequently asked
              </span>
            </div>
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white leading-[1.08] tracking-tight mb-4">
              Real questions from{" "}
              <span className="text-lime">prospective members</span>
            </h2>
            <p className="text-[15px] text-white/55 leading-[1.8] max-w-[440px] mb-6">
              Pulled directly from our April 2026 info sessions. If your
              question isn&rsquo;t here, bring it to the next session — or ask
              us directly.
            </p>
            <Link
              href="/lehumo/onboard"
              className="inline-flex items-center gap-2 bg-lime text-navy px-6 py-3 rounded-full font-bold text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(184,255,0,0.3)] transition-all"
            >
              Apply to join <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Right: Question list */}
          <div>
            {FAQ.map((item, i) => (
              <QuestionRow key={item.q} item={item} index={i} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
