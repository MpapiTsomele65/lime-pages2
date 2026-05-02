import { NextRequest, NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import {
  getMemberByIdLite,
  uploadKycAttachment,
  setMemberKyc,
} from "@/lib/airtable";

// ─── Limits ─────────────────────────────────────────────────────────
// Server-relay path: browser POSTs JSON+base64 directly to this
// function, which then PATCHes Airtable. Vercel's serverless
// function body cap is 4.5 MB; base64 adds 33% overhead; 3 MB raw
// fits with headroom for the JSON envelope. Files larger than this
// must use the @vercel/blob direct-upload route instead.
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
 * Admin-on-behalf KYC upload — SERVER-RELAY path.
 *
 * Why this exists alongside the @vercel/blob direct-upload route:
 *   The @vercel/blob client uploads from browser → vercel.com/api/blob.
 *   On some networks (notably some South African ISPs) that exact
 *   host gets filtered or fails connection-establishment, manifesting
 *   as "Failed to fetch" with no server-side trace. Bouncing the
 *   upload through our own function — which sits on the SAME custom
 *   domain (limepages.co.za) the user is already loading — sidesteps
 *   the filter entirely because the browser only ever talks to the
 *   already-trusted origin.
 *
 * Trade-off: this path is capped at ~3 MB raw because Vercel
 * functions have a hard 4.5 MB body cap. Files larger than that
 * still need the @vercel/blob route. The client picks based on size
 * after compression.
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
        `File too large (${(approxBytes / 1024 / 1024).toFixed(1)}MB). Server-relay path caps at 3MB — use the Blob path for larger files.`,
        413,
      );
    }

    stage = "lookup_member";
    const existing = await getMemberByIdLite(memberId);
    if (!existing) return bad("Member not found", 404);

    stage = "upload_attachment";
    let updated = await uploadKycAttachment(memberId, slot, {
      contentType,
      base64: file,
      filename: filename.trim(),
    });

    stage = "maybe_flip_status";
    // Mirror the @vercel/blob route's first-doc auto-flip — admin
    // uploads land in the queue identically.
    const idPresent = (updated.kycIdDocument?.length ?? 0) > 0;
    const poaPresent = (updated.kycProofOfAddress?.length ?? 0) > 0;
    const anyPresent = idPresent || poaPresent;
    const bothPresent = idPresent && poaPresent;
    const stillRequestingDocs = updated.kycStatus === "Docs Requested";
    if (anyPresent && stillRequestingDocs) {
      updated = await setMemberKyc(updated.id, {
        kycStatus: "In Progress",
        markSubmittedNow: true,
      });
    }

    return NextResponse.json({
      member: updated,
      slot,
      bothPresent,
      idPresent,
      poaPresent,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `Admin KYC upload-direct error [stage=${stage}]:`,
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
