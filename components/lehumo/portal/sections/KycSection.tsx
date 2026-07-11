"use client";

import { motion } from "framer-motion";

import type { LehumoMember } from "@/lib/definitions";
import { SectionHeader } from "./SectionHeader";
import { KycStatusTracker } from "../KycStatusTracker";
import { KycDocumentsCard } from "../KycDocumentsCard";

export function KycSection({ member }: { member: LehumoMember }) {
  const iosEase = [0.32, 0.72, 0, 1] as const;
  return (
    <div className="space-y-8">
      <SectionHeader eyebrow="My account" title="KYC / FICA Documents" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: iosEase }}
      >
        <KycStatusTracker status={member.kycStatus} />
      </motion.div>

      <motion.div
        id="kyc-docs"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: iosEase }}
        className="scroll-mt-24"
      >
        <KycDocumentsCard member={member} />
      </motion.div>
    </div>
  );
}
