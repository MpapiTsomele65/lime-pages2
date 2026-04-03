"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { NAV_LINKS } from "@/lib/constants";
import Logo from "@/components/shared/Logo";

export default function Navbar() {
  const pathname = usePathname();
  const [pinned, setPinned] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

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
            <Logo variant={pinned ? "color" : "white"} />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden min-[900px]:flex items-center gap-8">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm transition-colors duration-200 ${
                    pinned
                      ? isActive
                        ? "text-navy font-semibold"
                        : "text-muted hover:text-ink"
                      : isActive
                        ? "text-white font-semibold"
                        : "text-[rgba(255,255,255,0.75)] hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Book Now CTA */}
            <Link
              href="/connect"
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                pinned
                  ? "bg-teal text-white hover:bg-teal/90"
                  : "bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              Book Now
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setDrawerOpen((prev) => !prev)}
            className="flex min-[900px]:hidden flex-col justify-center items-center w-10 h-10 gap-[6px]"
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
          >
            <motion.span
              animate={
                drawerOpen
                  ? { rotate: 45, y: 4, backgroundColor: pinned ? "#0B0B0B" : "#fff" }
                  : { rotate: 0, y: 0, backgroundColor: pinned ? "#0B0B0B" : "#fff" }
              }
              transition={{ duration: 0.25 }}
              className="block w-6 h-[2px] rounded-full origin-center"
            />
            <motion.span
              animate={
                drawerOpen
                  ? { rotate: -45, y: -4, backgroundColor: pinned ? "#0B0B0B" : "#fff" }
                  : { rotate: 0, y: 0, backgroundColor: pinned ? "#0B0B0B" : "#fff" }
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
            className="fixed inset-0 top-[70px] z-40 bg-white/95 backdrop-blur-lg min-[900px]:hidden"
          >
            <div className="flex flex-col h-full px-6 pt-6 pb-8 overflow-y-auto">
              <div className="flex flex-col flex-1">
                {NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`py-4 text-[20px] font-semibold border-b border-border transition-colors duration-200 ${
                        isActive ? "text-navy" : "text-ink hover:text-teal"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              {/* Book Now button */}
              <Link
                href="/connect"
                className="mt-auto w-full py-4 bg-teal text-white text-center text-lg font-semibold rounded-xl transition-colors duration-200 hover:bg-teal/90"
              >
                Book Now
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
