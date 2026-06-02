"use client";

/**
 * AdminContributionsClient — client-side state + filters wrapper
 * for the Contributions admin page.
 *
 * Hosts:
 *   • The LogManualDepositCard at the top (primary action)
 *   • Filter pills bar (period / status / source / member)
 *   • The AdminContributionsTable below, fed pre-filtered rows
 *
 * Filter state is URL-driven so the page is bookmarkable + the
 * Members page's per-row "Contributions" deep-link
 * (?member=recXXX) lands with the right filter already applied.
 * Filter changes use `router.replace` (not push) so the back button
 * doesn't accumulate one history entry per keystroke.
 *
 * Lifts contribution state via the same pattern as
 * AdminMembersClient — local copy seeded from server, mutated
 * in-place via onContributionUpdate callback after admin actions.
 *
 * `key={contributions.length}` in the parent re-mounts this
 * wrapper when a manual deposit creates a new Paid row, so the
 * useState re-seeds from the fresh server-side snapshot.
 */

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import {
  CONTRIBUTION_SOURCE,
  CONTRIBUTION_STATUS,
  formatMemberNumber,
  type LehumoContribution,
  type LehumoMember,
} from "@/lib/definitions";
import type { EftAllocationPlan } from "@/lib/eft-allocation";
import { AdminContributionsTable } from "./AdminContributionsTable";
import { LogManualDepositCard } from "./LogManualDepositCard";

interface AdminContributionsClientProps {
  initialContributions: LehumoContribution[];
  members: LehumoMember[];
}

const STATUS_VALUES = Object.values(CONTRIBUTION_STATUS);
const SOURCE_VALUES = Object.values(CONTRIBUTION_SOURCE);

export function AdminContributionsClient({
  initialContributions,
  members,
}: AdminContributionsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filter state seeded from URL on every render. URL is the
  // source of truth so navigating to a deep-link applies filters
  // on first paint; setters call router.replace which re-renders
  // this component with the new search params.
  const filterPeriod = searchParams.get("period") ?? "";
  const filterStatus = searchParams.get("status") ?? "";
  const filterSource = searchParams.get("source") ?? "";
  const filterMember = searchParams.get("member") ?? "";

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }

  function clearAllFilters() {
    router.replace("?", { scroll: false });
  }

  // Local contribution snapshot. Updated in-place via callback so
  // an inline status edit reflects immediately without a refetch.
  const [contributions, setContributions] =
    useState<LehumoContribution[]>(initialContributions);

  const onContributionUpdate = useCallback(
    (updated: LehumoContribution) => {
      setContributions((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
      );
    },
    [],
  );

  // Member id → LehumoMember lookup for the table's name resolution.
  const memberById = useMemo(() => {
    const map = new Map<string, LehumoMember>();
    for (const m of members) map.set(m.id, m);
    return map;
  }, [members]);

  // ── Distinct periods that actually appear in the data, used to
  //    populate the Period filter dropdown. Sorted desc so the most
  //    recent period is at the top. ──
  const periodOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of contributions) set.add(c.period);
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [contributions]);

  // ── Pre-filtered rows for the table ──
  const filteredRows = useMemo(() => {
    return contributions.filter((c) => {
      if (filterPeriod && c.period !== filterPeriod) return false;
      if (filterStatus && c.status !== filterStatus) return false;
      if (filterSource && c.source !== filterSource) return false;
      if (filterMember && c.memberId !== filterMember) return false;
      return true;
    });
  }, [contributions, filterPeriod, filterStatus, filterSource, filterMember]);

  // ── When the LogManualDepositCard commits, we know the plan
  //    touched specific contribution rows. The plan rows tell us
  //    which contribution ids became Paid; the response shape from
  //    logEftPayment doesn't actually give us the full updated
  //    LehumoContribution objects (only the member + plan), so for
  //    the moment we trigger a router.refresh() to repull the
  //    server-side contributions snapshot. ──
  const onLogged = useCallback(
    (_member: LehumoMember, _plan: EftAllocationPlan) => {
      router.refresh();
    },
    [router],
  );

  const selectedMember = filterMember ? memberById.get(filterMember) : null;

  const hasActiveFilters = Boolean(
    filterPeriod || filterStatus || filterSource || filterMember,
  );

  return (
    <div className="space-y-8">
      <LogManualDepositCard
        members={members}
        contributions={contributions}
        onLogged={onLogged}
      />

      {/* Filter bar */}
      <section className="rounded-[20px] border border-[#EDEDED] bg-white p-4 md:p-5">
        <div className="flex flex-wrap items-end gap-3">
          <FilterSelect
            label="Period"
            value={filterPeriod}
            onChange={(v) => setFilter("period", v)}
            options={[
              { value: "", label: "All periods" },
              ...periodOptions.map((p) => ({
                value: p,
                label: formatPeriodLong(p),
              })),
            ]}
          />
          <FilterSelect
            label="Status"
            value={filterStatus}
            onChange={(v) => setFilter("status", v)}
            options={[
              { value: "", label: "Any status" },
              ...STATUS_VALUES.map((s) => ({ value: s, label: s })),
            ]}
          />
          <FilterSelect
            label="Source"
            value={filterSource}
            onChange={(v) => setFilter("source", v)}
            options={[
              { value: "", label: "Any source" },
              ...SOURCE_VALUES.map((s) => ({ value: s, label: s })),
            ]}
          />
          {selectedMember && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                Member
              </span>
              <button
                type="button"
                onClick={() => setFilter("member", "")}
                className="inline-flex items-center gap-2 rounded-full border border-[#0B1933]/20 bg-[#F8F9FA] px-3 py-1.5 text-[12.5px] font-medium text-[#0B1933] hover:bg-[#EDEDED] transition-colors"
                title="Clear member filter"
              >
                {selectedMember.fullName} ·{" "}
                {formatMemberNumber(selectedMember.memberNumber)}
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="ml-auto text-[12.5px] text-[#6B7280] hover:text-[#0B1933] font-medium underline-offset-2 hover:underline transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
        <p className="mt-3 text-[11px] text-[#9CA3AF]">
          Showing {filteredRows.length} of {contributions.length} contributions
        </p>
      </section>

      <AdminContributionsTable
        rows={filteredRows}
        memberById={memberById}
        onContributionUpdate={onContributionUpdate}
      />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-[13px] text-[#0B1933] outline-none focus:border-[#0B1933]/30 focus:ring-1 focus:ring-[#0B1933]/15 transition-colors cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function formatPeriodLong(period: string): string {
  const [year, m] = period.split("-");
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const monthIdx = Number(m) - 1;
  return `${months[monthIdx] ?? m} ${year}`;
}
