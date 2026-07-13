/**
 * Lime Travel — destination presets + trip-pool calculator.
 *
 * Phase 1 of the Lime Travel vertical: a public planner that turns a
 * destination + group + date into a per-person cost estimate, a suggested
 * monthly contribution, and a funding timeline (flights funded → book,
 * accommodation funded → book, fully funded → depart).
 *
 * ⚠️ All figures are ILLUSTRATIVE budgeting estimates in ZAR — flight and
 * accommodation prices move. Lime Pages is not a travel agent or an FSP.
 *
 * Pure — safe for client components (the planner runs entirely in the
 * browser; no server round-trips until the waitlist form submits).
 */

export interface TravelDestination {
  id: string;
  name: string;
  /** Unsplash photo (hotlinked via next/image remotePatterns). */
  photo: string;
  photoAlt: string;
  /** Return flights from JNB, per person. */
  flightsZar: number;
  /** Room rate per night (split across `occupancy` sharers). */
  accomPerNightZar: number;
  /** Food + transport + activities, per person per day. */
  dailySpendZar: number;
  /** Visa cost per person (0 = visa-free / on arrival at no cost). */
  visaZar: number;
  blurb: string;
}

/** Two to a room — the planner's sharing assumption. */
export const ROOM_OCCUPANCY = 2;
/** Prices move; pad the estimate. */
export const BUFFER_PCT = 0.1;

const UNSPLASH = (id: string) =>
  `https://images.unsplash.com/${id}?w=640&q=80&auto=format&fit=crop`;

export const DESTINATIONS: TravelDestination[] = [
  {
    id: "zanzibar",
    name: "Zanzibar",
    photo: UNSPLASH("photo-1505881502353-a1986add3762"),
    photoAlt: "Dhow boat off a Zanzibar beach at sunset",
    flightsZar: 6500,
    accomPerNightZar: 1800,
    dailySpendZar: 950,
    visaZar: 0,
    blurb: "White sand, dhow sunsets, Stone Town — the classic crew escape.",
  },
  {
    id: "bali",
    name: "Bali",
    photo: UNSPLASH("photo-1537996194471-e657df975ab4"),
    photoAlt: "Bali rice terraces",
    flightsZar: 12500,
    accomPerNightZar: 1600,
    dailySpendZar: 1000,
    visaZar: 650,
    blurb: "Villas, rice terraces and surf — long-haul but worth every rand.",
  },
  {
    id: "dubai",
    name: "Dubai",
    photo: UNSPLASH("photo-1512453979798-5ea266f8880c"),
    photoAlt: "Dubai skyline at dusk",
    flightsZar: 9000,
    accomPerNightZar: 2400,
    dailySpendZar: 1300,
    visaZar: 1400,
    blurb: "Skyline, desert and shopping — the short-haul flex.",
  },
  {
    id: "thailand",
    name: "Thailand",
    photo: UNSPLASH("photo-1528181304800-259b08848526"),
    photoAlt: "Long-tail boat in a Thai bay",
    flightsZar: 11500,
    accomPerNightZar: 1200,
    dailySpendZar: 900,
    visaZar: 0,
    blurb: "Islands, street food and night markets — big trip, friendly budget.",
  },
  {
    id: "mauritius",
    name: "Mauritius",
    photo: UNSPLASH("photo-1544550581-5f7ceaf7f992"),
    photoAlt: "Le Morne mountain and lagoon, Mauritius",
    flightsZar: 8500,
    accomPerNightZar: 2200,
    dailySpendZar: 1100,
    visaZar: 0,
    blurb: "Lagoons and Le Morne, four hours away — visa-free for SA passports.",
  },
  {
    id: "london",
    name: "London",
    photo: UNSPLASH("photo-1513635269975-59663e0ac1ad"),
    photoAlt: "Tower Bridge and the Thames, London",
    flightsZar: 13500,
    accomPerNightZar: 3200,
    dailySpendZar: 1800,
    visaZar: 2600,
    blurb: "The big city trip — museums, football, and everyone's bucket list.",
  },
];

export const destinationById = (id: string): TravelDestination =>
  DESTINATIONS.find((d) => d.id === id) ?? DESTINATIONS[0];

// ── Period helpers (YYYY-MM) ─────────────────────────────────────────

