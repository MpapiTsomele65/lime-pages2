"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Mail, Phone, ChevronDown, CheckCircle2 } from "lucide-react";

import { formatMemberNumber } from "@/lib/definitions";
import type { AdminStats } from "@/lib/admin-stats";

interface AdminBehindSnapshotProps {
  stats: AdminStats;
}

/**
 * Falling-behind snapshot for the admin dashboard.
 *
 * Lists active members who haven't paid the current month, sorted by
 * how many months they're behind year-to-date (worst offenders first).
 * Each row surfaces phone + email so an admin can chase them up
 * without leaving the dashboard.
 *
 * Collapses to the top 5 by default to keep the dashboard hero
 * compact on busy months — "show all" expands the full list.
 */
export function AdminBehindSnapshot({ stats }: AdminBehindSnapshotProps) {
  const { behindNow, behindCount, currentMonth, activeCount } = stats;
  const [expanded, setExpanded] = useState(false);

  const PREVIEW_COUNT = 5;
  const showExpand = behindCount > PREVIEW_COUNT;
  const visible = expanded ? behindNow : behindNow.slice(0, PREVIEW_COUNT);

  // All-paid celebration state — keeps the card on the page so admins
  // see the positive signal rather than wondering whether the section
  // failed to load.
  if (behindCount === 0) {
    return (
      <section className="rounded-[20px] border border-[#B8FF00]/40 bg-gradient-to-br from-[#B8FF00]/[0.06] to-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#B8FF00]/15 text-[#0B1933]">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#0B1933]">
              {currentMonth} — Everyone&apos;s caught up
            </p>
            <p className="mt-1 text-lg font-bold text-[#0B1933] leading-tight">
              All {activeCount} active members have paid {currentMonth}.
            </p>
            <p className="mt-1 text-xs text-[#6B7280]">
              No chase-up needed — pool is on track this month.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[20px] border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#9CA3AF]">
              Falling Behind — {currentMonth}
            </p>
            <p className="mt-1 text-lg font-bold text-[#0B1933] leading-tight">
              {behindCount} active{" "}
              {behindCount === 1 ? "member hasn't" : "members haven't"} paid{" "}
              {currentMonth} yet
            </p>
            <p className="mt-0.5 text-xs text-[#6B7280]">
              Sorted worst-first by months-behind year-to-date. Use the
              member table below to mark a payment when they pay.
            </p>
          </div>
        </div>
      </div>

      {/* List */}
      <ul className="divide-y divide-[#E5E7EB]">
        {visible.map(({ member, paidYTD, monthsBehindYTD }, i) => (
          <motion.li
            key={member.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
              delay: i * 0.04,
            }}
            className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-medium text-sm text-[#0B0B0B] truncate">
                  {member.fullName || "—"}
                </span>
                <span className="shrink-0 text-[10px] uppercase tracking-wider text-[#9CA3AF]">
                  {formatMemberNumber(member.memberNumber)}
                </span>
              </div>
              <p className="text-xs text-[#6B7280] truncate">
                Paid {paidYTD} of the year so far
                {monthsBehindYTD > 1 && (
                  <>
                    {" "}
                    ·{" "}
                    <span className="text-orange-600 font-medium">
                      {monthsBehindYTD} months behind
                    </span>
                  </>
                )}
              </p>
            </div>

            {/* Contact shortcuts */}
            <div className="flex items-center gap-1.5 shrink-0">
              {member.phone && (
                <a
                  href={`tel:${member.phone.replace(/\s/g, "")}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:border-[#0B1933]/30 hover:text-[#0B1933] transition-colors"
                  title={`Call ${member.phone}`}
                >
                  <Phone className="h-3.5 w-3.5" />
                </a>
              )}
              {member.email && (
                <a
                  href={`mailto:${member.email}?subject=Lehumo — ${currentMonth} contribution reminder`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:border-[#0B1933]/30 hover:text-[#0B1933] transition-colors"
                  title={`Email ${member.email}`}
                >
                  <Mail className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </motion.li>
        ))}
      </ul>

      {/* Show more / less */}
      {showExpand && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#0B1933] hover:text-[#0B1933]/80"
        >
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
          {expanded
            ? "Show less"
            : `Show all ${behindCount} (${behindCount - PREVIEW_COUNT} more)`}
        </button>
      )}
    </section>
  );
}
