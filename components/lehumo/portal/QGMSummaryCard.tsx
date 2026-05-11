"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, Download, ExternalLink, Users } from "lucide-react";

import { PortalCard } from "./PortalCard";
import {
  getGoogleCalendarUrl,
  getNextQGM,
  listQGMs,
  QGM_END_TIME_SAST,
  QGM_HOST_EMAIL,
  QGM_START_TIME_SAST,
} from "@/lib/qgm";

/**
 * Quarterly General Meeting card.
 *
 * Renders the next upcoming QGM date prominently, with two add-to-calendar
 * actions (.ics download + Google Calendar deep link) and a list of the
 * next four meetings so members can plan ahead.
 *
 * Both calendar exports use an RRULE that covers all future quarterly
 * meetings — one add, the whole series appears in the member's calendar.
 * That's why the "Download .ics" button isn't tied to a specific date:
 * it's a subscription-style series, not a one-off event.
 *
 * Static + cheap: the date math runs entirely client-side (no API call)
 * via `lib/qgm.ts`, which has no React or Next.js dependencies. The
 * single network round-trip is the optional ICS download.
 */
export function QGMSummaryCard() {
  // useMemo so we don't re-enumerate every render. `now` is captured
  // once on mount — stale-by-a-few-seconds is harmless here (the next
  // QGM doesn't flip mid-session).
  const { next, upcoming, googleUrl } = useMemo(() => {
    const next = getNextQGM();
    const upcoming = listQGMs().slice(0, 4);
    const googleUrl = getGoogleCalendarUrl();
    return { next, upcoming, googleUrl };
  }, []);

  if (!next) {
    // Defensive — should never trigger inside the 5-year enumeration
    // window, but if it does we'd rather render nothing than show a
    // stale-looking placeholder.
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      aria-labelledby="qgm-card-title"
    >
      <PortalCard className="p-6 md:p-7">
        {/* Header row — icon + title + host chip */}
        <div className="flex items-start gap-4 mb-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#46CDCF]/15 text-[#46CDCF]">
            <Users className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-1">
              Quarterly General Meeting
            </p>
            <h2
              id="qgm-card-title"
              className="text-[17px] font-semibold tracking-tight text-white leading-tight"
            >
              Next general meeting
            </h2>
          </div>
        </div>

        {/* Date showcase — the single most important piece of info on
            the card. Big + bold so it reads at a glance. */}
        <div className="rounded-[16px] border border-[#B8FF00]/15 bg-gradient-to-br from-[#B8FF00]/[0.06] to-[#46CDCF]/[0.04] p-5 mb-5">
          <div className="flex items-baseline gap-2 mb-2">
            <Calendar className="h-4 w-4 text-[#B8FF00] shrink-0 self-center" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B8FF00]">
              Save the date
            </span>
          </div>
          <p className="text-[22px] md:text-[24px] font-semibold tracking-tight text-white leading-tight">
            {next.displayLong}
          </p>
          <p className="mt-2 text-[12.5px] text-white/55 leading-relaxed">
            {QGM_START_TIME_SAST}–{QGM_END_TIME_SAST} SAST · Virtual ·
            Investment update, governance committee report, member Q&amp;A
          </p>
          <p className="mt-3 text-[11px] text-white/40">
            Hosted by{" "}
            <a
              href={`mailto:${QGM_HOST_EMAIL}`}
              className="text-[#46CDCF] hover:text-[#B8FF00] transition-colors"
            >
              {QGM_HOST_EMAIL}
            </a>{" "}
            — meeting link circulated by email the day before.
          </p>
        </div>

        {/* Calendar actions — both subscribe the user to the entire
            quarterly series via RRULE, not just the next meeting. */}
        <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
          <a
            href="/api/lehumo/portal/qgm.ics"
            download="lehumo-qgm.ics"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-white/[0.08] hover:border-white/[0.15] transition-colors"
          >
            <Download className="h-4 w-4" />
            Download .ics (Apple / Outlook)
          </a>
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#46CDCF]/25 bg-[#46CDCF]/[0.08] px-4 py-2.5 text-[13px] font-semibold text-[#46CDCF] hover:bg-[#46CDCF]/[0.15] hover:border-[#46CDCF]/40 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Add to Google Calendar
          </a>
        </div>

        {/* Upcoming list — quietly subordinate to the headline date.
            Helps members planning ahead see the cadence at a glance. */}
        <div className="pt-5 border-t border-white/[0.06]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35 mb-3">
            Upcoming meetings
          </p>
          <ul className="space-y-2">
            {upcoming.map((q) => {
              const isNext = q.isoDate === next.isoDate;
              return (
                <li
                  key={q.isoDate}
                  className={`flex items-center justify-between text-[13px] ${
                    isNext ? "text-white" : "text-white/55"
                  }`}
                >
                  <span className="tracking-tight">{q.displayLong}</span>
                  {isNext && (
                    <span className="inline-flex items-center rounded-full bg-[#B8FF00]/[0.12] border border-[#B8FF00]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#B8FF00]">
                      Next
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </PortalCard>
    </motion.section>
  );
}
