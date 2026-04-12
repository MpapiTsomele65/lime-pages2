import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/lehumo/portal/", "/lehumo/portal/login"],
      },
    ],
    sitemap: "https://www.limepages.co.za/sitemap.xml",
  };
}
