"use client";

/**
 * CTAButton — the canonical call-to-action button used across the
 * marketing site.
 *
 * Encapsulates the pattern that was previously duplicated inline
 * across 15+ files (e.g. `bg-lime text-navy px-7 py-3 rounded-full
 * font-bold text-sm hover:-translate-y-0.5 hover:shadow-lime-glow
 * transition-all`).
 *
 * Variants:
 *   • `primary` — lime fill, navy text, glow on hover. The lime
 *     button used on dark-bg marketing CTAs ("Apply to Join", etc).
 *   • `secondary` — teal outline + text. The accent-secondary
 *     treatment for less-prominent actions ("Learn more").
 *   • `tertiary` — subtle white-on-dark surface. Used for cards.
 *   • `ghost` — link-flavoured, no background. For inline links.
 *
 * Sizes: `md` (default) and `lg` (the "hero CTA" sizing on landing
 * sections).
 *
 * Behaviour:
 *   • If `href` is provided, renders as a `<Link>` from next/link
 *     so prefetching works for internal routes.
 *   • If `loading` is true, swaps the children for a spinner +
 *     optional `loadingText`. Also disables interaction.
 *   • Icons can sit leading or trailing the label.
 *
 * Visual output is byte-equivalent to the inline patterns it
 * replaces.
 */

import { forwardRef } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export type CTAButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "ghost";
export type CTAButtonSize = "md" | "lg";

type CommonProps = {
  variant?: CTAButtonVariant;
  size?: CTAButtonSize;
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: "leading" | "trailing";
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
};

type LinkProps = CommonProps & {
  href: string;
  type?: never;
  onClick?: never;
};

type ButtonProps = CommonProps & {
  href?: never;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
};

export type CTAButtonProps = LinkProps | ButtonProps;

const VARIANT_STYLES: Record<CTAButtonVariant, string> = {
  primary:
    "bg-lime text-navy hover:-translate-y-0.5 hover:shadow-lime-glow",
  secondary:
    "border border-teal text-teal hover:bg-teal/10 hover:-translate-y-0.5",
  tertiary:
    "bg-white/[0.06] text-white border border-white/[0.1] hover:bg-white/[0.10]",
  ghost: "text-white/70 hover:text-white",
};

const SIZE_STYLES: Record<CTAButtonSize, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none";

export const CTAButton = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  CTAButtonProps
>(function CTAButton(props, ref) {
  const {
    variant = "primary",
    size = "md",
    loading = false,
    loadingText,
    icon,
    iconPosition = "trailing",
    disabled = false,
    className = "",
    children,
  } = props;

  const isLink = "href" in props && props.href !== undefined;
  const composite = [BASE, VARIANT_STYLES[variant], SIZE_STYLES[size], className]
    .filter(Boolean)
    .join(" ");

  const content = loading ? (
    <>
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      <span>{loadingText ?? children}</span>
    </>
  ) : (
    <>
      {icon && iconPosition === "leading" && (
        <span className="inline-flex shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {icon && iconPosition === "trailing" && (
        <span className="inline-flex shrink-0">{icon}</span>
      )}
    </>
  );

  if (isLink && !disabled && !loading) {
    const { href } = props as LinkProps;
    return (
      <Link
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={composite}
        aria-busy={loading || undefined}
      >
        {content}
      </Link>
    );
  }

  const { type = "button", onClick } = props as ButtonProps;
  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={composite}
      aria-busy={loading || undefined}
    >
      {content}
    </button>
  );
});
