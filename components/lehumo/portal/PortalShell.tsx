"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut, User } from "lucide-react";

interface PortalShellProps {
  memberName: string;
  children: React.ReactNode;
}

export function PortalShell({ memberName, children }: PortalShellProps) {
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
      {/* Top header bar */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0F2040]/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          {/* Left: Logo / Name */}
          <a
            href="/lehumo/portal"
            className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#B8FF00]/10">
              <span className="text-sm font-bold text-[#B8FF00]">L</span>
            </div>
            <span className="text-lg font-bold tracking-tight">Lehumo</span>
          </a>

          {/* Right: Member name + Logout */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-white/60">
              <User className="h-4 w-4" />
              <span>{memberName}</span>
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 rounded-full border border-white/[0.1] px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
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
