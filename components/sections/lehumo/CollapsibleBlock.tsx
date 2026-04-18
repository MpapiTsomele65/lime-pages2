"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";

interface CollapsibleBlockProps {
  /** Tiny uppercase kicker shown above the title (e.g. "Benefits?"). */
  eyebrow: string;
  /** Kicker colour — matches the original per-section accent. */
  eyebrowColor?: "lime" | "teal";
  /** The h2 content. Accepts JSX so callers can include <br /> and <span>. */
  title: ReactNode;
  /** Optional short teaser paragraph always visible below the title. */
  teaser?: ReactNode;
  /** Render the body expanded on first paint. Defaults to collapsed for faster scroll-to-CTA. */
  defaultOpen?: boolean;
  /** The hidden body content. */
  children: ReactNode;
}

/**
 * Heading + plus/minus toggle that collapses long-form content. Used on the
 * Lehumo page to shorten the scroll path to the lead-capture CTAs — the
 * headline stays visible so visitors know what's there, but the detail is
 * opt-in via the plus button.
 *
 * Accessibility: the whole header row is a single <button> with
 * aria-expanded, so keyboard and screen-reader users get the same large
 * hit target as mouse users.
 */
export function CollapsibleBlock({
  eyebrow,
  eyebrowColor = "teal",
  title,
  teaser,
  defaultOpen = false,
  children,
}: CollapsibleBlockProps) {
  const [open, setOpen] = useState(defaultOpen);
  const eyebrowClass = eyebrowColor === "lime" ? "text-lime" : "text-teal";

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, ease: "easeOut" as const }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={`${open ? "Collapse" : "Expand"} ${eyebrow} section`}
          className="group w-full flex items-start justify-between gap-6 text-left cursor-pointer"
        >
          <div className="flex-1 min-w-0">
            <span
              className={`text-[11px] font-bold tracking-[1.4px] uppercase mb-3.5 block ${eyebrowClass}`}
            >
              {eyebrow}
            </span>
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white leading-[1.08] tracking-tight">
              {title}
            </h2>
            {teaser && (
              <div className="mt-4 text-[15px] text-white/55 leading-relaxed max-w-[560px]">
                {teaser}
              </div>
            )}
          </div>

          <div
            className={`shrink-0 mt-2 h-11 w-11 rounded-full border flex items-center justify-center transition-all ${
              open
                ? "bg-lime/15 border-lime/40 text-lime"
                : "bg-white/[0.06] border-white/[0.12] text-white/70 group-hover:bg-lime/10 group-hover:border-lime/30 group-hover:text-lime"
            }`}
          >
            <motion.span
              animate={{ rotate: open ? 45 : 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex"
            >
              <Plus className="h-5 w-5" />
            </motion.span>
          </div>
        </button>
      </motion.div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="pt-10">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
