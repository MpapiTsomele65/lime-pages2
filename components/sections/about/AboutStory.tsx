"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";

const fadeUp = {
  initial: { opacity: 0, y: 20 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, amount: 0.15 } as const,
  transition: { duration: 0.7, ease: "easeOut" as const } as const,
};

export function AboutStory() {
  return (
    <>
      {/* ═══════════════════════════════════════════
          HERO — Full-bleed photo + headline
      ═══════════════════════════════════════════ */}
      <section className="relative h-[60vh] min-h-[440px] max-h-[600px] overflow-hidden flex items-end">
        <Image
          src="/images/52982939648_9e27736587_o.jpg"
          alt="Mpapi Tsomele"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1933] via-[#0B1933]/50 to-transparent" />
        <Container className="relative z-[1] pb-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <p className="text-[11px] font-bold tracking-[1.8px] uppercase text-teal mb-4">
              Our Story
            </p>
            <h1 className="text-[clamp(2.2rem,5vw,3.8rem)] font-extrabold text-white leading-[1.05] tracking-tight max-w-[600px]">
              Two economies.
              <br />
              One country.
            </h1>
          </motion.div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════
          THE PROBLEM — Why this exists
      ═══════════════════════════════════════════ */}
      <section className="py-[100px] px-[clamp(1.25rem,4vw,3.5rem)] bg-white">
        <Container className="max-w-[760px]">
          <motion.div {...fadeUp} className="mb-16">
            <p className="text-[11px] font-bold tracking-[1.8px] uppercase text-[#A1A1AA] mb-6">
              The Problem
            </p>
            <h2 className="text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold text-[#18181B] leading-[1.15] tracking-tight mb-8">
              I grew up in the township. I work in the boardroom. I see both
              worlds clearly &mdash; and the gap between them is not an
              accident.
            </h2>
            <div className="space-y-6 text-[16.5px] text-[#52525B] leading-[1.85]">
              <p>
                South Africa runs on two economies that exist side by side but
                almost never touch. In one, there are financial advisors, family
                networks with generational knowledge, mentors who open doors
                with a single phone call, and capital that flows to people
                simply because other people with capital already trust them.
              </p>
              <p>
                In the other &mdash; the one I come from &mdash; you figure it
                out yourself. You learn by making expensive mistakes. You
                don&apos;t know what a SAFE note is until it&apos;s too late.
                You don&apos;t know your rights under the NCA because no one
                ever told you. You don&apos;t have a mentor who&apos;s been
                through a Series A &mdash; you barely know anyone who&apos;s
                been through a business plan.
              </p>
              <p>
                This isn&apos;t about talent or work ethic. The ambition is
                there. The intelligence is there. What&apos;s missing is
                access &mdash; to the right information, the right people, and
                the right tools at the right time. That&apos;s not a personal
                failing. That&apos;s a systemic one.
              </p>
            </div>
          </motion.div>

          {/* Divider */}
          <motion.div
            {...fadeUp}
            className="flex items-center gap-3 mb-16"
          >
            <div className="h-px flex-1 bg-[#E4E4E7]" />
            <div className="w-1.5 h-1.5 rounded-full bg-teal" />
            <div className="h-px flex-1 bg-[#E4E4E7]" />
          </motion.div>

          {/* ═══ THE RESPONSE ═══ */}
          <motion.div {...fadeUp}>
            <p className="text-[11px] font-bold tracking-[1.8px] uppercase text-[#A1A1AA] mb-6">
              The Response
            </p>
            <h2 className="text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold text-[#18181B] leading-[1.15] tracking-tight mb-8">
              Lime Pages exists to close that gap.
            </h2>
            <div className="space-y-6 text-[16.5px] text-[#52525B] leading-[1.85]">
              <p>
                After 7+ years in financial services at a senior level, I
                watched the industry serve the people who already had
                everything &mdash; and quietly look past everyone else. The
                knowledge was there. The frameworks were there. The playbooks
                were there. They were just never shared in the right direction.
              </p>
              <p>
                So I built Lime Pages. Not another fintech app. Not a product
                you subscribe to and forget. A practice &mdash; built
                specifically around the people the industry assumed weren&apos;t
                worth the effort.
              </p>
              <p>
                We democratise the information, the resources, and the ways of
                doing things that live comfortably on the privileged side of
                abundance &mdash; and make them accessible to ambitious,
                first-generation South Africans who were never given a seat at
                the table, but are building their own chairs.
              </p>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════
          QUOTE BREAK
      ═══════════════════════════════════════════ */}
      <section className="py-20 px-[clamp(1.25rem,4vw,3.5rem)] bg-[#FAFAFA]">
        <Container className="max-w-[700px]">
          <motion.blockquote
            {...fadeUp}
            className="text-center"
          >
            <p className="text-[clamp(1.3rem,3vw,1.8rem)] font-bold text-[#18181B] leading-[1.5] italic mb-5">
              &ldquo;We all deserve a chance at bumping into the right person,
              having the right network, taking a chance that works out to
              change the rest of our lives.&rdquo;
            </p>
            <cite className="text-[13px] text-[#71717A] font-semibold tracking-wide uppercase not-italic">
              Mpapi Tsomele, Founder
            </cite>
          </motion.blockquote>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════
          WHAT WE DO — The three pillars
      ═══════════════════════════════════════════ */}
      <section className="py-[100px] px-[clamp(1.25rem,4vw,3.5rem)] bg-white">
        <Container className="max-w-[760px]">
          <motion.div {...fadeUp} className="mb-14">
            <p className="text-[11px] font-bold tracking-[1.8px] uppercase text-[#A1A1AA] mb-6">
              What We Do
            </p>
            <h2 className="text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold text-[#18181B] leading-[1.15] tracking-tight mb-4">
              Three ways we respond to inequality.
            </h2>
            <p className="text-[16.5px] text-[#71717A] leading-[1.8]">
              Every part of Lime Pages is designed to move knowledge, capital,
              and opportunity toward the people who need it most.
            </p>
          </motion.div>

          <div className="space-y-10">
            {[
              {
                num: "01",
                title: "Democratise information.",
                body: "Free AI-powered guidance on your consumer rights, financial literacy tools, and plain-language education on the laws that protect you — NCA, FAIS, CPA. The same knowledge that financial advisors charge R2,000 an hour to explain, made accessible to everyone.",
                accent: "text-teal",
              },
              {
                num: "02",
                title: "Unlock access to capital.",
                body: "Community investment trusts that let 30 people pool R1,000 a month to build collective wealth. Angel syndicates where 5 investors put in R10,000 each to back African startups. Alternative paths to wealth creation that don't require inherited privilege.",
                accent: "text-teal",
              },
              {
                num: "03",
                title: "Build the missing networks.",
                body: "Advisory sessions for SMMEs, founders, and young professionals who don't have a mentor in the industry. Fundraising strategy for first-time founders. Growth support for side hustlers and content creators turning passion into livelihood. The door that was closed — we open it.",
                accent: "text-teal",
              },
            ].map((item, i) => (
              <motion.div
                key={item.num}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: 0.06 * i }}
                className="flex gap-6"
              >
                <span className={`text-[13px] font-extrabold ${item.accent} mt-1 shrink-0 tracking-wide`}>
                  {item.num}
                </span>
                <div className="border-l border-[#E4E4E7] pl-6">
                  <h3 className="text-[18px] font-extrabold text-[#18181B] mb-2 leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-[15px] text-[#71717A] leading-[1.8]">
                    {item.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════
          FOUNDER — Personal section
      ═══════════════════════════════════════════ */}
      <section className="py-[100px] px-[clamp(1.25rem,4vw,3.5rem)] bg-[#FAFAFA]">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Photo */}
            <motion.div
              {...fadeUp}
              className="relative aspect-[4/5] rounded-[20px] overflow-hidden"
            >
              <Image
                src="/images/IMG_8486.jpg"
                alt="Mpapi Tsomele"
                fill
                className="object-cover"
              />
            </motion.div>

            {/* Bio */}
            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}>
              <p className="text-[11px] font-bold tracking-[1.8px] uppercase text-[#A1A1AA] mb-4">
                The Founder
              </p>
              <h2 className="text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold text-[#18181B] leading-[1.15] tracking-tight mb-6">
                Mpapi Tsomele
              </h2>
              <div className="space-y-5 text-[15.5px] text-[#52525B] leading-[1.85]">
                <p>
                  7+ years in financial services at a senior level. I&apos;ve
                  sat in the rooms where the decisions are made about who gets
                  capital, who gets advice, and who gets ignored. That
                  experience didn&apos;t make me comfortable &mdash; it made me
                  angry enough to build something.
                </p>
                <p>
                  I&apos;m a township kid who made it to the boardroom. But
                  &ldquo;making it&rdquo; doesn&apos;t mean the system works.
                  It means I got lucky in a way that millions of equally
                  talented, equally driven South Africans didn&apos;t. Lime
                  Pages is my attempt to make luck less necessary.
                </p>
                <p>
                  I believe that if you give ambitious people the same
                  information, the same tools, and the same access that
                  privilege quietly provides &mdash; they won&apos;t just
                  compete. They&apos;ll lead.
                </p>
              </div>

              {/* Stats */}
              <div className="flex gap-10 flex-wrap mt-10 pt-8 border-t border-[#E4E4E7]">
                <div>
                  <div className="text-[28px] font-extrabold text-[#18181B] leading-none">
                    7+
                  </div>
                  <div className="text-[12px] text-[#A1A1AA] mt-1.5 font-medium">
                    Years in Financial Services
                  </div>
                </div>
                <div>
                  <div className="text-[28px] font-extrabold text-teal leading-none">
                    30
                  </div>
                  <div className="text-[12px] text-[#A1A1AA] mt-1.5 font-medium">
                    Lehumo Founding Members
                  </div>
                </div>
                <div>
                  <div className="text-[28px] font-extrabold text-[#18181B] leading-none">
                    50+
                  </div>
                  <div className="text-[12px] text-[#A1A1AA] mt-1.5 font-medium">
                    Topics in Free Advisor
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════
          CTA — Closing
      ═══════════════════════════════════════════ */}
      <section className="py-20 px-[clamp(1.25rem,4vw,3.5rem)] bg-[#0B1933] relative overflow-hidden">
        <div className="absolute -top-[30%] -right-[5%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(70,205,207,0.1),transparent_70%)] blur-[60px] pointer-events-none" />
        <Container className="relative z-[1] text-center max-w-[620px]">
          <motion.div {...fadeUp}>
            <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold text-white leading-[1.1] tracking-tight mb-5">
              The table has room.
              <br />
              <span className="text-teal">Pull up a chair.</span>
            </h2>
            <p className="text-white/50 text-[15px] leading-[1.8] mb-9">
              Whether you&apos;re investing your first R1,000, scaling a side
              hustle, or raising capital for a startup &mdash; we built this
              for you.
            </p>
            <div className="flex gap-3.5 flex-wrap justify-center">
              <Link
                href="/advisory"
                className="bg-lime text-navy px-8 py-3.5 rounded-full font-bold text-sm hover:opacity-90 hover:-translate-y-0.5 transition-all"
              >
                Get Started &rarr;
              </Link>
              <Link
                href="/connect"
                className="text-white px-8 py-3.5 rounded-full font-semibold text-sm border-2 border-white/20 hover:bg-white/[0.07] hover:border-teal/40 transition-all"
              >
                Let&apos;s Connect
              </Link>
            </div>
          </motion.div>
        </Container>
      </section>
    </>
  );
}
