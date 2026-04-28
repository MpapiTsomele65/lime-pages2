"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  UserPlus,
  XCircle,
} from "lucide-react";

import { formatMemberNumber } from "@/lib/definitions";
import {
  adminCreateMember,
  type AdminActionResult,
} from "@/app/lehumo/portal/admin/actions";

const SOURCES = ["Google", "Instagram", "Referral", "WhatsApp", "Direct"] as const;

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  source: (typeof SOURCES)[number];
  idType: "" | "sa_id" | "passport";
  idNumber: string;
  residentialAddress: string;
  sendWelcomeEmail: boolean;
}

const EMPTY: FormState = {
  fullName: "",
  email: "",
  phone: "",
  source: "Direct",
  idType: "",
  idNumber: "",
  residentialAddress: "",
  sendWelcomeEmail: true,
};

/**
 * Admin-side "manually add a member" card.
 *
 * Lives directly above the KYC review queue on the admin dashboard.
 * Collapsed by default — clicking the trigger reveals the inline form.
 *
 * On successful create we call `router.refresh()` so the server page
 * re-fetches the member list and the new row drops into the review
 * queue + member table on the next render. The form clears and a
 * non-blocking success banner stays visible until dismissed.
 */
export function AdminAddMemberCard() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, startTransition] = useTransition();

  const update = useCallback(<K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    setForm(EMPTY);
    setError(null);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      setSuccess(null);

      // Trim before submission — admins paste from emails which often
      // includes leading/trailing whitespace that would fail email
      // validation server-side.
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        source: form.source,
        idType: form.idType === "" ? undefined : form.idType,
        idNumber: form.idNumber.trim() || undefined,
        residentialAddress: form.residentialAddress.trim() || undefined,
        sendWelcomeEmail: form.sendWelcomeEmail,
      };

      startTransition(async () => {
        let res: AdminActionResult;
        try {
          res = await adminCreateMember(payload);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Something went wrong");
          return;
        }

        if (!res.ok) {
          setError(res.error);
          return;
        }

        setSuccess(
          `Created ${formatMemberNumber(res.member.memberNumber)} — ${res.member.fullName}. They've been added to the KYC review queue below.`,
        );
        reset();
        // Don't auto-collapse — admin will often want to upload the
        // emailed docs immediately, which means scrolling down to the
        // queue. Leaving the form open lets them add multiple in a row
        // (e.g. when processing a batch of email submissions).
        router.refresh();
      });
    },
    [form, reset, router],
  );

  return (
    <section className="rounded-[20px] border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      {/* Header / trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-[#F8F9FA]/60 transition-colors rounded-t-[20px]"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B1933] text-[#B8FF00]">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#0B0B0B]">
              Add Member Manually
            </h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              For prospects who emailed their KYC docs without filling in the
              public onboarding form.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#0B1933]/[0.06] px-3 py-1.5 text-xs font-semibold text-[#0B1933]">
          {open ? (
            <>
              Collapse <ChevronUp className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" /> New member
              <ChevronDown className="h-3.5 w-3.5" />
            </>
          )}
        </span>
      </button>

      {/* Success banner — sticks until the next submission so admins
          can confirm the previous create even after starting a new one. */}
      {success && (
        <div className="border-t border-[#B8FF00]/40 bg-[#B8FF00]/[0.08] px-5 py-2.5 text-sm text-[#0B1933] flex items-start gap-2">
          <Check className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{success}</span>
          <button
            type="button"
            onClick={() => setSuccess(null)}
            className="ml-auto text-xs font-semibold text-[#0B1933]/60 hover:text-[#0B1933]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Form */}
      {open && (
        <form
          onSubmit={handleSubmit}
          className="border-t border-[#E5E7EB] px-5 py-5 space-y-4"
        >
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full name" required>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                placeholder="e.g. Oarabile Mokoena"
                className={inputClasses}
              />
            </Field>

            <Field label="Email" required>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="oarabile@example.com"
                className={inputClasses}
              />
            </Field>

            <Field label="Phone" required>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="0821234567"
                className={inputClasses}
              />
            </Field>

            <Field label="Source">
              <select
                value={form.source}
                onChange={(e) =>
                  update("source", e.target.value as FormState["source"])
                }
                className={inputClasses}
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="ID type" hint="Optional — fill in if known">
              <select
                value={form.idType}
                onChange={(e) =>
                  update("idType", e.target.value as FormState["idType"])
                }
                className={inputClasses}
              >
                <option value="">— Not provided —</option>
                <option value="sa_id">SA ID</option>
                <option value="passport">Passport</option>
              </select>
            </Field>

            <Field label="ID / Passport number" hint="Optional">
              <input
                type="text"
                value={form.idNumber}
                onChange={(e) => update("idNumber", e.target.value)}
                placeholder="e.g. 9001015009087"
                className={`${inputClasses} font-mono`}
              />
            </Field>
          </div>

          <Field label="Residential address" hint="Optional">
            <textarea
              rows={2}
              value={form.residentialAddress}
              onChange={(e) => update("residentialAddress", e.target.value)}
              placeholder="Street, suburb, city, postal code"
              className={`${inputClasses} resize-none`}
            />
          </Field>

          <label className="flex items-center gap-2.5 text-sm text-[#0B0B0B] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.sendWelcomeEmail}
              onChange={(e) => update("sendWelcomeEmail", e.target.checked)}
              className="h-4 w-4 rounded border-[#E5E7EB] text-[#0B1933] focus:ring-[#0B1933]/20"
            />
            <span>
              Send welcome email with their member number
              <span className="text-[#9CA3AF] font-normal ml-1">
                (uncheck if you&rsquo;ve already been corresponding directly)
              </span>
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-[#B8FF00] px-4 py-2 text-sm font-bold text-[#0B1933] hover:bg-[#a8ef00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Create member
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#0B0B0B] hover:border-[#0B1933]/40 disabled:opacity-50 transition-colors"
            >
              Clear form
            </button>
            <span className="text-xs text-[#9CA3AF] ml-auto">
              New members start as Status:{" "}
              <span className="font-semibold text-[#0B1933]">Onboarding</span>{" "}
              · KYC:{" "}
              <span className="font-semibold text-[#0B1933]">Docs Requested</span>
            </span>
          </div>
        </form>
      )}
    </section>
  );
}

// ── Reusable form-field shell ────────────────────────────────────────

const inputClasses =
  "w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#0B0B0B] outline-none focus:border-[#0B1933]/40 focus:ring-2 focus:ring-[#0B1933]/10 placeholder:text-[#9CA3AF]";

function Field({
  label,
  hint,
  required = false,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {hint && (
          <span className="ml-2 text-[#9CA3AF] font-normal normal-case tracking-normal">
            {hint}
          </span>
        )}
      </span>
      {children}
    </label>
  );
}
