"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HeartHandshake, Loader2, X } from "lucide-react";

import {
  RELATIONSHIP_OPTIONS,
  type BeneficiaryFormData,
  type BeneficiaryRelationship,
  type LehumoMember,
} from "@/lib/definitions";

interface BeneficiaryDialogProps {
  /** Render gate. Renders nothing when null. The member object is
   *  passed in so the dialog can pre-fill from existing beneficiary
   *  values when editing, and so the title can name the member. */
  member: LehumoMember | null;
  /** Called when the admin clicks Save with valid form data. The
   *  parent fires the actual server action; the dialog just collects
   *  + validates input. The promise resolves with success/error so
   *  the dialog can keep its busy state until the write lands. */
  onSubmit: (
    member: LehumoMember,
    fields: BeneficiaryFormData,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  /** Cancel / close. Wipes form state in the parent. */
  onCancel: () => void;
}

interface BeneficiaryDialogInnerProps {
  member: LehumoMember;
  onSubmit: BeneficiaryDialogProps["onSubmit"];
  onCancel: () => void;
}

/**
 * Admin-on-behalf beneficiary editor.
 *
 * Uses the same dark-themed modal aesthetic as ConfirmDialog so the
 * destructive-vs-edit flows feel like one family. Pre-fills with
 * existing beneficiary values when present (edit mode) or starts
 * blank (add mode). Closes on Esc / outside-click only when not
 * mid-save — pressing Esc on a save-in-flight would orphan the
 * Airtable PATCH visually but is non-destructive.
 *
 * Validation is light client-side (required fields + at-least-one-
 * contact-channel) — the heavy lifting happens server-side via
 * BeneficiaryFormSchema, which the action re-validates. The point of
 * the client check is to surface the obvious problems immediately
 * without paying a roundtrip.
 */
export function BeneficiaryDialog(props: BeneficiaryDialogProps) {
  // Outer gates rendering on `member` and handles AnimatePresence so
  // the inner form unmounts cleanly on close. Inner is keyed on
  // member.id so React tears it down + remounts whenever the admin
  // jumps between rows — that way the form's local useState is seeded
  // from the right member's values via lazy initialisation, with no
  // setState-in-effect anti-pattern.
  return (
    <AnimatePresence>
      {props.member && (
        <BeneficiaryDialogInner
          key={props.member.id}
          member={props.member}
          onSubmit={props.onSubmit}
          onCancel={props.onCancel}
        />
      )}
    </AnimatePresence>
  );
}

function BeneficiaryDialogInner({
  member,
  onSubmit,
  onCancel,
}: BeneficiaryDialogInnerProps) {
  // Lazy-init from the member prop. Because the outer keys this
  // component on member.id, the lazy init re-runs (with fresh values)
  // every time the admin opens the dialog on a different row.
  const [firstName, setFirstName] = useState(
    () => member.beneficiaryFirstName ?? "",
  );
  const [surname, setSurname] = useState(() => member.beneficiarySurname ?? "");
  const [relationship, setRelationship] = useState<BeneficiaryRelationship>(
    () =>
      // Default to Spouse for fresh entries — most common case in a
      // SA stokvel context. If the stored value matches our enum, use
      // it; otherwise fall back to Spouse.
      (member.beneficiaryRelationship as BeneficiaryRelationship) || "Spouse",
  );
  const [phone, setPhone] = useState(() => member.beneficiaryPhone ?? "");
  const [email, setEmail] = useState(() => member.beneficiaryEmail ?? "");
  const [address, setAddress] = useState(() => member.beneficiaryAddress ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const firstNameRef = useRef<HTMLInputElement | null>(null);

  // Focus into the first field on mount (= dialog open). Small QoL
  // win on a form opened many times in a row during onboarding day.
  useEffect(() => {
    requestAnimationFrame(() => firstNameRef.current?.focus());
  }, []);

  // Esc closes the dialog (= cancel). Same pattern as ConfirmDialog
  // so muscle memory is consistent. Disabled mid-save to avoid
  // closing the dialog while the request is in flight.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) {
        e.preventDefault();
        onCancel();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    // Light client-side check; server re-validates via the same schema.
    const fn = firstName.trim();
    const sn = surname.trim();
    if (!fn) {
      setError("First name is required");
      return;
    }
    if (!sn) {
      setError("Surname is required");
      return;
    }
    if (!phone.trim() && !email.trim() && !address.trim()) {
      setError("Provide at least one of phone, email, or address");
      return;
    }

    setError(null);
    setBusy(true);

    const res = await onSubmit(member, {
      firstName: fn,
      surname: sn,
      relationship,
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
    });

    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }
    // Parent handles closing the dialog after a successful save —
    // gives the parent control over post-save UX (e.g. toast).
  }

