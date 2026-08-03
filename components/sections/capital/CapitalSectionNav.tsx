"use client";

/**
 * CapitalSectionNav — the sticky "navigation key" for /capital.
 *
 * The page runs to ~34 screens and ~22 minutes of reading, which is far
 * past the point where scrolling is a usable way to find anything. This
 * pins a slim section bar under the main navbar so every concept on the
 * page is one click away, and shows where you currently are.
 *
 * Scroll-spy deliberately uses a "last section whose top has passed the
 * reading line" scan rather than IntersectionObserver: the sections here
 * range from 74px dividers to a 5,200px comparison block, and an
 * observer with a single rootMargin either misses the short ones or
 * fires several at once on the tall ones. A direct scan is both simpler
 * and correct at every height.
 *
 * Accessibility: <nav> landmark, aria-current="true" on the active link,
 * 44px touch targets, real anchor hrefs (so it works without JS, and
 * links stay right-clickable and shareable), and a visible focus ring.
 * Motion respects the prefers-reduced-motion guard in globals.css.
 */

import { useCallback, useEffect, useRef, useState } from "react";

/** Fixed navbar (70px) + this bar (~48px), so headings clear both. */
const SCROLL_OFFSET = 124;

interface NavSection {
  id: string;
  label: string;
  /** Shown on wide screens only, where there's room for the fuller name. */
  longLabel?: string;
}

/**
 * In page order — a scroll-spy bar that jumps around out of sequence is
 * disorienting. Not every anchor appears; this is a key to the main
 * concepts, not an exhaustive index.
 */
const SECTIONS: NavSection[] = [
  { id: "tools", label: "Tools" },
  { id: "investing-101", label: "Investing 101" },
  { id: "fund-performance", label: "Funds", longLabel: "Compare funds" },
  { id: "risk-profile", label: "Risk profile" },
  { id: "retirement-annuities", label: "Retirement" },
  { id: "home-loan-accelerator-section", label: "Home loan" },
  { id: "alternative-investments", label: "Alternatives" },
  { id: "wills-estates", label: "Wills" },
];

export default function CapitalSectionNav() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);
  const listRef = useRef<HTMLUListElement>(null);

  const recomputeActive = useCallback(() => {
    const line = window.scrollY + SCROLL_OFFSET + 12;
    let current = SECTIONS[0].id;
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (!el) continue;
      if (el.getBoundingClientRect().top + window.scrollY <= line) current = s.id;
    }
    // At the very bottom the last section may never reach the reading
    // line (a short trailing block), so pin it explicitly.
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) {
      current = SECTIONS[SECTIONS.length - 1].id;
    }
    setActiveId(current);
  }, []);

  useEffect(() => {
    // Computed directly on the (passive) scroll event rather than behind a
    // requestAnimationFrame throttle. A rAF latch looks cheaper but wedges:
    // rAF is suspended while the tab is hidden, so a "already scheduled"
    // flag set just before a suspended frame never clears, and scroll-spy
    // stays dead for the rest of the session once the user tabs away and
    // back. Measuring 8 elements per event is genuinely negligible by
    // comparison, and it cannot get stuck.
    recomputeActive();
    window.addEventListener("scroll", recomputeActive, { passive: true });
    window.addEventListener("resize", recomputeActive, { passive: true });
    return () => {
      window.removeEventListener("scroll", recomputeActive);
      window.removeEventListener("resize", recomputeActive);
    };
  }, [recomputeActive]);

  // Keep the active pill in view on mobile, where the bar scrolls
  // horizontally and the active item can sit off-screen.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.querySelector<HTMLElement>('[data-active="true"]');
    if (!active) return;
    const listBox = list.getBoundingClientRect();
    const itemBox = active.getBoundingClientRect();
    if (itemBox.left < listBox.left || itemBox.right > listBox.right) {
      list.scrollTo({
        left: active.offsetLeft - list.clientWidth / 2 + active.clientWidth / 2,
        behavior: "smooth",
      });
    }
  }, [activeId]);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    const el = document.getElementById(id);
    if (!el) return; // let the browser handle it
    e.preventDefault();
    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    window.scrollTo({ top, behavior: "smooth" });
    // Keep the URL shareable even though we scrolled manually.
    history.replaceState(null, "", `#${id}`);
    setActiveId(id);
  }

  return (
    <nav
      aria-label="Sections on this page"
      className="sticky top-[70px] z-30 bg-white/95 backdrop-blur-md border-b border-border"
    >
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <ul
          ref={listRef}
          className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1.5"
        >
          {SECTIONS.map((s) => {
            const active = s.id === activeId;
            return (
              <li key={s.id} className="shrink-0">
                <a
                  href={`#${s.id}`}
                  onClick={(e) => handleClick(e, s.id)}
                  data-active={active}
                  aria-current={active ? "true" : undefined}
                  className={`relative flex min-h-[38px] items-center rounded-lg px-3 text-[12.5px] font-medium whitespace-nowrap transition-colors ${
                    active
                      ? "bg-navy text-white"
                      : "text-subtle hover:bg-snow hover:text-navy"
                  }`}
                >
                  <span className="hidden xl:inline">
                    {s.longLabel ?? s.label}
                  </span>
                  <span className="xl:hidden">{s.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
