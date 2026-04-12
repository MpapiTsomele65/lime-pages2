"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

const COOKIE_KEY = "lp_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Small delay so it doesn't flash on page load
    const timer = setTimeout(() => {
      const consent = localStorage.getItem(COOKIE_KEY);
      if (!consent) setVisible(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(COOKIE_KEY, "declined");
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 z-[9999] p-4 sm:p-6 pointer-events-none"
        >
          <div className="max-w-[520px] mx-auto bg-[#0B0B0B] rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.25)] border border-white/[0.08] p-5 sm:p-6 pointer-events-auto">
            {/* Close button */}
            <button
              onClick={decline}
              className="absolute top-3 right-3 text-white/25 hover:text-white/60 transition-colors"
              aria-label="Close cookie banner"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="hidden sm:flex w-10 h-10 rounded-xl bg-capital/15 items-center justify-center flex-shrink-0 mt-0.5">
                <Cookie className="w-5 h-5 text-capital" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 leading-relaxed mb-4">
                  We use cookies and analytics to improve your experience. By
                  continuing, you agree to our{" "}
                  <Link
                    href="/privacy"
                    className="text-teal font-medium hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={accept}
                    aria-label="Accept cookies and analytics"
                    className="bg-capital text-navy px-5 py-2 rounded-full text-xs font-bold hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(193,255,114,0.25)] transition-all"
                  >
                    Accept
                  </button>
                  <button
                    onClick={decline}
                    aria-label="Decline cookies and analytics"
                    className="text-white/40 px-4 py-2 rounded-full text-xs font-semibold hover:text-white/70 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