  const isEdit = !!member.beneficiaryFirstName;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-8 overflow-y-auto"
      // Outside-click cancels — but only if we're not mid-save.
      // Same defensive pattern as Esc-to-close.
      onClick={() => !busy && onCancel()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="beneficiary-dialog-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0F2040] shadow-2xl"
      >
            <form onSubmit={handleSubmit}>
              {/* Header */}
              <div className="flex items-start gap-4 p-6 border-b border-white/[0.06]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#B8FF00]/15 text-[#B8FF00]">
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2
                    id="beneficiary-dialog-title"
                    className="text-lg font-semibold text-white"
                  >
                    {isEdit ? "Edit beneficiary" : "Add beneficiary"}
                  </h2>
                  <p className="mt-1 text-xs text-white/60">
                    {member.fullName || "—"}
                    {member.email ? ` · ${member.email}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={busy}
                  className="text-white/40 hover:text-white disabled:opacity-40 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Fields */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First name" required>
                    <input
                      ref={firstNameRef}
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      autoComplete="off"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Surname" required>
                    <input
                      type="text"
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      autoComplete="off"
                      className={inputClass}
                    />
                  </Field>
                </div>

                <Field label="Relationship" required>
                  <select
                    value={relationship}
                    onChange={(e) =>
                      setRelationship(e.target.value as BeneficiaryRelationship)
                    }
                    className={`${inputClass} appearance-none pr-8 cursor-pointer`}
                  >
                    {RELATIONSHIP_OPTIONS.map((r) => (
                      <option key={r} value={r} className="bg-[#0F2040]">
                        {r}
                      </option>
                    ))}
                  </select>
                </Field>

                {/* Contact group — at least one required. Helper text
                    surfaces the rule so admins don't hit the validation
                    error blind. */}
                <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 space-y-3">
                  <p className="text-[11px] uppercase tracking-wider text-white/50">
                    Contact (at least one)
                  </p>
                  <Field label="Phone">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+27 …"
                      autoComplete="off"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="off"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Address">
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={2}
                      autoComplete="off"
                      className={`${inputClass} resize-none`}
                    />
                  </Field>
                </div>

                {error && (
                  <p className="text-sm text-red-400">{error}</p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={busy}
                  className="rounded-full border border-white/[0.1] bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/[0.08] disabled:opacity-40 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#B8FF00] px-4 py-2 text-sm font-bold text-[#0B1933] hover:bg-[#a8ef00] disabled:opacity-50 transition-colors"
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : isEdit ? (
                    "Save changes"
                  ) : (
                    "Add beneficiary"
                  )}
                </button>
              </div>
            </form>
      </motion.div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Internal layout primitives — kept local to avoid leaking dialog-only
// styling into the broader UI library.
// ──────────────────────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-lg bg-white/[0.04] border border-white/[0.1] px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#B8FF00]/50 focus:ring-1 focus:ring-[#B8FF00]/20 transition-colors";

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
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wider text-white/50 mb-1">
        {label}
        {required && <span className="text-[#B8FF00] ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}
