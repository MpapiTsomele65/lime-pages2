"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface ReferralFormModalProps {
  open: boolean;
  onClose: () => void;
}

type Plan = "basic" | "standard" | "vip" | "unsure";

export function ReferralFormModal({ open, onClose }: ReferralFormModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [referredByName, setReferredByName] = useState("");
  const [planInterest, setPlanInterest] = useState<Plan>("unsure");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Reset state each time the modal opens fresh
  useEffect(() => {
    if (open) {
      setSuccess(false);
      setError(null);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/lehumo/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          referredByName: referredByName.trim() || undefined,
          planInterest,
          notes: notes.trim() || undefined,
          source: "Referral Form",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      trackEvent("lead_submitted", {
        source: "Referral Form",
        planInterest,
      });

      setSuccess(true);
      setFullName("");
      setEmail("");
      setPhone("");
      setReferredByName("");
      setPlanInterest("unsure");
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-lg bg-[#0F2040] rounded-[20px] border border-white/[0.08] p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {success ? (
              <div className="py-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#B8FF00]/10 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 className="w-7 h-7 text-[#B8FF00]" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Thanks — you&rsquo;re on the list
                </h2>
                <p className="text-white/55 text-sm leading-relaxed mb-6 max-w-sm mx-auto">
                  We&rsquo;ll be in touch soon with your next steps. Keep an
                  eye on your inbox.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full bg-[#B8FF00] px-7 py-3 text-sm font-semibold text-[#0B1933] hover:bg-[#a8ef00] transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <span className="text-[11px] font-bold tracking-[1.4px] uppercase text-[#46CDCF] mb-3 block">
                    Join the movement
                  </span>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Become a Lehumo lead
                  </h2>
                  <p className="text-sm text-white/55 leading-relaxed">
                    Tell us who you are and we&rsquo;ll reach out when a spot
                    opens. If a member referred you, add their name below.
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-5 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300"
                  >
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Field label="Full name" required>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Thabo Mokoena"
                      className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-[#B8FF00]/40 transition-colors"
                    />
                  </Field>

                  <Field label="Email" required>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-[#B8FF00]/40 transition-colors"
                    />
                  </Field>

                  <Field label="Phone (optional)">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+27 82 000 0000"
                      className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-[#B8FF00]/40 transition-colors"
                    />
                  </Field>

                  <Field label="Referred by (optional)">
                    <input
                      type="text"
                      value={referredByName}
                      onChange={(e) => setReferredByName(e.target.value)}
                      placeholder="Name & surname of the member who referred you"
                      className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-[#B8FF00]/40 transition-colors"
                    />
                  </Field>

                  <Field label="What interests you most?">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(
                        [
                          { v: "basic", l: "Basic" },
                          { v: "standard", l: "Standard" },
                          { v: "vip", l: "VIP" },
                          { v: "unsure", l: "Not sure" },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.v}
                          type="button"
                          onClick={() => setPlanInterest(opt.v)}
                          className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${
                            planInterest === opt.v
                              ? "bg-[#B8FF00]/15 border-[#B8FF00]/50 text-[#B8FF00]"
                              : "bg-white/[0.03] border-white/[0.1] text-white/60 hover:border-white/25 hover:text-white/80"
                          }`}
                        >
                          {opt.l}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Anything else? (optional)">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Questions, goals, or when you'd like to start"
                      className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-[#B8FF00]/40 transition-colors resize-none"
                    />
                  </Field>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full bg-[#B8FF00] py-3.5 px-6 text-sm font-semibold text-[#0B1933] hover:bg-[#a8ef00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit"
                    )}
                  </button>

                  <p className="text-[11px] text-white/35 leading-relaxed text-center">
                    By submitting, you consent to Lime Pages processing your
                    personal information under POPIA for the purpose of
                    Lehumo membership and communication. See our{" "}
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/55 underline hover:text-white/80"
                    >
                      Privacy Policy
                    </a>
                    .
                  </p>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">
        {label}
        {required && <span className="text-[#B8FF00] ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
