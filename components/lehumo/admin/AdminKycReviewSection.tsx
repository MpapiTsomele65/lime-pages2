"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import {
  AlertCircle,
  Check,
  ExternalLink,
  FileCheck,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";

import {
  formatMemberNumber,
  type AirtableAttachment,
  type LehumoMember,
} from "@/lib/definitions";
import {
  adminApproveKyc,
  adminRequestKycResubmission,
  type AdminActionResult,
} from "@/app/lehumo/portal/admin/actions";

interface AdminKycReviewSectionProps {
  initialMembers: LehumoMember[];
}

const ACCEPT_ATTR = "image/jpeg,image/png,image/heic,image/heif,application/pdf";
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/heic",
  "image/heif",
  "application/pdf",
]);
const MAX_BYTES = 5 * 1024 * 1024;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Unexpected FileReader result"));
        return;
      }
      const commaIdx = result.indexOf(",");
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
    reader.readAsDataURL(file);
  });
}

/**
 * Members appearing in the review queue: anyone whose KYC isn't yet
 * Complete and who hasn't exited the program. We deliberately include
 * "Docs Requested" so admins can see who hasn't submitted yet — useful
 * for chase-up emails — alongside the active "In Progress" review pile.
 */
function isInReviewQueue(m: LehumoMember): boolean {
  if (m.status === "Exited") return false;
  return m.kycStatus === "In Progress" || m.kycStatus === "Docs Requested";
}

