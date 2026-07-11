"use client";

/**
 * PortalSidebar — persistent left navigation for the member portal.
 *
 * Dark-theme sibling of the admin AdminSidebar. Visible at lg+ as a
 * 240px column flush against the main content; below lg it collapses
 * behind the header hamburger and opens as a slide-in drawer.
 *
 * The member dashboard used to be one long scroll of ~18 cards; this
 * files those into seven routed sections so members jump straight to
 * what they need. Active state uses a lime left-rail + aria-current.
 *
 * Accessibility: nav/aside landmarks, aria-current="page", 44px rows,
 * and (drawer) Escape/backdrop dismiss, body-scroll-lock, role=dialog
 * + focus moved into the panel on open. Motion respects
 * prefers-reduced-motion via the global guard in globals.css.
 */

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Banknote,
  LifeBuoy,
  Users,
  UserRound,
  ShieldCheck,
  GraduationCap,
  X,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  /** Section header above the items. Null for the top-level items and
   *  the trailing Learn item that sit outside a labelled group. */
  label: string | null;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [
      { label: "Overview", href: "/lehumo/portal", icon: LayoutDashboard },
    ],
  },
  {
    label: "My money",
    items: [
      {
        label: "Manage my contributions",
        href: "/lehumo/portal/contributions",
        icon: Banknote,
      },
      {
        label: "Emergency Loans",
        href: "/lehumo/portal/emergency",
        icon: LifeBuoy,
      },
    ],
  },
  {
    label: "Community",
    items: [
      { label: "Lehumo community", href: "/lehumo/portal/community", icon: Users },
    ],
  },
  {
    label: "My account",
    items: [
      { label: "Profile", href: "/lehumo/portal/profile", icon: UserRound },
      {
        label: "KYC/FICA Documents",
        href: "/lehumo/portal/kyc",
        icon: ShieldCheck,
      },
    ],
  },
  {
    label: null,
    items: [
      { label: "Learn", href: "/lehumo/portal/learn", icon: GraduationCap },
    ],
  },
];

/**
 * Active check. Exact match for the Overview root so nested sections
 * don't all light Overview; sub-routes use a "starts with" check so
 * deeper paths still highlight their parent.
 */
function isActive(pathname: string, href: string): boolean {
  if (href === "/lehumo/portal") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface PortalSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function PortalSidebar({ mobileOpen, onMobileClose }: PortalSidebarProps) {
  const pathname = usePathname();
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Escape closes the mobile drawer.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onMobileClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, onMobileClose]);

  // Lock body scroll + move focus into the panel while the drawer is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const navList = (
    <nav aria-label="Portal sections" className="px-3">
      {NAV_GROUPS.map((group, gIdx) => (
        <div key={group.label ?? `top-${gIdx}`} className={gIdx > 0 ? "mt-5" : ""}>
          {group.label && (
            <p className="px-3 mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/55">
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
                  className={`group relative flex min-h-[44px] items-center gap-2.5 rounded-md px-3 py-2 transition-colors ${
                    active
                      ? "bg-white/[0.05] text-white"
                      : "text-white/60 hover:bg-white/[0.03] hover:text-white"
                  }`}
                >
                  {active && (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[#B8FF00]"
                    />
                  )}
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      active
                        ? "text-[#B8FF00]"
                        : "text-white/60 group-hover:text-white/80"
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
      {/* Persistent sidebar — lg+ only, sticky under the header. */}
      <aside
        aria-label="Portal navigation"
        className="hidden lg:block w-60 shrink-0 border-r border-white/[0.06] bg-white/[0.015]"
      >
        <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto py-6">
          <p className="px-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55 mb-3">
            Menu
          </p>
          {navList}
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="portal-sidebar-mobile"
            className="lg:hidden fixed inset-0 z-[60]"
            aria-modal="true"
            role="dialog"
            aria-label="Portal navigation"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={onMobileClose}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              className="relative h-full w-[280px] bg-[#0d1c3a] shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
                  Menu
                </p>
                <button
                  ref={closeBtnRef}
                  type="button"
                  onClick={onMobileClose}
                  aria-label="Close navigation"
                  className="h-8 w-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-white/60 hover:text-white transition-colors"
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
