"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Pencil,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  HeartHandshake,
  X,
} from "lucide-react";

import {
  RELATIONSHIP_OPTIONS,
  hasBeneficiary as memberHasBeneficiary,
  type LehumoMember,
  type BeneficiaryRelationship,
} from "@/lib/definitions";

interface BeneficiaryCardProps {
  member: LehumoMember;
}

/**
 * Format a YYYY-MM-DD value for display in en-ZA locale. The portal stores
 * beneficiary timestamps as date-only strings (Airtable date fields reject
 * full ISO timestamps with INVALID_VALUE_FOR_COLUMN), so we anchor to UTC
 * to avoid the value sliding back a day in non-UTC zones.
 */
function formatUpdatedAt(iso: string): string {
  try {
    const dateOnly = iso.slice(0, 10);
    const d = new Date(`${dateOnly}T00:00:00Z`);
    return d.toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return iso;
  }
}

/**
 * Member-portal next-of-kin / beneficiary card.
 *
 * View mode: shows the saved beneficiary or a "not yet captured" empty
 * state nudging the member to add their details.
 *
 * Edit mode: inline form for First Name, Surname, Relationship, Phone,
 * Email, Address. The backend enforces "at least one of phone/email/
 * address" — the form mirrors that hint visually but lets the API be the
 * source of truth.
 *
 * Single-beneficiary today; multi-beneficiary splits land with the trust
 * paperwork after Phase 2.
 */
export function BeneficiaryCard({ member }: BeneficiaryCardProps) {
  const router = useRouter();

  const hasBeneficiary = memberHasBeneficiary(member);

  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const initialState = useMemo(
    () => ({
      firstName: member.beneficiaryFirstName ?? "",
      surname: member.beneficiarySurname ?? "",
      relationship:
        (member.beneficiaryRelationship as BeneficiaryRelationship | "") ?? "",
      phone: member.beneficiaryPhone ?? "",
      email: member.beneficiaryEmail ?? "",
      address: member.beneficiaryAddress ?? "",
    }),
    [member],
  );

  const [form, setForm] = useState(initialState);

  const handleOpen = useCallback(() => {
    setForm(initialState);
    setError(null);
    setEditing(true);
  }, [initialState]);

  const handleCancel = useCallback(() => {
    setForm(initialState);
    setError(null);
    setEditing(false);
  }, [initialState]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (busy) return;

      // Quick client-side guards mirroring the API schema. Final validation
      // still runs server-side — we just want to avoid round-trips for
      // obvious misses.
      if (!form.firstName.trim() || !form.surname.trim()) {
        setError("First name and surname are required.");
        return;
      }
      if (!form.relationship) {
        setError("Pick a relationship.");
        return;
      }
      if (
        !form.phone.trim() &&
        !form.email.trim() &&
        !form.address.trim()
      ) {
        setError("Provide at least one of phone, email, or address.");
        return;
      }

      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/lehumo/portal/member/beneficiary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: form.firstName.trim(),
            surname: form.surname.trim(),
            relationship: form.relationship,
            phone: form.phone.trim(),
            email: form.email.trim(),
            address: form.address.trim(),
          }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || "Save failed");
        }

        setEditing(false);
        setJustSaved(true);
        // Hide the "saved" toast after a moment so it doesn't linger.
        window.setTimeout(() => setJustSaved(false), 3000);
        // Re-fetch the server-rendered card so the new values appear.
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Save failed. Please try again.",
        );
      } finally {
        setBusy(false);
      }
    },
    [busy, form, router],
  );

  return (
    <div className="bg-[#0F2040] rounded-[20px] border border-white/[0.06] p-6">
      <div className="flex items-start justify-between mb-1 gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-[#46CDCF]" />
          <h2 className="text-lg font-semibold text-white">Next of Kin</h2>
        </div>
        {hasBeneficiary && !editing ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#B8FF00]/15 px-2.5 py-1 text-[11px] font-bold text-[#B8FF00]">
            <CheckCircle2 className="h-3 w-3" /> On file
          </span>
        ) : !editing ? (
          <span className="inline-flex items-center rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-bold text-white/60">
            Action recommended
          </span>
        ) : null}
      </div>
      <p className="text-xs text-white/50 mb-5">
        {hasBeneficiary
          ? "We use these details to contact your next of kin if anything happens to you."
          : "Add a beneficiary so we know who to contact if anything happens to you. You can update this any time."}
      </p>

      {/* Saved toast */}
      {justSaved && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#B8FF00]/30 bg-[#B8FF00]/10 px-3 py-2 text-xs text-[#B8FF00]">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Beneficiary details saved.
        </div>
      )}

      {!editing ? (
        <ViewMode
          member={member}
          hasBeneficiary={hasBeneficiary}
          onEdit={handleOpen}
        />
      ) : (
        <EditForm
          form={form}
          setForm={setForm}
          busy={busy}
          error={error}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isFirstTime={!hasBeneficiary}
        />
      )}
    </div>
  );
}

// ─── View mode ──────────────────────────────────────────────────────

interface ViewModeProps {
  member: LehumoMember;
  hasBeneficiary: boolean;
  onEdit: () => void;
}

