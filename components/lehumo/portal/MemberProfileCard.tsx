"use client";

import { User, Mail, Phone, Hash, Globe } from "lucide-react";
import type { LehumoMember, MemberStatus } from "@/lib/definitions";

interface MemberProfileCardProps {
  member: LehumoMember;
}

const STATUS_STYLES: Record<MemberStatus, string> = {
  Active: "bg-[#B8FF00]/15 text-[#B8FF00]",
  Onboarding: "bg-[#46CDCF]/15 text-[#46CDCF]",
  "On Hold": "bg-yellow-400/15 text-yellow-400",
  Exited: "bg-red-400/15 text-red-400",
  Prospect: "bg-white/10 text-white/60",
};

export function MemberProfileCard({ member }: MemberProfileCardProps) {
  const statusStyle = STATUS_STYLES[member.status] ?? STATUS_STYLES.Prospect;

  return (
    <div className="bg-[#0F2040] rounded-[20px] border border-white/[0.06] p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Member Profile</h2>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}
        >
          {member.status}
        </span>
      </div>

      <div className="space-y-4">
        <ProfileRow icon={<User className="h-4 w-4" />} label="Full Name">
          {member.fullName}
        </ProfileRow>

        <ProfileRow icon={<Hash className="h-4 w-4" />} label="Member #">
          {member.memberNumber}
        </ProfileRow>

        <ProfileRow icon={<Mail className="h-4 w-4" />} label="Email">
          {member.email}
        </ProfileRow>

        <ProfileRow icon={<Phone className="h-4 w-4" />} label="Phone">
          {member.phone}
        </ProfileRow>

        <ProfileRow icon={<Globe className="h-4 w-4" />} label="Source">
          {member.source || "N/A"}
        </ProfileRow>
      </div>
    </div>
  );
}

function ProfileRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-white/40">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-white/40">{label}</p>
        <p className="text-sm font-medium text-white truncate">{children}</p>
      </div>
    </div>
  );
}
