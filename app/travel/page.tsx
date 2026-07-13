import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";
import TripPlanner from "@/components/sections/travel/TripPlanner";

export const metadata: Metadata = {
  title: "Lime Travel (Beta) — Plan the trip. Pool the money. Land together.",
  description:
    "Pick a destination with your friends, see what each of you needs, and turn it into a monthly contribution with a funding timeline for flights, accommodation and spending money.",
};

/**
 * Lime Travel — Phase 1 (public planner).
 *
 * A budgeting planner + waitlist page: destination presets → per-person
 * estimate → suggested monthly contribution → funding timeline. No money
 * handling in this phase; the CTA captures leads for the trip-pool
 * launch (Phase 2 reuses the Lehumo pool engine).
 */
export default function TravelPage() {
  return (
    <div className="pt-[70px]">
      {/* ═══ HERO ═══ */}
      {/* Lime Travel deliberately avoids the Lehumo navy — its palette is
          lime + teal on white (à la Lime Capital) with soft gradient fills. */}
      <section className="bg-gradient-to-br from-teal-light via-white to-capital-light pt-14 sm:pt-20 pb-4">
        <Container>
          <div className="max-w-2xl">
            <span className="inline-flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#46CDCF]/40 bg-[#46CDCF]/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[1.2px] text-[#0d7d80]">
                ✈️ Lime Travel
              </span>
              <span className="rounded-full bg-gradient-to-r from-lime to-teal px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[1.2px] text-ink">
                Beta
              </span>
            </span>
            <h1 className="mt-4 text-[clamp(2rem,5vw,3.2rem)] font-extrabold leading-[1.08] tracking-tight text-[#0B0B0B]">
              Plan the trip. Pool the money.{" "}
              <span className="bg-gradient-to-r from-[#0d7d80] to-[#5c9a00] bg-clip-text text-transparent">
                Land together.
              </span>
            </h1>
            <p className="mt-4 text-[15px] leading-[1.75] text-[#6B7280]">
              Group trips die in the group chat because nobody knows what it
              really costs — or how to keep six people saving at the same
              pace. Pick where your crew is going and we&rsquo;ll estimate
              what each of you needs, then turn it into a monthly
              contribution and a funding timeline so flights and
              accommodation get booked on time, together.
            </p>
          </div>
        </Container>
      </section>

      {/* ═══ PLANNER ═══ */}
      <TripPlanner />

      {/* ═══ HOW A TRIP POOL WORKS ═══ */}
      <section className="py-14 bg-[#F8F9FA] border-t border-[#EDEDED]">
        <Container>
          <p className="text-[11px] font-bold uppercase tracking-[1.4px] text-[#0d7d80] mb-3">
            Coming next
          </p>
          <h2 className="text-[clamp(1.4rem,3vw,2rem)] font-extrabold tracking-tight text-[#0B0B0B] mb-8">
            How a trip pool works
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                n: "01",
                t: "Set the plan, invite the crew",
                d: "Lock the destination and dates, share one invite link, and everyone commits to the same monthly amount.",
              },
              {
                n: "02",
                t: "Contribute together, transparently",
                d: "Every payment lands in the shared pool — who's paid, who's behind, and each milestone's progress is visible to the whole group.",
              },
              {
                n: "03",
                t: "Book at each milestone",
                d: "Flights funded? Book while fares are low. Accommodation funded? Lock the villa. Every spend is logged with its receipt.",
              },
            ].map((s) => (
              <div
                key={s.n}
                className="rounded-2xl border border-[#EDEDED] bg-white p-6"
              >
                <span
                  aria-hidden
                  className="block h-1 w-10 rounded-full bg-gradient-to-r from-lime to-teal mb-4"
                />
                <p className="text-[12px] font-extrabold text-[#0d7d80]">
                  {s.n}
                </p>
                <h3 className="mt-2 text-[15.5px] font-bold text-[#0B0B0B]">
                  {s.t}
                </h3>
                <p className="mt-2 text-[13px] leading-[1.7] text-[#6B7280]">
                  {s.d}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}
