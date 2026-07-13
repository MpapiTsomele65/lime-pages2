"use client";

/**
 * TripPlanner — the interactive Lime Travel planner on /travel.
 *
 * Pick a destination (photo tiles), set the group + dates, and the
 * planner computes the per-person cost breakdown, a suggested monthly
 * contribution, and the funding timeline (flights funded → book,
 * accommodation funded → book, fully funded → depart). Ends in the
 * trip-pool waitlist form (reuses the existing leads endpoint with the
 * trip context in the notes).
 *
 * Everything computes client-side via lib/lime-travel — no server
 * round-trips until the waitlist submits.
 */

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Users } from "lucide-react";

import { Container } from "@/components/ui/Container";
import {
  DESTINATIONS,
  ROOM_OCCUPANCY,
  addMonths,
  computeTripPlan,
  labelPeriod,
  monthDiff,
} from "@/lib/lime-travel";

const R = (n: number) => `R${n.toLocaleString("en-ZA")}`;

const TRAVELLER_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const NIGHT_OPTIONS = [3, 5, 7, 10, 14];

export default function TripPlanner() {
  // SAST "now" as YYYY-MM — the anchor every timeline label derives from.
  const currentPeriod = useMemo(
    () =>
      new Date()
        .toLocaleDateString("en-CA", { timeZone: "Africa/Johannesburg" })
        .slice(0, 7),
    [],
  );

  // Departure choices: 3–18 months out.
  const departureOptions = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => addMonths(currentPeriod, i + 3)),
    [currentPeriod],
  );

  const [destinationId, setDestinationId] = useState("zanzibar");
  const [travellers, setTravellers] = useState(6);
  const [nights, setNights] = useState(7);
  const [departure, setDeparture] = useState(
    () => addMonths(currentPeriod, 10),
  );

  const monthsToSave = Math.max(1, monthDiff(currentPeriod, departure));
  const plan = useMemo(
    () =>
      computeTripPlan({
        destinationId,
        travellers,
        nights,
        monthsToSave,
        currentPeriod,
      }),
    [destinationId, travellers, nights, monthsToSave, currentPeriod],
  );

  // ── Waitlist form state ──
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [joined, setJoined] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function joinWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);
    if (fullName.trim().length < 2 || !email.includes("@")) {
      setFormError("Add your name and a valid email so we can reach you.");
      return;
    }
    setSubmitting(true);
    try {
      await fetch("/api/lehumo/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          source: "Lime Travel — Waitlist",
          notes:
            `Trip plan: ${plan.destination.name} · ${travellers} travellers · ` +
            `${nights} nights · depart ${labelPeriod(departure)} · ` +
            `±${R(plan.monthlyPerPerson)}/mo pp · pool ${R(plan.groupTotal)}`,
        }),
      });
      setJoined(true);
    } catch {
      setFormError("Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="planner" className="py-14 sm:py-16 bg-white">
      <Container>
        {/* ── 1 · Destination ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <p className="text-[10.5px] font-extrabold tracking-[0.14em] uppercase text-[#9CA3AF] mb-3">
            1 · Where are you headed?
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {DESTINATIONS.map((d) => {
              const selected = d.id === destinationId;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDestinationId(d.id)}
                  aria-pressed={selected}
                  className={`group overflow-hidden rounded-[14px] border bg-white text-left transition-all ${
                    selected
                      ? "border-[#0d7d80] ring-2 ring-[#0d7d80]"
                      : "border-[#E5E7EB] hover:border-[#0d7d80]/50 hover:-translate-y-0.5"
                  }`}
                >
                  <div className="relative h-24 bg-[#dbe4e6]">
                    <Image
                      src={d.photo}
                      alt={d.photoAlt}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 170px"
                      className="object-cover"
                    />
                    {selected && (
                      <span className="absolute top-2 right-2 rounded-full bg-[#B8FF00] px-2 py-0.5 text-[10px] font-extrabold text-[#083f41] shadow">
                        ✓ Selected
                      </span>
                    )}
                  </div>
                  <div className="px-3 py-2.5">
                    <p className="text-[13px] font-bold text-[#0B0B0B]">
                      {d.name}
                    </p>
                    <p
                      className={`text-[11px] mt-0.5 ${
                        selected
                          ? "font-semibold text-[#0d7d80]"
                          : "text-[#6B7280]"
                      }`}
                    >
                      ± {R(
                        computeTripPlan({
                          destinationId: d.id,
                          travellers,
                          nights,
                          monthsToSave,
                          currentPeriod,
                        }).perPerson.total,
                      )}{" "}
                      pp
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[12px] text-[#6B7280]">
            {plan.destination.blurb}
          </p>
        </motion.div>

        {/* ── 2 · The trip ── */}
        <p className="text-[10.5px] font-extrabold tracking-[0.14em] uppercase text-[#9CA3AF] mt-8 mb-3">
          2 · Your trip
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <label className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] px-4 py-3 block">
            <span className="block text-[10px] font-bold tracking-[0.1em] uppercase text-[#9CA3AF]">
              Travellers
            </span>
            <select
              value={travellers}
              onChange={(e) => setTravellers(Number(e.target.value))}
              className="mt-1 w-full bg-transparent text-[15px] font-bold text-[#0B0B0B] outline-none cursor-pointer"
            >
              {TRAVELLER_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} friends
                </option>
              ))}
            </select>
          </label>
          <label className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] px-4 py-3 block">
            <span className="block text-[10px] font-bold tracking-[0.1em] uppercase text-[#9CA3AF]">
              Nights
            </span>
            <select
              value={nights}
              onChange={(e) => setNights(Number(e.target.value))}
              className="mt-1 w-full bg-transparent text-[15px] font-bold text-[#0B0B0B] outline-none cursor-pointer"
            >
              {NIGHT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} nights
                </option>
              ))}
            </select>
          </label>
          <label className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] px-4 py-3 block">
            <span className="block text-[10px] font-bold tracking-[0.1em] uppercase text-[#9CA3AF]">
              Departure
            </span>
            <select
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
              className="mt-1 w-full bg-transparent text-[15px] font-bold text-[#0B0B0B] outline-none cursor-pointer"
            >
              {departureOptions.map((p) => (
                <option key={p} value={p}>
                  {labelPeriod(p)}
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] px-4 py-3">
            <span className="block text-[10px] font-bold tracking-[0.1em] uppercase text-[#9CA3AF]">
              Months to save
            </span>
            <span className="mt-1 block text-[15px] font-bold text-[#0B0B0B]">
              {monthsToSave}
            </span>
          </div>
        </div>

        {/* ── 3 · What it takes ── */}
        <p className="text-[10.5px] font-extrabold tracking-[0.14em] uppercase text-[#9CA3AF] mt-8 mb-3">
          3 · What it takes
        </p>
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-3.5">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <h3 className="text-[13px] font-extrabold text-[#0B0B0B] mb-2">
              Per person — {plan.destination.name}, {nights} nights
            </h3>
            <BreakdownRow label={`✈️ Return flights (from JNB)`} value={plan.perPerson.flights} />
            <BreakdownRow
              label={`🏨 Accommodation · ${R(plan.destination.accomPerNightZar)}/night ÷ ${ROOM_OCCUPANCY} sharing`}
              value={plan.perPerson.accommodation}
            />
            <BreakdownRow
              label={`🍽️ Food, transport & activities · ${R(plan.destination.dailySpendZar)} × ${plan.days} days`}
              value={plan.perPerson.dailySpend}
            />
            <BreakdownRow label="🛂 Visa" value={plan.perPerson.visa} />
            <BreakdownRow label="🛟 10% buffer (prices move)" value={plan.perPerson.buffer} />
            <div className="flex justify-between pt-2.5 text-[14px] font-extrabold text-[#0B0B0B]">
              <span>Total per person</span>
              <span className="tabular-nums text-[#0d7d80]">
                {R(plan.perPerson.total)}
              </span>
            </div>
          </div>

          {/* Deep-teal gradient (not Lehumo navy) — dark enough that the
              white/70 secondary text still clears WCAG AA. */}
          <div className="rounded-2xl bg-gradient-to-br from-[#0b686b] to-[#083f41] shadow-teal-glow p-5 text-white flex flex-col justify-center">
            <p className="text-[10.5px] font-bold tracking-[0.14em] uppercase text-white/70">
              Suggested contribution
            </p>
            <p className="text-[38px] font-extrabold tracking-tight text-[#B8FF00] tabular-nums leading-none mt-2">
              {R(plan.monthlyPerPerson)}
            </p>
            <p className="text-[12.5px] text-white/70 mt-1.5">
              per person / month · {monthsToSave} months
            </p>
            <p className="mt-3 pt-3 border-t border-white/15 text-[12.5px] text-white/70 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Group pool target:{" "}
              <span className="font-bold text-white tabular-nums">
                {R(plan.groupTotal)}
              </span>
            </p>
          </div>
        </div>

        {/* ── Funding timeline ── */}
        <div className="mt-4 rounded-2xl border border-[#E5E7EB] bg-gradient-to-br from-teal-light to-capital-light p-5">
          <h3 className="text-[13px] font-extrabold text-[#0B0B0B] mb-3.5">
            Your funding timeline
          </h3>
          <ol className="relative ml-1.5">
            <span
              aria-hidden
              className="absolute left-0 top-1 bottom-1 w-[2px] rounded-full bg-gradient-to-b from-[#46CDCF] to-[#B8FF00]"
            />
            {plan.milestones.map((m) => (
              <li key={m.key} className="relative pl-5 pb-3.5 last:pb-0">
                <span
                  aria-hidden
                  className={`absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-white shadow-[0_0_0_1px_#0d7d80] ${
                    m.key === "flights" ||
                    m.key === "accommodation" ||
                    m.key === "funded"
                      ? "bg-[#B8FF00]"
                      : "bg-[#0d7d80]"
                  }`}
                />
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <span className="w-[86px] shrink-0 text-[11.5px] font-bold text-[#0d7d80]">
                    {labelPeriod(m.period)}
                  </span>
                  <span className="text-[13px] text-[#374151]">
                    <b className="text-[#0B0B0B]">
                      {m.emoji} {m.label}
                    </b>{" "}
                    — {m.detail}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* ── Waitlist CTA ── */}
        <div className="mt-5 rounded-2xl bg-gradient-to-br from-[#0d7d80] to-[#083f41] p-6 sm:p-7">
          {joined ? (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 shrink-0 text-[#B8FF00]" />
              <div>
                <p className="text-[15px] font-bold text-white">
                  You&rsquo;re on the list 🎉
                </p>
                <p className="mt-1 text-[13px] text-white/70 leading-relaxed">
                  We&rsquo;ll email you the moment trip pools open — with your{" "}
                  {plan.destination.name} plan saved and ready to share with
                  the crew.
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-[16px] font-extrabold text-white">
                Start your trip pool
              </p>
              <p className="mt-1 mb-4 text-[13px] text-white/70 leading-relaxed max-w-xl">
                Trip pools are launching soon — invite your friends, and we
                track every contribution and milestone on the same engine our
                Lehumo community saves toward R2 million with. Join the
                waitlist and we&rsquo;ll bring your plan with you.
              </p>
              <form
                onSubmit={joinWaitlist}
                className="grid sm:grid-cols-[1fr_1.2fr_1fr_auto] gap-2.5"
              >
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  className="rounded-xl bg-white/[0.06] border border-white/15 px-4 py-3 text-[13.5px] text-white placeholder:text-white/40 outline-none focus:border-[#B8FF00]/60"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="rounded-xl bg-white/[0.06] border border-white/15 px-4 py-3 text-[13.5px] text-white placeholder:text-white/40 outline-none focus:border-[#B8FF00]/60"
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="WhatsApp (optional)"
                  className="rounded-xl bg-white/[0.06] border border-white/15 px-4 py-3 text-[13.5px] text-white placeholder:text-white/40 outline-none focus:border-[#B8FF00]/60"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#B8FF00] px-6 py-3 text-[13.5px] font-extrabold text-[#083f41] hover:bg-[#a8ef00] transition-colors disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  ) : (
                    "Join the waitlist"
                  )}
                </button>
              </form>
              {formError && (
                <p className="mt-2 text-[12px] text-red-300">{formError}</p>
              )}
            </>
          )}
        </div>

        <p className="mt-4 text-[11.5px] text-[#9CA3AF] leading-relaxed">
          Estimates only — flight and accommodation prices vary by season and
          how early you book. Lime Pages is not a travel agent or a registered
          financial services provider; the planner is a budgeting tool.
        </p>
      </Container>
    </section>
  );
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-[#F3F4F6] text-[13px]">
      <span className="text-[#374151]">{label}</span>
      <span className="tabular-nums font-semibold text-[#0B0B0B]">
        {R(value)}
      </span>
    </div>
  );
}
