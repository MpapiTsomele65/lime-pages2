"use client";

import { useCallback, useState } from "react";

import { AdminKycReviewSection } from "@/components/lehumo/admin/AdminKycReviewSection";
import type { LehumoMember } from "@/lib/definitions";

interface AdminKycClientProps {
  initialMembers: LehumoMember[];
}

/**
 * Thin client wrapper for the KYC Review queue page.
 *
 * Owns the local `members` array so row-level mutations (approve,
 * reject, beneficiary add/edit) update the queue inline without a
 * full page refresh.
 *
 * Mirrors the shape of AdminMembersClient (which now wraps only
 * the member table). The split into separate pages means the two
 * queues no longer need to share state — each manages its own
 * view, and the layout-level data fetch in the parent page hands
 * each the fresh server-side snapshot on every navigation.
 *
 * `key={members.length}` in the parent re-mounts this wrapper
 * when a new member is added elsewhere — re-seeds the useState
 * from the new initial prop.
 */
export function AdminKycClient({ initialMembers }: AdminKycClientProps) {
  const [members, setMembers] = useState<LehumoMember[]>(initialMembers);

  const onMemberUpdate = useCallback((updated: LehumoMember) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === updated.id ? updated : m)),
    );
  }, []);

  return (
    <AdminKycReviewSection
      members={members}
      onMemberUpdate={onMemberUpdate}
    />
  );
}
