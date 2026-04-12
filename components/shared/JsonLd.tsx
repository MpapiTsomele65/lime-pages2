export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Lime Pages",
    url: "https://www.limepages.co.za",
    logo: "https://www.limepages.co.za/icon.svg",
    description:
      "Advisory & Fintech solutions empowering African entrepreneurs and young professionals to build thriving businesses and generational wealth.",
    foundingDate: "2019",
    founder: {
      "@type": "Person",
      name: "Mpapi Tsomele",
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "ZA",
    },
    sameAs: ["https://www.instagram.com/limepages"],
    contactPoint: {
      "@type": "ContactPoint",
      email: "hello@limepages.co.za",
      contactType: "customer service",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function WebSiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Lime Pages",
    url: "https://www.limepages.co.za",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function ServiceJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Business Advisory",
    provider: {
      "@type": "Organization",
      name: "Lime Pages",
      url: "https://www.limepages.co.za",
    },
    areaServed: {
      "@type": "Country",
      name: "South Africa",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Advisory Packages",
      itemListElement: [
        {
          "@type": "Offer",
          name: "Personal Advisory",
          price: "500",
          priceCurrency: "ZAR",
          description:
            "Personal financial advisory session for individuals and young professionals.",
        },
        {
          "@type": "Offer",
          name: "Business Advisory",
          price: "699",
          priceCurrency: "ZAR",
          description:
            "Business growth strategy and SMME advisory session.",
        },
        {
          "@type": "Offer",
          name: "Wealth Advisory",
          price: "790",
          priceCurrency: "ZAR",
          description:
            "Comprehensive wealth strategy and investor readiness session.",
        },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
