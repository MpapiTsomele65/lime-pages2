import { NextResponse } from "next/server";

import { generateQGMIcs } from "@/lib/qgm";

/**
 * Downloadable ICS file for the QGM series.
 *
 * Linked from the portal's QGMSummaryCard "Download .ics" button. We
 * serve as `text/calendar` with a `Content-Disposition: attachment`
 * header so the browser triggers a download (Apple Calendar / Outlook
 * then pick the file up via OS handler).
 *
 * Public — no auth gate. The QGM dates aren't sensitive and we'd
 * rather not double-handle session checks on a static-feeling resource.
 * If we later decide only members should see this, swap to `getSession()`
 * + 401 on miss.
 */
export async function GET() {
  const ics = generateQGMIcs();

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="lehumo-qgm.ics"',
      // Short cache — the ICS content only changes if we tweak the
      // schedule constants, which is rare. 1 hour gives us a fast
      // bust-window if we do change anything.
      "Cache-Control": "public, max-age=3600, must-revalidate",
    },
  });
}
