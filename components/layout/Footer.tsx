import Link from "next/link";
import { FOOTER_NAV } from "@/lib/constants";
import Logo from "@/components/shared/Logo";

function InstagramIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}


const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/limepages", icon: InstagramIcon },
];

export default function Footer() {
  return (
    <footer className="bg-[#0B0B0B] text-white">
      <div className="max-w-[1200px] mx-auto px-[clamp(1.25rem,4vw,3.5rem)] py-10 md:py-12">
        {/* Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="h-8 mb-5">
              <Logo variant="white" height={32} />
            </div>
            <p className="text-white/50 text-sm leading-relaxed mb-5 max-w-xs">
              Empowering communities through advisory, growth strategy,
              and collective investment solutions across South Africa.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="text-white/30 hover:text-teal transition-colors duration-200"
                >
                  <social.icon />
                </a>
              ))}
            </div>
          </div>

          {/* Navigate */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-4">
              Navigate
            </h4>
            <ul className="space-y-1">
              {FOOTER_NAV.navigate.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/30 hover:text-teal transition-colors duration-200 inline-block py-1.5"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-4">
              Services
            </h4>
            <ul className="space-y-1">
              {FOOTER_NAV.services.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/30 hover:text-teal transition-colors duration-200 inline-block py-1.5"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-4">
              Community
            </h4>
            <ul className="space-y-1">
              {FOOTER_NAV.community.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/30 hover:text-teal transition-colors duration-200 inline-block py-1.5"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-5 border-t border-[#2A2A2A] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/30">
          <span>&copy; 2026 Lime Pages &middot; All rights reserved</span>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="hover:text-teal transition-colors duration-200"
            >
              Privacy Policy
            </Link>
            <span className="text-white/15">&middot;</span>
            <Link
              href="/terms"
              className="hover:text-teal transition-colors duration-200"
            >
              Terms of Service
            </Link>
            <span className="text-white/15">&middot;</span>
            <span>#ThisIsNotFinancialAdvice</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
