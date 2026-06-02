"use client";

/**
 * AdminSidebar — persistent left navigation for the admin portal.
 *
 * Visible at lg+ as a 240px-wide column flush against the main
 * content. Below lg it stays hidden and is opened via a hamburger
 * button in AdminShell's header (rendered as a slide-in drawer with
 * a backdrop overlay).
 *
 * Structure mirrors mature admin tools (Old Mutual, Linear, Stripe):
 *   - Top-level items (no group label) at the top
 *   - Uppercase group labels separating themed clusters below
 *   - Tight row density (py-2, 13px label) so dense IA still scans
 *
 * Active state: lime left-rail accent (3px) + subtle navy tint on
 * the row + bold-leaning weight on the label. `aria-current="page"`
 * for screen readers.
 *
 * Mobile: slide-in drawer with backdrop overlay, dismisses on
 * Escape / backdrop click / nav-item click. Body scroll locks
 * while open. Slide animation respects prefers-reduced-motion via
 * the global guard in globals.css.
 */

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Banknote,
  Mail,
  Settings,
  X,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  /** Section header shown above the items. Null for the
   *  top-level items that sit above the first labelled group. */
  label: string | null;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [
      {
        label: "Overview",
        href: "/lehumo/portal/admin",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Members",
    items: [
      {
        label: "Members",
        href: "/lehumo/portal/admin/members",
        icon: Users,
      },
      {
        label: "KYC Review",
        href: "/lehumo/portal/admin/kyc",
        icon: ShieldCheck,
      },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        label: "Contributions",
        href: "/lehumo/portal/admin/contributions",
        icon: Banknote,
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        label: "Communications",
        href: "/lehumo/portal/admin/comms",
        icon: Mail,
      },
      {
        label: "Settings",
        href: "/lehumo/portal/admin/settings",
        icon: Settings,
      },
    ],
  },
];

/**
 * Check whether the given href matches the current pathname.
 * Exact match for the Overview root so that nested sub-routes
 * don't all light up the Overview tab. Sub-routes use a "starts
 * with" check so deeper paths still highlight their parent
 * (future-proofing for nested routes within Members / KYC etc).
 */
function isActive(pathname: string, href: string): boolean {
  if (href === "/lehumo/portal/admin") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface AdminSidebarProps {
  /** Controls mobile drawer visibility. Persistent sidebar at lg+
   *  ignores this. */
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function AdminSidebar({ mobileOpen, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname();

  // Close on Escape when the mobile drawer is open. Skipped at lg+
  // because the drawer state doesn't apply there.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onMobileClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, onMobileClose]);

  // Lock body scroll while the drawer is open so the page underneath
  // doesn't scroll-bleed when the user pans within the drawer.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const navList = (
    <nav aria-label="Admin sections" className="px-3">
      {NAV_GROUPS.map((group, gIdx) => (
        <div key={group.label ?? `top-${gIdx}`} className={gIdx > 0 ? "mt-5" : ""}>
          {group.label && (
            <p className="px-3 mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">
              {group.label}
            </p>
          )}
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={onMobileClose}
                  className={`group relative flex items-center gap-2.5 rounded-md px-3 py-2 transition-colors ${
                    active
                      ? "bg-[#0B1933]/[0.05] text-[#0B1933]"
                      : "text-[#52525B] hover:bg-[#0B1933]/[0.03] hover:text-[#0B1933]"
                  }`}
                >
                  {/* Lime active rail — 3px on the left edge. Sits
                      ABSOLUTE inside the rounded row so the rounding
                      doesn't clip it; rendered conditionally to keep
                      inactive rows clean. */}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[#B8FF00]"
                    />
                  )}
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      active
                        ? "text-[#0B1933]"
                        : "text-[#9CA3AF] group-hover:text-[#0B1933]"
                    }`}
                  />
                  <span
                    className={`text-[13px] leading-tight ${
                      active ? "font-semibold" : "font-medium"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Persistent sidebar — visible at lg+ only. Sticks to the top
          of the viewport beneath the header so it stays accessible
          during long page scrolls. */}
      <aside
        aria-label="Admin navigation"
        className="hidden lg:block w-60 shrink-0 border-r border-[#EDEDED] bg-white/40 backdrop-blur-sm"
      >
        <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto py-6">
          <p className="px-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9CA3AF] mb-3">
            Admin
          </p>
          {navList}
        </div>
      </aside>

      {/* Mobile drawer — overlay + slide-in panel. AnimatePresence so
          the exit animation finishes before unmount, otherwise the
          drawer would just snap-disappear. */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="admin-sidebar-mobile"
            className="lg:hidden fixed inset-0 z-[60]"
            aria-modal="true"
            role="dialog"
            aria-label="Admin navigation"
          >
            {/* Backdrop — clicking dismisses. Lower opacity than a
                full modal because this is navigation, not a critical
                interruption. */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={onMobileClose}
              className="absolute inset-0 bg-[#0B1933]/40 backdrop-blur-sm"
            />
            {/* Slide-in panel */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              className="relative h-full w-[280px] bg-white shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#EDEDED]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">
                  Admin
                </p>
                <button
                  type="button"
                  onClick={onMobileClose}
                  aria-label="Close navigation"
                  className="h-8 w-8 rounded-full bg-[#F8F9FA] hover:bg-[#EDEDED] flex items-center justify-center text-[#6B7280] hover:text-[#0B1933] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-4">{navList}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
