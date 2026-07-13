import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lime Travel destination thumbnails are served from Unsplash (their
  // license permits commercial use). next/image needs the host
  // allowlisted to optimise remote images.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
    // Next 16 only serves qualities listed here (default [75]); the home
    // hero requests quality 80.
    qualities: [75, 80],
  },
  // Cap @vercel/blob client retries from its default of 10 to 2.
  // The lib reads `process.env.VERCEL_BLOB_RETRIES` literally inside
  // browser code; without inlining via Next's `env` config, the
  // bundle resolves it to undefined and falls back to "10" — which
  // means a single failing upload attempt will silently re-upload
  // the entire file 10 times before surfacing an error. With 2,
  // we get one bona-fide retry on transient blips, then a real
  // error toast. See chunk-WCA6LLLU.cjs#getRetries in
  // node_modules/@vercel/blob/dist/.
  env: {
    VERCEL_BLOB_RETRIES: "2",
  },
  // Lime Connect was rebranded to Lime Services; the page moved from
  // /connect to /services. Permanent redirect so old links, bookmarks,
  // and the OG image route keep resolving.
  async redirects() {
    return [
      { source: "/connect", destination: "/services", permanent: true },
    ];
  },
};

export default nextConfig;
