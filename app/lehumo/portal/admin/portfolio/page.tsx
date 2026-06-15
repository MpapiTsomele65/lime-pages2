import { getAdminSession } from "@/lib/admin-auth";
import { getFundPortfolio } from "@/lib/fund-settings";
import { AdminPageHeader } from "@/components/lehumo/admin/AdminPageHeader";
import { FundPortfolioEditor } from "@/components/lehumo/admin/FundPortfolioEditor";
import { FundInterestEditor } from "@/components/lehumo/admin/FundInterestEditor";

export const dynamic = "force-dynamic";

/**
 * Admin → Portfolio.
 *
 * Home for fund-level investment configuration that members see on the
 * portal's "Where is our money now?" card:
 *   - Current portfolio allocation + investment-strategy note
 *     (editable, backed by the Lehumo Fund Settings Airtable singleton).
 *   - Pool interest earned (currently env-driven; a manual in-dashboard
 *     input is the next addition here).
 *
 * Split out of Settings so investment management has its own home in
 * the Finance section of the sidebar. Auth gated at the layout level.
 */
export default async function AdminPortfolioPage() {
  const session = await getAdminSession();
  const email = session?.email ?? "Admin";
  const portfolio = await getFundPortfolio();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Admin · Portfolio"
        title="Portfolio management"
        subtitle="Current allocation, investment strategy, and pool interest — what members see on the portal."
        rightChip={email}
      />

      <FundPortfolioEditor initial={portfolio} />

      <FundInterestEditor initial={portfolio.interestEarned} />
    </div>
  );
}
