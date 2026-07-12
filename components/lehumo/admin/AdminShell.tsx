"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, LogOut, Menu, User } from "lucide-react";

import { AdminSidebar } from "./AdminSidebar";

interface AdminShellProps {
  memberName: string;
  /** True for regular (non-super) admins — they can view every admin
   *  surface but money-mutating actions are rejected server-side. The
   *  shell surfaces the tier so the state is never a surprise. */
  readOnly?: boolean;
  children: React.ReactNode;
}

/**
 * Light-theme shell used exclusively for the admin panel. Mirrors the
 * dark PortalShell (member dashboard) but on a white/snow background so
 * it matches the main Lime Pages marketing design system.
 *
 * Layout:
 *   - Top header bar (sticky, full-width, hamburger on the left at <lg)
 *   - Two-column body: persistent sidebar (lg+) | main content
 *   - Mobile: sidebar collapses to a slide-in drawer behind the
 *     hamburger button
 *
 * AdminSidebar is rendered directly here rather than passed as a
 * slot — there's only one consumer, and tying the sidebar's open
 * state to the header's hamburger requires shared state that lives
 * in this component.
 */
export function AdminShell({
  memberName,
  readOnly = false,
  children,
}: AdminShellProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/lehumo/auth/logout", { method: "POST" });
      router.push("/lehumo");
    } catch {
      setLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#0B0B0B] relative overflow-x-hidden">
      {/* Top header bar — Apple-flavoured chrome. Backdrop-saturate-150
          gives the glass blur a slight pop on warm/cool backgrounds
          (the trick used in macOS Big Sur+). The base hairline is a
          gradient (transparent → black/8 → transparent) instead of a
          solid border — reads as a soft transition between chrome and
          content, not a hard line. */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        className="sticky top-0 z-50 bg-white/70 backdrop-blur-2xl backdrop-saturate-150"
      >
        <div className="mx-auto flex h-14 items-center justify-between px-4 md:px-8">
          {/* Left: hamburger (<lg) + back-to-portal + brand */}
          <div className="flex items-center gap-3">
            {/* Mobile nav toggle — visible below lg only. The lg+ side
                has the persistent sidebar instead, so the hamburger
                would be redundant there. */}
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
              aria-expanded={mobileNavOpen}
              className="lg:hidden -ml-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-[#6B7280] hover:bg-[#0B1933]/[0.04] hover:text-[#0B1933] transition-colors"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>

            <Link
              href="/lehumo/portal"
              className="flex items-center gap-1.5 text-[12px] font-medium text-[#6B7280] hover:text-[#0B1933] transition-colors"
              title="Back to member dashboard"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Portal</span>
            </Link>

            <span className="h-5 w-px bg-[#E5E7EB]" aria-hidden />

            <Link
              href="/lehumo/portal/admin"
              className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-gradient-to-br from-[#0B1933] to-[#0F2040] shadow-[0_2px_6px_-1px_rgba(11,25,51,0.3)]">
                <span className="text-[13px] font-bold text-[#B8FF00] tracking-tight">L</span>
              </div>
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-[15px] font-semibold tracking-tight text-[#0B1933]">
                  Lehumo
                </span>
                <span className="text-[9px] uppercase tracking-[0.18em] text-[#9CA3AF] font-semibold mt-0.5">
                  Admin
                </span>
              </div>
            </Link>

            {readOnly && (
              <span
                className="inline-flex items-center rounded-full border border-[#F59E0B]/40 bg-[#FEF3C7]/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#92400E]"
                title="You can review every admin surface; only the super user can change contributions or money settings."
              >
                Read-only
              </span>
            )}
          </div>

          {/* Right: Member name + Logout */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-[13px] text-[#6B7280] mr-1">
              <User className="h-3.5 w-3.5" />
              <span className="font-medium">{memberName}</span>
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white/50 px-3 py-1.5 text-[11.5px] font-medium text-[#6B7280] hover:text-[#0B1933] hover:border-[#0B1933]/20 hover:bg-white transition-all duration-200 disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {loggingOut ? "Signing out…" : "Sign Out"}
              </span>
            </button>
          </div>
        </div>

        {/* Soft gradient hairline at the bottom — replaces the solid
            E5E7EB border. Reads as a fade between chrome and content
            rather than a hard rule, the macOS / iOS pattern for
            sticky-bar/scrolling-content boundaries. */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-black/[0.08] to-transparent" />
      </motion.header>

      {/* Body — sidebar + main content. Sidebar is sticky inside its
          own column so it doesn't scroll-disappear during long page
          scrolls; main content gets the previous max-w-7xl padding
          envelope so existing pages aren't squeezed by the column. */}
      <div className="flex flex-1">
        <AdminSidebar
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
        />
        <main className="flex-1 min-w-0">
          <div className="mx-auto w-full max-w-7xl px-4 md:px-8 py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