function ViewMode({ member, hasBeneficiary, onEdit }: ViewModeProps) {
  if (!hasBeneficiary) {
    return (
      <button
        type="button"
        onClick={onEdit}
        className="w-full rounded-[14px] border border-dashed border-white/15 bg-[#0B1933]/40 p-5 text-left transition-colors hover:border-[#B8FF00]/40 hover:bg-[#B8FF00]/[0.03] cursor-pointer"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-white/50">
            <HeartHandshake className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white mb-0.5">
              Add your beneficiary
            </p>
            <p className="text-xs text-white/50">
              Name, surname, relationship, plus at least one way to reach them.
            </p>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-[14px] border border-white/[0.08] bg-[#0B1933]/40 p-5">
      <div className="space-y-3">
        <div>
          <p className="text-xs text-white/40 mb-0.5">Name</p>
          <p className="text-sm font-medium text-white">
            {member.beneficiaryFirstName} {member.beneficiarySurname}
            {member.beneficiaryRelationship ? (
              <span className="ml-2 inline-flex items-center rounded-full bg-[#46CDCF]/15 px-2 py-0.5 text-[10px] font-bold text-[#46CDCF]">
                {member.beneficiaryRelationship}
              </span>
            ) : null}
          </p>
        </div>

        {member.beneficiaryPhone && (
          <ContactRow
            icon={<Phone className="h-3.5 w-3.5" />}
            label="Phone"
            value={member.beneficiaryPhone}
          />
        )}
        {member.beneficiaryEmail && (
          <ContactRow
            icon={<Mail className="h-3.5 w-3.5" />}
            label="Email"
            value={member.beneficiaryEmail}
          />
        )}
        {member.beneficiaryAddress && (
          <ContactRow
            icon={<MapPin className="h-3.5 w-3.5" />}
            label="Address"
            value={member.beneficiaryAddress}
            multiline
          />
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
        <p className="text-[11px] text-white/40">
          {member.beneficiaryUpdatedAt
            ? `Last updated ${formatUpdatedAt(member.beneficiaryUpdatedAt)}`
            : "Not yet updated"}
        </p>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-white/70 hover:border-[#B8FF00]/40 hover:bg-[#B8FF00]/[0.05] hover:text-[#B8FF00] transition-colors cursor-pointer"
        >
          <Pencil className="h-3 w-3" /> Update
        </button>
      </div>
    </div>
  );
}

interface ContactRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  multiline?: boolean;
}

function ContactRow({ icon, label, value, multiline = false }: ContactRowProps) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-white/40">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wide text-white/40">
          {label}
        </p>
        <p
          className={`text-sm text-white ${multiline ? "whitespace-pre-line break-words" : "truncate"}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Edit mode ──────────────────────────────────────────────────────

interface EditFormProps {
  form: {
    firstName: string;
    surname: string;
    relationship: BeneficiaryRelationship | "";
    phone: string;
    email: string;
    address: string;
  };
  setForm: React.Dispatch<React.SetStateAction<EditFormProps["form"]>>;
  busy: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  isFirstTime: boolean;
}

function EditForm({
  form,
  setForm,
  busy,
  error,
  onSubmit,
  onCancel,
  isFirstTime,
}: EditFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Name row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field
          label="First name"
          required
          value={form.firstName}
          onChange={(v) => setForm((s) => ({ ...s, firstName: v }))}
          autoComplete="given-name"
        />
        <Field
          label="Surname"
          required
          value={form.surname}
          onChange={(v) => setForm((s) => ({ ...s, surname: v }))}
          autoComplete="family-name"
        />
      </div>

      {/* Relationship */}
      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-white/50">
          Relationship <span className="text-[#B8FF00]">*</span>
        </label>
        <select
          value={form.relationship}
          onChange={(e) =>
            setForm((s) => ({
              ...s,
              relationship: e.target.value as BeneficiaryRelationship | "",
            }))
          }
          required
          className="w-full rounded-lg border border-white/[0.08] bg-[#0B1933]/60 px-3 py-2.5 text-sm text-white focus:border-[#46CDCF]/40 focus:outline-none focus:ring-1 focus:ring-[#46CDCF]/40 cursor-pointer"
        >
          <option value="" disabled>
            Pick one…
          </option>
          {RELATIONSHIP_OPTIONS.map((r) => (
            <option key={r} value={r} className="bg-[#0F2040]">
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Contact details — at-least-one-of */}
      <div className="space-y-3 rounded-lg border border-white/[0.06] bg-[#0B1933]/40 p-3">
        <p className="text-[11px] text-white/50">
          Provide at least one — phone, email, or address.
        </p>
        <Field
          label="Phone / WhatsApp"
          value={form.phone}
          onChange={(v) => setForm((s) => ({ ...s, phone: v }))}
          type="tel"
          autoComplete="tel"
          placeholder="+27 …"
        />
        <Field
          label="Email"
          value={form.email}
          onChange={(v) => setForm((s) => ({ ...s, email: v }))}
          type="email"
          autoComplete="email"
        />
        <Field
          label="Address"
          value={form.address}
          onChange={(v) => setForm((s) => ({ ...s, address: v }))}
          multiline
          autoComplete="street-address"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-full border border-white/[0.1] px-4 py-2 text-xs font-semibold text-white/60 hover:text-white hover:border-white/20 disabled:opacity-50 transition-colors cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#B8FF00] px-4 py-2 text-xs font-bold text-[#0B1933] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(184,255,0,0.25)] disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none transition-all"
        >
          {busy ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
            </>
          ) : (
            <>{isFirstTime ? "Save beneficiary" : "Save changes"}</>
          )}
        </button>
      </div>
    </form>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: "text" | "tel" | "email";
  multiline?: boolean;
  autoComplete?: string;
  placeholder?: string;
}

function Field({
  label,
  value,
  onChange,
  required = false,
  type = "text",
  multiline = false,
  autoComplete,
  placeholder,
}: FieldProps) {
  const baseClass =
    "w-full rounded-lg border border-white/[0.08] bg-[#0B1933]/60 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#46CDCF]/40 focus:outline-none focus:ring-1 focus:ring-[#46CDCF]/40";

  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-white/50">
        {label} {required && <span className="text-[#B8FF00]">*</span>}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          rows={2}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`${baseClass} resize-none`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={baseClass}
        />
      )}
    </div>
  );
}
