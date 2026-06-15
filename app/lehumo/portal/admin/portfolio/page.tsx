import { getAdminSession } from "@/lib/admin-auth";
import { getFundPortfolio } from "@/lib/fund-settings";
import { AdminPageHeader } from "@/components/lehumo/admin/AdminPageHeader";
import { FundPortfolioEditor } from "@/components/lehumo/admin/FundPortfolioEditor";

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

      {/* Pool interest — env-driven today; manual input is the next
          addition here (replaces the Vercel-env workflow below). */}
      <section
        className="rounded-[24px] border border-[#EDEDED] bg-gradient-to-b from-white to-[#FCFCFD] p-7"
        style={{
          boxShadow:
            "inset 0 1px 0 0 rgba(255, 255, 255, 0.6), " +
            "0 1px 2px 0 rgba(0, 0, 0, 0.04), " +
            "0 4px 16px -4px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-[17px] font-semibold tracking-tight text-[#0B0B0B]">
            Pool interest earned
          </h2>
          <span className="inline-flex items-center rounded-full bg-[#B8FF00]/15 border border-[#B8FF00]/40 px-2 py-0.5 text-[10.5px] font-semibold text-[#0B7A3B]">
            Manual input coming soon
          </span>
        </div>
        <p className="text-sm text-[#6B7280] mb-4">
          The dashboard&rsquo;s cumulative-interest number is currently driven by
          the{" "}
          <code className="rounded bg-[#F8F9FA] border border-[#E5E7EB] px-1.5 py-0.5 text-xs text-[#0B1933]">
            LEHUMO_INTEREST_EARNED_ZAR
          </code>{" "}
          and{" "}
          <code className="rounded bg-[#F8F9FA] border border-[#E5E7EB] px-1.5 py-0.5 text-xs text-[#0B1933]">
            LEHUMO_INTEREST_HISTORY_JSON
          </code>{" "}
          Vercel env vars. An in-dashboard manual input — backed by the same
          Fund Settings table as the allocation above — lands here next.
        </p>
        <p className="text-xs text-[#9CA3AF]">
          To update now: Vercel → Project Settings → Environment Variables →
          edit the two variables above → redeploy.
        </p>
      </section>
    </div>
  );
}
