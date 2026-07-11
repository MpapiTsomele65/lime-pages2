"use client";

import { motion } from "framer-motion";

import type { LehumoMember } from "@/lib/definitions";
import { SectionHeader } from "./SectionHeader";
import { EmergencyAccessCard } from "../EmergencyAccessCard";

export function EmergencySection({ member }: { member: LehumoMember }) {
  return (
    <div className="space-y-8">
      <SectionHeader eyebrow="My money" title="Emergency Loans" />
      <motion.div
        id="emergency-access"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
        className="scroll-mt-24"
      >
        <EmergencyAccessCard member={member} />
      </motion.div>
    </div>
  );
}
