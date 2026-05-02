"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import {
  Upload,
  FileCheck,
  ShieldCheck,
  Loader2,
  AlertCircle,
  ExternalLink,
  RotateCcw,
} from "lucide-react";

import type { LehumoMember, AirtableAttachment } from "@/lib/definitions";
import { compressImage } from "@/lib/compress-image";
import {
  uploadViaServerRelay,
  SERVER_RELAY_MAX_BYTES,
} from "@/lib/upload-via-server-relay";
import {
  uploadViaChunks,
  CHUNKED_MAX_BYTES,
} from "@/lib/upload-via-chunks";

interface KycDocumentsCardProps {
  member: LehumoMember;
}

type SlotKey = "id" | "poa";

interface SlotConfig {
  key: SlotKey;
  label: string;
  hint: string;
  attachments?: AirtableAttachment[];
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
// Vercel Blob direct upload bypasses our function body cap entirely
// (file goes browser → Blob storage, not browser → Vercel function),
// so the 3 MB ceiling is gone. Cap at 10 MB to keep individual files
// reasonable — bigger than that is almost certainly a misclick.
const MAX_BYTES = 10 * 1024 * 1024;

interface SlotCardProps {
  slot: SlotConfig;
  isVerified: boolean;
  onUploaded: () => void;
}

function SlotCard({ slot, isVerified, onUploaded }: SlotCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Live progress while a Blob upload is in flight. `null` outside an
  // active upload, 0–100 during the PUT to Blob storage. Surfaced in
  // the slot UI so a slow connection on a 5 MB+ file looks like
  // "uploading 40%" instead of "spinner forever".
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadedBytes, setUploadedBytes] = useState<number>(0);
  const [totalBytes, setTotalBytes] = useState<number>(0);

  const hasFile = (slot.attachments?.length ?? 0) > 0;
  const firstFile = slot.attachments?.[0];

  const handlePick = useCallback(() => {
    if (busy) return;
    setError(null);
    inputRef.current?.click();
  }, [busy]);

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const picked = e.target.files?.[0];
      // Reset the input value so picking the same file again still triggers
      // change — by default browsers suppress duplicate selections.
      e.target.value = "";
      if (!picked) return;

      if (!ALLOWED_MIME.has(picked.type)) {
        setError("Unsupported file type. Use JPG, PNG, HEIC, or PDF.");
        return;
      }

      setBusy(true);
      setError(null);

      // Compress images that exceed the 3 MB envelope before encoding —
      // a 5 MB phone photo typically lands in 500 KB–1 MB at quality 0.85
      // with a 2,000 px long-edge cap. PDFs are passed through unchanged
      // (compressImage early-exits on non-image MIME types) so they
      // still hit the size gate below if too large.
      let file: File;
      try {
        file = await compressImage({ file: picked });
      } catch {
        file = picked;
      }

      if (file.size > MAX_BYTES) {
        setBusy(false);
        setError(
          `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 10MB.`,
        );
        return;
      }

      setProgress(0);
      setUploadedBytes(0);
      setTotalBytes(file.size);

      // ─── Path selection ─────────────────────────────────────────
      // Three upload paths, ordered by network friendliness on
      // filtered ISPs (South African mobile networks frequently
      // filter vercel.com), then by simplicity:
      //
      //   ≤ 3 MB → server-relay (single POST through our own
      //            function on limepages.co.za)
      //   ≤ 10 MB → chunked (multiple sub-cap POSTs through our
      //            function; the SERVER then uses @vercel/blob's
      //            server-side put() — server-to-server, never
      //            user→vercel.com)
      //   > 10 MB → @vercel/blob direct (last resort; only path
      //            with no headroom limit, but blocked on
      //            filtered networks)
      //
      // Server-relay caps at 3 MB because Vercel functions have a
      // 4.5 MB request body cap. Chunked extends to 10 MB by
      // splitting across multiple sub-cap requests.
      const useServerRelay = file.size <= SERVER_RELAY_MAX_BYTES;
      const useChunked = !useServerRelay && file.size <= CHUNKED_MAX_BYTES;

