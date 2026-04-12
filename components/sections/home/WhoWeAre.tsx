"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";

const fadeUp = {
  initial: { opacity: 0, y: 24 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, amount: 0.2 } as const,
  transition: { duration: 0.6, ease: "easeOut" as const } as const,
};

export function WhoWeAre() {
  return (
    <section className="py-16 sm:py-[100px] px-[clamp(1.25rem,4vw,3.5rem)] bg-snow relative overflow-hidden">
      <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(70,205,207,0.1),transparent_70%)] blur-[60px] pointer-events-none" />

      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-[72px] items-center relative z-[1]">
          {/* Photo */}
          <motion.div
            {...fadeUp}
            className="relative aspect-[4/3] sm:aspect-[4/5] rounded-[20px] overflow-hidden"
          >
            <Image
              src="/images/IMG_8486.jpg"
              alt="Mpapi Tsomele"
              fill
              className="object-cover"
            />
          </motion.div>

          {/* Text */}
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.15 }}
          >
            <p className="text-[18px] font-bold tracking-[1.5px] uppercase text-teal mb-3.5">
              The Founder
            </p>
            <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-extrabold text-dark leading-[1.1] tracking-tight mb-7">
              Mpapi <span className="text-navy">Tsomele</span>
            </h2>

            <div className="space-y-5 text-[15.5px] text-muted leading-[1.85] mb-10">
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

            {/* CTA */}
            <div className="flex gap-3.5 flex-wrap pt-8 border-t border-[#E4E4E7]">
              <Link
                href="/advisory"
                className="bg-lime text-navy px-8 py-3.5 rounded-full font-bold text-sm hover:opacity-90 hover:-translate-y-0.5 transition-all"
              >
                Get Started &rarr;
              </Link>
              <Link
                href="/connect"
                className="text-navy px-8 py-3.5 rounded-full font-semibold text-sm border-2 border-navy/15 hover:bg-navy/[0.04] hover:border-navy/30 transition-all"
              >
                Let&apos;s Connect
              </Link>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
