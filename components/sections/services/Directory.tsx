"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import {
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Scale,
  Briefcase,
  Building2,
  Shield,
  MessageCircle,
  Star,
  LineChart,
  Info,
} from "lucide-react";

/* ─── Profile type ─── */
interface DirectoryProfile {
  id: string;
  name: string;
  initials: string;
  tagline: string;
  description: string;
  category: string;
  location: string;
  badges: string[];
  services: string[];
  contact: {
    phone?: string;
    whatsapp?: string;
    email?: string;
    website?: string;
  };
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  /** Optional headline rate, e.g. "R2,000 / hour" — rendered as a
   *  pill in the card header. Omit for quote-based services. */
  price?: string;
  /** Optional small caption under the price pill — what the rate
   *  covers, or VAT status. Rendered only when `price` is set. */
  priceNote?: string;
  /** Optional compliance note rendered as a footnote at the bottom of
   *  the card (e.g. a "not financial advice" FAIS disclaimer). Omit
   *  for services that don't need one. */
  disclaimer?: string;
  featured?: boolean;
}

/* ─── Active Lime Services ─── */
const profiles: DirectoryProfile[] = [
  {
    id: "simelane-attorneys",
    name: "Simelane Attorneys Inc",
    initials: "PSA",
    tagline: "Wills, estates & tailored legal solutions",
    description:
      "A 100% Black-owned boutique law firm based in Bryanston, Sandton. Our go-to partner for wills & estate planning — plus wide-ranging legal services with the experience to handle complex matters across multiple disciplines.",
    category: "Wills & Estate Services",
    location: "Bryanston, Sandton",
    badges: ["100% Black-Owned", "BBBEE Certified", "Boutique Firm"],
    services: [
      "Trusts, Wills & Estates",
      "Conveyancing & Property Law",
      "Commercial & Corporate Law",
      "Dispute Resolution & Litigation",
      "Employment & Labour Law",
      "Family Law",
      "Administrative & Public Law",
      "Notarial Services",
    ],
    contact: {
      phone: "010 900 5387",
      whatsapp: "074 260 9136",
      email: "info@psa-law.co.za",
      website: "https://psa-law.co.za",
    },
    accentColor: "text-teal",
    accentBg: "bg-teal/10",
    accentBorder: "border-teal/25",
    price: "R2,500",
    priceNote: "Wills & estate · incl. consultation & drafting",
    featured: true,
  },
  {
    // Active service. Enquiries route to the Lehumo inbox by design;
    // fuller service details may be added as the offering matures.
    id: "alternative-investment-advisory",
    name: "Financial & Investment Strategy Advisory",
    initials: "FS",
    tagline: "Strategy and structure for smarter money decisions",
    description:
      "Independent, fee-based guidance on financial and investment strategy — goal-based planning, portfolio structure, and access to alternative assets like angel syndicates and private deals normally reserved for institutions. Sessions focus on frameworks, structure, and options so you can make informed decisions. Full service details coming soon.",
    category: "Financial Strategy",
    location: "South Africa",
    badges: ["Independent", "Strategy-Led", "Fee-Based"],
    services: [
      "Goal-based financial planning",
      "Investment strategy & structure",
      "Portfolio construction review",
      "Alternative asset access",
      "Investment readiness",
    ],
    contact: {
      // Routed to the Lehumo inbox (intentional — see note above).
      email: "lehumo@limepages.co.za",
    },
    accentColor: "text-capital",
    accentBg: "bg-capital/10",
    accentBorder: "border-capital/25",
    price: "R2,000 / hour",
    priceNote: "Advisory rate · excl. VAT",
    disclaimer:
      "Not financial advice. This is a general financial and investment strategy advisory service — not regulated financial advice under the FAIS Act, and not a recommendation to buy, sell, or hold any financial product. Consult a licensed financial services provider (FSP) before making investment decisions.",
    featured: true,
  },
];

/* ─── Category icons ─── */
const categoryIcon: Record<string, React.ElementType> = {
  "Legal Services": Scale,
  "Wills & Estate Services": Scale,
  "Investment Advisory": Building2,
  "Financial Strategy": LineChart,
  Business: Briefcase,
  Finance: Building2,
};

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