      if (useServerRelay) {
        try {
          await uploadViaServerRelay({
            endpoint: "/api/lehumo/portal/member/kyc-upload-direct",
            file,
            payload: { slot: slot.key },
            onProgress: ({ loaded, total, percentage }) => {
              setProgress(percentage);
              setUploadedBytes(loaded);
              setTotalBytes(total);
            },
          });
          await new Promise((resolve) => setTimeout(resolve, 300));
          onUploaded();
        } catch (err) {
          setError(
            err instanceof Error
              ? `Upload failed: ${err.message}`
              : "Upload failed. Please try again.",
          );
        } finally {
          setBusy(false);
          setProgress(null);
          setUploadedBytes(0);
          setTotalBytes(0);
        }
        return;
      }

      if (useChunked) {
        try {
          await uploadViaChunks({
            endpoint: "/api/lehumo/portal/member/kyc-upload-chunked",
            file,
            payload: { slot: slot.key },
            onProgress: ({ loaded, total, percentage }) => {
              setProgress(percentage);
              setUploadedBytes(loaded);
              setTotalBytes(total);
            },
          });
          await new Promise((resolve) => setTimeout(resolve, 300));
          onUploaded();
        } catch (err) {
          setError(
            err instanceof Error
              ? `Upload failed: ${err.message}`
              : "Upload failed. Please try again.",
          );
        } finally {
          setBusy(false);
          setProgress(null);
          setUploadedBytes(0);
          setTotalBytes(0);
        }
        return;
      }

      // ─── Fallback: @vercel/blob direct upload for files > 3 MB ─
      // 90-second hard timeout via AbortSignal. The PUT to Vercel
      // Blob has been hanging indefinitely on some networks (likely
      // ISP-level filtering of vercel.com/api/blob — South African
      // networks have a history of this). Without a timeout, the
      // promise never resolves AND never rejects.
      const abortCtrl = new AbortController();
      let stalledTimer: ReturnType<typeof setTimeout> = setTimeout(() => {
        abortCtrl.abort(new Error("Upload timed out after 90 seconds"));
      }, 90_000);

