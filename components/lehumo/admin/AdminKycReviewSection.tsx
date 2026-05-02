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
              onClearSlot={(slot) => {
                // Route every destructive Remove through the
                // confirmation dialog. The Airtable PATCH only fires
                // if the admin clicks Confirm; Cancel / Esc / outside-
                // click drops the action entirely.
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
                      address, beneficiary, contributions) is preserved.
                      Re-uploading is a one-click fix if this was the
                      wrong action.
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

  return (
    <li className="px-5 py-4">
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
                docs are uploaded. Once both land we drop the chip so the
                row's KycStatusPill carries the rest of the lifecycle. */}
            {submittedCount < 2 && (
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
            onRefresh={onRefresh}
            onMemberUpdate={onMemberUpdate}
            onError={onUploadError}
            onClear={() => onClearSlot("poa")}
            setBusyKey={setBusyKey}
          />

          {/* Approve / reject actions */}
          <div className="flex items-center gap-2 pt-1">
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
  clearing: boolean;
  disabled: boolean;
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
          // Confirmation is handled by the parent's ConfirmDialog —
          // clicking Remove queues the action; the styled modal asks
          // "Are you sure?" with focus on Cancel by default.
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