export function Directory() {
  return (
    <section className="py-24 bg-white">
      <Container>
        {/* Header */}
        <motion.div {...fadeUp} className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-teal-light border border-teal/20 rounded-full px-[18px] py-[7px] mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
            <span className="text-[11px] font-bold text-teal tracking-[1.2px] uppercase">
              Now Live
            </span>
          </div>
          <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold text-ink leading-[1.1] tracking-tight mb-3">
            Vetted services for the community
          </h2>
          <p className="text-base text-muted leading-[1.8] max-w-[540px] mx-auto">
            Trusted partners offering services to Lime Pages members — from
            wills &amp; estate planning to financial &amp; investment strategy
            advisory.
          </p>
        </motion.div>

        {/* Profiles */}
        <div className="max-w-[840px] mx-auto space-y-6">
          {profiles.map((profile, i) => {
            const CatIcon = categoryIcon[profile.category] || Briefcase;

            return (
              <motion.div
                key={profile.id}
                id={profile.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.1 * i, ease: "easeOut" }}
                className={`scroll-mt-28 rounded-[22px] border overflow-hidden bg-white shadow-[0_2px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.1)] transition-shadow ${
                  profile.featured ? "border-teal/30" : "border-border"
                }`}
              >
                {/* Featured banner */}
                {profile.featured && (
                  <div className="bg-gradient-to-r from-teal/10 via-teal/5 to-transparent px-7 py-2.5 border-b border-teal/15 flex items-center gap-2">
                    <Star className="w-3.5 h-3.5 text-teal fill-teal" />
                    <span className="text-[11px] font-bold text-teal tracking-[1px] uppercase">
                      Featured Community Member
                    </span>
                  </div>
                )}

                <div className="p-7 sm:p-8">
                  {/* Top: Avatar + Name + Meta */}
                  <div className="flex items-start gap-5 mb-6">
                    {/* Initials avatar */}
                    <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl bg-gradient-to-br from-navy to-navy/80 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">
                        {profile.initials}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-extrabold text-ink leading-tight mb-1">
                        {profile.name}
                      </h3>
                      <p className="text-sm text-muted italic mb-2.5">
                        {profile.tagline}
                      </p>

                      {/* Category + Location */}
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <CatIcon className="w-3.5 h-3.5 text-teal" />
                          <span className="text-xs font-semibold text-teal">
                            {profile.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-muted" />
                          <span className="text-xs text-muted">
                            {profile.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Headline rate — quote-based services omit this. */}
                    {profile.price && (
                      <div className="shrink-0 text-right max-w-[140px]">
                        <span className="inline-flex items-center rounded-full bg-teal/10 border border-teal/25 px-3.5 py-1.5 text-[13px] font-extrabold text-teal whitespace-nowrap">
                          {profile.price}
                        </span>
                        {profile.priceNote && (
                          <p className="text-[10.5px] text-muted mt-1.5 leading-snug">
                            {profile.priceNote}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {profile.badges.map((badge) => (
                      <span
                        key={badge}
                        className="inline-flex items-center gap-1.5 bg-navy/[0.04] border border-navy/10 rounded-full px-3 py-1"
                      >
                        <Shield className="w-3 h-3 text-navy/50" />
                        <span className="text-[11px] font-semibold text-navy/70">
                          {badge}
                        </span>
                      </span>
                    ))}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted leading-[1.8] mb-6">
                    {profile.description}
                  </p>

                  {/* Services grid */}
                  <div className="mb-6">
                    <p className="text-[11px] font-bold text-ink/50 uppercase tracking-[1.2px] mb-3">
                      Practice Areas
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {profile.services.map((service) => (
                        <span
                          key={service}
                          className="bg-teal-light text-teal text-xs font-medium rounded-lg px-3 py-1.5"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Contact row */}
                  <div className="flex flex-wrap gap-2.5 pt-5 border-t border-border">
                    {profile.contact.website && (
                      <a
                        href={profile.contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-teal text-white text-xs font-bold rounded-full px-4 py-2.5 hover:-translate-y-0.5 hover:shadow-md transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Visit Website
                      </a>
                    )}
                    {profile.contact.email && (
                      <a
                        href={`mailto:${profile.contact.email}`}
                        className="inline-flex items-center gap-2 border border-border text-ink text-xs font-semibold rounded-full px-4 py-2.5 hover:border-teal/30 hover:bg-teal-light transition-all"
                      >
                        <Mail className="w-3.5 h-3.5 text-muted" />
                        {profile.contact.email}
                      </a>
                    )}
                    {profile.contact.phone && (
                      <a
                        href={`tel:${profile.contact.phone.replace(/\s/g, "")}`}
                        className="inline-flex items-center gap-2 border border-border text-ink text-xs font-semibold rounded-full px-4 py-2.5 hover:border-teal/30 hover:bg-teal-light transition-all"
                      >
                        <Phone className="w-3.5 h-3.5 text-muted" />
                        {profile.contact.phone}
                      </a>
                    )}
                    {profile.contact.whatsapp && (
                      <a
                        href={`https://wa.me/27${profile.contact.whatsapp.replace(/\s/g, "").replace(/^0/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 border border-border text-ink text-xs font-semibold rounded-full px-4 py-2.5 hover:border-green-500/30 hover:bg-green-50 transition-all"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                        WhatsApp
                      </a>
                    )}
                  </div>

                  {/* Compliance footnote (e.g. FAIS "not advice") */}
                  {profile.disclaimer && (
                    <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-snow border border-border px-4 py-3">
                      <Info className="w-4 h-4 text-muted/70 mt-px shrink-0" />
                      <p className="text-[11.5px] leading-relaxed text-muted">
                        {profile.disclaimer}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* More coming */}
        <motion.div {...fadeUp} className="text-center mt-14">
          <div className="inline-flex flex-col items-center gap-3 bg-snow rounded-2xl border border-border px-10 py-8">
            <div className="flex -space-x-2">
              {["bg-teal", "bg-lime", "bg-navy", "bg-pink"].map((bg, i) => (
                <div
                  key={i}
                  className={`w-9 h-9 rounded-full ${bg} border-2 border-white flex items-center justify-center`}
                >
                  <span className="text-white text-[10px] font-bold">
                    {["?", "?", "?", "?"][i]}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-sm font-semibold text-ink">
              More profiles coming soon
            </p>
            <p className="text-xs text-muted max-w-[320px] leading-relaxed">
              VIP members can list their businesses and services here.
              Join Lehumo to get your profile on Lime Services.
            </p>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