export function addMonths(period: string, n: number): string {
  const [y, m] = period.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

export function monthDiff(from: string, to: string): number {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  return ty * 12 + tm - (fy * 12 + fm);
}

const MONTHS_LONG = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "2027-05" → "May 2027" */
export function labelPeriod(period: string): string {
  const [y, m] = period.split("-").map(Number);
  return `${MONTHS_LONG[(m ?? 1) - 1] ?? m} ${y}`;
}

// ── The calculator ───────────────────────────────────────────────────

export interface TripPlanInput {
  destinationId: string;
  travellers: number;
  nights: number;
  /** Contribution months available before departure (≥ 1). */
  monthsToSave: number;
  /** Current SAST period (YYYY-MM) — contributions start the month
   *  after; the timeline labels derive from this anchor. */
  currentPeriod: string;
}

export interface TripMilestone {
  key: "open" | "flights" | "accommodation" | "funded" | "depart";
  emoji: string;
  label: string;
  detail: string;
  /** YYYY-MM the milestone lands. */
  period: string;
}

export interface TripPlan {
  destination: TravelDestination;
  perPerson: {
    flights: number;
    accommodation: number;
    dailySpend: number;
    visa: number;
    buffer: number;
    total: number;
  };
  groupTotal: number;
  /** Suggested contribution per person per month (rounded up to R5). */
  monthlyPerPerson: number;
  monthsToSave: number;
  days: number;
  milestones: TripMilestone[];
}

export function computeTripPlan(input: TripPlanInput): TripPlan {
  const destination = destinationById(input.destinationId);
  const travellers = Math.max(2, input.travellers);
  const nights = Math.max(1, input.nights);
  const months = Math.max(1, input.monthsToSave);
  // Days on the ground = nights + 1 (arrival day counts for spend).
  const days = nights + 1;

  const flights = destination.flightsZar;
  const accommodation = Math.round(
    (destination.accomPerNightZar / ROOM_OCCUPANCY) * nights,
  );
  const dailySpend = destination.dailySpendZar * days;
  const visa = destination.visaZar;
  const subtotal = flights + accommodation + dailySpend + visa;
  const buffer = Math.round(subtotal * BUFFER_PCT);
  const total = subtotal + buffer;

  // Round the monthly UP to the nearest R5 so the pool always reaches the
  // target on or before the final month.
  const monthlyPerPerson = Math.ceil(total / months / 5) * 5;

  // Milestone month = first contribution month whose cumulative covers the
  // running requirement. Contributions start the month AFTER the current
  // one (offset 1 = currentPeriod + 1).
  const monthFor = (requirement: number) =>
    Math.min(months, Math.max(1, Math.ceil(requirement / monthlyPerPerson)));

  const openPeriod = addMonths(input.currentPeriod, 1);
  const flightsPeriod = addMonths(
    input.currentPeriod,
    monthFor(flights),
  );
  const accomPeriod = addMonths(
    input.currentPeriod,
    monthFor(flights + accommodation),
  );
  const fundedPeriod = addMonths(input.currentPeriod, months);

  const milestones: TripMilestone[] = [
    {
      key: "open",
      emoji: "🟢",
      label: "Pool opens",
      detail: `First R${monthlyPerPerson.toLocaleString("en-ZA")} in — everyone commits`,
      period: openPeriod,
    },
    {
      key: "flights",
      emoji: "✈️",
      label: "Flights funded",
      detail: `R${flights.toLocaleString("en-ZA")} pp — book early while fares are low`,
      period: flightsPeriod,
    },
    {
      key: "accommodation",
      emoji: "🏨",
      label: "Accommodation funded",
      detail: `R${accommodation.toLocaleString("en-ZA")} pp — lock in the stay`,
      period: accomPeriod,
    },
    {
      key: "funded",
      emoji: "💰",
      label: "Fully funded",
      detail: "Spending money + buffer in the pool",
      period: fundedPeriod,
    },
    {
      key: "depart",
      emoji: "🛫",
      label: "Wheels up",
      detail: "Nobody borrowed, nobody bailed.",
      period: fundedPeriod,
    },
  ];

  return {
    destination,
    perPerson: { flights, accommodation, dailySpend, visa, buffer, total },
    groupTotal: total * travellers,
    monthlyPerPerson,
    monthsToSave: months,
    days,
    milestones,
  };
}
