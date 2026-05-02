import { NextRequest, NextResponse } from "next/server";
import { put as blobPut, list as blobList, del as blobDel } from "@vercel/blob";

import { getSession } from "@/lib/session";
import {
  getMemberByIdLite,
  uploadKycAttachmentByUrl,
  setMemberKyc,
} from "@/lib/airtable";
import { sendKycReceivedEmail } from "@/lib/email";

// See the admin chunked route for the full architectural rationale.
// This is the member-portal mirror — same flow, different auth gate
// (member session vs admin email allowlist) and an extra side effect
// on the first-doc transition (KYC-received receipt email).

const MAX_CHUNK_BYTES = 4 * 1024 * 1024;
const MAX_ASSEMBLED_BYTES = 10 * 1024 * 1024;
const MAX_CHUNK_COUNT = 10;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

interface ChunkBody {
  uploadId?: unknown;
  chunkIndex?: unknown;
  chunkCount?: unknown;
  chunkBase64?: unknown;
  isLast?: unknown;
  slot?: unknown;
  filename?: unknown;
  contentType?: unknown;
}

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  let stage: string = "init";
  const reqId = `${Date.now()}:${Math.random().toString(16).slice(2, 8)}`;
  try {
    stage = "session";
    const session = await getSession();
    if (!session) return bad("Unauthorized", 401);

    stage = "parse_body";
    const body = (await request.json().catch(() => null)) as ChunkBody | null;
    if (!body) return bad("Invalid JSON body");

    const {
      uploadId,
      chunkIndex,
      chunkCount,
      chunkBase64,
      isLast,
      slot,
      filename,
      contentType,
    } = body;

    stage = "validate_chunk_meta";
    if (typeof uploadId !== "string" || !/^[\w-]+$/.test(uploadId)) {
      return bad("uploadId must be a simple identifier");
    }
    if (
      typeof chunkIndex !== "number" ||
      !Number.isInteger(chunkIndex) ||
      chunkIndex < 0
    ) {
      return bad("chunkIndex must be a non-negative integer");
    }
    if (
      typeof chunkCount !== "number" ||
      !Number.isInteger(chunkCount) ||
      chunkCount <= 0 ||
      chunkCount > MAX_CHUNK_COUNT
    ) {
      return bad(`chunkCount must be 1..${MAX_CHUNK_COUNT}`);
    }
    if (chunkIndex >= chunkCount) {
      return bad("chunkIndex out of range");
    }
    if (typeof chunkBase64 !== "string" || chunkBase64.length === 0) {
      return bad("chunkBase64 is required");
    }

    stage = "validate_chunk_size";
    const approxRaw = Math.floor((chunkBase64.length * 3) / 4);
    if (approxRaw > MAX_CHUNK_BYTES) {
      return bad(`Chunk too large: ${approxRaw} bytes`, 413);
    }

    stage = "validate_metadata";
    if (slot !== "id" && slot !== "poa") {
      return bad("slot must be 'id' or 'poa'");
    }
    if (typeof filename !== "string" || filename.trim().length === 0) {
      return bad("filename is required");
    }
    if (typeof contentType !== "string" || !ALLOWED_MIME.has(contentType)) {
      return bad("Unsupported file type. Allowed: JPG, PNG, HEIC, or PDF.");
    }

    stage = "store_chunk";
    const chunkPathname = `kyc-chunks/${uploadId}/${String(chunkIndex).padStart(4, "0")}`;
    const chunkBuffer = Buffer.from(chunkBase64, "base64");
    const chunkBlob = await blobPut(chunkPathname, chunkBuffer, {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/octet-stream",
      allowOverwrite: true,
    });
    console.log(
      `[member kyc-chunked ${reqId}] stored chunk ${chunkIndex + 1}/${chunkCount} at ${chunkBlob.pathname}`,
    );

    if (!isLast) {
      return NextResponse.json({
        ok: true,
        chunkIndex,
        chunkCount,
      });
    }

    // ── Final chunk: assemble & PATCH Airtable ───────────────────
    stage = "list_chunks";
    const { blobs } = await blobList({
      prefix: `kyc-chunks/${uploadId}/`,
    });
    if (blobs.length !== chunkCount) {
      return bad(
        `Missing chunks: expected ${chunkCount}, got ${blobs.length}`,
        500,
      );
    }
    blobs.sort((a, b) => a.pathname.localeCompare(b.pathname));

    stage = "download_chunks";
    const buffers = await Promise.all(
      blobs.map(async (b) => {
        const res = await fetch(b.url);
        if (!res.ok) {
          throw new Error(
            `Failed to fetch chunk ${b.pathname}: ${res.status}`,
          );
        }
        return Buffer.from(await res.arrayBuffer());
      }),
    );

    stage = "assemble";
    const assembled = Buffer.concat(buffers);
    if (assembled.length > MAX_ASSEMBLED_BYTES) {
      return bad(
        `Assembled file too large: ${(assembled.length / 1024 / 1024).toFixed(1)}MB`,
        413,
      );
    }

    stage = "lookup_member";
    const existing = await getMemberByIdLite(session.memberId);
    if (!existing) return bad("Member not found", 404);

    stage = "store_assembled";
    const finalPathname = `kyc/${slot}/${Date.now()}-${filename.trim()}`;
    const finalBlob = await blobPut(finalPathname, assembled, {
      access: "public",
      addRandomSuffix: false,
      contentType,
      allowOverwrite: true,
    });
    console.log(
      `[member kyc-chunked ${reqId}] assembled ${assembled.length} bytes → ${finalBlob.url}`,
    );

    stage = "patch_airtable";
    let updated = await uploadKycAttachmentByUrl(
      session.memberId,
      slot,
      finalBlob.url,
      filename.trim(),
    );

    stage = "maybe_flip_status";
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

    stage = "cleanup";
    void Promise.all(
      blobs.map((b) =>
        blobDel(b.url).catch((err) =>
          console.error(
            `[member kyc-chunked ${reqId}] chunk cleanup failed for ${b.pathname}:`,
            err,
          ),
        ),
      ),
    );
    setTimeout(() => {
      blobDel(finalBlob.url).catch((err) =>
        console.error(
          `[member kyc-chunked ${reqId}] assembled blob cleanup failed:`,
          err,
        ),
      );
    }, 30_000);

    return NextResponse.json({
      ok: true,
      member: updated,
      slot,
      bothPresent,
      idPresent,
      poaPresent,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `Member KYC chunked upload error [${reqId}] [stage=${stage}]:`,
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
