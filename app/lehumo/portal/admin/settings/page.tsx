import Link from "next/link";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminPageHeader } from "@/components/lehumo/admin/AdminPageHeader";

export const dynamic = "force-dynamic";

/**
 * Admin → Settings.
 *
 * Home for operational configuration (env diagnostics, audit log,
 * scheduled-job toggles — future additions). Investment configuration
 * (portfolio allocation, strategy, pool interest) now lives in its own
 * Portfolio section under Finance.
 *
 * Auth is gated at the layout level.
 */
export default async function AdminSettingsPage() {
  const session = await getAdminSession();
  const email = session?.email ?? "Admin";

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Admin · Settings"
        title="Settings"
        subtitle="Operational configuration and toggles."
        rightChip={email}
      />

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
          Investment configuration has moved
        </h2>
        <p className="text-sm text-[#6B7280]">
          Portfolio allocation, the investment-strategy note, and pool
          interest now live under{" "}
          <Link
            href="/lehumo/portal/admin/portfolio"
            className="font-semibold text-[#0B1933] underline underline-offset-2 hover:text-[#46CDCF] transition-colors"
          >
            Portfolio
          </Link>{" "}
          in the Finance section. Operational toggles and diagnostics will
          land on this page.
        </p>
      </section>
    </div>
  );
}
