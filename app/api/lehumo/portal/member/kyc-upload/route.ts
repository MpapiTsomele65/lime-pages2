import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import {
  getMemberByIdLite,
  uploadKycAttachment,
  setMemberKyc,
} from "@/lib/airtable";
import { sendKycReceivedEmail } from "@/lib/email";

// ─── Limits ─────────────────────────────────────────────────────────
// Vercel's serverless function request body cap is 4.5 MB. The file
// arrives as a base64-encoded string inside a JSON body, which adds
// ~33% overhead, so the practical raw-file ceiling is ~3.4 MB before
// the platform 413s us before our handler ever runs. Set MAX_BYTES at
// 3 MB to leave headroom for the JSON envelope + base64 padding.
// Airtable itself supports up to 5 MB; the binding constraint is
// Vercel's body limit. To support the full 5 MB later we'd need
// browser-direct uploads via Vercel Blob (or similar) — bypassing
// the function body limit entirely.
const MAX_BYTES = 3 * 1024 * 1024;

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
  // Track which stage of the flow the request is in so error responses
  // (and logs) pinpoint where things broke. Same pattern as Paystack
  // init's `stage` variable.
  let stage: string = "init";
  try {
    stage = "session";
    const session = await getSession();
    if (!session) return bad("Unauthorized", 401);

    stage = "parse_body";
    const json = (await request.json().catch(() => null)) as UploadBody | null;
    if (!json) return bad("Invalid JSON body");

    const { slot, filename, contentType, file } = json;

    stage = "validate_slot";
    if (slot !== "id" && slot !== "poa") {
      return bad("slot must be 'id' or 'poa'");
    }

    stage = "validate_filename";
    if (typeof filename !== "string" || filename.trim().length === 0) {
      return bad("filename is required");
    }

    stage = "validate_contenttype";
    if (typeof contentType !== "string" || !ALLOWED_MIME.has(contentType)) {
      return bad(`Unsupported file type. Allowed: JPG, PNG, HEIC, or PDF.`);
    }

    stage = "validate_size";
    if (typeof file !== "string" || file.length === 0) {
      return bad("file (base64) is required");
    }
    // base64 length × 3/4 ≈ decoded bytes. Cheap pre-check before we
    // ship it to Airtable.
    const approxBytes = Math.floor((file.length * 3) / 4);
    if (approxBytes > MAX_BYTES) {
      return bad(
        `File too large (${(approxBytes / 1024 / 1024).toFixed(1)}MB). Max 3MB.`,
        413,
      );
    }

    stage = "lookup_member";
    // Lite fetch — we don't need contribution rows on the upload path.
    const existing = await getMemberByIdLite(session.memberId);
    if (!existing) return bad("Member not found", 404);

    stage = "upload_attachment";
    let updated = await uploadKycAttachment(session.memberId, slot, {
      contentType,
      base64: file,
      filename: filename.trim(),
    });

    stage = "maybe_flip_status";
    // Auto-flip kycStatus when both slots are filled. We only flip on
    // the *transition* — once kycStatus is already "In Progress" or
    // "Complete", we leave it alone so re-uploads after admin rejection
    // don't double-count the queue.
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
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `KYC upload error [stage=${stage}]:`,
      message,
      error instanceof Error ? error.stack : undefined,
    );
    // Surface the stage + a one-line error message so the client can
    // show actionable copy and we have something searchable in logs.
    // Stack traces stay server-side.
    return NextResponse.json(
      {
        error: `Upload failed at ${stage}: ${message}`,
        stage,
      },
      { status: 500 },
    );
  }
}
