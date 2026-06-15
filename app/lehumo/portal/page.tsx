import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { getCommunityPoolStats, getMemberById } from "@/lib/airtable";
import { getFundPortfolio } from "@/lib/fund-settings";
import { isAdminEmail } from "@/lib/admin-auth";
import { getSastMonthInfo, isBeforeLaunch } from "@/lib/definitions";
import { getSastCurrentPeriod } from "@/lib/member-contributions-view";
import { siteUrl } from "@/lib/site-url";
import { PortalShell } from "@/components/lehumo/portal/PortalShell";
import { DashboardOverview } from "@/components/lehumo/portal/DashboardOverview";

/**
 * Portal landing page.
 *
 * Accepts optional `?payment=success&reference=xxx` query params — fired
 * by the Paystack callback URL when a member sets up automatic payments
 * from inside the portal (see `SetUpPaymentsCard.handleStandardSubscribe`
 * + the init route's `returnTo: "portal"` branch). When that flag is
 * present we call the verify endpoint synchronously **before** rendering
 * the dashboard, so the member's Airtable record reflects the new
 * contribution on first paint — bypassing the race against the Paystack
 * webhook. Verify is idempotent (it short-circuits if the contribution
 * row is already Paid), so it's safe even when the webhook beats us.
 */
export default async function PortalDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    payment?: string;
    reference?: string;
  }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/lehumo/portal/login");
  }

  // Resolve the Paystack callback params before we kick off the Airtable
  // reads, so the verify-then-read sequence keeps the dashboard data
  // fresh on bounce-back. We swallow verify errors — payment may still
  // have succeeded (the webhook will pick it up), and we'd rather show
  // the dashboard with a "may take a moment to reflect" banner than 500.
  const params = await searchParams;
  const paymentSuccess = params.payment === "success";

  if (paymentSuccess && params.reference) {
    try {
      // Server-to-server call — go straight to our own verify route via
      // siteUrl() so we re-use its existing idempotency + email logic.
      // `no-store` because we never want this call cached.
      await fetch(
        `${siteUrl()}/api/lehumo/paystack/verify?reference=${encodeURIComponent(
          params.reference,
        )}`,
        { cache: "no-store" },
      );
    } catch (err) {
      console.error(
        "[portal] paystack verify on bounce-back failed (webhook should catch up):",
        err,
      );
    }
  }

  const [member, communityStats, fundPortfolio] = await Promise.all([
    getMemberById(session.memberId),
    getCommunityPoolStats().catch((err) => {
      // Community stats are non-critical — don't break the dashboard if Airtable
      // returns an error for the list endpoint (e.g. permissions change).
      console.error("Failed to load community pool stats:", err);
      return null;
    }),
    // getFundPortfolio already resolves to a default-allocation fallback on
    // error, so it never rejects — but guard anyway for symmetry.
    getFundPortfolio().catch((err) => {
      console.error("Failed to load fund portfolio:", err);
      return null;
    }),
  ]);

  const memberName = member?.fullName ?? session.fullName ?? "Member";
  const isAdmin = isAdminEmail(session.email);

  if (!member) {
    return (
      <PortalShell memberName={memberName} isAdmin={isAdmin}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-[#0F2040] rounded-[20px] border border-white/[0.06] p-8 text-center max-w-md">
            <h2 className="text-xl font-semibold text-white mb-2">
              Member Not Found
            </h2>
            <p className="text-white/50 text-sm">
              We could not load your profile. Please contact support or try
              signing in again.
            </p>
          </div>
        </div>
      </PortalShell>
    );
  }

  // Compute SAST current-month + days-left server-side so the
  // contribution reminder card renders correctly on first paint and
  // doesn't rely on a useEffect to settle (which would flash the wrong
  // month for two hours either side of UTC midnight).
  const { monthCode: currentMonth, daysLeftInMonth } = getSastMonthInfo();

  // Period (YYYY-MM) is what the new Contributions table indexes on. Past
  // Phase 4 the reminder/grid use this to disambiguate Jun 2026 from Jun
  // 2027 etc — the legacy `currentMonth` (just "Jun") is ambiguous after
  // year 1.
  const currentPeriod = getSastCurrentPeriod();

  // Lehumo collections start 1 Jun 2026. Members onboarding before that
  // shouldn't see "Next due: Jan" / past-month catch-up prompts — gate
  // payment-prompt UI on this flag, computed server-side so SSR matches
  // the client.
  const beforeLaunch = isBeforeLaunch();

  return (
    <PortalShell memberName={memberName} isAdmin={isAdmin}>
      <DashboardOverview
        member={member}
        communityStats={communityStats}
        fundPortfolio={fundPortfolio}
        isAdmin={isAdmin}
        currentMonth={currentMonth}
        currentPeriod={currentPeriod}
        daysLeftInMonth={daysLeftInMonth}
        beforeLaunch={beforeLaunch}
        paymentSuccess={paymentSuccess}
      />
    </PortalShell>
  );
}
