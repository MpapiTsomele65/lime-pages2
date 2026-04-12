"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import Link from "next/link";
import { Shield, ArrowRight } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

export default function LehumoTeaser() {
  return (
    <section className="py-16 bg-snow">
      <Container>
        <motion.div
          {...fadeUp}
          className="relative bg-navy rounded-[20px] p-8 md:p-12 overflow-hidden"
        >
          {/* Glow */}
          <div className="absolute top-[-30%] right-[-10%] w-[350px] h-[350px] rounded-full bg-[radial-gradient(circle,rgba(70,205,207,0.15),transparent_70%)] blur-[60px] pointer-events-none" />

          <div className="relative z-[1] flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10">
            <div className="w-14 h-14 rounded-2xl bg-teal/15 border border-teal/25 flex items-center justify-center shrink-0">
              <Shield className="w-7 h-7 text-teal" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <p className="text-xs font-bold tracking-[1.5px] uppercase text-teal">
                  Prefer Lower Risk?
                </p>
                <div className="inline-flex items-center gap-1.5 bg-teal/10 border border-teal/20 rounded-full px-3 py-[4px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal" />
                  <span className="text-[10px] font-bold text-teal tracking-wide uppercase">
                    Lower Risk
                  </span>
                </div>
              </div>
              <h3 className="text-xl md:text-2xl font-extrabold text-white leading-tight mb-2">
                Explore the Lehumo Community Trust
              </h3>
              <p className="text-sm text-white/45 leading-relaxed max-w-[520px]">
                Not ready for angel investing? Lehumo pools community capital
                into regulated, diversified investment vehicles — from as little
                as your monthly contribution. No minimum check size needed.
              </p>
            </div>
            <Link
              href="/lehumo"
              className="inline-flex items-center gap-2 bg-teal text-navy px-7 py-3.5 rounded-full font-bold text-sm hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(70,205,207,0.3)] transition-all shrink-0"
            >
              Learn More
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
