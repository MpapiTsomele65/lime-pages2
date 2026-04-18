"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, UserPlus } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ReferralFormModal } from "./ReferralFormModal";

/**
 * Visible CTA that sits directly after <CommunityGrowth /> on the Lehumo
 * page. Shares the `bg-navy-mid` background so it reads as the natural
 * close of the "How will the community grow?" section. Clicking the
 * button opens a modal with the lead-capture form (writes to the
 * Lehumo Leads Airtable table).
 */
export function ReferralCta() {
  const [open, setOpen] = useState(false);

  return (
    <section id="waitlist" className="pb-20 pt-0 bg-navy-mid scroll-mt-24">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, ease: "easeOut" as const }}
          className="mx-auto max-w-[640px] text-center"
        >
          <p className="text-sm text-white/60 mb-5 leading-relaxed">
            Referred by a founding member — or want to be considered for
            one of the next 60 spots? Add yourself to the list.
          </p>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-lime px-7 py-3.5 text-sm font-bold text-navy hover:bg-[#a8ef00] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(184,255,0,0.35)] transition-all"
          >
            <UserPlus className="h-4 w-4" />
            I am interested, contact me
            <ArrowRight className="h-4 w-4" />
          </button>

          <p className="mt-4 text-xs text-white/35">
            Takes 30 seconds. No payment needed to join the list.
          </p>
        </motion.div>
      </Container>

      <ReferralFormModal open={open} onClose={() => setOpen(false)} />
    </section>
  );
}
