"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Mail, ArrowRight, Shield, Clock, Users } from "lucide-react";

const ONBOARD_FEATURES = [
  {
    icon: Clock,
    title: "5-Minute Setup",
    desc: "Complete your membership application entirely online — no paperwork.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    desc: "Your data is encrypted. KYC documents are verified separately via WhatsApp or email.",
  },
  {
    icon: Users,
    title: "Join 30 Founding Members",
    desc: "Spots are limited. Be part of the community building generational wealth together.",
  },
];

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
        <h2 className="text-[clamp(2.2rem,5vw,3.8rem)] font-extrabold text-white tracking-tight leading-[1.05] mb-[18px]">
          Your wealth creation journey
          <br />
          starts <span className="text-lime">today.</span>
        </h2>

        <p className="text-base text-white/55 leading-[1.8] mb-10 max-w-[560px] mx-auto">
          Apply online in under 5 minutes. Choose your plan, verify your
          identity, and start investing — all from one seamless digital
          experience.
        </p>

        {/* Onboard CTA */}
        <Link
          href="/lehumo/onboard"
          className="inline-flex items-center gap-2.5 bg-lime text-navy px-10 py-4 rounded-full font-extrabold text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(184,255,0,0.3)] transition-all mb-12"
        >
          Become a Founding Member <ArrowRight className="w-4 h-4" />
        </Link>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {ONBOARD_FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-lime/10 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-lime" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">
                  {feat.title}
                </h3>
                <p className="text-xs text-white/40 leading-relaxed">
                  {feat.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Contact + existing member */}
        <div className="flex gap-4 justify-center flex-wrap">
          <a
            href="mailto:lehumo@limepages.co.za"
            className="bg-white/[0.04] border border-white/[0.08] rounded-[14px] px-6 py-[18px] flex items-center gap-3 hover:border-teal/25 transition-colors"
          >
            <Mail className="w-5 h-5 text-teal flex-shrink-0" />
            <div className="text-left">
              <div className="text-[11px] text-white/32 font-semibold uppercase tracking-[1px] mb-0.5">
                Questions? Email us
              </div>
              <div className="text-sm text-white font-semibold">
                lehumo@limepages.co.za
              </div>
            </div>
          </a>
          <Link
            href="/lehumo/portal/login"
            className="bg-white/[0.04] border border-white/[0.08] rounded-[14px] px-6 py-[18px] flex items-center gap-3 hover:border-lime/25 transition-colors"
          >
            <Shield className="w-5 h-5 text-lime flex-shrink-0" />
            <div className="text-left">
              <div className="text-[11px] text-white/32 font-semibold uppercase tracking-[1px] mb-0.5">
                Already a member?
              </div>
              <div className="text-sm text-lime font-semibold">
                Sign in to your portal
              </div>
            </div>
          </Link>
        </div>

        <p className="mt-12 text-sm text-white/32">
          Founded by{" "}
          <strong className="text-white font-bold">Mpapi Tsomele</strong> ·
          Powered by Lime Pages
        </p>
      </motion.div>
    </section>
  );
}
