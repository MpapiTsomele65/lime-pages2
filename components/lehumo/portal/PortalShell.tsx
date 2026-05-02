"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut, Shield, User } from "lucide-react";

interface PortalShellProps {
  memberName: string;
  isAdmin?: boolean;
  children: React.ReactNode;
}

export function PortalShell({
  memberName,
  isAdmin = false,
  children,
}: PortalShellProps) {
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
    <div className="min-h-screen flex flex-col">
      {/* Top header bar — Apple-flavoured chrome. Glass-blur over a
          translucent navy-mid keeps the radial gradient from the
          page background subtly visible as the user scrolls. The
          base hairline is a gradient (transparent → white/8 →
          transparent) instead of a solid border so it reads as a
          soft transition, not a harsh line. */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        className="sticky top-0 z-50 bg-[#0F2040]/70 backdrop-blur-2xl backdrop-saturate-150"
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-8">
          {/* Left: Logo / Name. Refined logo block — softer glow,
              tighter rounded radius, slightly smaller. */}
          <a
            href="/lehumo/portal"
            className="flex items-center gap-2.5 text-white hover:opacity-90 transition-opacity"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-gradient-to-br from-[#B8FF00]/[0.18] to-[#B8FF00]/[0.06] border border-[#B8FF00]/20 shadow-[0_0_20px_-4px_rgba(184,255,0,0.3)]">
              <span className="text-[13px] font-bold text-[#B8FF00] tracking-tight">L</span>
            </div>
            <span className="text-[15px] font-semibold tracking-tight">Lehumo</span>
          </a>

          {/* Right: Member name + Admin + Logout */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-[13px] text-white/55 mr-1">
              <User className="h-3.5 w-3.5" />
              <span className="font-medium">{memberName}</span>
            </div>

            {isAdmin && (
              <Link
                href="/lehumo/portal/admin"
                className="flex items-center gap-1.5 rounded-full border border-[#B8FF00]/25 bg-[#B8FF00]/[0.08] px-3 py-1.5 text-[11.5px] font-semibold text-[#B8FF00] hover:bg-[#B8FF00]/[0.14] hover:border-[#B8FF00]/40 transition-all duration-200"
              >
                <Shield className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-[11.5px] font-medium text-white/60 hover:text-white hover:border-white/15 hover:bg-white/[0.05] transition-all duration-200 disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {loggingOut ? "Signing out…" : "Sign Out"}
              </span>
            </button>
          </div>
        </div>

        {/* Soft gradient hairline at the bottom — replaces the solid
            white/[0.06] border. Reads as a transition from chrome to
            content instead of a hard line, which is the Apple way of
            handling a fixed-bar/scrolling-content boundary. */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      </motion.header>

      {/* Main content — slightly more vertical breathing room */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 md:px-8 py-10">
        {children}
      </main>
    </div>
  );
}
