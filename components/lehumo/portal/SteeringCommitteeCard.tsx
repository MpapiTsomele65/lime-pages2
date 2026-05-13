"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  PencilLine,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";

import type { LehumoMember, SteeringSubmission } from "@/lib/definitions";

import { PortalCard } from "./PortalCard";

interface SteeringCommitteeCardProps {
  member: LehumoMember;
}

/**
 * Steering Committee volunteer card.
 *
 * Mirrors the invite in the cohort nudge email: 6-person committee for
 * trust oversight, decision at the kick-off QGM (Thu 11 Jun 2026),
 * election if more than 6 volunteers. Members opt in here, can update
 * their entry any time, can withdraw if they change their mind.
 *
 * Three render states driven by `member.steering`:
 *   1. Empty (no submission yet) → invite copy + form
 *   2. Form open (initial volunteer OR edit) → inputs visible
 *   3. Submitted (and not editing) → summary chip with timestamp +
 *      Edit / Withdraw actions
 *
 * Validation matches the API contract — expertise 5–1000 chars
 * (required), motivation up to 2000 chars (optional). Client-side
 * validation just surfaces the error inline; the server re-validates
 * before write.
 */
export function SteeringCommitteeCard({ member }: SteeringCommitteeCardProps) {
  const router = useRouter();
  // Eligibility: only fully-registered (Status = Active) members can
  // volunteer. Pre-Active members see the invite copy + a "complete
  // your registration first" prompt instead of the form. Mirrors the
  // server-side gate in /api/lehumo/portal/member/steering.
  //
  // Edge case: a previously-Active member who's now On Hold / Exited
  // and HAS an existing submission — let them see the read-only
  // summary + withdraw, but not edit. (Defensive — under normal
  // operation this won't happen because the submission required
  // Active at write time.)
  const isActive = member.status === "Active";
  const existing: SteeringSubmission | null = member.steering ?? null;
  const [editing, setEditing] = useState(false);
  const [expertise, setExpertise] = useState(existing?.expertise ?? "");
  const [motivation, setMotivation] = useState(existing?.motivation ?? "");
  const [busy, setBusy] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);

  // Re-sync inputs whenever the member's stored entry changes (e.g.
  // after a successful submit + server refresh). Edge case: admin
  // edits the notes directly in Airtable and the member sees the
  // change after router.refresh().
  useEffect(() => {
    if (!editing) {
      setExpertise(existing?.expertise ?? "");
      setMotivation(existing?.motivation ?? "");
    }
  }, [existing?.expertise, existing?.motivation, editing]);

  async function submit() {
    const trimmedExpertise = expertise.trim();
    if (trimmedExpertise.length < 5) {
      setError("Please share at least a short description of the expertise you bring.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/lehumo/portal/member/steering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expertise: trimmedExpertise,
          motivation: motivation.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.error ||
            "Couldn't save your submission. Please try again or email lehumo@limepages.co.za.",
        );
      }
      setEditing(false);
      setJustSubmitted(true);
      // Refresh so the parent dashboard picks up the new
      // member.steering values and re-passes them in as props.
      router.refresh();
      setTimeout(() => setJustSubmitted(false), 4500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function withdraw() {
    if (
      !confirm(
        "Withdraw your Steering Committee application? You can re-volunteer any time before the kick-off QGM.",
      )
    ) {
      return;
    }
    setWithdrawing(true);
    setError(null);
    try {
      const res = await fetch("/api/lehumo/portal/member/steering", {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error || "Couldn't withdraw — please try again.",
        );
      }
      setExpertise("");
      setMotivation("");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setWithdrawing(false);
    }
  }

  const hasSubmission = Boolean(existing);
  // Form is shown only when the member is eligible AND
  // (in edit mode OR they don't have a submission yet). Pre-Active
  // members without a prior submission see the gated state instead.
  const showForm = isActive && (editing || !hasSubmission);
  // Pre-Active members never see the form — they see the gated copy.
  const showGated = !isActive && !hasSubmission;
  const submittedDateLabel = existing?.submittedAt
    ? new Date(existing.submittedAt).toLocaleDateString("en-ZA", {
        timeZone: "Africa/Johannesburg",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <motion.section
      id="steering-committee"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      className="scroll-mt-24"
      aria-labelledby="steering-card-title"
    >
      <PortalCard className="p-6 md:p-7">
        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#B8FF00]/15 text-[#B8FF00]">
            <Users className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-1">
              Governance
            </p>
            <h2
              id="steering-card-title"
              className="text-[17px] font-semibold tracking-tight text-white leading-tight"
            >
              Executive Steering Governance Committee
            </h2>
            <p className="mt-1 text-[12.5px] text-white/55 leading-relaxed">
              We&rsquo;re forming a six-person committee to provide oversight
              of the trust. If you&rsquo;d like to serve, tell us what expertise
              you bring. Decision at the{" "}
              <strong className="text-white">Kick-off QGM</strong> on Thursday,
              11 June 2026 — we&rsquo;ll run a quick election if more than six
              volunteer.
            </p>
          </div>
        </div>

        {/* Gated state — non-Active members see the invite copy + a
            "complete registration first" prompt instead of the form.
            Status === "Active" requires KYC complete AND a first
            contribution, which is the governance bar we want for
            committee eligibility. The CTA routes them to the page
            most likely to unblock them next. */}
        {showGated && (
          <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.02] p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-white/55">
                <Lock className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold tracking-tight text-white">
                  Volunteering opens after your registration is complete
                </p>
                <p className="mt-1 text-[12.5px] text-white/55 leading-relaxed">
                  Steering Committee eligibility is reserved for members
                  who&rsquo;ve completed their KYC and made their first
                  contribution. You&rsquo;re currently{" "}
                  <strong className="text-white/80">{member.status}</strong>
                  {" "}— finish onboarding to unlock the form.
                </p>
              </div>
            </div>
            <Link
              href="/lehumo/portal#payment"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#B8FF00] px-4 py-2 text-[12.5px] font-semibold text-[#0B1933] hover:bg-[#a8ef00] transition-colors"
            >
              Complete next step
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <p className="mt-3 text-[11px] text-white/35 leading-relaxed">
              Already submitted KYC? It usually takes us under 24 hours
              to verify. Once approved + your first contribution lands,
              this card unlocks automatically.
            </p>
          </div>
        )}

        {/* Submitted summary state — collapsed view */}
        {hasSubmission && !showForm && (
          <div className="rounded-[16px] border border-[#B8FF00]/25 bg-gradient-to-br from-[#B8FF00]/[0.07] to-[#46CDCF]/[0.03] p-5">
            <div className="flex items-start gap-2 mb-3">
              <ShieldCheck className="h-4 w-4 text-[#B8FF00] shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-semibold tracking-tight text-white">
                  You&rsquo;ve volunteered
                  {submittedDateLabel && (
                    <span className="font-normal text-white/55">
                      {" "}· submitted {submittedDateLabel}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40 mb-1">
                  Expertise you bring
                </p>
                <p className="text-[13.5px] text-white/85 leading-relaxed whitespace-pre-wrap">
                  {existing?.expertise}
                </p>
              </div>
              {existing?.motivation && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40 mb-1">
                    Why you want to serve
                  </p>
                  <p className="text-[13.5px] text-white/85 leading-relaxed whitespace-pre-wrap">
                    {existing.motivation}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-white/[0.06] flex flex-wrap gap-2">
              {/* Edit is gated on Active — matches the server-side
                  write gate. Members who submitted while Active but
                  have since moved to On Hold / Exited can still
                  withdraw, just not re-edit. (Vanishingly rare path
                  under normal operation but safe by default.) */}
              {isActive && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(true);
                    setError(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-3.5 py-1.5 text-[12px] font-semibold text-white/80 hover:bg-white/[0.08] hover:text-white transition-colors"
                >
                  <PencilLine className="h-3.5 w-3.5" />
                  Edit submission
                </button>
              )}
              <button
                type="button"
                onClick={withdraw}
                disabled={withdrawing}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-500/[0.06] px-3.5 py-1.5 text-[12px] font-semibold text-red-300 hover:bg-red-500/[0.12] disabled:opacity-50 transition-colors"
              >
                {withdrawing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
                Withdraw
              </button>
            </div>
          </div>
        )}

        {/* Form — initial volunteer OR edit */}
        {showForm && (
          <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.02] p-5">
            <label className="block mb-4">
              <span className="block text-[11px] uppercase tracking-wider text-white/50 mb-1.5">
                Key expertise you bring <span className="text-[#B8FF00]">*</span>
              </span>
              <textarea
                value={expertise}
                onChange={(e) => setExpertise(e.target.value)}
                rows={3}
                placeholder="e.g. Financial governance, legal/compliance, operations, marketing, community-building, audit, technology, …"
                maxLength={1000}
                className="w-full rounded-lg bg-white/[0.04] border border-white/[0.1] px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#B8FF00]/50 focus:ring-1 focus:ring-[#B8FF00]/20 transition-colors resize-y"
              />
              <span className="block text-[10.5px] text-white/35 mt-1">
                {expertise.length}/1000
              </span>
            </label>
            <label className="block mb-4">
              <span className="block text-[11px] uppercase tracking-wider text-white/50 mb-1.5">
                Why you want to serve <span className="text-white/35">(optional)</span>
              </span>
              <textarea
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                rows={3}
                placeholder="A short note on why this matters to you — helps the cohort get to know your perspective."
                maxLength={2000}
                className="w-full rounded-lg bg-white/[0.04] border border-white/[0.1] px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#B8FF00]/50 focus:ring-1 focus:ring-[#B8FF00]/20 transition-colors resize-y"
              />
              <span className="block text-[10.5px] text-white/35 mt-1">
                {motivation.length}/2000
              </span>
            </label>

            {error && (
              <div className="mb-4 rounded-lg border border-red-400/30 bg-red-500/[0.08] p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-300 shrink-0 mt-0.5" />
                <p className="text-[12.5px] text-red-300 leading-relaxed">
                  {error}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 justify-end">
              {hasSubmission && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setExpertise(existing?.expertise ?? "");
                    setMotivation(existing?.motivation ?? "");
                    setError(null);
                  }}
                  disabled={busy}
                  className="rounded-full border border-white/[0.1] bg-white/[0.03] px-4 py-2 text-[13px] font-semibold text-white/80 hover:bg-white/[0.08] disabled:opacity-40 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={submit}
                disabled={busy || expertise.trim().length < 5}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#B8FF00] px-5 py-2 text-[13px] font-bold text-[#0B1933] hover:bg-[#a8ef00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : hasSubmission ? (
                  "Save changes"
                ) : (
                  "Volunteer for the committee"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Just-submitted celebratory banner — tucked between form/summary
            and the bottom footnote so the success state is felt without
            replacing the persistent submission view. */}
        <AnimatePresence>
          {justSubmitted && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
              className="mt-4 rounded-xl border border-[#B8FF00]/30 bg-[#B8FF00]/[0.08] px-4 py-3 flex items-start gap-2"
              role="status"
              aria-live="polite"
            >
              <CheckCircle2 className="h-4 w-4 text-[#B8FF00] shrink-0 mt-0.5" />
              <p className="text-[12.5px] text-white/80 leading-relaxed">
                Submission received. We&rsquo;ve emailed you a confirmation and
                looped admin in. You can update or withdraw any time.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </PortalCard>
    </motion.section>
  );
}
