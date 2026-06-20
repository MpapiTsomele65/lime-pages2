import {
  Landmark,
  Lock,
  Users,
  LineChart,
  TrendingUp,
  ShieldCheck,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react";

/**
 * AssuranceStrip — the credibility strip that sits at the hero's bottom
 * boundary (where the decorative Marquee used to live).
 *
 * A calm, data-driven bridge between the hero and the page body: small
 * pillar-tinted icon + a substantiated assurance, focused on the two
 * core pillars (Lehumo + Lime Capital) plus a couple of platform
 * guarantees. Reinforces a professional, wealth-advisory feel without
 * implying licensed/regulated advice.
 *
 * Server component — pure markup + a CSS marquee animation (no hooks),
 * so it ships zero client JS. The `marquee` keyframe lives in
 * globals.css; `prefers-reduced-motion` (also globals.css) freezes the
 * scroll into a static row for motion-sensitive users.
 */

type Pillar = "lehumo" | "capital" | "platform";

interface AssuranceItem {
  icon: LucideIcon;
  label: string;
  pillar?: Pillar;
}

/** Subtle colour-coding so the eye can group the two pillars. */
const PILLAR_TINT: Record<Pillar, string> = {
  lehumo: "text-lime",
  capital: "text-capital",
  platform: "text-teal",
};

/** Substantiated only — see plan's compliance guardrail. */
const ASSURANCES: AssuranceItem[] = [
  { icon: Landmark, label: "~R2M Collective Investment Trust", pillar: "lehumo" },
  { icon: Lock, label: "5-year lock-in · 30 founding members", pillar: "lehumo" },
  { icon: Users, label: "Community-owned & governed", pillar: "lehumo" },
  { icon: LineChart, label: "Real 10-year fund performance data", pillar: "capital" },
  { icon: TrendingUp, label: "Access to alternative investments", pillar: "capital" },
  { icon: ShieldCheck, label: "Secure payments · Paystack", pillar: "platform" },
  { icon: BadgeCheck, label: "POPIA-compliant · 24-hr money-back", pillar: "platform" },
];

function ItemRow({ item, hidden }: { item: AssuranceItem; hidden?: boolean }) {
  const Icon = item.icon;
  const tint = item.pillar ? PILLAR_TINT[item.pillar] : "text-teal";
  return (
    <li
      className="flex items-center gap-2.5 whitespace-nowrap"
      aria-hidden={hidden || undefined}
    >
      <Icon className={`w-4 h-4 shrink-0 ${tint}`} aria-hidden="true" />
      <span className="text-[13px] font-semibold text-white/70 tracking-wide">
        {item.label}
      </span>
    </li>
  );
}

export function AssuranceStrip({
  items = ASSURANCES,
  scroll = true,
}: {
  items?: AssuranceItem[];
  /** `true` = marquee carousel (default). `false` = static, evenly-spaced row. */
  scroll?: boolean;
}) {
  if (!scroll) {
    return (
      <div className="bg-navy border-t-2 border-lime py-3.5">
        <ul
          aria-label="Member assurances"
          className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-center gap-x-8 gap-y-2.5 px-6"
        >
          {items.map((item) => (
            <ItemRow key={item.label} item={item} />
          ))}
        </ul>
      </div>
    );
  }

  // Duplicate the set so the -50% marquee keyframe loops seamlessly; the
  // second copy is aria-hidden so a screen reader reads each item once.
  const doubled = [...items, ...items];
  return (
    <div className="bg-navy border-t-2 border-lime overflow-hidden py-3.5">
      <ul
        aria-label="Member assurances"
        className="flex w-max items-center gap-10"
        style={{ animation: "marquee 38s linear infinite" }}
      >
        {doubled.map((item, i) => (
          <ItemRow key={i} item={item} hidden={i >= items.length} />
        ))}
      </ul>
    </div>
  );
}
