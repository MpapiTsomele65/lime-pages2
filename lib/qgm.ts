/**
 * Quarterly General Meeting (QGM) date math + calendar exports.
 *
 * Schedule: first Thursday of every 3rd month, starting September 2026.
 * Time: 18:00–19:30 SAST. Host: lehumo@limepages.co.za.
 *
 * Used by the portal's QGMSummaryCard (renders the upcoming meeting) and
 * the `/api/lehumo/portal/qgm.ics` endpoint (serves a downloadable ICS
 * with an RRULE that covers all future meetings in one calendar entry).
 *
 * SAST has no DST (fixed UTC+2 year-round), which keeps date math simple —
 * 18:00 SAST is always 16:00 UTC. We anchor every Date in UTC and lean on
 * `Africa/Johannesburg` formatters only for display.
 */

/** First QGM date — Thursday 3 September 2026, 18:00 SAST. */
export const QGM_FIRST_DATE_ISO = "2026-09-03";
export const QGM_START_TIME_SAST = "18:00";
export const QGM_END_TIME_SAST = "19:30";
export const QGM_DURATION_MIN = 90;
export const QGM_HOST_EMAIL = "lehumo@limepages.co.za";
export const QGM_TITLE = "Lehumo Quarterly General Meeting";
export const QGM_DESCRIPTION =
  "Quarterly AGM-style update for Lehumo members. Investment performance review, governance committee updates, and member Q&A. Hosted by lehumo@limepages.co.za — meeting link will be circulated by email closer to the date.";

export interface QGMDate {
  /** ISO date string, e.g. `2026-09-03`. SAST-relative. */
  isoDate: string;
  /** Full start datetime as a UTC Date (18:00 SAST = 16:00 UTC). */
  start: Date;
  /** Full end datetime as a UTC Date (19:30 SAST = 17:30 UTC). */
  end: Date;
  /** Pre-formatted SAST display, e.g. `Thursday, 3 September 2026`. */
  displayLong: string;
  /** Short SAST display, e.g. `3 Sept 2026`. */
  displayShort: string;
}

/**
 * First Thursday of the given year/month-zero. Loops through days 1–7
 * looking for `getUTCDay() === 4` (Thursday). Works in UTC so local
 * timezone offsets can't shift the result by a day.
 */
function firstThursday(year: number, monthZero: number): string {
  for (let day = 1; day <= 7; day++) {
    const d = new Date(Date.UTC(year, monthZero, day));
    if (d.getUTCDay() === 4) {
      const mm = String(monthZero + 1).padStart(2, "0");
      const dd = String(day).padStart(2, "0");
      return `${year}-${mm}-${dd}`;
    }
  }
  throw new Error(`unreachable: no Thursday in ${year}-${monthZero}`);
}

/**
 * Build a QGMDate record from an ISO date string. Pins the start/end to
 * 18:00 / 19:30 SAST (= 16:00 / 17:30 UTC) and pre-formats the display
 * variants using Africa/Johannesburg locale-aware formatting so the
 * portal renders the same string regardless of the viewer's timezone.
 */
