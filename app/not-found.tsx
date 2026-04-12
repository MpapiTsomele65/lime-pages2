"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { ArrowRight, Home, Search } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

export default function NotFound() {
  return (
    <div className="pt-[70px] min-h-screen bg-snow flex items-center">
      <Container>
        <motion.div
          {...fadeUp}
          className="max-w-[560px] mx-auto text-center py-20"
        >
          {/* 404 Number */}
          <div className="relative mb-8">
            <span className="text-[clamp(6rem,18vw,12rem)] font-extrabold leading-none tracking-tighter text-navy/[0.06] select-none">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-capital/20 flex items-center justify-center">
                <Search className="w-7 h-7 text-navy" />
              </div>
            </div>
          </div>

          {/* Copy */}
          <h1 className="text-[clamp(1.6rem,4vw,2.4rem)] font-extrabold text-ink leading-[1.1] tracking-tight mb-4">
            Page not found
          </h1>
          <p className="text-[#3F3F46] leading-[1.75] mb-8 max-w-[420px] mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved. Let&apos;s get you back on track.
          </p>

          {/* Actions */}
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-navy text-white px-8 py-3.5 rounded-full font-bold text-sm hover:-translate-y-0.5 hover:shadow-lg transition-all"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
            <Link
              href="/advisory"
              className="inline-flex items-center gap-2 text-navy px-8 py-3.5 rounded-full font-semibold text-sm border-2 border-navy/15 hover:bg-navy/[0.04] hover:border-navy/30 transition-all"
            >
              Explore Advisory <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Quick links */}
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-xs font-bold tracking-[1.2px] uppercase text-[#9CA3AF] mb-4">
              Popular Pages
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { label: "Lehumo", href: "/lehumo" },
                { label: "Lime Capital", href: "/capital" },
                { label: "Lime Connect", href: "/connect" },
                { label: "Behind the Pages", href: "/about" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-navy/60 hover:text-navy font-medium px-4 py-2 rounded-full bg-white border border-border hover:border-navy/20 hover:shadow-sm transition-all"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </Container>
    </div>
  );
}
