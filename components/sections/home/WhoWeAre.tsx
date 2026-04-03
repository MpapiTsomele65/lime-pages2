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
    <section className="py-[100px] px-[clamp(1.25rem,4vw,3.5rem)] bg-snow relative overflow-hidden">
      <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(70,205,207,0.1),transparent_70%)] blur-[60px] pointer-events-none" />

      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[72px] items-center relative z-[1]">
          {/* Photo slot */}
          <motion.div
            {...fadeUp}
            className="relative aspect-[4/5] rounded-[20px] overflow-hidden"
          >
            <Image
              src="/images/IMG_8486.jpg"
              alt="Mpapi Tsomele speaking at a conference"
              fill
              className="object-cover"
            />
            <div className="absolute bottom-6 left-6 right-6 bg-white/85 border border-teal/30 rounded-xl px-4 py-3 backdrop-blur-xl z-10">
              <small className="text-[11px] text-[#0a7a7b] block font-bold tracking-[1px] uppercase mb-0.5">
                The People We Serve
              </small>
              <span className="text-[15px] text-dark font-semibold">
                South African builders & entrepreneurs
              </span>
            </div>
          </motion.div>

          {/* Text */}
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }}>
            <p className="text-xs font-bold tracking-[1.5px] uppercase text-navy mb-3.5">
              Who We Are
            </p>
            <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-extrabold text-dark leading-[1.1] tracking-tight mb-7">
              Behind the <span className="text-navy">pages</span>
            </h2>
            <p className="text-base text-muted leading-[1.85] mb-[18px]">
              Lime Pages exists because the system, as it stands, was not designed
              to serve most South Africans. 7 years in financial services at a
              senior level showed me that gap up close — the knowledge, the access,
              the networks exist. They&apos;re just not being shared in the right
              direction.
            </p>
            <p className="text-base text-subtle leading-[1.85] mb-11">
              I built Lime Pages to change that. Not another product. Not another
              app. A practice — built around the people the industry quietly assumed
              weren&apos;t worth the effort.
            </p>

            <div className="flex gap-9 flex-wrap mb-10">
              <div>
                <div className="text-[34px] font-extrabold text-navy leading-none">
                  7+
                </div>
                <div className="text-[13px] text-muted mt-1.5 max-w-[120px]">
                  Years in Financial Services
                </div>
              </div>
              <div>
                <div className="text-[34px] font-extrabold text-lime bg-navy px-3 py-1 rounded-lg leading-none">
                  30
                </div>
                <div className="text-[13px] text-muted mt-1.5 max-w-[120px]">
                  Lehumo Members Target
                </div>
              </div>
              <div>
                <div className="text-[34px] font-extrabold text-navy leading-none">
                  24h
                </div>
                <div className="text-[13px] text-muted mt-1.5 max-w-[120px]">
                  Refund Guarantee
                </div>
              </div>
            </div>

            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-navy font-semibold text-[15px] hover:text-teal hover:gap-3.5 transition-all"
            >
              Learn more about us →
            </Link>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
