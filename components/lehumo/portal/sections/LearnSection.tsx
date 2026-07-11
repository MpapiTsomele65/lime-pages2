"use client";

import { SectionHeader } from "./SectionHeader";
import { LearnCard } from "../LearnCard";

export function LearnSection() {
  return (
    <div className="space-y-8">
      <SectionHeader eyebrow="Learn" title="How Lehumo works" />
      <LearnCard />
    </div>
  );
}
