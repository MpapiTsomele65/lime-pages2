import { NextRequest, NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import {
  getMemberByIdLite,
  uploadKycAttachment,
  setMemberKyc,
} from "@/lib/airtable";

// ─── Limits ─────────────────────────────────────────────────────────
// Mirror the member-portal upload route. Vercel's serverless function
// body cap is 4.5 MB; base64 adds 33% overhead; 3 MB raw fits with
// headroom for the JSON envelope. See member route for the full
// rationale and the path to support 5 MB via Vercel Blob.
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
  memberId?: unknown;
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
 * Admin-on-behalf KYC document upload.
 *
 * Use case: a member emails their ID/POA to lehumo@limepages.co.za
 * instead of uploading through the portal. The admin then drops it into
 * the right slot from the admin panel — same Airtable end state, no
 * second portal login required from the member.
 *
 * Flow mirrors `/api/lehumo/portal/member/kyc-upload`:
 *   1. Admin auth gate (LEHUMO_ADMIN_EMAILS).
 *   2. Validate memberId, slot, filename, content-type, and size.
 *   3. Push to Airtable's content-upload endpoint.
 *   4. If both slots populated and kycStatus is "Docs Requested",
 *      auto-flip to "In Progress" + stamp kycSubmittedAt. (We don't
 *      auto-approve here — admin still has to click Approve so the
 *      kycVerifiedAt timestamp reflects the actual review moment.)
 */
export async function POST(request: NextRequest) {
  let stage: string = "init";
  try {
    stage = "admin_session";
    const session = await getAdminSession();
    if (!session) return bad("Forbidden", 403);

    stage = "parse_body";
    const json = (await request.json().catch(() => null)) as UploadBody | null;
    if (!json) return bad("Invalid JSON body");

    const { memberId, slot, filename, contentType, file } = json;

    stage = "validate_memberid";
    if (typeof memberId !== "string" || !memberId.startsWith("rec")) {
      return bad("memberId must be an Airtable record id");
    }

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
      return bad("Unsupported file type. Allowed: JPG, PNG, HEIC, or PDF.");
    }

    stage = "validate_size";
    if (typeof file !== "string" || file.length === 0) {
      return bad("file (base64) is required");
    }
    const approxBytes = Math.floor((file.length * 3) / 4);
    if (approxBytes > MAX_BYTES) {
      return bad(
        `File too large (${(approxBytes / 1024 / 1024).toFixed(1)}MB). Max 3MB.`,
        413,
      );
    }

    stage = "lookup_member";
    // Lite fetch — admin upload route doesn't need contribution rows.
    const existing = await getMemberByIdLite(memberId);
    if (!existing) return bad("Member not found", 404);

    stage = "upload_attachment";
    let updated = await uploadKycAttachment(memberId, slot, {
      contentType,
      base64: file,
      filename: filename.trim(),
    });

    stage = "maybe_flip_status";
    const bothPresent =
      (updated.kycIdDocument?.length ?? 0) > 0 &&
      (updated.kycProofOfAddress?.length ?? 0) > 0;
    const stillRequestingDocs = updated.kycStatus === "Docs Requested";
    if (bothPresent && stillRequestingDocs) {
      updated = await setMemberKyc(updated.id, {
        kycStatus: "In Progress",
        markSubmittedNow: true,
      });
    }

    return NextResponse.json({
      member: updated,
      slot,
      bothPresent,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `Admin KYC upload error [stage=${stage}]:`,
      message,
      error instanceof Error ? error.stack : undefined,
    );
    return NextResponse.json(
      {
        error: `Upload failed at ${stage}: ${message}`,
        stage,
      },
      { status: 500 },
    );
  }
}
