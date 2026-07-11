import { getSession } from "@/lib/session";
import { getCommunityPoolStats, getMemberById } from "@/lib/airtable";
import { isAdminEmail } from "@/lib/admin-auth";
import { getSastMonthInfo, isBeforeLaunch } from "@/lib/definitions";
import { getSastCurrentPeriod } from "@/lib/member-contributions-view";
import { siteUrl } from "@/lib/site-url";
import { OverviewSection } from "@/components/lehumo/portal/sections/OverviewSection";
import { MemberNotFound } from "@/components/lehumo/portal/MemberNotFound";

/**
 * Portal Overview (landing) — URL `/lehumo/portal`.
 *
 * Accepts `?payment=success&reference=xxx` from the Paystack callback
 * (the bounce-back always lands here). We verify synchronously before
 * rendering so the dashboard reflects the new contribution on first
 * paint; verify is idempotent, so it's safe even when the webhook wins.
 *
 * Fetches the member + community stats — the pool + leaderboard now live
 * on the landing (surfaced from the same read the Community section uses).
 */
export default async function PortalOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string; reference?: string }>;
}) {
  const session = await getSession();
  if (!session) return null; // layout already redirected

  const params = await searchParams;
  const paymentSuccess = params.payment === "success";

  if (paymentSuccess && params.reference) {
    try {
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

  const [member, communityStats] = await Promise.all([
    getMemberById(session.memberId),
    getCommunityPoolStats().catch((err) => {
      console.error("Failed to load community pool stats:", err);
      return null;
    }),
  ]);

  if (!member) return <MemberNotFound />;

  const { monthCode: currentMonth, daysLeftInMonth } = getSastMonthInfo();
  const currentPeriod = getSastCurrentPeriod();

  return (
    <OverviewSection
      member={member}
      communityStats={communityStats}
      isAdmin={isAdminEmail(session.email)}
      currentMonth={currentMonth}
      currentPeriod={currentPeriod}
      daysLeftInMonth={daysLeftInMonth}
      beforeLaunch={isBeforeLaunch()}
      paymentSuccess={paymentSuccess}
    />
  );
}
