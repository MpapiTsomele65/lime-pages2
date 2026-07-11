"use client";

import { motion } from "framer-motion";

import type { LehumoMember } from "@/lib/definitions";
import { SectionHeader } from "./SectionHeader";
import { MemberProfileCard } from "../MemberProfileCard";
import { RiskProfileCard } from "../RiskProfileCard";
import { BeneficiaryCard } from "../BeneficiaryCard";

export function ProfileSection({ member }: { member: LehumoMember }) {
  const iosEase = [0.32, 0.72, 0, 1] as const;
  return (
    <div className="space-y-8">
      <SectionHeader eyebrow="My account" title="Profile" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: iosEase }}
      >
        <MemberProfileCard member={member} />
      </motion.div>

      {/* Investor risk + wealth profile */}
      <RiskProfileCard member={member} />

      {/* Next of kin / beneficiary */}
      <motion.div
        id="beneficiary"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: iosEase }}
        className="scroll-mt-24"
      >
        <BeneficiaryCard member={member} />
      </motion.div>
    </div>
  );
}
