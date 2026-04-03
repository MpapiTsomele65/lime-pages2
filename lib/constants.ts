export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Lehumo", href: "/lehumo" },
  { label: "Lime Capital", href: "/capital" },
  { label: "About", href: "/about" },
  { label: "Lime Connect", href: "/connect" },
  { label: "Lime Advisory", href: "/advisory" },
] as const;

export const FOOTER_NAV = {
  navigate: [
    { label: "Home", href: "/" },
    { label: "Lehumo", href: "/lehumo" },
    { label: "Lime Capital", href: "/capital" },
    { label: "About", href: "/about" },
    { label: "Lime Connect", href: "/connect" },
    { label: "Lime Advisory", href: "/advisory" },
  ],
  services: [
    { label: "Wealth Planning", href: "/advisory" },
    { label: "Investor Readiness", href: "/advisory" },
    { label: "SMME Advisory", href: "/advisory" },
    { label: "Business Funding", href: "/advisory" },
    { label: "Financial Planning", href: "/advisory" },
  ],
  community: [
    { label: "Lehumo Trust", href: "/lehumo" },
    { label: "Lime Capital", href: "/capital" },
    { label: "Join Lehumo", href: "/lehumo#join" },
  ],
} as const;

export const MARQUEE_HOME = [
  "Business Funding", "Investor Readiness", "Wealth Planning",
  "SMME Advisory", "Lime Capital", "Lehumo Trust",
  "Mentoring", "Fintech Solutions",
];

export const MARQUEE_LEHUMO = [
  "Save \u00b7 Buy \u00b7 Protect", "Lehumo Collective Investment Trust",
  "30 Founding Members", "R1,000 Per Month", "5-Year Lock-in",
  "R2 Million Target", "Generational Wealth",
  "Interest-Free Emergency Loans", "Community-Owned Assets",
];
