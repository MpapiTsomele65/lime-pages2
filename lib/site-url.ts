import "server-only";

/**
 * Resolve the canonical site origin for absolute URLs in transactional
 * emails, OAuth callbacks, payment redirects, and any other place we
 * need a fully-qualified link back to the app.
 *
 * Priority order:
 *
 *   1. `NEXT_PUBLIC_SITE_URL` — explicit production URL set in Vercel
 *      project settings (e.g. `https://www.limepages.co.za`). This is
 *      the canonical answer when set.
 *
 *   2. `VERCEL_URL` — automatically injected by Vercel on every deploy
 *      (preview branches, ephemeral builds, even production). Comes
 *      *without* a protocol scheme (just the host, e.g.
 *      `lime-pages-abc123.vercel.app`), so we prepend `https://`.
 *      This makes preview deploys self-link correctly without needing
 *      a manual env-var override per branch.
 *
 *   3. `http://localhost:3000` — local dev fallback. Matches Next.js'
 *      default `next dev` port.
 *
 * Defensive scrub: `NEXT_PUBLIC_SITE_URL` was historically stored on
 * Vercel with a literal trailing `\n` (the value got typed with a stray
 * escape sequence). Without sanitization the templated URL became
 * `https://www.limepages.co.za\n/lehumo/portal/login` and links 404.
 * The env var has since been corrected, but the scrub stays in place
 * as cheap insurance against future env-var typos — strips the literal
 * `\n`, real newlines, surrounding whitespace, and a trailing slash.
 *
 * Server-only: this helper reads `VERCEL_URL` which is not exposed to
 * the client. Importing from a client component throws at build time.
 * If you need the site URL in a client component, hard-code the public
 * origin or pass it down as a prop from a server component.
 */
export function siteUrl(): string {
  const explicit = (process.env.NEXT_PUBLIC_SITE_URL ?? "")
    .replace(/\\n/g, "")
    .replace(/[\r\n]+/g, "")
    .trim()
    .replace(/\/$/, "");

  if (explicit) return explicit;

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}
