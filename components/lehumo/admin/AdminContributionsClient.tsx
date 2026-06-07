"use client";

/**
 * AdminContributionsClient — client-side state + filters wrapper
 * for the Contributions admin page.
 *
 * Hosts:
 *   • The LogManualDepositCard at the top (primary action)
 *   • Filter pills bar (period range presets / status / source / member)
 *   • The AdminContributionsTable below, fed pre-filtered rows
 *
 * Filter state is URL-driven so the page is bookmarkable + the
 * Members page's per-row "Contributions" deep-link
 * (?member=recXXX) lands with the right filter already applied.
 * Filter changes use `router.replace` (not push) so the back button
 * doesn't accumulate one history entry per keystroke.
 *
 * Period filtering uses a `periodRange` param that accepts:
 *   - "this-month" (default) — current SAST period only
 *   - "past-4"               — current + 3 prior months
 *   - "next-3"               — current + 2 upcoming months
 *   - "all"                  — no period filter
 *   - "YYYY-MM"              — a specific historical/future period
 *
 * Default = "this-month" so the page loads with ~30 rows
 * (one per onboarded member) instead of the full ~1,800-row
 * 60-month-schedule × cohort grid.
 *
 * Lifts contribution state via the same pattern as
 * AdminMembersClient — local copy seeded from server, mutated
 * in-place via onContributionUpdate callback after admin actions.
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
import {
  buildPeriodRange,
  currentSastPeriod,
} from "@/lib/contribution-periods";
import { findOrphanContributions } from "@/lib/contributions-aggregate";
import { AdminContributionsRollupTable } from "./AdminContributionsRollupTable";
import { OrphanContributionsBanner } from "./OrphanContributionsBanner";
import { LogManualDepositCard } from "./LogManualDepositCard";

interface AdminContributionsClientProps {
  initialContributions: LehumoContribution[];
  members: LehumoMember[];
}

const STATUS_VALUES = Object.values(CONTRIBUTION_STATUS);
const SOURCE_VALUES = Object.values(CONTRIBUTION_SOURCE);

type PeriodPreset = "this-month" | "past-4" | "next-3" | "all";

const PRESET_LABELS: Record<PeriodPreset, string> = {
  "this-month": "This month",
  "past-4": "Past 4 months",
  "next-3": "Next 3 months",
  all: "All periods",
};

const PRESET_ORDER: PeriodPreset[] = [
  "this-month",
  "past-4",
  "next-3",
  "all",
];

/**
 * Resolve a `periodRange` URL value to the set of `YYYY-MM`
 * periods it represents, or `null` if the filter is "no period
 * constraint" (the "all" preset).
 */
function resolvePeriodSet(periodRange: string): Set<string> | null {
  const current = currentSastPeriod();
  switch (periodRange) {
    case "all":
      return null;
    case "past-4":
      // Current + 3 prior = 4 periods
      return buildPeriodRange(current, -3, 0);
    case "next-3":
      // Current + 2 upcoming = 3 periods
      return buildPeriodRange(current, 0, 2);
    default:
      if (/^\d{4}-\d{2}$/.test(periodRange)) return new Set([periodRange]);
      // "this-month" + any unrecognised default → current only
      return new Set([current]);
  }
}

