"use client";

import { useCallback, useState } from "react";

import { AdminMemberTable } from "@/components/lehumo/admin/AdminMemberTable";
import type { LehumoMember } from "@/lib/definitions";

interface AdminMembersClientProps {
  initialMembers: LehumoMember[];
}

/**
 * Client wrapper for the Members page's full member table.
 *
 * Owns the local `members` array so row-level mutations (status
 * change, KYC quick-toggle, beneficiary add/edit, password clear)
 * update the table inline without a full page refresh.
 *
 * Monthly contribution toggles + the per-row "Log EFT" button used
 * to live on this table — both have moved to the dedicated
 * /admin/contributions page (cleaner separation of identity vs.
 * money flow). The `currentMonth` prop chain that fed the now-
 * removed month columns is gone too.
 *
 * `key={members.length}` in the parent re-mounts this wrapper
 * when a new member is added — re-seeds the useState from the
 * fresh prop. Without that, the new row wouldn't appear in the
 * table until a manual refresh because useState ignores prop
 * changes after the initial mount.
 */
export function AdminMembersClient({
  initialMembers,
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
    />
  );
}