      try {
        // `multipart: false` forces a single PUT instead of parallel
        // chunked uploads. @vercel/blob v2 splits files >5 MB into
        // multipart, and the finalize step has been observed to
        // bounce certain uploads at 99% — restarting from scratch.
        await upload(`kyc/${slot.key}/${Date.now()}-${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/lehumo/portal/member/kyc-upload",
          contentType: file.type,
          multipart: false,
          abortSignal: abortCtrl.signal,
          clientPayload: JSON.stringify({
            slot: slot.key,
            filename: file.name,
          }),
          onUploadProgress: ({ loaded, total, percentage }) => {
            setProgress(Math.round(percentage));
            setUploadedBytes(loaded);
            setTotalBytes(total);
            clearTimeout(stalledTimer);
            stalledTimer = setTimeout(() => {
              abortCtrl.abort(new Error("Upload timed out after 90 seconds"));
            }, 90_000);
          },
        });

        // upload() resolves once the file lands in Blob storage; the
        // server's onUploadCompleted (Airtable PATCH + Blob delete)
        // runs as a follow-on webhook from Vercel Blob.
        await new Promise((resolve) => setTimeout(resolve, 1500));
        onUploaded();
      } catch (err) {
        const isAbort =
          err instanceof Error &&
          (err.name === "AbortError" || err.message.includes("timed out"));
        const isFetchFailure =
          err instanceof Error && err.message.includes("Failed to fetch");
        if (isAbort || isFetchFailure) {
          setError(
            "Large-file upload blocked — your network appears to be filtering our storage provider. Try compressing the file under 3MB, switching network (mobile hotspot often works), or email the document to lehumo@limepages.co.za.",
          );
        } else {
          setError(
            err instanceof Error
              ? `Upload failed: ${err.message}`
              : "Upload failed. Please try again.",
          );
        }
      } finally {
        clearTimeout(stalledTimer);
        setBusy(false);
        setProgress(null);
        setUploadedBytes(0);
        setTotalBytes(0);
      }
    },
    [slot.key, onUploaded],
  );

  // Helper for the progress label — formats as "MB" with one decimal
  // for files under 100MB (covers our 10MB ceiling comfortably) and
  // returns "n/a" if total isn't yet known (e.g., before first
  // progress event fires).
  const fmtMb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)}MB`;

  // ── Render variants ──────────────────────────────────────────────
  const baseClasses =
    "relative rounded-[14px] border bg-[#0B1933]/40 p-4 transition-colors";

  if (isVerified && hasFile) {
    return (
      <div
        className={`${baseClasses} border-[#B8FF00]/40`}
        aria-label={`${slot.label} verified`}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#B8FF00]/15 text-[#B8FF00]">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-white">{slot.label}</p>
              <span className="inline-flex items-center rounded-full bg-[#B8FF00]/15 px-2 py-0.5 text-[10px] font-bold text-[#B8FF00]">
                Verified
              </span>
            </div>
            {firstFile && (
              <p className="truncate text-xs text-white/50">
                {firstFile.filename}
              </p>
            )}
            {firstFile && (
              <a
                href={firstFile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#46CDCF] hover:text-[#B8FF00] transition-colors"
              >
                View document <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (hasFile) {
    return (
      <div
        className={`${baseClasses} border-white/[0.08]`}
        aria-label={`${slot.label} submitted`}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#46CDCF]/15 text-[#46CDCF]">
            <FileCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-white">{slot.label}</p>
              <span className="inline-flex items-center rounded-full bg-[#46CDCF]/15 px-2 py-0.5 text-[10px] font-bold text-[#46CDCF]">
                Submitted
              </span>
            </div>
            {firstFile && (
              <p className="truncate text-xs text-white/50">
                {firstFile.filename}
              </p>
            )}
            <div className="mt-2 flex items-center gap-3">
              {firstFile && (
                <a
                  href={firstFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-white/60 hover:text-white transition-colors"
                >
                  View <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <button
                type="button"
                onClick={handlePick}
                disabled={busy}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-white/60 hover:text-[#B8FF00] disabled:opacity-50 transition-colors"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />{" "}
                    {progress !== null ? `${progress}%` : "Uploading…"}
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-3 w-3" /> Replace
                  </>
                )}
              </button>
            </div>
            {/* Inline progress bar during a Replace upload — same
                bytes/percent feedback as the empty-slot case. */}
            {busy && progress !== null && (
              <div className="mt-2 h-1 w-full rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full bg-[#B8FF00] transition-all duration-150 ease-out"
                  style={{ width: `${progress}%` }}
                />
                <p className="mt-1 text-[10px] text-white/40">
                  {fmtMb(uploadedBytes)} of {fmtMb(totalBytes)}
                </p>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT_ATTR}
              className="hidden"
              onChange={handleChange}
            />
            {error && (
              <p className="mt-2 flex items-center gap-1 text-[11px] text-red-400">
                <AlertCircle className="h-3 w-3" /> {error}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Empty / not yet uploaded
  return (
    <button
      type="button"
      onClick={handlePick}
      disabled={busy}
      className={`${baseClasses} border-dashed border-white/15 hover:border-[#B8FF00]/40 hover:bg-[#B8FF00]/[0.03] disabled:opacity-50 disabled:cursor-not-allowed text-left w-full cursor-pointer`}
      aria-label={`Upload ${slot.label}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-white/50">
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white mb-0.5">
            {slot.label}
          </p>
          <p className="text-xs text-white/50">
            {busy
              ? progress !== null
                ? `Uploading ${progress}% · ${fmtMb(uploadedBytes)} of ${fmtMb(totalBytes)}`
                : "Uploading…"
              : slot.hint}
          </p>
          {/* Progress bar — only renders during an active upload.
              Gives explicit visual confirmation that bytes are
              flowing, so a slow connection on a large file looks
              like work-in-progress instead of "stuck spinner". */}
          {busy && progress !== null && (
            <div className="mt-2 h-1 w-full rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full bg-[#B8FF00] transition-all duration-150 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          {error && (
            <p className="mt-2 flex items-center gap-1 text-[11px] text-red-400">
              <AlertCircle className="h-3 w-3" /> {error}
            </p>
          )}
        </div>
      </div>
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

/**
 * Member-portal KYC upload card. Two slots — ID document + proof of
 * address — each with its own upload state. Once both are populated,
 * the API auto-flips kycStatus to "In Progress" and stamps the
 * submission timestamp; admins then approve via the admin portal.
 *
 * Hidden entirely once the member is fully verified (kycStatus =
 * "Complete"), since the existing KycStatusTracker already conveys
 * that state and there's nothing left for the member to do.
 */
export function KycDocumentsCard({ member }: KycDocumentsCardProps) {
  const router = useRouter();

  const slots: SlotConfig[] = [
    {
      key: "id",
      label: "ID Document",
      hint: "Upload your SA ID or passport — JPG, PNG, HEIC, or PDF (max 10MB).",
      attachments: member.kycIdDocument,
    },
    {
      key: "poa",
      label: "Proof of Address",
      hint: "Utility bill, lease, or bank statement (under 3 months old)",
      attachments: member.kycProofOfAddress,
    },
  ];

  const isVerified = member.kycStatus === "Complete";
  const submittedCount = slots.reduce(
    (n, s) => n + ((s.attachments?.length ?? 0) > 0 ? 1 : 0),
    0,
  );
  const allSubmitted = submittedCount === slots.length;
  const someSubmitted = submittedCount > 0 && !allSubmitted;

  // After an upload, refresh the route so the server-rendered card
  // re-fetches the member with the new attachment URLs.
  const handleUploaded = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <div className="rounded-[24px] border border-white/[0.05] bg-gradient-to-b from-[#10224a] to-[#0F2040] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_8px_32px_-8px_rgba(0,0,0,0.35)] p-6">
      <div className="flex items-start justify-between mb-1">
        <h2 className="text-lg font-semibold text-white">KYC Documents</h2>
        {isVerified ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#B8FF00]/15 px-2.5 py-1 text-[11px] font-bold text-[#B8FF00]">
            <ShieldCheck className="h-3 w-3" /> All verified
          </span>
        ) : allSubmitted ? (
          <span className="inline-flex items-center rounded-full bg-[#46CDCF]/15 px-2.5 py-1 text-[11px] font-bold text-[#46CDCF]">
            Awaiting review
          </span>
        ) : someSubmitted ? (
          <span className="inline-flex items-center rounded-full bg-[#46CDCF]/15 px-2.5 py-1 text-[11px] font-bold text-[#46CDCF]">
            {submittedCount} of {slots.length} submitted
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-bold text-white/60">
            Action required
          </span>
        )}
      </div>
      <p className="text-xs text-white/50 mb-5">
        {isVerified
          ? "Your documents have been verified. Nothing more to do here."
          : allSubmitted
            ? "Both documents received. We'll review and verify within 24 hours."
            : someSubmitted
              ? "One document received — upload the remaining one to complete your KYC. The admin can also approve a partial submission while you sort the second file."
              : "Upload both documents to complete your KYC. You can also email them to lehumo@limepages.co.za."}
      </p>

      <div className="grid grid-cols-1 gap-3">
        {slots.map((slot) => (
          <SlotCard
            key={slot.key}
            slot={slot}
            isVerified={isVerified}
            onUploaded={handleUploaded}
          />
        ))}
      </div>
    </div>
  );
}
