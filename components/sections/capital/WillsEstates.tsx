"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import {
  FileText,
  Shield,
  Users,
  Landmark,
  Baby,
  HeartHandshake,
  ArrowRight,
  Check,
  AlertTriangle,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const whyReasons = [
  {
    icon: Users,
    title: "You choose who inherits",
    desc: "Without a Will, your estate is distributed according to the Intestate Succession Act \u2014 which may not reflect your wishes at all.",
  },
  {
    icon: Baby,
    title: "Protect your children",
    desc: "Nominate a legal guardian for your minor children. Without one, the court decides \u2014 and the process can take months.",
  },
  {
    icon: Landmark,
    title: "Appoint your executor",
    desc: "Choose a trusted person or firm to manage your estate. Otherwise, the Master of the High Court appoints one for you.",
  },
  {
    icon: Shield,
    title: "Minimise disputes & delays",
    desc: "A valid Will speeds up the administration process and reduces the chance of costly legal disputes between family members.",
  },
];

const processSteps = [
  {
    num: "01",
    title: "Consultation",
    desc: "A 30-minute session with PSA Law to understand your assets, dependants, and wishes. In-person at their Bryanston offices or virtual.",
    color: "text-teal",
    barColor: "bg-teal",
  },
  {
    num: "02",
    title: "Will Drafting",
    desc: "Your Will is drafted by a qualified attorney \u2014 legally compliant, clear, and tailored to your specific situation.",
    color: "text-capital",
    barColor: "bg-capital",
  },
  {
    num: "03",
    title: "Review & Sign",
    desc: "You review the draft, request changes if needed, then sign in the presence of two competent witnesses (14+ years old).",
    color: "text-teal",
    barColor: "bg-teal",
  },
  {
    num: "04",
    title: "Safekeeping",
    desc: "Your signed Will is stored securely. You receive a copy and can request a free annual update to keep it current.",
    color: "text-capital",
    barColor: "bg-capital",
  },
];

const estatePhases = [
  {
    phase: "Reporting",
    desc: "Death is reported, documents gathered, and the estate is lodged with the Master of the High Court.",
  },
  {
    phase: "Executor Appointed",
    desc: "The nominated executor receives Letters of Executorship and notifies creditors.",
  },
  {
    phase: "Liquidation",
    desc: "Debts are settled, tax returns filed, and a Liquidation & Distribution account is prepared.",
  },
  {
    phase: "Distribution",
    desc: "Assets are transferred and inheritance paid out to beneficiaries as directed by the Will.",
  },
];

