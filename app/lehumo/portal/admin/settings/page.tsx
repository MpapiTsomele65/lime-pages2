import { getAdminSession } from "@/lib/admin-auth";
import { getFundPortfolio } from "@/lib/fund-settings";
import { AdminPageHeader } from "@/components/lehumo/admin/AdminPageHeader";
import { FundPortfolioEditor } from "@/components/lehumo/admin/FundPortfolioEditor";

export const dynamic = "force-dynamic";

/**
 * Admin → Settings.
 *
 * Placeholder home for pool / env / audit configuration that
 * currently lives outside the dashboard. Today it just surfaces
 * the manual Vercel-env editing instructions for pool interest;
 * future additions land here (in-dashboard editors, audit log,
 * env presence diagnostics, scheduled-job toggles).
 *
 * Auth is gated at the layout level.
 */
export default async function AdminSettingsPage() {
  const session = await getAdminSession();
  const email = session?.email ?? "Admin";
  const portfolio = await getFundPortfolio();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Admin · Settings"
        title="Settings"
        subtitle="Pool configuration, environment variables, and operational toggles."
        rightChip={email}
      />

      <FundPortfolioEditor initial={portfolio} />

      <section
        className="rounded-[24px] border border-[#EDEDED] bg-gradient-to-b from-white to-[#FCFCFD] p-7"
        style={{
          boxShadow:
            "inset 0 1px 0 0 rgba(255, 255, 255, 0.6), " +
            "0 1px 2px 0 rgba(0, 0, 0, 0.04), " +
            "0 4px 16px -4px rgba(0, 0, 0, 0.05)",
        }}
      >
        <h2 className="text-[17px] font-semibold tracking-tight text-[#0B0B0B] mb-1">
          Pool Interest Earned
        </h2>
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
          Vercel env vars. An in-dashboard editor backed by Airtable is on the
          next milestone.
        </p>
        <p className="text-xs text-[#9CA3AF]">
          To update now: Vercel → Project Settings → Environment Variables →
          edit the two variables above → redeploy.
        </p>
      </section>
    </div>
  );
}
