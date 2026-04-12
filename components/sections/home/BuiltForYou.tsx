"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ArrowRight } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

export default function BuiltForYou() {
  return (
    <section className="py-24 bg-snow">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left — photo placeholder */}
          <motion.div {...fadeUp} className="relative">
            <div className="relative aspect-[4/5] rounded-[20px] overflow-hidden">
              <Image
                src="/images/fotografia-editorial-prl9DeDCKrM-unsplash.jpg"
                alt="Young professional ready to build"
                fill
                className="object-cover"
              />
            </div>
          </motion.div>

          {/* Right — copy */}
          <div>
            <motion.p
              {...fadeUp}
              className="text-[18px] font-bold tracking-[1.5px] uppercase text-teal mb-4"
            >
              Built for You
            </motion.p>

            <motion.h2
              {...fadeUp}
              transition={{ duration: 0.6, ease: "easeOut" as const, delay: 0.1 }}
              className="text-[clamp(1.8rem,4vw,3rem)] font-extrabold leading-[1.1] tracking-tight text-navy mb-6"
            >
              The system wasn&apos;t built for us. So we built our own.
            </motion.h2>

            <motion.p
              {...fadeUp}
              transition={{ duration: 0.6, ease: "easeOut" as const, delay: 0.2 }}
              className="text-muted leading-relaxed mb-4"
            >
              Whether you&apos;re a young professional trying to make your salary work harder,
              a content creator figuring out what to do with campaign money, or a founder
              scaling a side hustle into a real business — the traditional financial industry
              wasn&apos;t designed with you in mind.
            </motion.p>

            <motion.p
              {...fadeUp}
              transition={{ duration: 0.6, ease: "easeOut" as const, delay: 0.25 }}
              className="text-muted leading-relaxed mb-8"
            >
              Lime Pages is. Honest advice, practical tools, and a community that builds
              wealth together.
            </motion.p>

            <motion.div
              {...fadeUp}
              transition={{ duration: 0.6, ease: "easeOut" as const, delay: 0.3 }}
            >
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-full bg-navy px-8 py-3.5 text-sm font-bold text-white transition-transform hover:scale-[1.03] active:scale-[0.98]"
              >
                Behind the Pages
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
}