function toQGMDate(isoDate: string): QGMDate {
  const start = new Date(`${isoDate}T${QGM_START_TIME_SAST}:00+02:00`);
  const end = new Date(`${isoDate}T${QGM_END_TIME_SAST}:00+02:00`);
  const displayLong = start.toLocaleDateString("en-ZA", {
    timeZone: "Africa/Johannesburg",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const displayShort = start.toLocaleDateString("en-ZA", {
    timeZone: "Africa/Johannesburg",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return { isoDate, start, end, displayLong, displayShort };
}

/**
 * Enumerate QGM dates starting Sept 2026, for `yearsAhead` years forward.
 * Months are March, June, September, December — every 3 months from
 * September. The first year (2026) only includes Sept + Dec since the
 * schedule starts in September.
 */
export function listQGMs(yearsAhead = 5): QGMDate[] {
  const out: QGMDate[] = [];
  const startYear = 2026;
  // 0-indexed months: Feb=1, May=4, Aug=7, Nov=10. Mar/Jun/Sep/Dec in
  // 1-indexed = months 3/6/9/12, so 0-indexed = 2/5/8/11.
  const QGM_MONTHS_ZERO = [2, 5, 8, 11];

  for (let y = startYear; y <= startYear + yearsAhead; y++) {
    for (const m of QGM_MONTHS_ZERO) {
      // Skip months before September 2026 (the first scheduled meeting).
      if (y === 2026 && m < 8) continue;
      out.push(toQGMDate(firstThursday(y, m)));
    }
  }
  return out;
}

/**
 * The next upcoming QGM relative to `now`. Returns null if we've run
 * past the enumerated horizon (which means it's time to extend
 * `listQGMs`'s default `yearsAhead`).
 */
export function getNextQGM(now: Date = new Date()): QGMDate | null {
  const all = listQGMs();
  return all.find((q) => q.start.getTime() > now.getTime()) ?? null;
}

/**
 * Generate the .ics calendar file content. Uses RRULE so a single VEVENT
 * covers every quarterly meeting — Apple Calendar, Google Calendar, and
 * Outlook all honour this. Times are expressed in UTC (suffix `Z`) so
 * we don't need to declare a VTIMEZONE block — calendar clients then
 * render the event in the viewer's local timezone, which for SA members
 * is SAST.
 *
 * The RRULE `FREQ=MONTHLY;INTERVAL=3;BYDAY=1TH` reads as: every 3 months,
 * on the 1st Thursday. Anchored to DTSTART (3 Sept 2026 18:00 SAST), this
 * generates exactly the schedule we want — Sept 2026, Dec 2026, Mar 2027,
 * Jun 2027, …
 */
export function generateQGMIcs(): string {
  // Anchor to the first meeting (Sept 3, 2026 18:00 SAST = 16:00 UTC).
  const start = new Date(
    `${QGM_FIRST_DATE_ISO}T${QGM_START_TIME_SAST}:00+02:00`,
  );
  const end = new Date(
    `${QGM_FIRST_DATE_ISO}T${QGM_END_TIME_SAST}:00+02:00`,
  );

  // Format as `YYYYMMDDTHHMMSSZ` (basic ISO 8601, no separators).
  const fmtUtc = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  // Stable UID so re-importing the .ics updates the existing series
  // instead of creating duplicates.
  const uid = "qgm-lehumo-2026-09-03@limepages.co.za";
  const dtstamp = fmtUtc(new Date());

  // Each line should be wrapped at 75 octets per RFC 5545. None of our
  // single-line fields are long enough to need folding, but we keep
  // DESCRIPTION on its own line and replace newlines with `\n` (the ICS
  // escape) so the calendar app renders the paragraph cleanly.
  const description = QGM_DESCRIPTION.replace(/\n/g, "\\n");

  // CRLF line endings are required by RFC 5545. Apple Calendar tolerates
  // LF but Outlook is stricter — emit CRLF to be safe.
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lime Pages//Lehumo QGM//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${fmtUtc(start)}`,
    `DTEND:${fmtUtc(end)}`,
    "RRULE:FREQ=MONTHLY;INTERVAL=3;BYDAY=1TH",
    `SUMMARY:${QGM_TITLE}`,
    `DESCRIPTION:${description}`,
    "LOCATION:Virtual — link to follow by email",
    `ORGANIZER;CN=Lehumo Trust:MAILTO:${QGM_HOST_EMAIL}`,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${QGM_TITLE} in 1 hour`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}

/**
 * Build a Google Calendar `render` URL that prompts the user to add the
 * recurring QGM series to their account. Uses the same RRULE so the
 * created event covers all future meetings, not just the next one.
 *
 * Note: Google Calendar's URL-based event creator expects `dates` in
 * UTC `YYYYMMDDTHHMMSSZ` format, and accepts an optional `recur` param
 * with a raw RRULE (URL-encoded). The `ctz` (calendar timezone) hint
 * keeps the displayed time in SAST for the user's calendar regardless
 * of where they sign in from.
 */
export function getGoogleCalendarUrl(): string {
  const start = new Date(
    `${QGM_FIRST_DATE_ISO}T${QGM_START_TIME_SAST}:00+02:00`,
  );
  const end = new Date(
    `${QGM_FIRST_DATE_ISO}T${QGM_END_TIME_SAST}:00+02:00`,
  );
  const fmtUtc = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: QGM_TITLE,
    dates: `${fmtUtc(start)}/${fmtUtc(end)}`,
    details: QGM_DESCRIPTION,
    location: "Virtual — link to follow by email",
    ctz: "Africa/Johannesburg",
    recur: "RRULE:FREQ=MONTHLY;INTERVAL=3;BYDAY=1TH",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