export function AdminKycReviewSection({
  initialMembers,
}: AdminKycReviewSectionProps) {
  // We hold the FULL member list locally so individual rows can update
  // optimistically after approve / reject / upload — and so once a
  // member's KYC is approved they drop off the queue automatically.
  const [members, setMembers] = useState<LehumoMember[]>(initialMembers);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const queue = useMemo(() => members.filter(isInReviewQueue), [members]);

  const applyMemberUpdate = useCallback((updated: LehumoMember) => {
    startTransition(() => {
      setMembers((prev) =>
        prev.map((m) => (m.id === updated.id ? updated : m)),
      );
    });
  }, []);

  async function runAction(
    key: string,
    action: () => Promise<AdminActionResult>,
  ) {
    setBusyKey(key);
    setError(null);
    try {
      const res = await action();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      applyMemberUpdate(res.member);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <section className="rounded-[20px] border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-[#0B0B0B]">KYC Review</h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Members awaiting document review or chase-up.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-[#0B1933]/[0.06] px-2.5 py-1 text-[11px] font-bold text-[#0B1933]">
          {queue.length} {queue.length === 1 ? "member" : "members"}
        </span>
      </div>

      {error && (
        <div className="border-b border-red-200 bg-red-50 px-5 py-2 text-sm text-red-700 flex items-center gap-2">
          <XCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Empty state */}
      {queue.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#B8FF00]/15 text-[#0B1933] mb-3">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-[#0B0B0B]">All caught up</p>
          <p className="mt-1 text-xs text-[#6B7280]">
            No members are currently waiting on KYC review.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[#E5E7EB]">
          {queue.map((member) => (
            <KycReviewRow
              key={member.id}
              member={member}
              busyKey={busyKey}
              onApprove={() =>
                runAction(`${member.id}:approve`, () =>
                  adminApproveKyc(member.id),
                )
              }
              onReject={() =>
                runAction(`${member.id}:reject`, () =>
                  adminRequestKycResubmission(member.id),
                )
              }
              onUploaded={applyMemberUpdate}
              onUploadError={setError}
              setBusyKey={setBusyKey}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Per-member row
// ──────────────────────────────────────────────────────────────────────

interface KycReviewRowProps {
  member: LehumoMember;
  busyKey: string | null;
  onApprove: () => void;
  onReject: () => void;
  onUploaded: (member: LehumoMember) => void;
  onUploadError: (msg: string) => void;
  setBusyKey: (key: string | null) => void;
}

function KycReviewRow({
  member,
  busyKey,
  onApprove,
  onReject,
  onUploaded,
  onUploadError,
  setBusyKey,
}: KycReviewRowProps) {
  const approving = busyKey === `${member.id}:approve`;
  const rejecting = busyKey === `${member.id}:reject`;
  const idBusy = busyKey === `${member.id}:upload:id`;
  const poaBusy = busyKey === `${member.id}:upload:poa`;
  const anyBusy = approving || rejecting || idBusy || poaBusy;

  const idAttachment = member.kycIdDocument?.[0];
  const poaAttachment = member.kycProofOfAddress?.[0];
  const bothPresent = !!idAttachment && !!poaAttachment;

  return (
    <li className="px-5 py-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        {/* Left: identity */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-[#0B0B0B]">
              {member.fullName || "—"}
            </p>
            <span className="inline-flex items-center rounded-full bg-[#F8F9FA] border border-[#E5E7EB] px-2 py-0.5 text-[10px] font-medium text-[#6B7280]">
              {formatMemberNumber(member.memberNumber)}
            </span>
            <KycStatusPill status={member.kycStatus} />
          </div>
          <p className="text-xs text-[#6B7280] truncate">
            {member.email || "no email"}
            {member.phone ? ` · ${member.phone}` : ""}
          </p>

          <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            <Field
              label="ID Type"
              value={member.idType || "—"}
            />
            <Field
              label="ID / Passport #"
              value={member.idNumber || "—"}
              mono
            />
            <Field
              label="Address"
              value={member.residentialAddress || "—"}
              colSpan
            />
            {member.kycSubmittedAt && (
              <Field
                label="Submitted"
                value={formatDate(member.kycSubmittedAt)}
              />
            )}
          </dl>
        </div>

        {/* Right: documents + actions */}
        <div className="flex flex-col gap-3 w-full lg:w-[420px] shrink-0">
          <DocSlot
            label="ID Document"
            slot="id"
            memberId={member.id}
            attachment={idAttachment}
            busy={idBusy}
            disabled={anyBusy}
            onUploaded={onUploaded}
            onError={onUploadError}
            setBusyKey={setBusyKey}
          />
          <DocSlot
            label="Proof of Address"
            slot="poa"
            memberId={member.id}
            attachment={poaAttachment}
            busy={poaBusy}
            disabled={anyBusy}
            onUploaded={onUploaded}
            onError={onUploadError}
            setBusyKey={setBusyKey}
          />

          {/* Approve / reject actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onApprove}
              disabled={anyBusy || !bothPresent}
              title={
                bothPresent
                  ? "Approve KYC and stamp verified date"
                  : "Both documents must be uploaded before approval"
              }
              className="inline-flex items-center gap-1.5 rounded-full bg-[#B8FF00] px-3 py-1.5 text-xs font-bold text-[#0B1933] hover:bg-[#a8ef00] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {approving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Approve
            </button>
            <button
              type="button"
              onClick={onReject}
              disabled={anyBusy}
              title="Flip back to Docs Requested so the member can re-upload"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#0B0B0B] hover:border-[#0B1933]/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {rejecting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
              Request resubmission
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Field helper
// ──────────────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  mono = false,
  colSpan = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  colSpan?: boolean;
}) {
  return (
    <div className={colSpan ? "sm:col-span-2" : ""}>
      <dt className="text-[10px] uppercase tracking-wider text-[#9CA3AF]">
        {label}
      </dt>
      <dd
        className={`text-[#0B0B0B] ${mono ? "font-mono" : ""} break-words`}
      >
        {value}
      </dd>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function KycStatusPill({ status }: { status: string }) {
  const colour =
    status === "In Progress"
      ? "bg-[#46CDCF]/15 text-[#0B1933]"
      : status === "Docs Requested"
        ? "bg-[#FEF3C7] text-[#92400E]"
        : "bg-[#F8F9FA] text-[#6B7280] border border-[#E5E7EB]";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${colour}`}
    >
      {status}
    </span>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Single document slot — view + admin-on-behalf upload
// ──────────────────────────────────────────────────────────────────────

interface DocSlotProps {
  label: string;
  slot: "id" | "poa";
  memberId: string;
  attachment?: AirtableAttachment;
  busy: boolean;
  disabled: boolean;
  onUploaded: (member: LehumoMember) => void;
  onError: (msg: string) => void;
  setBusyKey: (key: string | null) => void;
}

function DocSlot({
  label,
  slot,
  memberId,
  attachment,
  busy,
  disabled,
  onUploaded,
  onError,
  setBusyKey,
}: DocSlotProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const pick = useCallback(() => {
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      // Reset so the same file can be picked again later.
      e.target.value = "";
      if (!file) return;

      if (!ALLOWED_MIME.has(file.type)) {
        onError("Unsupported file type. Use JPG, PNG, HEIC, or PDF.");
        return;
      }
      if (file.size > MAX_BYTES) {
        onError(
          `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB.`,
        );
        return;
      }

      const key = `${memberId}:upload:${slot}`;
      setBusyKey(key);
      try {
        const base64 = await fileToBase64(file);
        const res = await fetch("/api/lehumo/portal/admin/kyc-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            memberId,
            slot,
            filename: file.name,
            contentType: file.type,
            file: base64,
          }),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || "Upload failed");
        }
        const data = (await res.json()) as { member: LehumoMember };
        onUploaded(data.member);
      } catch (err) {
        onError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setBusyKey(null);
      }
    },
    [memberId, slot, onUploaded, onError, setBusyKey],
  );

  const baseClasses =
    "rounded-[12px] border bg-[#F8F9FA] px-3 py-2.5 text-left transition-colors";

  if (attachment) {
    return (
      <div
        className={`${baseClasses} border-[#E5E7EB] flex items-center gap-3`}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#46CDCF]/15 text-[#0B1933]">
          <FileCheck className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wider text-[#9CA3AF]">
            {label}
          </p>
          <p className="truncate text-xs font-medium text-[#0B0B0B]">
            {attachment.filename}
          </p>
        </div>
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0B1933] hover:text-[#46CDCF] transition-colors"
        >
          View <ExternalLink className="h-3 w-3" />
        </a>
        <button
          type="button"
          onClick={pick}
          disabled={disabled}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6B7280] hover:text-[#0B1933] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Replace this document on the member's behalf"
        >
          {busy ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RotateCcw className="h-3 w-3" />
          )}
          Replace
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          className="hidden"
          onChange={handleChange}
        />
      </div>
    );
  }

  // Empty state — admin can upload on the member's behalf (e.g. when
  // docs were emailed to lehumo@limepages.co.za).
  return (
    <button
      type="button"
      onClick={pick}
      disabled={disabled}
      className={`${baseClasses} border-dashed border-[#E5E7EB] hover:border-[#0B1933]/40 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 w-full`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white border border-[#E5E7EB] text-[#9CA3AF]">
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wider text-[#9CA3AF]">
          {label}
        </p>
        <p className="text-xs text-[#6B7280]">
          {busy ? "Uploading…" : "Not yet uploaded · click to upload on member's behalf"}
        </p>
      </div>
      <AlertCircle className="h-4 w-4 shrink-0 text-[#9CA3AF]" />
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={handleChange}
      />
    </button>
  );
}
