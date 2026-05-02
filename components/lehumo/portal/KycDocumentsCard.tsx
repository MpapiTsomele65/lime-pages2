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

      try {
        // Direct browser → Vercel Blob upload. Our route mints a
        // signed token, browser PUTs the file straight to Blob
        // storage, then `onUploadCompleted` fires server-side to
        // PATCH Airtable with the resulting public URL.
        await upload(`kyc/${slot.key}/${Date.now()}-${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/lehumo/portal/member/kyc-upload",
          contentType: file.type,
          clientPayload: JSON.stringify({
            slot: slot.key,
            filename: file.name,
          }),
        });

        // upload() resolves once the file lands in Blob storage; the
        // server's onUploadCompleted (Airtable PATCH + Blob delete)
        // runs as a follow-on webhook from Vercel Blob. Brief delay
        // before the page refresh lets that PATCH land so the
        // re-render shows the new attachment.
        await new Promise((resolve) => setTimeout(resolve, 1500));
        onUploaded();
      } catch (err) {
        setError(
          err instanceof Error
            ? `Upload failed: ${err.message}`
            : "Upload failed. Please try again.",
        );
      } finally {
        setBusy(false);
      }
    },
    [slot.key, onUploaded],
  );

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
                    <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-3 w-3" /> Replace
                  </>
                )}
              </button>
            </div>
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
            {busy ? "Uploading…" : slot.hint}
          </p>
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
    <div className="bg-[#0F2040] rounded-[20px] border border-white/[0.06] p-6">
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
