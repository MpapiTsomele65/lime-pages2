"use client";

import { useCallback, useState } from "react";

import { AdminKycReviewSection } from "@/components/lehumo/admin/AdminKycReviewSection";
import { AdminMemberTable } from "@/components/lehumo/admin/AdminMemberTable";
import type { LehumoMember } from "@/lib/definitions";

interface AdminMembersClientProps {
  initialMembers: LehumoMember[];
  currentMonth: string;
}

/**
 * Single-source-of-truth client wrapper for the two member-list
 * sections on the admin dashboard.
 *
 * Why this exists:
 *   The KYC Review section and the full Member Table both render rows
 *   for the same underlying members. Each section has interactive
 *   actions (KYC approve/reject, beneficiary add/edit, contribution
 *   month toggles, status changes) that update Airtable AND need to
 *   reflect in the local UI without a full page reload.
 *
 *   Previously each section held its own `useState(initialMembers)`,
 *   which meant an action in section A wouldn't propagate to
 *   section B — and `router.refresh()` doesn't help, because
 *   useState ignores prop changes after the initial mount. Concrete
 *   bug it caused: adding a beneficiary from the KYC row's
 *   BeneficiaryBlock left the AdminMemberTable's beneficiary cell
 *   still showing "+ Add", inviting the admin to overwrite the
 *   freshly-saved record.
 *
 *   Lifting the member list state to this shared parent fixes that —
 *   both children read from the same `members` array and call the
 *   same `onMemberUpdate` callback when they patch a row.
 *
 * For NEW members (AdminAddMemberCard creates a fresh row and calls
 * router.refresh()), the parent page passes new `initialMembers`
 * with one extra entry. The page-level `key={members.length}`
 * remounts this wrapper, which re-seeds useState from the fresh
 * props. So the lifted-state model handles both updates (live, via
 * setMembers) and additions (via key-remount).
 */
export function AdminMembersClient({
  initialMembers,
  currentMonth,
}: AdminMembersClientProps) {
  const [members, setMembers] = useState<LehumoMember[]>(initialMembers);

  // Single setter shared by both children. Each row-level action
  // returns the freshly-PATCHed member from Airtable; we splice it
  // into the array by id. Same shape as the previous per-section
  // applyMemberUpdate so the call sites only need a prop rename.
  const onMemberUpdate = useCallback((updated: LehumoMember) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === updated.id ? updated : m)),
    );
  }, []);

  return (
    <>
      {/* KYC review queue — surfaces members waiting on document review
          or chase-up. Sits above the member table so the most actionable
          work is the first thing an admin sees on load. */}
      <AdminKycReviewSection
        members={members}
        onMemberUpdate={onMemberUpdate}
      />

      {/* Full member table — every member in one searchable, filterable
          grid with monthly contribution toggles. */}
      <AdminMemberTable
        members={members}
        onMemberUpdate={onMemberUpdate}
        currentMonth={currentMonth}
      />
    </>
  );
}
