import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/lehumo/admin/AdminShell";

/**
 * Admin route segment layout.
 *
 * Hosts the single source of truth for the admin auth gate. Next.js
 * runs the layout's server code on every nested route under
 * /lehumo/portal/admin/*, so anything that needs admin access is
 * automatically protected without per-page boilerplate. Previously
 * the check lived at the top of page.tsx; with the split into
 * Overview / Members / KYC / Comms / Settings, a layout-level guard
 * keeps every sub-route safe without risking one being forgotten on
 * a new file.
 *
 * The shell itself (header + persistent sidebar + mobile drawer)
 * also lives here so the chrome stays mounted across client-side
 * navigations between sub-routes — no re-render flash when the
 * sidebar's active item changes.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/lehumo/portal/login");
  }

  return (
    <AdminShell memberName={session.fullName || "Admin"}>{children}</AdminShell>
  );
}