export function AdminContributionsClient({
  initialContributions,
  members,
}: AdminContributionsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Period range — defaults to "this-month" when the URL is empty.
  // Anything else falls through to resolvePeriodSet which handles
  // both preset names and literal YYYY-MM strings.
  const periodRange = searchParams.get("periodRange") ?? "this-month";
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
    // Reset takes us back to the default "this-month" view, not a
    // truly empty URL — that's the most useful resting state.
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

  // Set form of the live cohort's member IDs — used to detect orphan
  // rows (rows whose memberId no longer matches any live member).
  const liveMemberIds = useMemo(
    () => new Set(members.map((m) => m.id)),
    [members],
  );

  // Orphans = Paid rows whose memberId points at no live member.
  //
  // We only surface PAID orphans because that's the actual problem
  // worth admin attention — actual cash sitting in the trust account
  // that hasn't been credited to anyone. A Pending or Failed row on
  // a deleted member is just a stale schedule slot, not an
  // unallocated payment — surfacing those was creating ~60 rows of
  // noise that buried the one real issue.
  //
  // Computed from `contributions` (not `filteredRows`) so the banner
  // stays visible regardless of the active period / status filter.
  const orphans = useMemo(
    () =>
      findOrphanContributions(contributions, liveMemberIds).filter(
        (r) => r.status === CONTRIBUTION_STATUS.paid,
      ),
    [contributions, liveMemberIds],
  );

  // Distinct periods that actually appear in the data, used to
  // populate the "Specific month" dropdown.
  const periodOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of contributions) set.add(c.period);
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [contributions]);

  // Resolve the active period-range to a set of periods (or null
  // for "no constraint"). Memoised against the URL value.
  const activePeriodSet = useMemo(
    () => resolvePeriodSet(periodRange),
    [periodRange],
  );

  // Which members the rollup should display.
  //
  // The rollup table receives the FULL contribution set + the active
  // period set, and computes each member's totals internally. The
  // status / source / member filters narrow WHICH members appear
  // (a member shows if they have ≥1 row matching the filter inside
  // the active period) — they do NOT strip the rows fed to the
  // aggregation, so a shown member's totals stay honest (filtering
  // by "Pending" no longer makes a paid member read as R0 received).
  //
  // null = no row-level filter active → show the whole cohort.
  const visibleMemberIds = useMemo(() => {
    const hasRowFilter = Boolean(filterStatus || filterSource || filterMember);
    if (!hasRowFilter) return null;
    const set = new Set<string>();
    for (const c of contributions) {
      if (activePeriodSet && !activePeriodSet.has(c.period)) continue;
      if (filterStatus && c.status !== filterStatus) continue;
      if (filterSource && c.source !== filterSource) continue;
      if (filterMember && c.memberId !== filterMember) continue;
      set.add(c.memberId);
    }
    return set;
  }, [contributions, activePeriodSet, filterStatus, filterSource, filterMember]);

  // Total cohort size vs. shown count for the status line.
  const shownMemberCount =
    visibleMemberIds === null ? members.length : visibleMemberIds.size;

  // When the LogManualDepositCard commits, the plan touched
  // specific contribution rows. Trigger a router.refresh() to
  // repull the server-side snapshot so the table shows the new
  // Paid rows.
  const onLogged = useCallback(
    (_member: LehumoMember, _plan: EftAllocationPlan) => {
      router.refresh();
    },
    [router],
  );

  const selectedMember = filterMember ? memberById.get(filterMember) : null;
  const isPresetSelected = (PRESET_ORDER as string[]).includes(periodRange);
  const specificMonthValue = isPresetSelected ? "" : periodRange;

  // Active-filter count (for the "Clear all" affordance + status text).
  const activeFilterCount =
    (periodRange !== "this-month" ? 1 : 0) +
    (filterStatus ? 1 : 0) +
    (filterSource ? 1 : 0) +
    (filterMember ? 1 : 0);

  // Human-readable label for the active period range — used in the
  // "showing X of Y" status line so admins can sanity-check the
  // filter without hunting through the chips.
  const periodRangeLabel = useMemo(() => {
    if (isPresetSelected) return PRESET_LABELS[periodRange as PeriodPreset];
    if (/^\d{4}-\d{2}$/.test(periodRange)) return formatPeriodLong(periodRange);
    return PRESET_LABELS["this-month"];
  }, [periodRange, isPresetSelected]);

  return (
    <div className="space-y-8">
      <LogManualDepositCard
        members={members}
        contributions={contributions}
        onLogged={onLogged}
      />

      {/* Filter bar */}
      <section className="rounded-[20px] border border-[#EDEDED] bg-white p-4 md:p-5">
        {/* Period preset chips — primary period switcher */}
        <div className="flex flex-col gap-1.5 mb-4">
          <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
            Period
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {PRESET_ORDER.map((preset) => {
              const active =
                preset === "this-month"
                  ? !searchParams.get("periodRange") ||
                    periodRange === "this-month"
                  : periodRange === preset;
              return (
                <PresetChip
                  key={preset}
                  active={active}
                  onClick={() =>
                    setFilter(
                      "periodRange",
                      preset === "this-month" ? "" : preset,
                    )
                  }
                >
                  {PRESET_LABELS[preset]}
                </PresetChip>
              );
            })}
            <select
              value={specificMonthValue}
              onChange={(e) =>
                setFilter("periodRange", e.target.value || "")
              }
              className="rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12px] font-medium text-[#0B1933] outline-none focus:border-[#0B1933]/30 focus:ring-1 focus:ring-[#0B1933]/15 transition-colors cursor-pointer"
            >
              <option value="">Specific month…</option>
              {periodOptions.map((p) => (
                <option key={p} value={p}>
                  {formatPeriodLong(p)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary filters row */}
        <div className="flex flex-wrap items-end gap-3">
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
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="ml-auto text-[12.5px] text-[#6B7280] hover:text-[#0B1933] font-medium underline-offset-2 hover:underline transition-colors"
            >
              Reset to default
            </button>
          )}
        </div>
        <p className="mt-3 text-[11px] text-[#9CA3AF]">
          Showing {shownMemberCount} of {members.length} members ·{" "}
          {periodRangeLabel}
        </p>
      </section>

      <AdminContributionsRollupTable
        allRows={contributions}
        members={members}
        activePeriodSet={activePeriodSet}
        visibleMemberIds={visibleMemberIds}
        onContributionUpdate={onContributionUpdate}
      />

      {/* Orphan banner pinned to the bottom — the rollup view is the
          primary daily surface, and orphans are the exceptional
          "needs reassignment" cleanup that lives below it. */}
      <OrphanContributionsBanner
        orphans={orphans}
        members={members}
        onContributionUpdate={onContributionUpdate}
      />
    </div>
  );
}

function PresetChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
        active
          ? "border-[#0B1933]/30 bg-[#0B1933] text-[#B8FF00] hover:bg-[#0B1933]/90"
          : "border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#0B1933]/30 hover:text-[#0B1933]"
      }`}
    >
      {children}
    </button>
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
