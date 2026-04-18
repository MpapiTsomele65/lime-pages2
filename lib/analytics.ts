/**
 * Thin analytics layer for GA4 + Meta Pixel.
 *
 * Both scripts are injected at the root layout by <SiteAnalytics />. This
 * module exposes a single `trackEvent` helper that fans out to whichever
 * providers are loaded. Safe to call on the server — it no-ops unless
 * called from the browser and the relevant global is present.
 */

// Narrow the globals we touch so we don't have to `as any` everywhere.
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/**
 * Fire a custom analytics event. Sends to GA4 and (if it's a supported
 * standard event) to Meta Pixel. For soft-launch we only need a handful
 * of events; extend the `META_MAP` below as needed.
 */
export function trackEvent(
  name: string,
  params: Record<string, string | number | boolean | undefined> = {},
): void {
  if (typeof window === "undefined") return;

  // GA4 — always fires if gtag is loaded.
  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }

  // Meta Pixel — map our internal event names to Pixel's vocabulary.
  if (typeof window.fbq === "function") {
    const metaEvent = META_MAP[name];
    if (metaEvent) {
      window.fbq("track", metaEvent, params);
    } else {
      // Fall back to a trackCustom call if no standard event matches.
      window.fbq("trackCustom", name, params);
    }
  }
}

/**
 * Map internal → Meta Pixel standard events. Standard events unlock
 * better optimisation in Ads Manager than custom ones.
 * See: https://developers.facebook.com/docs/meta-pixel/reference
 */
const META_MAP: Record<string, string> = {
  lead_submitted: "Lead",
  onboarding_started: "InitiateCheckout",
  onboarding_completed: "CompleteRegistration",
};
