"use client";

import { useCallback, useState } from "react";

import { AdminMemberTable } from "@/components/lehumo/admin/AdminMemberTable";
import type { LehumoMember } from "@/lib/definitions";

interface AdminMembersClientProps {
  initialMembers: LehumoMember[];
  currentMonth: string;
}

/**
 * Client wrapper for the Members page's full member table.
 *
 * Owns the local `members` array so row-level mutations (status
 * change, KYC quick-toggle, beneficiary add/edit, contribution
 * month toggle, EFT log, password clear) update the table inline
 * without a full page refresh.
 *
 * The wrapper used to lift state across both the KYC review queue
 * and this table — both were rendered on a single admin page so
 * they needed to share a single members array for cross-section
 * mutations to propagate. With the split into separate routes
 * (Members vs KYC Review), each page has its own client wrapper
 * managing its own local copy. Same pattern, simpler scope.
 *
 * `key={members.length}` in the parent re-mounts this wrapper
 * when a new member is added — re-seeds the useState from the
 * fresh prop. Without that, the new row wouldn't appear in the
 * table until a manual refresh because useState ignores prop
 * changes after the initial mount.
 */
export function AdminMembersClient({
  initialMembers,
  currentMonth,
}: AdminMembersClientProps) {
  const [members, setMembers] = useState<LehumoMember[]>(initialMembers);

  const onMemberUpdate = useCallback((updated: LehumoMember) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === updated.id ? updated : m)),
    );
  }, []);

  return (
    <AdminMemberTable
      members={members}
      onMemberUpdate={onMemberUpdate}
      currentMonth={currentMonth}
    />
  );
}
