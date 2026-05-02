"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import {
  AlertCircle,
  Check,
  ExternalLink,
  FileCheck,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Trash2,
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
  adminClearKycAttachment,
  adminRequestKycResubmission,
  type AdminActionResult,
} from "@/app/lehumo/portal/admin/actions";
import { compressImage } from "@/lib/compress-image";
import {
  uploadViaServerRelay,
  SERVER_RELAY_MAX_BYTES,
} from "@/lib/upload-via-server-relay";
import {
  uploadViaChunks,
  CHUNKED_MAX_BYTES,
} from "@/lib/upload-via-chunks";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface AdminKycReviewSectionProps {
  initialMembers: LehumoMember[];
}

/**
 * Holds the state for an in-flight destructive admin action that's
 * waiting on a confirmation dialog. The shape is generic so future
 * destructive actions (member deletion, status reversion, etc) can
 * funnel through the same dialog without a per-action redesign.
 */
interface PendingConfirm {
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  /** Action to fire when the admin clicks Confirm. The state is
   *  cleared (dialog closes) before the action runs so a slow
   *  Airtable PATCH doesn't leave the dialog hanging open. */
  onConfirm: () => void;
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
// Mirror the server route's MAX_BYTES — Vercel Blob direct upload
// bypasses the function body cap, so this is just a sanity ceiling.
// 10 MB comfortably covers high-res phone photos and multi-page bank
// statement PDFs without inviting 100 MB scans into the queue.
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Awaiting-review pile: anyone whose KYC isn't yet Complete and who
 * hasn't exited the program. We deliberately include "Docs Requested"
 * so admins can see who hasn't submitted yet — useful for chase-up
 * emails — alongside the active "In Progress" review pile.
 */
function isAwaitingReview(m: LehumoMember): boolean {
  if (m.status === "Exited") return false;
  return m.kycStatus === "In Progress" || m.kycStatus === "Docs Requested";
}

/**
 * Verified pile: members with completed KYC. Shown beneath the
 * awaiting-review pile so admins keep a visible audit trail of recent
 * approvals (instead of verified members "disappearing" the moment
 * they're approved). Read-only by default — the only action is
 * "Request resubmission" which flips kycStatus back to Docs Requested
 * if a mistake needs correcting.
 */
function isVerified(m: LehumoMember): boolean {
  if (m.status === "Exited") return false;
  return m.kycStatus === "Complete";
}

export function AdminKycReviewSection({
  initialMembers,
}: AdminKycReviewSectionProps) {
  // We hold the FULL member list locally so individual rows can update
  // optimistically after approve / reject / clear — and so once a
  // member's KYC is approved they drop off the queue automatically.
  // Uploads use router.refresh() instead of optimistic merging because
  // the Blob direct-upload path's onUploadCompleted runs server-side
  // after the client's upload promise resolves; we don't get the
  // updated member back synchronously.
  const router = useRouter();
  const [members, setMembers] = useState<LehumoMember[]>(initialMembers);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Confirmation dialog state — every Remove action funnels through
  // this so a misclick on a phone or trackpad doesn't immediately
  // wipe a KYC attachment. The action is held in `pendingConfirm`
  // until the admin clicks the destructive Confirm button (which
  // then runs the action), or Cancel / Esc / outside-click which
  // drops the dialog without firing.
  const [pendingConfirm, setPendingConfirm] =
    useState<PendingConfirm | null>(null);

  const queue = useMemo(() => members.filter(isAwaitingReview), [members]);
  // Verified members, most-recently-verified first. We sort by
  // kycVerifiedAt descending — the date string is YYYY-MM-DD so a
  // localeCompare on the raw value works as a chronological sort.
  // Members without a verifiedAt (legacy data, manually flipped in
  // Airtable) sort to the bottom.
  const verified = useMemo(
    () =>
      members.filter(isVerified).sort((a, b) => {
        const aDate = a.kycVerifiedAt ?? "";
        const bDate = b.kycVerifiedAt ?? "";
        return bDate.localeCompare(aDate);
      }),
    [members],
  );

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
            Members awaiting document review, with recent approvals
            visible at the bottom for audit.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center rounded-full bg-[#0B1933]/[0.06] px-2.5 py-1 text-[11px] font-bold text-[#0B1933]"
            title="Awaiting review (Docs Requested + In Progress)"
          >
            {queue.length} pending
          </span>
          {verified.length > 0 && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-[#B8FF00]/15 px-2.5 py-1 text-[11px] font-bold text-[#0B1933]"
              title="Verified KYC — kept visible for audit"
            >
              <ShieldCheck className="h-3 w-3" />
              {verified.length} verified
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="border-b border-red-200 bg-red-50 px-5 py-2 text-sm text-red-700 flex items-center gap-2">
          <XCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Empty state — only when BOTH lists are empty. If we have any
          verified members, we still want the audit trail visible even
          on a "no pending review" day. */}
      {queue.length === 0 && verified.length === 0 ? (
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
        <>
          {/* Awaiting Review group — the active work pile. Empty
              sub-state when we only have verified members keeps the
              section honest about its current state. */}
          {queue.length > 0 ? (
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
                  onClearSlot={(slot) => {
                    // Route every destructive Remove through the
                    // confirmation dialog. The Airtable PATCH only
                    // fires if the admin clicks Confirm; Cancel / Esc
                    // / outside-click drops the action entirely.
                    const slotLabel =
                      slot === "id" ? "ID Document" : "Proof of Address";
                    setPendingConfirm({
                      title: `Remove ${slotLabel}?`,
                      description: (
                        <>
                          This deletes the file from{" "}
                          <span className="text-white font-medium">
                            {member.fullName || "this member"}
                          </span>
                          &apos;s record. Other onboarding data (ID type,
                          address, beneficiary, contributions) is
                          preserved. Re-uploading is a one-click fix if
                          this was the wrong action.
                        </>
                      ),
                      confirmLabel: "Remove",
                      onConfirm: () =>
                        runAction(`${member.id}:clear:${slot}`, () =>
                          adminClearKycAttachment(member.id, slot),
                        ),
                    });
                  }}
                  onRefresh={() => router.refresh()}
                  onMemberUpdate={applyMemberUpdate}
                  onUploadError={setError}
                  setBusyKey={setBusyKey}
                />
              ))}
            </ul>
          ) : (
            <div className="px-5 py-8 text-center">
              <p className="text-xs text-[#6B7280]">
                No members awaiting review.{" "}
                <span className="text-[#9CA3AF]">
                  Verified members are listed below.
                </span>
              </p>
            </div>
          )}

          {/* Verified group — visible audit trail. Subtle visual
              separator + grey background sub-header makes the split
              obvious without competing with the active work above. */}
          {verified.length > 0 && (
            <>
              <div className="flex items-center justify-between gap-2 border-y border-[#E5E7EB] bg-[#F8F9FA] px-5 py-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#0B1933]" />
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#0B1933]">
                    Verified
                  </h3>
                  <span className="text-[11px] text-[#6B7280]">
                    {verified.length}{" "}
                    {verified.length === 1 ? "member" : "members"}
                  </span>
                </div>
                <span className="text-[10px] text-[#9CA3AF]">
                  Most recent first
                </span>
              </div>
              <ul className="divide-y divide-[#E5E7EB]">
                {verified.map((member) => (
                  <KycReviewRow
                    key={member.id}
                    member={member}
                    busyKey={busyKey}
                    // No-op handlers for the actions the verified-row
                    // variant doesn't render. Kept as required props
                    // to avoid making them optional and breaking the
                    // active-row code path's exhaustive checks.
                    onApprove={() => {}}
                    onReject={() =>
                      runAction(`${member.id}:reject`, () =>
                        adminRequestKycResubmission(member.id),
                      )
                    }
                    onClearSlot={() => {}}
                    onRefresh={() => router.refresh()}
                    onMemberUpdate={applyMemberUpdate}
                    onUploadError={setError}
                    setBusyKey={setBusyKey}
                  />
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {/* Destructive-action confirmation dialog — backs every Remove
          (and future member-deletion / status-reversion) flow. Lives
          at the section root so a single instance covers every row. */}
      <ConfirmDialog
        open={pendingConfirm !== null}
        title={pendingConfirm?.title ?? ""}
        description={pendingConfirm?.description}
        confirmLabel={pendingConfirm?.confirmLabel ?? "Confirm"}
        destructive
        onConfirm={() => {
          // Snapshot + clear before firing so the dialog can't be
          // double-clicked into running the action twice.
          const action = pendingConfirm?.onConfirm;
          setPendingConfirm(null);
          action?.();
        }}
        onCancel={() => setPendingConfirm(null)}
      />
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
  onClearSlot: (slot: "id" | "poa") => void;
  onRefresh: () => void;
  /** Push a freshly-fetched member back into the section's local
   *  state so the slot UI flips to "uploaded" without waiting for
   *  router.refresh() (which doesn't reset useState anyway). */
  onMemberUpdate: (updated: LehumoMember) => void;
  onUploadError: (msg: string) => void;
  setBusyKey: (key: string | null) => void;
}

function KycReviewRow({
  member,
  busyKey,
  onApprove,
  onReject,
  onClearSlot,
  onRefresh,
  onMemberUpdate,
  onUploadError,
  setBusyKey,
}: KycReviewRowProps) {
  const approving = busyKey === `${member.id}:approve`;
  const rejecting = busyKey === `${member.id}:reject`;
  const idBusy = busyKey === `${member.id}:upload:id`;
  const poaBusy = busyKey === `${member.id}:upload:poa`;
  const idClearing = busyKey === `${member.id}:clear:id`;
  const poaClearing = busyKey === `${member.id}:clear:poa`;
  const anyBusy =
    approving || rejecting || idBusy || poaBusy || idClearing || poaClearing;

  const idAttachment = member.kycIdDocument?.[0];
  const poaAttachment = member.kycProofOfAddress?.[0];
  const idPresent = !!idAttachment;
  const poaPresent = !!poaAttachment;
  const bothPresent = idPresent && poaPresent;
  const anyPresent = idPresent || poaPresent;
  const submittedCount = (idPresent ? 1 : 0) + (poaPresent ? 1 : 0);

  // Verified rows render in a simplified read-only form: docs as
  // View-only (no Replace / Remove), no Approve button (already
  // approved), and "Re-open KYC" as the sole action lever in case a
  // verification turns out to have been a mistake. Visually muted
  // (subtle background tint) so the active review pile keeps visual
  // priority above.
  const isVerifiedRow = member.kycStatus === "Complete";

  return (
    <li
      className={`px-5 py-4 ${
        isVerifiedRow ? "bg-[#FAFBFC]" : ""
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        {/* Left: identity */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-sm font-semibold text-[#0B0B0B]">
              {member.fullName || "—"}
            </p>
            <span className="inline-flex items-center rounded-full bg-[#F8F9FA] border border-[#E5E7EB] px-2 py-0.5 text-[10px] font-medium text-[#6B7280]">
              {formatMemberNumber(member.memberNumber)}
            </span>
            <KycStatusPill status={member.kycStatus} />
            {/* Partial-submission badge — only render when 0 or 1 of 2
                docs are uploaded AND we're not in the verified group.
                Verified rows have already passed approval (possibly via
                admin override) so the partial chip would just add noise. */}
            {!isVerifiedRow && submittedCount < 2 && (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  submittedCount === 0
                    ? "bg-[#F8F9FA] border border-[#E5E7EB] text-[#6B7280]"
                    : "bg-[#46CDCF]/10 border border-[#46CDCF]/30 text-[#0B1933]"
                }`}
                title={
                  submittedCount === 0
                    ? "Awaiting both ID and Proof of Address"
                    : `Awaiting ${idPresent ? "Proof of Address" : "ID Document"}`
                }
              >
                {submittedCount} of 2 docs
              </span>
            )}
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
            {/* Surface the verification date in the verified-row
                variant so admins can see when each approval landed
                without needing to dig into Airtable. Most-recent-first
                ordering of the group makes this the audit trail. */}
            {isVerifiedRow && member.kycVerifiedAt && (
              <Field
                label="Verified"
                value={formatDate(member.kycVerifiedAt)}
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
            clearing={idClearing}
            disabled={anyBusy}
            readOnly={isVerifiedRow}
            onRefresh={onRefresh}
            onMemberUpdate={onMemberUpdate}
            onError={onUploadError}
            onClear={() => onClearSlot("id")}
            setBusyKey={setBusyKey}
          />
          <DocSlot
            label="Proof of Address"
            slot="poa"
            memberId={member.id}
            attachment={poaAttachment}
            busy={poaBusy}
            clearing={poaClearing}
            disabled={anyBusy}
            readOnly={isVerifiedRow}
            onRefresh={onRefresh}
            onMemberUpdate={onMemberUpdate}
            onError={onUploadError}
            onClear={() => onClearSlot("poa")}
            setBusyKey={setBusyKey}
          />

          {/* Action buttons. Branch on row variant:
              - Awaiting review → Approve (primary) + Request resubmission
              - Verified → Re-open KYC only (single safety lever; the
                Approve button would be a no-op and the per-slot
                Replace / Remove are gated by the readOnly flag above)
              The Re-open lever reuses adminRequestKycResubmission which
              flips kycStatus back to "Docs Requested" — same Airtable
              path as the awaiting-review reject button. */}
          <div className="flex items-center gap-2 pt-1">
            {!isVerifiedRow && (
              <button
                type="button"
                onClick={onApprove}
                disabled={anyBusy || !anyPresent}
                title={
                  bothPresent
                    ? "Approve KYC and stamp verified date"
                    : anyPresent
                      ? "Approve with partial submission — admin override (member is missing one document)"
                      : "Upload at least one document before approving"
                }
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  bothPresent
                    ? "bg-[#B8FF00] text-[#0B1933] hover:bg-[#a8ef00]"
                    : "bg-[#46CDCF] text-white hover:bg-[#3aa9ab]"
                }`}
              >
                {approving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                {bothPresent ? "Approve" : "Approve (1 of 2)"}
              </button>
            )}
            <button
              type="button"
              onClick={onReject}
              disabled={anyBusy}
              title={
                isVerifiedRow
                  ? "Re-open KYC — flips status back to Docs Requested so the docs can be re-reviewed"
                  : "Flip back to Docs Requested so the member can re-upload"
              }
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#0B0B0B] hover:border-[#0B1933]/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {rejecting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
              {isVerifiedRow ? "Re-open KYC" : "Request resubmission"}
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
    // kycSubmittedAt / kycVerifiedAt are stored as Airtable date-only
    // values (YYYY-MM-DD), so there's no time component to display.
    // We normalize first in case a legacy full-ISO value is ever read
    // back, then pin to UTC to avoid the midnight-local timezone shift
    // that can flip the displayed day in some locales.
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

function KycStatusPill({ status }: { status: string }) {
  // Green pill for Complete so the verified group reads as "approved"
  // at a glance. Teal for In Progress (active review). Amber for
  // Docs Requested (awaiting member action). Grey fallback for any
  // other state Airtable might surface.
  const colour =
    status === "Complete"
      ? "bg-[#B8FF00]/20 text-[#0B1933] border border-[#B8FF00]/40"
      : status === "In Progress"
        ? "bg-[#46CDCF]/15 text-[#0B1933]"
        : status === "Docs Requested"
          ? "bg-[#FEF3C7] text-[#92400E]"
          : "bg-[#F8F9FA] text-[#6B7280] border border-[#E5E7EB]";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${colour}`}
    >
      {status === "Complete" ? "Verified" : status}
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
  clearing: boolean;
  disabled: boolean;
  /** When true, render the slot in a sealed read-only mode: View link
   *  is preserved (admins still need to inspect verified docs) but
   *  Replace and Remove are hidden, as is the empty-slot upload
   *  affordance. Used for verified-row slots where the documents are
   *  considered final until the row is explicitly re-opened via the
   *  "Re-open KYC" button. */
  readOnly?: boolean;
  /** Triggers a soft router.refresh() on the admin page after the
   *  Blob upload + server-side Airtable PATCH have settled. Used by
   *  the @vercel/blob direct path — handleUpload's onUploadCompleted
   *  runs server-side after the client's upload promise resolves,
   *  so we can't return the updated member synchronously. The
   *  page-level refresh re-fetches the member list. */
  onRefresh: () => void;
  /** Server-relay path (≤3MB) returns the freshly-PATCHed member
   *  in its response body. Push it back into the section's local
   *  state so the slot UI flips to "uploaded" immediately —
   *  router.refresh() alone doesn't help because useState in the
   *  section doesn't re-initialise from props on re-render. */
  onMemberUpdate: (updated: LehumoMember) => void;
  onError: (msg: string) => void;
  onClear: () => void;
  setBusyKey: (key: string | null) => void;
}

function DocSlot({
  label,
  slot,
  memberId,
  attachment,
  busy,
  clearing,
  disabled,
  readOnly = false,
  onRefresh,
  onMemberUpdate,
  onError,
  onClear,
  setBusyKey,
}: DocSlotProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Live progress while a Blob upload is in flight. Mirrors the
  // member-portal SlotCard so admins on slow connections see byte-by-
  // byte feedback on a 5–8 MB POA PDF instead of a "did this freeze?"
  // spinner.
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadedBytes, setUploadedBytes] = useState<number>(0);
  const [totalBytes, setTotalBytes] = useState<number>(0);

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
      const key = `${memberId}:upload:${slot}`;
      setBusyKey(key);

      // Compress images that exceed 3 MB before base64-encoding —
      // most ID photos arrive as 4–5 MB phone snaps. PDFs pass
      // through unchanged.
      let prepared: File;
      try {
        prepared = await compressImage({ file });
      } catch {
        prepared = file;
      }

      if (prepared.size > MAX_BYTES) {
        setBusyKey(null);
        onError(
          `File too large (${(prepared.size / 1024 / 1024).toFixed(1)}MB). Max 10MB.`,
        );
        return;
      }

      setProgress(0);
      setUploadedBytes(0);
      setTotalBytes(prepared.size);

      // ─── Path selection ─────────────────────────────────────────
      // Three upload paths, ordered by network friendliness on
      // filtered ISPs (South African mobile networks frequently
      // filter vercel.com), then by simplicity:
      //
      //   ≤ 3 MB → server-relay (single POST through our own
      //            function on limepages.co.za, never touches
      //            vercel.com from the browser)
      //   ≤ 10 MB → chunked (multiple POSTs through our function;
      //            the SERVER then uses @vercel/blob's server-side
      //            put() — server-to-server, also never user→
      //            vercel.com)
      //   > 10 MB → @vercel/blob direct (last resort; only path
      //            with no headroom limit, but blocked on filtered
      //            networks)
      //
      // Server-relay caps at 3 MB because Vercel functions have a
      // hard 4.5 MB body cap. Chunked extends that to 10 MB by
      // splitting the file across multiple sub-cap requests.
      const useServerRelay = prepared.size <= SERVER_RELAY_MAX_BYTES;
      const useChunked =
        !useServerRelay && prepared.size <= CHUNKED_MAX_BYTES;

      if (useServerRelay) {
        try {
          // The route returns `{member, slot, idPresent, poaPresent,
          // bothPresent}`. We push the fresh member into local state
          // immediately so the slot UI flips to "uploaded" without
          // waiting on router.refresh() (which can't mutate the
          // section's useState anyway — see comments on
          // onMemberUpdate). Then we ALSO call onRefresh() so the
          // outer admin page (queue counts, KPI tiles, behind-list)
          // re-fetches with the new state.
          const res = await uploadViaServerRelay<{
            member: LehumoMember;
          }>({
            endpoint: "/api/lehumo/portal/admin/kyc-upload-direct",
            file: prepared,
            payload: { memberId, slot },
            onProgress: ({ loaded, total, percentage }) => {
              setProgress(percentage);
              setUploadedBytes(loaded);
              setTotalBytes(total);
            },
          });
          if (res?.member) {
            onMemberUpdate(res.member);
          }
          onRefresh();
        } catch (err) {
          onError(err instanceof Error ? err.message : "Upload failed");
        } finally {
          setBusyKey(null);
          setProgress(null);
          setUploadedBytes(0);
          setTotalBytes(0);
        }
        return;
      }

      if (useChunked) {
        try {
          const res = await uploadViaChunks<{ member: LehumoMember }>({
            endpoint: "/api/lehumo/portal/admin/kyc-upload-chunked",
            file: prepared,
            payload: { memberId, slot },
            onProgress: ({ loaded, total, percentage }) => {
              setProgress(percentage);
              setUploadedBytes(loaded);
              setTotalBytes(total);
            },
          });
          if (res?.member) {
            onMemberUpdate(res.member);
          }
          onRefresh();
        } catch (err) {
          onError(err instanceof Error ? err.message : "Upload failed");
        } finally {
          setBusyKey(null);
          setProgress(null);
          setUploadedBytes(0);
          setTotalBytes(0);
        }
        return;
      }

      // ─── Fallback: @vercel/blob direct upload ──────────────────
      // Practically unreachable today — MAX_BYTES (10 MB) ≤
      // CHUNKED_MAX_BYTES, so files in range take the chunked path
      // and oversized files are rejected before this point. Kept as
      // a defensive last resort: if MAX_BYTES is ever bumped past
      // CHUNKED_MAX_BYTES, files in the gap fall through here.
      //
      // 90-second hard timeout via AbortSignal — without it, a
      // PUT to vercel.com/api/blob on a filtered network never
      // resolves AND never rejects, leaving the user with a
      // forever-spinner. With it, a stalled upload surfaces as
      // a real error in the toast.
      const abortCtrl = new AbortController();
      let stalledTimer: ReturnType<typeof setTimeout> = setTimeout(() => {
        abortCtrl.abort(new Error("Upload timed out after 90 seconds"));
      }, 90_000);

      try {
        // `multipart: false` keeps the upload as a single PUT.
        // @vercel/blob v2 auto-shards files >5 MB into multipart
        // chunks; the finalize step has produced infinite 99%-loop
        // retries on certain files. Forcing single PUT trades a
        // bit of parallelism for monotonic progress.
        await upload(`kyc/${slot}/${Date.now()}-${prepared.name}`, prepared, {
          access: "public",
          handleUploadUrl: "/api/lehumo/portal/admin/kyc-upload",
          contentType: prepared.type,
          multipart: false,
          abortSignal: abortCtrl.signal,
          clientPayload: JSON.stringify({
            memberId,
            slot,
            filename: prepared.name,
          }),
          onUploadProgress: ({ loaded, total, percentage }) => {
            setProgress(Math.round(percentage));
            setUploadedBytes(loaded);
            setTotalBytes(total);
            // Reset + re-arm the stall timer on each progress event.
            clearTimeout(stalledTimer);
            stalledTimer = setTimeout(() => {
              abortCtrl.abort(new Error("Upload timed out after 90 seconds"));
            }, 90_000);
          },
        });

        // upload() resolves once the file lands in Blob storage. The
        // server's `onUploadCompleted` callback fires via Vercel Blob's
        // webhook AFTER that — small delay lets that PATCH land.
        await new Promise((resolve) => setTimeout(resolve, 1500));
        onRefresh();
      } catch (err) {
        const isAbort =
          err instanceof Error &&
          (err.name === "AbortError" || err.message.includes("timed out"));
        const isFetchFailure =
          err instanceof Error && err.message.includes("Failed to fetch");
        if (isAbort || isFetchFailure) {
          onError(
            "Large-file upload blocked — your network appears to be filtering vercel.com. Try (a) compressing the file under 3MB so it routes through our server, (b) a different network like mobile hotspot, or (c) an incognito browser window to rule out extensions.",
          );
        } else {
          onError(err instanceof Error ? err.message : "Upload failed");
        }
      } finally {
        clearTimeout(stalledTimer);
        setBusyKey(null);
        setProgress(null);
        setUploadedBytes(0);
        setTotalBytes(0);
      }
    },
    [memberId, slot, onRefresh, onMemberUpdate, onError, setBusyKey],
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
        {/* Replace + Remove are sealed off in read-only mode (verified
            rows). View remains so admins can still inspect the doc;
            mutations require explicitly Re-opening the KYC first. */}
        {!readOnly && (
          <>
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
            <button
              type="button"
              // Confirmation is handled by the parent's ConfirmDialog
              // — clicking Remove queues the action; the styled modal
              // asks "Are you sure?" with focus on Cancel by default.
              onClick={onClear}
              disabled={disabled}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#9CA3AF] hover:text-[#DC2626] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Delete this attachment without changing other onboarding data — for wrong-file or wrong-member uploads"
            >
              {clearing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              Remove
            </button>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT_ATTR}
              className="hidden"
              onChange={handleChange}
            />
          </>
        )}
      </div>
    );
  }

  // Empty state — admin can upload on the member's behalf (e.g. when
  // docs were emailed to lehumo@limepages.co.za). Read-only verified
  // rows shouldn't have empty slots in practice (they passed approval
  // with both docs, or via partial-submission admin override which
  // already locks the slot). In the override case, render a muted
  // placeholder rather than the upload affordance — an admin who needs
  // to fill the missing slot must Re-open KYC first.
  if (readOnly) {
    return (
      <div
        className={`${baseClasses} border-dashed border-[#E5E7EB] flex items-center gap-3`}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white border border-[#E5E7EB] text-[#9CA3AF]">
          <AlertCircle className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wider text-[#9CA3AF]">
            {label}
          </p>
          <p className="text-xs text-[#9CA3AF]">
            Not on file · approved without this document
          </p>
        </div>
      </div>
    );
  }

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
          {busy
            ? progress !== null
              ? `Uploading ${progress}% · ${(uploadedBytes / 1024 / 1024).toFixed(1)}MB of ${(totalBytes / 1024 / 1024).toFixed(1)}MB`
              : "Uploading…"
            : "Not yet uploaded · click to upload on member's behalf"}
        </p>
        {/* Live progress bar — visible only while a Blob upload is
            in flight. Gives explicit byte-by-byte confirmation that
            a 5–8 MB POA PDF is actually moving across the wire. */}
        {busy && progress !== null && (
          <div className="mt-1.5 h-1 w-full rounded-full bg-[#E5E7EB] overflow-hidden">
            <div
              className="h-full bg-[#46CDCF] transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
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
