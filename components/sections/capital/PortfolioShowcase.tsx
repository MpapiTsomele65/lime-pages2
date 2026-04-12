"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import {
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  FileText,
  ArrowRight,
  Briefcase,
  MapPin,
} from "lucide-react";

/* ─── Types ─── */
interface PortfolioStartup {
  name: string;
  logo: string;
  website: string;
  investmentType: string;
  sector: string;
  region: string;
  tagline: string;
  deckPages: string[]; // ordered array of page image paths
}

/* ─── Data ─── */
const startups: PortfolioStartup[] = [
  {
    name: "Paycloud",
    logo: "/images/portfolio/paycloud/logo.png",
    website: "https://paycloudafrica.com",
    investmentType: "SAFE",
    sector: "FinTech",
    region: "Kenya",
    tagline: "Neobank for Africa\u2019s MSMEs.",
    deckPages: Array.from({ length: 10 }, (_, i) =>
      `/images/portfolio/paycloud/deck-${String(i + 1).padStart(2, "0")}.jpg`
    ),
  },
];

/* ─── Animations ─── */
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

/* ─── Pitch Deck Carousel ─── */
function DeckCarousel({ pages, name }: { pages: string[]; name: string }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const total = pages.length;

  const goTo = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= total) return;
      setDirection(idx > current ? 1 : -1);
      setCurrent(idx);
    },
    [current, total]
  );

  const next = useCallback(() => goTo(Math.min(current + 1, total - 1)), [current, total, goTo]);
  const prev = useCallback(() => goTo(Math.max(current - 1, 0)), [current, goTo]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [next, prev]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  if (total === 0) {
    return (
      <div className="aspect-[16/9] bg-white/[0.03] rounded-[14px] border border-white/[0.06] flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-8 h-8 text-white/20 mx-auto mb-2" />
          <p className="text-xs text-white/30">Pitch deck coming soon</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Deck viewer */}
      <div
        className="relative aspect-[16/9] bg-[#111] rounded-[14px] overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={current}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Image
              src={pages[current]}
              alt={`${name} pitch deck — page ${current + 1}`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 700px"
            />
          </motion.div>
        </AnimatePresence>

        {/* Nav arrows */}
        <button
          onClick={prev}
          disabled={current === 0}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 disabled:opacity-20 disabled:cursor-default transition-all z-10"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={next}
          disabled={current === total - 1}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 disabled:opacity-20 disabled:cursor-default transition-all z-10"
          aria-label="Next page"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Page counter */}
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 z-10">
          <span className="text-[11px] font-semibold text-white/80 tabular-nums">
            {current + 1} / {total}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 px-1">
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-capital"
            initial={false}
            animate={{ width: `${((current + 1) / total) * 100}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Startup Card ─── */
function StartupCard({ startup, index }: { startup: PortfolioStartup; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.1 * index, ease: "easeOut" as const }}
      className="bg-white/[0.03] border border-white/[0.08] rounded-[20px] overflow-hidden hover:border-capital/20 transition-all"
    >
      {/* Header */}
      <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-4">
        <div className="flex items-center gap-3 sm:gap-4 mb-3">
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 overflow-hidden flex items-center justify-center shrink-0">
            <Image
              src={startup.logo}
              alt={`${startup.name} logo`}
              fill
              className="object-contain p-1.5"
            />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
              {startup.name}
            </h3>
            <p className="text-xs text-white/40 truncate">{startup.tagline}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="inline-flex items-center gap-1.5 bg-capital/15 border border-capital/25 rounded-full px-2.5 sm:px-3 py-[4px]">
            <span className="text-[10px] font-bold text-capital tracking-wide uppercase">
              {startup.investmentType}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white/[0.06] border border-white/10 rounded-full px-2.5 sm:px-3 py-[4px]">
            <span className="text-[10px] font-semibold text-white/50 tracking-wide uppercase">
              {startup.sector}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 bg-white/[0.06] border border-white/10 rounded-full px-2.5 sm:px-3 py-[4px]">
            <MapPin className="w-3 h-3 text-white/40" />
            <span className="text-[10px] font-semibold text-white/50 tracking-wide uppercase">
              {startup.region}
            </span>
          </span>
        </div>
      </div>

      {/* Pitch Deck Carousel */}
      <div className="px-4 sm:px-6 pb-4">
        <DeckCarousel pages={startup.deckPages} name={startup.name} />
      </div>

      {/* Footer */}
      <div className="px-4 sm:px-6 pb-5 sm:pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <a
          href={startup.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-capital hover:text-white transition-colors"
        >
          <ExternalLink className="w-4 h-4 shrink-0" />
          {startup.website.replace(/^https?:\/\//, "")}
        </a>
        <span className="text-[10px] text-white/25 font-medium">
          Swipe or use arrows to browse deck
        </span>
      </div>
    </motion.div>
  );
}

/* ─── Section ─── */
export default function PortfolioShowcase() {
  return (
    <section className="py-24 bg-navy relative overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute top-[20%] left-[-5%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(193,255,114,0.08),transparent_70%)] blur-[70px] pointer-events-none" />

      <Container className="relative z-[1]">
        {/* Header */}
        <motion.div {...fadeUp} className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-capital/15 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-capital" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                Portfolio
              </h2>
              <p className="text-xs text-white/40">
                Startups our angel network has invested in
              </p>
            </div>
          </div>
        </motion.div>

        {/* Cards */}
        <div className="space-y-8">
          {startups.map((startup, i) => (
            <StartupCard key={startup.name} startup={startup} index={i} />
          ))}
        </div>

        {/* More coming */}
        {startups.length <= 3 && (
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, ease: "easeOut" as const, delay: 0.2 }}
            className="mt-8 text-center"
          >
            <div className="inline-flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-full px-5 py-2.5">
              <ArrowRight className="w-3.5 h-3.5 text-capital" />
              <span className="text-xs font-semibold text-white/35">
                More investments coming soon
              </span>
            </div>
          </motion.div>
        )}
      </Container>
    </section>
  );
}
