"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, LogOut, User } from "lucide-react";

interface AdminShellProps {
  memberName: string;
  children: React.ReactNode;
}

/**
 * Light-theme shell used exclusively for the admin panel. Mirrors the
 * dark PortalShell (member dashboard) but on a white/snow background so
 * it matches the main Lime Pages marketing design system.
 */
export function AdminShell({ memberName, children }: AdminShellProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

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
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#0B0B0B]">
      {/* Top header bar */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white/85 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          {/* Left: Back-to-portal + brand */}
          <div className="flex items-center gap-3">
            <Link
              href="/lehumo/portal"
              className="flex items-center gap-1.5 text-xs font-medium text-[#6B7280] hover:text-[#0B1933] transition-colors"
              title="Back to member dashboard"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Portal</span>
            </Link>

            <span className="h-5 w-px bg-[#E5E7EB]" aria-hidden />

            <Link
              href="/lehumo/portal/admin"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B1933]">
                <span className="text-sm font-bold text-[#B8FF00]">L</span>
              </div>
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-base font-bold tracking-tight text-[#0B1933]">
                  Lehumo
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#6B7280]">
                  Admin
                </span>
              </div>
            </Link>
          </div>

          {/* Right: Member name + Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-[#6B7280]">
              <User className="h-4 w-4" />
              <span>{memberName}</span>
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 rounded-full border border-[#E5E7EB] px-3 py-1.5 text-xs font-medium text-[#6B7280] hover:text-[#0B1933] hover:border-[#0B1933]/20 transition-colors disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {loggingOut ? "Signing out..." : "Sign Out"}
              </span>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 md:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
