import { NextRequest, NextResponse } from "next/server";
import { put as blobPut, list as blobList, del as blobDel } from "@vercel/blob";

import { getAdminSession } from "@/lib/admin-auth";
import {
  getMemberByIdLite,
  uploadKycAttachmentByUrl,
  setMemberKyc,
} from "@/lib/airtable";

// ─── Limits ─────────────────────────────────────────────────────────
// Per-chunk cap. The CLIENT splits at 2.5 MB raw; base64 inflates by
// ~33% to ~3.4 MB; the JSON envelope adds a few hundred bytes. Stays
// comfortably under Vercel's 4.5 MB function body cap.
const MAX_CHUNK_BYTES = 4 * 1024 * 1024;
// Total assembled file cap. Members occasionally have 6–8 MB POA
// scans; 10 MB headroom covers the long tail without inviting raw
// 50 MB photo dumps.
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
  // Metadata (only meaningful on last chunk, but client sends every time)
  memberId?: unknown;
  slot?: unknown;
  filename?: unknown;
  contentType?: unknown;
}

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Admin-on-behalf KYC upload — CHUNKED path.
 *
 * For files in the 3–10 MB range, where the @vercel/blob CLIENT
 * direct-upload path is blocked at the user's network layer (ISP
 * filtering of vercel.com manifests as "Failed to fetch"), and the
 * server-relay path's 3 MB cap is too tight.
 *
 * Flow:
 *   1. Client splits the file into 2.5 MB chunks, each as base64.
 *   2. Each chunk POSTs here. Server uses @vercel/blob's SERVER-side
 *      put() — server-to-server, never user→vercel.com — to store
 *      the chunk at `kyc-chunks/{uploadId}/{index}`.
 *   3. The final chunk (isLast=true) triggers assembly: the server
 *      lists + downloads all chunks, concatenates, and uploads the
 *      assembled file to `kyc/{slot}/{ts}-{filename}`. Then PATCHes
 *      Airtable with that URL via uploadKycAttachmentByUrl.
 *   4. Chunks are deleted right away; the assembled blob is deleted
 *      after a 30-second grace period (Airtable downloads it
 *      asynchronously on its end).
 *
 * Failure modes worth knowing:
 *   - If a non-final chunk fails, the client throws and the user
 *     sees an error. Already-uploaded chunks become orphans, GC'd
 *     by Vercel Blob eventually.
 *   - If assembly fails (chunks missing, decode error), we return
 *     500 with stage info; the partial chunks still GC.
 */
export async function POST(request: NextRequest) {
  let stage: string = "init";
  const reqId = `${Date.now()}:${Math.random().toString(16).slice(2, 8)}`;
  try {
    stage = "admin_session";
    const session = await getAdminSession();
    if (!session) return bad("Forbidden", 403);

    stage = "parse_body";
    const body = (await request.json().catch(() => null)) as ChunkBody | null;
    if (!body) return bad("Invalid JSON body");

    const {
      uploadId,
      chunkIndex,
      chunkCount,
      chunkBase64,
      isLast,
      memberId,
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
    // Size sanity check — base64 length × 3/4 ≈ raw bytes.
    const approxRaw = Math.floor((chunkBase64.length * 3) / 4);
    if (approxRaw > MAX_CHUNK_BYTES) {
      return bad(`Chunk too large: ${approxRaw} bytes`, 413);
    }

    stage = "validate_metadata";
    if (typeof memberId !== "string" || !memberId.startsWith("rec")) {
      return bad("memberId must be an Airtable record id");
    }
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
    // Server-side put. Pads chunkIndex with zeros so a lexicographic
    // sort on pathname recovers the right order on assembly. Without
    // padding, "10" sorts before "2" and we'd reassemble in the
    // wrong order.
    const chunkPathname = `kyc-chunks/${uploadId}/${String(chunkIndex).padStart(4, "0")}`;
    const chunkBuffer = Buffer.from(chunkBase64, "base64");
    const chunkBlob = await blobPut(chunkPathname, chunkBuffer, {
      access: "public",
      addRandomSuffix: false,
      // Chunks are intermediate — content-type doesn't matter for
      // assembly. Mark octet-stream so anyone who somehow sees the
      // chunk URL doesn't get a misleading preview.
      contentType: "application/octet-stream",
      allowOverwrite: true,
    });
    console.log(
      `[admin kyc-chunked ${reqId}] stored chunk ${chunkIndex + 1}/${chunkCount} at ${chunkBlob.pathname}`,
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
      // Some chunks failed to upload but the client reported isLast.
      // Surface clearly so the user retries from scratch.
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
    const existing = await getMemberByIdLite(memberId);
    if (!existing) return bad("Member not found", 404);

    stage = "store_assembled";
    // Final blob path mirrors the existing /kyc/{slot}/* pattern from
    // the non-chunked Vercel Blob route, so admins debugging from the
    // dashboard see consistent naming. Date.now prefix gives uniqueness
    // even with addRandomSuffix:false.
    const finalPathname = `kyc/${slot}/${Date.now()}-${filename.trim()}`;
    const finalBlob = await blobPut(finalPathname, assembled, {
      access: "public",
      addRandomSuffix: false,
      contentType,
      allowOverwrite: true,
    });
    console.log(
      `[admin kyc-chunked ${reqId}] assembled ${assembled.length} bytes → ${finalBlob.url}`,
    );

    stage = "patch_airtable";
    let updated = await uploadKycAttachmentByUrl(
      memberId,
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
    }

    stage = "cleanup";
    // Delete chunks immediately — Airtable doesn't need them. Don't
    // await; the response can ship while cleanup runs in the
    // background. Errors are non-fatal (orphan blobs cost ~nothing).
    void Promise.all(
      blobs.map((b) =>
        blobDel(b.url).catch((err) =>
          console.error(
            `[admin kyc-chunked ${reqId}] chunk cleanup failed for ${b.pathname}:`,
            err,
          ),
        ),
      ),
    );
    // Defer the assembled-blob delete — Airtable fetches the URL
    // asynchronously; deleting too soon means an empty attachment.
    // 30s gives ample time. If the function ends first, the blob
    // sits at near-zero cost and gets GC'd by Vercel Blob's storage
    // policy.
    setTimeout(() => {
      blobDel(finalBlob.url).catch((err) =>
        console.error(
          `[admin kyc-chunked ${reqId}] assembled blob cleanup failed:`,
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
      `Admin KYC chunked upload error [${reqId}] [stage=${stage}]:`,
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
