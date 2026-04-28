import { NextRequest, NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { getMemberById, uploadKycAttachment, setMemberKyc } from "@/lib/airtable";

// ─── Limits ─────────────────────────────────────────────────────────
// Mirror the member-portal upload route. Airtable's hard ceiling for
// inline-base64 uploads is 5MB.
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
  try {
    const session = await getAdminSession();
    if (!session) return bad("Forbidden", 403);

    const json = (await request.json().catch(() => null)) as UploadBody | null;
    if (!json) return bad("Invalid JSON body");

    const { memberId, slot, filename, contentType, file } = json;

    // ── Validate memberId ──
    if (typeof memberId !== "string" || !memberId.startsWith("rec")) {
      return bad("memberId must be an Airtable record id");
    }

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
      return bad("Unsupported file type. Allowed: JPG, PNG, HEIC, or PDF.");
    }

    // ── Validate base64 + size ──
    if (typeof file !== "string" || file.length === 0) {
      return bad("file (base64) is required");
    }
    const approxBytes = Math.floor((file.length * 3) / 4);
    if (approxBytes > MAX_BYTES) {
      return bad(
        `File too large (${(approxBytes / 1024 / 1024).toFixed(1)}MB). Max 5MB.`,
        413,
      );
    }

    // ── Confirm the target member exists ──
    const existing = await getMemberById(memberId);
    if (!existing) return bad("Member not found", 404);

    // ── Upload to Airtable ──
    let updated = await uploadKycAttachment(memberId, slot, {
      contentType,
      base64: file,
      filename: filename.trim(),
    });

    // ── Auto-flip kycStatus when both slots are filled ──
    // Same logic as the member-portal upload route — only on the
    // transition from "Docs Requested" to avoid resetting an already-
    // reviewed-and-rejected resubmission cycle.
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
    console.error("Admin KYC upload error:", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 },
    );
  }
}
