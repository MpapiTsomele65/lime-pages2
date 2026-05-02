"use client";

import { forwardRef } from "react";

/**
 * PortalCard — shared visual primitive for every dashboard card.
 *
 * Apple-flavoured treatment:
 *   1. Larger border radius (24px) than the bare-bones rounded-2xl.
 *      Soft enough to feel cared-for without going round.
 *   2. Gradient surface — a subtle brighten on the inner top edge
 *      that catches the page's radial-glow and reads as if light is
 *      hitting the card from above. Same trick Apple uses on every
 *      glass surface in macOS.
 *   3. Multi-layer shadow:
 *        • Inner highlight on top edge (0 1px 0 rgba(255,255,255,
 *          0.04) inset) — implies a soft inner bevel
 *        • Wide soft drop (0 8px 32px -8px rgba(0,0,0,0.4)) — gives
 *          the card depth without a harsh shadow
 *      Both stack into the box-shadow prop together so the renderer
 *      composites them in one pass.
 *   4. Optional hover lift — translate-y-[-1px] + shadow growth.
 *      Apple cards subtly elevate on interaction, signalling
 *      tappability without a heavy state change.
 *
 * Variants:
 *   - default: standard card surface (most cards)
 *   - elevated: brighter, primary-action card (used by
 *     SetUpPaymentsCard and reminder-style high-priority surfaces)
 *
 * Usage in dashboard cards:
 *   <PortalCard>...</PortalCard>
 *   <PortalCard variant="elevated">...</PortalCard>
 *   <PortalCard interactive>...</PortalCard>  // adds hover lift
 *
 * Migration path: existing cards using ad-hoc
 * `bg-[#0F2040] rounded-[20px] border border-white/[0.06] p-6`
 * patterns can swap to <PortalCard className="p-6">…</PortalCard>
 * to inherit the new look without losing layout.
 */

interface PortalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual weight. `default` for standard cards (most of the
   *  dashboard); `elevated` for primary-action cards that should
   *  visually compete for attention. */
  variant?: "default" | "elevated";
  /** Adds a subtle hover transform + shadow growth. Use for cards
   *  that are clickable / link-like; skip for pure information
   *  cards so the dashboard isn't a sea of squirming surfaces. */
  interactive?: boolean;
  children: React.ReactNode;
}

export const PortalCard = forwardRef<HTMLDivElement, PortalCardProps>(
  function PortalCard(
    { variant = "default", interactive = false, className = "", children, ...rest },
    ref,
  ) {
    // Base — shared by both variants. Renders the inner highlight
    // + soft drop shadow via inline style (Tailwind doesn't have a
    // first-class API for stacked custom shadows yet).
    const baseStyle: React.CSSProperties = {
      boxShadow:
        "inset 0 1px 0 0 rgba(255, 255, 255, 0.04), " +
        "0 1px 2px 0 rgba(0, 0, 0, 0.2), " +
        "0 8px 32px -8px rgba(0, 0, 0, 0.35)",
    };

    const variantClass =
      variant === "elevated"
        ? "bg-gradient-to-b from-[#11244a] to-[#0F2040] border-white/[0.08]"
        : "bg-gradient-to-b from-[#10224a] to-[#0F2040] border-white/[0.05]";

    const interactiveClass = interactive
      ? "transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] " +
        "hover:-translate-y-[1px] hover:border-white/[0.10] " +
        "hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_2px_4px_0_rgba(0,0,0,0.25),0_12px_40px_-8px_rgba(0,0,0,0.45)]"
      : "transition-colors duration-300";

    return (
      <div
        ref={ref}
        style={baseStyle}
        className={`rounded-[24px] border ${variantClass} ${interactiveClass} ${className}`}
        {...rest}
      >
        {children}
      </div>
    );
  },
);
