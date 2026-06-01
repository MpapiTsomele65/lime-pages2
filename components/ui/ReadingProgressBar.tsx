"use client";

/**
 * ReadingProgressBar — a thin lime bar at the very top of the
 * viewport that tracks how far the user has scrolled through the
 * page.
 *
 * Why it earns its place:
 *   • Long marketing pages (Lehumo + Capital both have 10+ sections)
 *     give no spatial cue for "how much more is there?" — the progress
 *     bar answers that ambient question.
 *   • Tiny visual footprint (2px tall, lime), zero layout impact,
 *     no scrollbar replacement.
 *
 * Implementation notes:
 *   • Uses framer-motion's `useScroll` + `useSpring` so the bar
 *     advances smoothly rather than jittering with every scroll
 *     event. The spring damps the high-frequency wheel/trackpad
 *     input into a soft chase.
 *   • Pure transform-based update (scaleX 0 → 1) — runs entirely
 *     on the GPU, no layout thrash.
 *   • Self-hides under `prefers-reduced-motion: reduce` via the
 *     global CSS guard in globals.css (the spring's transition
 *     gets clamped to .01ms — effectively a step function instead
 *     of a smooth fill).
 *   • `pointer-events-none` so the bar never intercepts clicks
 *     near the top of the viewport (e.g. a fixed-position nav).
 *   • `aria-hidden` because the visual progress isn't meaningful
 *     to screen-readers — they navigate by structure, not pixel
 *     position.
 */

import { motion, useScroll, useSpring } from "framer-motion";

export function ReadingProgressBar() {
  const { scrollYProgress } = useScroll();
  // Spring config tuned for "responsive but not twitchy":
  //   stiffness 100 = quick response, damping 30 = settles fast,
  //   restDelta 0.001 = stop chasing once delta is sub-pixel.
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX, transformOrigin: "0% 50%" }}
      className="pointer-events-none fixed top-0 left-0 right-0 z-50 h-[2px] bg-lime"
    />
  );
}
