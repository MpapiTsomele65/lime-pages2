export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Lehumo", href: "/lehumo" },
  { label: "Lime Capital", href: "/capital" },
  { label: "Lime Services", href: "/services" },
  { label: "Lime Advisory", href: "/advisory" },
] as const;

export const NAV_MORE_LINKS: readonly {
  label: string;
  href: string;
  desc: string;
  /** Optional chip rendered next to the label, e.g. "Beta". */
  badge?: string;
}[] = [
  { label: "Lime Travel", href: "/travel", desc: "Group trip pools", badge: "Beta" },
  { label: "Lemonade Station", href: "/lemonade-station", desc: "For founders & SMMEs" },
  { label: "Behind the Pages", href: "/about", desc: "Our story & mission" },
];

export const FOOTER_NAV = {
  navigate: [
    { label: "Home", href: "/" },
    { label: "Lehumo", href: "/lehumo" },
    { label: "Lime Capital", href: "/capital" },
    { label: "Lime Travel", href: "/travel" },
    { label: "Lemonade Station", href: "/lemonade-station" },
    { label: "Lime Services", href: "/services" },
    { label: "Lime Advisory", href: "/advisory" },
    { label: "Behind the Pages", href: "/about" },
  ],
  services: [
    { label: "Growth Strategy", href: "/advisory" },
    { label: "Investor Readiness", href: "/advisory" },
    { label: "SMME Advisory", href: "/advisory" },
    { label: "Tech Implementation", href: "/advisory" },
    { label: "Business Scaling", href: "/advisory" },
  ],
  community: [
    { label: "Lehumo Trust", href: "/lehumo" },
    { label: "Lime Capital", href: "/capital" },
    { label: "Join Lehumo", href: "/lehumo/onboard" },
    { label: "Member Portal", href: "/lehumo/portal" },
  ],
} as const;

export const MARQUEE_HOME = [
  "Growth Strategy", "Business Scaling", "Tech Implementation",
  "SMME Advisory", "Investor Readiness", "Lehumo Trust",
  "Digital Transformation", "Lime Capital",
];

export const MARQUEE_LEHUMO = [
  "Save \u00b7 Buy \u00b7 Protect", "Lehumo Collective Investment Trust",
  "30 Founding Members", "R1,000 Per Month", "5-Year Lock-in",
  "R2 Million Target", "Generational Wealth",
  "Interest-Free Emergency Loans", "Community-Owned Assets",
];
