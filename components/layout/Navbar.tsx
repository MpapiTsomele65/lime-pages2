"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { NAV_LINKS, NAV_MORE_LINKS } from "@/lib/constants";
import { ChevronDown } from "lucide-react";
import Logo from "@/components/shared/Logo";

/*
 * Unpinned nav styles per page group:
 *  "white" → Home: white text + white logo (on dark hero)
 *  "teal"  → Lehumo: teal text + teal logo (on dark hero)
 *  "dark"  → Everything else: dark text + colored logo
 */
type NavTheme = "white" | "teal" | "dark";

function getNavTheme(pathname: string): NavTheme {
  if (pathname === "/") return "white";
  if (pathname === "/lehumo" || pathname.startsWith("/lehumo/")) return "teal";
  return "dark";
}

/* Check if current route matches any "More" dropdown link */
function isMoreActive(pathname: string): boolean {
  return NAV_MORE_LINKS.some((l) => pathname === l.href);
}

export default function Navbar() {
  const pathname = usePathname();
  const [pinned, setPinned] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  const theme = getNavTheme(pathname);

  const handleScroll = useCallback(() => {
    setPinned(window.scrollY > 50);
  }, []);

  useEffect(() => {
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  // Close drawer + dropdown on route change
  useEffect(() => {
    setDrawerOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  /* --- "More" dropdown hover handlers with delay --- */
  const openMore = () => {
    if (moreTimeout.current) clearTimeout(moreTimeout.current);
    setMoreOpen(true);
  };
  const closeMore = () => {
    moreTimeout.current = setTimeout(() => setMoreOpen(false), 200);
  };

  /* --- Unpinned colour helpers --- */
  const logoVariant = pinned ? "color" : theme === "white" ? "white" : theme === "teal" ? "teal" : "color";

  const underlineColor = pinned
    ? "#0B1933"
    : theme === "white"
      ? "#ffffff"
      : theme === "teal"
        ? "#46CDCF"
        : "#0B1933";

  const linkClass = (isActive: boolean) => {
    if (pinned) {
      return isActive ? "text-navy font-bold" : "text-muted hover:text-ink";
    }
    switch (theme) {
      case "white":
        return isActive
          ? "text-white font-bold"
          : "text-white/75 hover:text-white";
      case "teal":
        return isActive
          ? "text-teal font-bold"
          : "text-teal/70 hover:text-teal";
      case "dark":
      default:
        return isActive
          ? "text-navy font-bold"
          : "text-muted hover:text-ink";
    }
  };

  const ctaClass = pinned
    ? "bg-teal text-white hover:bg-teal/90"
    : theme === "white"
      ? "bg-white/15 text-white hover:bg-white/25"
      : theme === "teal"
        ? "border-2 border-teal text-teal hover:bg-teal hover:text-white"
        : "bg-teal text-white hover:bg-teal/90";

  const hamburgerColor =
    pinned
      ? "#0B0B0B"
      : theme === "white"
        ? "#fff"
        : theme === "teal"
          ? "#46cdcf"
          : "#0B0B0B";

  const moreActive = isMoreActive(pathname);
  const isLehumo = pathname === "/lehumo" || pathname.startsWith("/lehumo/");

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 h-[70px] transition-all duration-300 ${
          pinned
            ? "bg-white/90 backdrop-blur-md border-b border-border shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-[clamp(1.25rem,4vw,3.5rem)] h-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" aria-label="Home">
            <Logo variant={logoVariant} />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden min-[900px]:flex items-center gap-5 lg:gap-7">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative text-sm font-semibold transition-colors duration-200 py-1 ${linkClass(isActive)}`}
                >
                  {link.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute left-0 right-0 -bottom-1 h-[2px] rounded-full"
                      style={{ backgroundColor: underlineColor }}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}

            {/* More dropdown */}
            <div
              ref={moreRef}
              className="relative"
              onMouseEnter={openMore}
              onMouseLeave={closeMore}
            >
              <button
                onClick={() => setMoreOpen((v) => !v)}
                className={`relative flex items-center gap-1 text-sm font-semibold transition-colors duration-200 py-1 ${linkClass(moreActive)}`}
              >
                More
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    moreOpen ? "rotate-180" : ""
                  }`}
                />
                {moreActive && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute left-0 right-0 -bottom-1 h-[2px] rounded-full"
                    style={{ backgroundColor: underlineColor }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>

              <AnimatePresence>
                {moreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute right-0 top-full mt-3 w-[260px] bg-white rounded-2xl border border-border shadow-[0_8px_30px_rgba(0,0,0,0.1)] overflow-hidden"
                  >
                    <div className="py-2">
                      {NAV_MORE_LINKS.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            className={`flex flex-col gap-0.5 px-5 py-3.5 transition-colors duration-150 ${
                              isActive
                                ? "bg-snow"
                                : "hover:bg-snow"
                            }`}
                          >
                            <span
                              className={`text-sm font-bold ${
                                isActive ? "text-navy" : "text-ink"
                              }`}
                            >
                              {link.label}
                            </span>
                            <span className="text-xs text-muted leading-snug">
                              {link.desc}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* CTA buttons — context-aware */}
            {isLehumo ? (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/lehumo#waitlist"
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
                    pinned
                      ? "text-navy border border-navy/20 hover:bg-navy/5"
                      : "text-teal/80 border border-teal/30 hover:bg-teal/10 hover:text-teal"
                  }`}
                >
                  Join Waitlist
                </Link>
                <Link
                  href="/lehumo/onboard"
                  className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-200 ${
                    pinned
                      ? "bg-teal text-white hover:bg-teal/90"
                      : "bg-lime text-navy hover:shadow-[0_4px_16px_rgba(184,255,0,0.25)]"
                  }`}
                >
                  Join Lehumo
                </Link>
              </div>
            ) : (
              <Link
                href="/advisory"
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${ctaClass}`}
              >
                Book Now
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setDrawerOpen((prev) => !prev)}
            className="flex min-[900px]:hidden flex-col justify-center items-center w-11 h-11 gap-[6px] -mr-1"
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
          >
            <motion.span
              animate={
                drawerOpen
                  ? { rotate: 45, y: 4, backgroundColor: hamburgerColor }
                  : { rotate: 0, y: 0, backgroundColor: hamburgerColor }
              }
              transition={{ duration: 0.25 }}
              className="block w-6 h-[2px] rounded-full origin-center"
            />
            <motion.span
              animate={
                drawerOpen
                  ? { rotate: -45, y: -4, backgroundColor: hamburgerColor }
                  : { rotate: 0, y: 0, backgroundColor: hamburgerColor }
              }
              transition={{ duration: 0.25 }}
              className="block w-6 h-[2px] rounded-full origin-center"
            />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed inset-0 top-[70px] z-40 bg-white backdrop-blur-lg min-[900px]:hidden"
          >
            <div className="flex flex-col h-full px-6 pt-6 pb-8 overflow-y-auto">
              <div className="flex flex-col flex-1">
                {/* Primary links */}
                {NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`relative py-4 text-[20px] font-semibold border-b border-border transition-colors duration-200 ${
                        isActive
                          ? "text-navy pl-4"
                          : "text-ink hover:text-teal"
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full bg-teal" />
                      )}
                      {link.label}
                    </Link>
                  );
                })}

                {/* More section divider */}
                <span className="text-[11px] font-bold tracking-[1.5px] uppercase text-muted mt-6 mb-1 px-1">
                  More
                </span>

                {/* Secondary links */}
                {NAV_MORE_LINKS.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`relative py-4 border-b border-border transition-colors duration-200 ${
                        isActive ? "pl-4" : ""
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full bg-teal" />
                      )}
                      <span
                        className={`block text-[20px] font-semibold ${
                          isActive ? "text-navy" : "text-ink hover:text-teal"
                        }`}
                      >
                        {link.label}
                      </span>
                      <span className="block text-xs text-muted mt-0.5">
                        {link.desc}
                      </span>
                    </Link>
                  );
                })}
              </div>

              {/* Bottom CTAs */}
              {isLehumo ? (
                <div className="mt-auto flex flex-col gap-3">
                  <Link
                    href="/lehumo#waitlist"
                    className="w-full py-3.5 border-2 border-navy/20 text-navy text-center text-base font-semibold rounded-xl transition-colors duration-200 hover:bg-navy/5"
                  >
                    Join Waitlist
                  </Link>
                  <Link
                    href="/lehumo/onboard"
                    className="w-full py-4 bg-lime text-navy text-center text-lg font-semibold rounded-xl transition-colors duration-200 hover:bg-lime/90"
                  >
                    Join Lehumo
                  </Link>
                </div>
              ) : (
                <Link
                  href="/advisory"
                  className="mt-auto w-full py-4 bg-teal text-white text-center text-lg font-semibold rounded-xl transition-colors duration-200 hover:bg-teal/90"
                >
                  Book Now
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
