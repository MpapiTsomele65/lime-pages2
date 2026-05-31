import { NextResponse } from "next/server";

/**
 * Downloadable .ics for the pre-launch Investor Brief on Sunday
 * 31 May 2026, 18:00–19:00 SAST. Linked from the pre-launch broadcast
 * email's "Add to calendar" button — Apple Calendar / Google Calendar
 * / Outlook all import this format and surface the event on the
 * member's calendar with an alarm 30 min before.
 *
 * One-off event (no RRULE) — this is a single info session, not a
 * series. Times encoded in UTC so we don't need a VTIMEZONE block;
 * client renders in viewer's local zone (which for SA members is
 * SAST regardless).
 *
 * Public — no auth gate. The info session details aren't sensitive
 * (the meeting link is the same one shared in the email body) and
 * not gating keeps the calendar download flow frictionless.
 */
export async function GET() {
  const TITLE = "Lehumo Investor brief: 1 Day to Launch";
  const MEET_LINK = "https://meet.google.com/pgk-vrpz-jrn";
  const DIAL_IN = "(ZA) +27 10 823 0373, PIN: 237 950 787#";
  const MORE_PHONES = "https://tel.meet/pgk-vrpz-jrn?pin=6975153689050";

  // 31 May 2026 18:00 SAST = 16:00 UTC. SAST is UTC+02:00 year-round
  // (no DST), so the conversion is fixed.
  const start = new Date("2026-05-31T18:00:00+02:00");
  const end = new Date("2026-05-31T19:00:00+02:00");

  const fmtUtc = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const dtstamp = fmtUtc(new Date());
  const uid = `lehumo-investor-brief-2026-05-31@limepages.co.za`;

  const description = [
    "Reminder for tonight's Lehumo Investor Brief — final session before we launch on Monday 1 June 2026.",
    "",
    `Google Meet: ${MEET_LINK}`,
    `Dial in: ${DIAL_IN}`,
    `More phone numbers: ${MORE_PHONES}`,
    "",
    "Bring questions about contributions, KYC, plans, or anything else you'd like clarity on before launch.",
  ]
    .join("\n")
    .replace(/\n/g, "\\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lime Pages//Lehumo Investor Brief//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${fmtUtc(start)}`,
    `DTEND:${fmtUtc(end)}`,
    `SUMMARY:${TITLE}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${MEET_LINK}`,
    "ORGANIZER;CN=Lehumo Trust:MAILTO:lehumo@limepages.co.za",
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    // 30-minute pre-meeting reminder. Calendar clients display this
    // as a notification half an hour before the session starts.
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${TITLE} starts in 30 minutes`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  const ics = lines.join("\r\n") + "\r\n";

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="lehumo-investor-brief-2026-05-31.ics"',
      // Short cache — the file content is static, but if we ever
      // need to push a correction (typo, wrong link) we don't want
      // members stuck on a stale copy.
      "Cache-Control": "public, max-age=600, must-revalidate",
    },
  });
}