export default function WillsEstates() {
  return (
    <>
      {/* ═══ INTRO ═══ */}
      <section className="py-16 sm:py-20 bg-white">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left — Why */}
            <motion.div {...fadeUp}>
              <span className="text-[11px] font-bold tracking-[1.4px] uppercase text-teal block mb-3.5">
                Protect Your Legacy
              </span>
              <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold text-ink leading-[1.1] tracking-tight mb-5">
                Why every adult needs
                <br />
                <span className="text-navy">a valid Will.</span>
              </h2>
              <p className="text-muted text-[16px] leading-[1.8] mb-6">
                A Will is a legally binding document that lets you choose who
                inherits your assets, who looks after your children, and who
                manages your estate when you&apos;re no longer here. Without one,
                the law decides for you.
              </p>

              {/* Warning callout */}
              <div className="bg-[#FFF7ED] border border-[#FDBA74]/40 rounded-[14px] px-5 py-4 flex gap-3.5">
                <AlertTriangle className="w-5 h-5 text-[#EA580C] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-[#9A3412] mb-1">
                    Did you know?
                  </p>
                  <p className="text-sm text-[#9A3412]/70 leading-[1.65]">
                    If you die without a Will in South Africa, your estate is
                    distributed under the Intestate Succession Act &mdash; your
                    partner, children, or family may not receive what you intended.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Right — 4 reasons */}
            <div className="space-y-4">
              {whyReasons.map((r, i) => (
                <motion.div
                  key={r.title}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.45,
                    delay: 0.08 * i,
                    ease: "easeOut" as const,
                  }}
                  className="bg-white rounded-[16px] border border-border shadow-sm p-5 flex gap-4 hover:border-teal/30 hover:-translate-y-0.5 transition-all"
                >
                  <div className="w-10 h-10 rounded-[12px] bg-teal-light flex items-center justify-center shrink-0">
                    <r.icon className="w-5 h-5 text-teal" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-ink mb-1">
                      {r.title}
                    </h4>
                    <p className="text-sm text-muted leading-[1.65]">
                      {r.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ═══ PROCESS STEPS ═══ */}
      <section className="py-16 sm:py-20 bg-snow">
        <Container>
          <motion.div {...fadeUp} className="text-center max-w-[600px] mx-auto mb-14">
            <span className="text-[11px] font-bold tracking-[1.4px] uppercase text-navy block mb-3.5">
              How It Works
            </span>
            <h2 className="text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold text-ink leading-[1.1] tracking-tight mb-4">
              Draft your Will in{" "}
              <span className="text-navy">4 simple steps.</span>
            </h2>
            <p className="text-muted text-base leading-[1.8]">
              Powered by our partnership with Simelane Attorneys Inc (PSA Law)
              &mdash; professional, affordable, and fully compliant with South
              African law.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {processSteps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: 0.1 * i,
                  ease: "easeOut" as const,
                }}
                className="bg-white rounded-[20px] border border-border shadow-sm p-7 relative overflow-hidden hover:border-teal/30 hover:-translate-y-1 hover:shadow-md transition-all"
              >
                <div className={`absolute top-0 left-0 right-0 h-[3px] ${s.barColor}`} />
                <div className={`text-[11px] font-extrabold tracking-[2px] uppercase mb-4 ${s.color}`}>
                  Step {s.num}
                </div>
                <h3 className="text-lg font-bold text-ink mb-2 leading-tight">
                  {s.title}
                </h3>
                <p className="text-sm text-muted leading-[1.7]">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* ═══ PRICING ═══ */}
      <section className="py-16 sm:py-20 bg-white">
        <Container>
          <motion.div {...fadeUp} className="max-w-[820px] mx-auto">
            <div className="bg-white rounded-[24px] border-2 border-teal/25 shadow-md overflow-hidden">
              {/* Header */}
              <div className="bg-navy px-8 py-7 relative overflow-hidden">
                <div className="absolute top-[-30%] right-[-10%] w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(70,205,207,0.15),transparent_70%)] blur-[50px] pointer-events-none" />
                <div className="relative z-[1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Image
                        src="/images/logos/psa-law-white.png"
                        alt="PSA Law"
                        width={80}
                        height={32}
                        className="object-contain"
                      />
                      <div className="h-5 w-px bg-white/20" />
                      <span className="text-[10px] font-bold tracking-[1.2px] uppercase text-teal">
                        Exclusive Package
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold text-white leading-tight">
                      Comprehensive Estate Planning
                    </h3>
                    <p className="text-white/50 text-sm mt-1">
                      Will drafting + estate advisory &mdash; one package, one price
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[clamp(2rem,5vw,2.8rem)] font-extrabold text-teal leading-none">
                      R2,500
                    </span>
                    <p className="text-white/40 text-xs mt-1">once-off &middot; incl. VAT</p>
                  </div>
                </div>
              </div>

              {/* What's included */}
              <div className="px-8 py-7">
                <p className="text-[11px] font-bold tracking-[1.2px] uppercase text-navy mb-5">
                  What&apos;s Included
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5">
                  {[
                    "30-minute estate planning consultation",
                    "Professionally drafted Will by a qualified attorney",
                    "Review of assets, dependants & beneficiaries",
                    "Executor nomination & guidance",
                    "Guardianship provisions for minor children",
                    "Secure Will safekeeping with PSA Law",
                    "One free annual Will update",
                    "Digital copy for your records",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-teal shrink-0 mt-0.5" strokeWidth={3} />
                      <span className="text-sm text-[#3F3F46] leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA footer */}
              <div className="px-8 py-6 bg-snow/80 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-sm text-muted leading-relaxed max-w-[380px]">
                  Available in-person at PSA Law&apos;s Bryanston offices or
                  virtually via video call. Sessions by appointment.
                </p>
                <div className="flex gap-3 shrink-0">
                  <Link
                    href="/advisory"
                    className="inline-flex items-center gap-2 bg-teal text-navy px-7 py-3 rounded-full font-bold text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(70,205,207,0.25)] transition-all whitespace-nowrap"
                  >
                    Book Now <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href="mailto:hello@limepages.co.za?subject=Estate Planning Package — R2,500"
                    className="inline-flex items-center gap-2 border-[1.5px] border-navy text-navy px-7 py-3 rounded-full font-bold text-sm hover:bg-navy hover:text-white transition-colors whitespace-nowrap"
                  >
                    Enquire
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* ═══ ESTATE ADMINISTRATION ═══ */}
      <section className="py-16 sm:py-20 bg-white">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
            {/* Left — Explainer */}
            <motion.div {...fadeUp} className="lg:col-span-2">
              <span className="text-[11px] font-bold tracking-[1.4px] uppercase text-navy block mb-3.5">
                After You&apos;re Gone
              </span>
              <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold text-ink leading-[1.1] tracking-tight mb-5">
                What happens to
                <br />
                <span className="text-navy">your estate?</span>
              </h2>
              <p className="text-muted text-[15px] leading-[1.8] mb-6">
                Estate administration is the legal process of winding up your
                affairs after death. A valid Will with a nominated executor makes
                this process significantly faster, cheaper, and less stressful for
                your loved ones.
              </p>
              <div className="bg-teal-light border border-teal/15 rounded-[14px] px-5 py-4">
                <div className="flex items-center gap-3 mb-2">
                  <Image
                    src="/images/logos/psa-law.png"
                    alt="PSA Law — Simelane Attorneys Inc"
                    width={80}
                    height={32}
                    className="object-contain"
                  />
                </div>
                <p className="text-sm text-muted leading-[1.65]">
                  Professional estate administration handled end-to-end &mdash;
                  from reporting to final distribution. Your family won&apos;t
                  have to navigate the legal process alone.
                </p>
              </div>
            </motion.div>

            {/* Right — 4 phases */}
            <div className="lg:col-span-3">
              <div className="space-y-3">
                {estatePhases.map((p, i) => (
                  <motion.div
                    key={p.phase}
                    initial={{ opacity: 0, x: 16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.45,
                      delay: 0.1 * i,
                      ease: "easeOut" as const,
                    }}
                    className="flex gap-4 items-start"
                  >
                    {/* Timeline dot & line */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-extrabold ${
                        i === estatePhases.length - 1
                          ? "bg-capital text-navy"
                          : "bg-navy text-white"
                      }`}>
                        {i + 1}
                      </div>
                      {i < estatePhases.length - 1 && (
                        <div className="w-px h-8 bg-border" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="bg-white rounded-[14px] border border-border shadow-sm p-5 flex-1">
                      <h4 className="text-[15px] font-bold text-ink mb-1">
                        {p.phase}
                      </h4>
                      <p className="text-sm text-muted leading-[1.65]">
                        {p.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ═══ PARTNERSHIP BANNER ═══ */}
      <section className="py-12 bg-snow">
        <Container>
          <motion.div
            {...fadeUp}
            className="bg-navy rounded-[20px] p-8 sm:p-10 relative overflow-hidden"
          >
            <div className="absolute top-[-20%] right-[-10%] w-[350px] h-[350px] rounded-full bg-[radial-gradient(circle,rgba(70,205,207,0.15),transparent_70%)] blur-[60px] pointer-events-none" />

            <div className="relative z-[1] flex flex-col md:flex-row items-start md:items-center gap-8">
              {/* Left */}
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-5">
                  <Image
                    src="/images/logos/psa-law-white.png"
                    alt="PSA Law — Simelane Attorneys Inc"
                    width={120}
                    height={48}
                    className="object-contain"
                  />
                  <div className="h-8 w-px bg-white/15" />
                  <div>
                    <span className="text-[10px] font-bold tracking-[1.2px] uppercase text-teal block">
                      Legal Partner
                    </span>
                    <h3 className="text-base font-extrabold text-white leading-tight">
                      Simelane Attorneys Inc
                    </h3>
                  </div>
                </div>
                <p className="text-white/55 text-sm leading-[1.75] mb-5 max-w-[480px]">
                  A 100% black-owned boutique law firm based in Bryanston, Sandton.
                  We&apos;ve partnered with PSA Law to offer professional Will
                  drafting and estate planning services &mdash; qualified, experienced,
                  and committed to making this process accessible for every South African.
                </p>
                <ul className="space-y-2">
                  {[
                    "Professionally drafted Wills",
                    "Secure document safekeeping",
                    "Full estate administration",
                    "Annual Will review & updates",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <Check className="w-3.5 h-3.5 text-teal shrink-0" strokeWidth={3} />
                      <span className="text-sm text-white/70">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right CTA */}
              <div className="flex flex-col gap-3 shrink-0">
                <Link
                  href="/advisory"
                  className="inline-flex items-center justify-center gap-2 bg-teal text-navy px-8 py-3.5 rounded-full font-bold text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(70,205,207,0.3)] transition-all whitespace-nowrap"
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="mailto:hello@limepages.co.za?subject=Wills %26 Estate Planning Enquiry"
                  className="inline-flex items-center justify-center gap-2 text-white px-8 py-3.5 rounded-full font-semibold text-sm border border-white/20 hover:bg-white/[0.07] hover:border-teal/40 transition-all whitespace-nowrap"
                >
                  Enquire via Email
                </a>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>
    </>
  );
}
