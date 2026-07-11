import { motion } from "framer-motion";

/**
 * Shared heading for the portal's routed sections — one h1 per page for
 * orientation + accessibility. Overview keeps its own bespoke "Welcome
 * back" header; every other section uses this.
 */
export function SectionHeader({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55 mb-1.5">
        {eyebrow}
      </p>
      <h1 className="text-[28px] md:text-[34px] font-semibold tracking-tight text-white leading-[1.1]">
        {title}
      </h1>
    </motion.div>
  );
}
