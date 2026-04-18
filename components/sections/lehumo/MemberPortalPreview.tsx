"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import {
  LayoutDashboard,
  CalendarCheck,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  Lock,
  User,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, amount: 0.15 } as const,
  transition: { duration: 0.6, ease: "easeOut" as const } as const,
};

const portalFeatures = [
  {
    icon: LayoutDashboard,
    title: "Personal Dashboard",
    desc: "See your membership status, profile details, and community updates at a glance.",
    color: "text-lime",
    bg: "bg-lime/10",
    border: "border-lime/15",
  },
  {
    icon: CalendarCheck,
    title: "Contribution Tracker",
    desc: "Visual 12-month calendar showing every payment. Always know where you stand.",
    color: "text-teal",
    bg: "bg-teal/10",
    border: "border-teal/20",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    desc: "Pay your monthly R1,000 contribution via Paystack. One click, instant confirmation.",
    color: "text-lime",
    bg: "bg-lime/10",
    border: "border-lime/15",
  },
  {
    icon: ShieldCheck,
    title: "KYC Status",
    desc: "Track your verification progress from submission through to completion.",
    color: "text-teal",
    bg: "bg-teal/10",
    border: "border-teal/20",
  },
];

/* Mini dashboard mockup data */
const mockMonths = [
  { month: "Jan", paid: true },
  { month: "Feb", paid: true },
  { month: "Mar", paid: true },
  { month: "Apr", paid: true },
  { month: "May", paid: false },
  { month: "Jun", paid: false },
  { month: "Jul", paid: false },
  { month: "Aug", paid: false },
  { month: "Sep", paid: false },
  { month: "Oct", paid: false },
  { month: "Nov", paid: false },
  { month: "Dec", paid: false },
];

export function MemberPortalPreview() {
  return (
    <section className="py-20 md:py-28 bg-navy relative overflow-hidden">
      {/* Glow orbs */}
      <div className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(70,205,207,0.08),transparent_70%)] blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-[20%] -left-[10%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(184,255,0,0.06),transparent_70%)] blur-[80px] pointer-events-none" />

      <Container className="relative z-[1]">
        {/* Header */}
        <motion.div {...fadeUp} className="text-center max-w-[680px] mx-auto mb-14">
          <div className="inline-flex items-center gap-2.5 bg-teal/10 border border-teal/25 rounded-full px-[18px] py-1.5 mb-5">
            <Lock className="w-3.5 h-3.5 text-teal" />
            <span className="text-[11px] font-bold text-teal tracking-[1.2px] uppercase">
              Member Portal
            </span>
          </div>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white leading-[1.08] tracking-tight mb-4">
            Manage &amp; keep track of{" "}
            <span className="text-teal">your contributions</span>
          </h2>
          <p className="text-base text-white/50 leading-[1.8] max-w-[560px] mx-auto">
            Every Lehumo member gets a secure personal portal to track
            contributions, make payments, and monitor their journey to
            generational wealth.
          </p>
        </motion.div>

        {/* Two-column: Features + Dashboard Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start mb-14">
          {/* Left: Feature cards */}
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {portalFeatures.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.08 * i, ease: "easeOut" as const }}
                  className={`bg-white/[0.03] border ${feature.border} rounded-[16px] p-5 hover:bg-white/[0.05] transition-colors`}
                >
                  <div className={`w-10 h-10 rounded-xl ${feature.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <h3 className="text-[15px] font-bold text-white mb-1.5">
                    {feature.title}
                  </h3>
                  <p className="text-[13px] text-white/45 leading-[1.6]">
                    {feature.desc}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Right: Dashboard mockup */}
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.2 }}
            className="bg-[#0F2040] rounded-[20px] border border-white/[0.08] overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.3)]"
          >
            {/* Mock header bar */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-[#0F2040]/80">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-lime/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-lime">L</span>
                </div>
                <span className="text-sm font-bold text-white">Lehumo</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/40">
                <User className="w-3.5 h-3.5" />
                <span>Member Leh07</span>
              </div>
            </div>

            {/* Mock dashboard content */}
            <div className="p-5 space-y-5">
              {/* Welcome */}
              <div>
                <h3 className="text-lg font-bold text-white mb-0.5">
                  Welcome back, Thabo
                </h3>
                <div className="inline-flex items-center bg-lime/10 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-lime">
                  Active Member
                </div>
              </div>

              {/* Contribution grid mockup */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-[14px] p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-white/40 uppercase tracking-wider">
                    Contributions 2026
                  </span>
                  <span className="text-xs font-semibold text-teal">
                    4/12 paid
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {mockMonths.map((m) => (
                    <div key={m.month} className="text-center">
                      <div
                        className={`w-full aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold mb-1 ${
                          m.paid
                            ? "bg-lime/20 text-lime"
                            : "bg-white/[0.04] text-white/20"
                        }`}
                      >
                        {m.paid ? (
                          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3.5 8.5 L6.5 11.5 L12.5 4.5" />
                          </svg>
                        ) : (
                          ""
                        )}
                      </div>
                      <span className={`text-[9px] font-medium ${m.paid ? "text-white/50" : "text-white/20"}`}>
                        {m.month}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment + KYC row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Payment card mock */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-[14px] p-4">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider block mb-2">
                    Next Payment
                  </span>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-xl font-extrabold text-white">R1,000</span>
                    <span className="text-[11px] text-white/30">/mo</span>
                  </div>
                  <span className="text-[11px] text-teal font-medium">Due: May</span>
                  <div className="mt-3">
                    <div className="w-full h-8 bg-lime/20 rounded-full flex items-center justify-center">
                      <span className="text-[10px] font-bold text-lime">
                        Pay Now
                      </span>
                    </div>
                  </div>
                </div>

                {/* KYC mock */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-[14px] p-4">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider block mb-2">
                    KYC Status
                  </span>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-lime/20 flex items-center justify-center">
                      <ShieldCheck className="w-3 h-3 text-lime" />
                    </div>
                    <span className="text-sm font-bold text-lime">Complete</span>
                  </div>
                  <div className="flex gap-1.5 mt-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className="flex-1 h-1.5 rounded-full bg-lime/40"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Blur overlay with CTA */}
            <div className="relative px-5 py-5 bg-gradient-to-t from-[#0B1933] via-[#0B1933]/95 to-transparent -mt-4 pt-10">
              <div className="text-center">
                <p className="text-xs text-white/40 mb-3">
                  Sign in to access your personal dashboard
                </p>
                <Link
                  href="/lehumo/portal/login"
                  className="inline-flex items-center gap-2 bg-lime text-navy px-7 py-3 rounded-full font-bold text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(184,255,0,0.3)] transition-all"
                >
                  Member Sign In <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom: Not a member yet? */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.15 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-[16px] px-6 py-4">
            <div className="w-9 h-9 rounded-xl bg-lime/10 flex items-center justify-center shrink-0">
              <User className="w-4.5 h-4.5 text-lime" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">
                Not a member yet?
              </p>
              <p className="text-xs text-white/40">
                Apply to become a Founding Member and get instant portal access.
              </p>
            </div>
            <Link
              href="/lehumo/onboard"
              className="ml-3 bg-white/[0.06] border border-white/[0.1] text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-white/[0.1] transition-colors whitespace-nowrap"
            >
              Apply Now
            </Link>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
