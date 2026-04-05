"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Mail, ExternalLink, ArrowRight } from "lucide-react";

export function JoinCta() {
  return (
    <section id="join" className="py-16 bg-navy relative overflow-hidden">
      {/* Glows */}
      <div className="absolute -top-[30%] -left-[10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(184,255,0,0.07),transparent_70%)] blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-[30%] -right-[10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(70,205,207,0.07),transparent_70%)] blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.6, ease: "easeOut" as const }}
        className="relative z-[1] max-w-[900px] mx-auto text-center px-[clamp(1.25rem,4vw,3rem)]"
      >
        {/* Founder photo */}
        <div className="relative aspect-square w-full max-w-[280px] rounded-[20px] overflow-hidden mx-auto">
          <Image src="/images/52982939648_9e27736587_o.jpg" alt="Mpapi Tsomele, Curator of Lehumo" fill className="object-cover" />
        </div>

        <p className="text-xs font-bold text-teal tracking-[1.2px] uppercase mb-2">
          Mpapi Tsomele · Curator of Lehumo
        </p>

        <h2 className="text-[clamp(2.2rem,5vw,3.8rem)] font-extrabold text-white tracking-tight leading-[1.05] mb-[18px]">
          Your future
          <br />
          starts <span className="text-lime">today.</span>
        </h2>

        <p className="text-base text-white/55 leading-[1.8] mb-8 max-w-[600px] mx-auto">
          Spots are limited to 30 Founding Members. Join the waitlist now and be part of the community that builds generational wealth together.
        </p>

        {/* Onboard CTA */}
        <Link
          href="/lehumo/onboard"
          className="inline-flex items-center gap-2.5 bg-lime text-navy px-10 py-4 rounded-full font-extrabold text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(184,255,0,0.3)] transition-all mb-10"
        >
          Become a Founding Member <ArrowRight className="w-4 h-4" />
        </Link>

        {/* Application form badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2.5 bg-lime/10 border border-lime/25 rounded-full px-[18px] py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-lime" />
            <span className="text-[11px] font-bold text-lime tracking-[1.2px] uppercase">
              Application Form · 6 sections · takes ~5 mins
            </span>
          </div>
        </div>

        {/* Google Forms embed */}
        <div className="rounded-[20px] overflow-hidden border border-lime/[0.18] shadow-[0_24px_64px_rgba(0,0,0,0.35)]">
          <iframe
            src="https://docs.google.com/forms/d/e/1FAIpQLScMXzeouQPJZSYctW5qzmylkbBdEYKoEpqeRMFjJGFqdXX65Q/viewform?embedded=true"
            width="100%"
            height="1450"
            frameBorder="0"
            title="Lehumo Membership Onboarding Form"
            className="block bg-white"
          >
            Loading form…
          </iframe>
        </div>

        {/* Contact cards */}
        <div className="flex gap-4 justify-center flex-wrap mt-10">
          <a
            href="mailto:lehumo@limepages.co.za"
            className="bg-white/[0.04] border border-white/[0.08] rounded-[14px] px-6 py-[18px] flex items-center gap-3 hover:border-teal/25 transition-colors"
          >
            <Mail className="w-5 h-5 text-teal flex-shrink-0" />
            <div className="text-left">
              <div className="text-[11px] text-white/32 font-semibold uppercase tracking-[1px] mb-0.5">Questions? Email us</div>
              <div className="text-sm text-white font-semibold">lehumo@limepages.co.za</div>
            </div>
          </a>
          <a
            href="https://forms.gle/57Kes6tx5tio85H16"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/[0.04] border border-white/[0.08] rounded-[14px] px-6 py-[18px] flex items-center gap-3 hover:border-lime/25 transition-colors"
          >
            <ExternalLink className="w-5 h-5 text-lime flex-shrink-0" />
            <div className="text-left">
              <div className="text-[11px] text-white/32 font-semibold uppercase tracking-[1px] mb-0.5">Open form in new tab</div>
              <div className="text-sm text-lime font-semibold">forms.gle/57Kes6tx5tio85H16 ↗</div>
            </div>
          </a>
        </div>

        <p className="mt-12 text-sm text-white/32">
          Founded by <strong className="text-white font-bold">Mpapi Tsomele</strong> · Powered by Lime Pages
        </p>
      </motion.div>
    </section>
  );
}
