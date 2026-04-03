"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { TrendingUp, Users, ShieldCheck, ArrowRight } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const features = [
  { icon: TrendingUp, title: "Growth Capital", desc: "Access funding to scale your business, fulfil purchase orders, and take on bigger projects." },
  { icon: Users, title: "Community-Backed", desc: "Capital powered by the Lehumo community — investment that comes with built-in support and accountability." },
  { icon: ShieldCheck, title: "Regulated Partners", desc: "All capital is managed through FSP-licensed, regulated Black-owned investment managers." },
];

export default function CapitalPage() {
  return (
    <div className="pt-[70px]">
      {/* Hero */}
      <section className="bg-navy py-24 relative overflow-hidden">
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(70,205,207,0.15),transparent_70%)] blur-[70px] pointer-events-none" />
        <div className="absolute bottom-[5%] right-[10%] w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(184,255,0,0.12),transparent_70%)] blur-[70px] pointer-events-none" />

        <Container className="relative z-[1] text-center">
          <motion.div {...fadeUp}>
            <div className="inline-flex items-center gap-2 bg-teal/12 border border-teal/35 rounded-full px-[18px] py-[7px] mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-teal" />
              <span className="text-[11px] font-semibold text-teal tracking-[1.2px] uppercase">Coming Soon</span>
            </div>
            <h1 className="text-[clamp(2.4rem,6vw,4.5rem)] font-extrabold text-white leading-[1.07] tracking-tight mb-6">
              Lime <span className="bg-gradient-to-br from-teal to-lime bg-clip-text text-transparent">Capital</span>
            </h1>
            <p className="text-lg text-white/55 leading-[1.8] max-w-[560px] mx-auto mb-10">
              Capital access for Africa&apos;s entrepreneurs. Growth funding backed by community, managed by regulated partners.
            </p>
            <Link href="/lehumo#join" className="inline-flex items-center gap-2 bg-lime text-navy px-9 py-4 rounded-full font-extrabold text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(184,255,0,0.3)] transition-all">
              Join the Waitlist <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </Container>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * i, ease: "easeOut" as const }}
                className="bg-white rounded-[20px] border border-border shadow-sm p-9 hover:-translate-y-1 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-[14px] bg-teal-light flex items-center justify-center mb-5">
                  <f.icon className="w-6 h-6 text-teal" />
                </div>
                <h3 className="text-lg font-bold text-ink mb-3">{f.title}</h3>
                <p className="text-sm text-muted leading-[1.75]">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}
