import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import {
  getMemberById,
  uploadKycAttachment,
  setMemberKyc,
} from "@/lib/airtable";
import { sendKycReceivedEmail } from "@/lib/email";

// ─── Limits ─────────────────────────────────────────────────────────
// Airtable's hard ceiling for inline-base64 uploads is 5MB. We mirror
// that here so the user gets a friendly error instead of a 413 from
// Airtable when they try to push a phone-camera ID photo too big.
const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

interface UploadBody {
  slot?: unknown;
  filename?: unknown;
  contentType?: unknown;
  /** Base64-encoded file contents (no `data:` prefix). */
  file?: unknown;
}

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Member-portal KYC document upload.
 *
 * Flow:
 *   1. Auth via session cookie.
 *   2. Validate slot, filename, content-type, and size.
 *   3. Push the file to Airtable's content-upload endpoint.
 *   4. If BOTH KYC slots now hold attachments, flip kycStatus →
 *      "In Progress" and stamp kycSubmittedAt. This is the signal that
 *      pops the member into the admin review queue.
 *   5. Return the freshly-fetched member so the client can re-render.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return bad("Unauthorized", 401);

    const json = (await request.json().catch(() => null)) as UploadBody | null;
    if (!json) return bad("Invalid JSON body");

    const { slot, filename, contentType, file } = json;

    // ── Validate slot ──
    if (slot !== "id" && slot !== "poa") {
      return bad("slot must be 'id' or 'poa'");
    }

    // ── Validate filename ──
    if (typeof filename !== "string" || filename.trim().length === 0) {
      return bad("filename is required");
    }

    // ── Validate content type ──
    if (typeof contentType !== "string" || !ALLOWED_MIME.has(contentType)) {
      return bad(
        `Unsupported file type. Allowed: JPG, PNG, HEIC, or PDF.`,
      );
    }

    // ── Validate base64 + size ──
    if (typeof file !== "string" || file.length === 0) {
      return bad("file (base64) is required");
    }
    // base64 length × 3/4 ≈ decoded bytes. Cheap pre-check before we
    // ship it to Airtable.
    const approxBytes = Math.floor((file.length * 3) / 4);
    if (approxBytes > MAX_BYTES) {
      return bad(
        `File too large (${(approxBytes / 1024 / 1024).toFixed(1)}MB). Max 5MB.`,
        413,
      );
    }

    // ── Confirm the member exists & belongs to this session ──
    const existing = await getMemberById(session.memberId);
    if (!existing) return bad("Member not found", 404);

    // ── Upload to Airtable ──
    let updated = await uploadKycAttachment(session.memberId, slot, {
      contentType,
      base64: file,
      filename: filename.trim(),
    });

    // ── Auto-flip kycStatus when both slots are filled ──
    // We only flip on the *transition* — once kycStatus is already
    // "In Progress" or "Complete", we leave it alone. Re-uploads after
    // an admin rejection should keep the status as-is so the admin
    // queue isn't double-counted.
    const bothPresent =
      (updated.kycIdDocument?.length ?? 0) > 0 &&
      (updated.kycProofOfAddress?.length ?? 0) > 0;
    const stillRequestingDocs = updated.kycStatus === "Docs Requested";
    if (bothPresent && stillRequestingDocs) {
      updated = await setMemberKyc(updated.id, {
        kycStatus: "In Progress",
        markSubmittedNow: true,
      });

      // Best-effort receipt email — fire once on the Docs Requested →
      // In Progress transition. Don't await; a Resend hiccup must not
      // roll back the status flip.
      if (updated.email) {
        sendKycReceivedEmail({
          to: updated.email,
          fullName: updated.fullName,
          memberNumber: updated.memberNumber,
        }).catch((err) =>
          console.error("KYC received email failed:", err),
        );
      }
    }

    return NextResponse.json({
      member: updated,
      slot,
      bothPresent,
    });
  } catch (error) {
    console.error("KYC upload error:", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 },
    );
  }
}
