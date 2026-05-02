import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { del } from "@vercel/blob";

import { getSession } from "@/lib/session";
import {
  getMemberByIdLite,
  uploadKycAttachmentByUrl,
  setMemberKyc,
} from "@/lib/airtable";
import { sendKycReceivedEmail } from "@/lib/email";

// ─── Limits ─────────────────────────────────────────────────────────
// Vercel Blob accepts files up to 5 GB; the binding constraints are
// our willingness to keep the blob around (we delete after Airtable
// fetches it — see `onUploadCompleted`) and Airtable's downstream
// attachment-size cap. We hold the cap at 10 MB which comfortably
// covers a high-res phone photo or a multi-page bank-statement PDF
// without inviting members to dump 100 MB scans into the queue.
// Match the admin route's broad MIME list — Vercel Blob requires
// allowedContentTypes on the signed token, and any MIME variant the
// browser might send needs to be present here for the upload to
// finalize (strict-equality match). See the admin route for the
// full per-MIME rationale.
const ALLOWED_MIME = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
  "application/pdf",
  "application/octet-stream",
];

/**
 * Member-portal KYC upload — Vercel Blob direct-upload path.
 *
 * Flow:
 *   1. Browser calls `@vercel/blob/client.upload()` against this route
 *      with the file as a Blob/File body.
 *   2. `handleUpload` runs server-side. `onBeforeGenerateToken` checks
 *      the session and validates the slot/filename via clientPayload,
 *      then returns a one-shot signed token tied to a specific
 *      content-type allow-list and an opaque tokenPayload that
 *      survives the round trip.
 *   3. Browser uses the signed token to PUT the file directly to
 *      Vercel Blob storage (bypassing our function body cap entirely
 *      — that's the whole point).
 *   4. Vercel Blob fires `onUploadCompleted` server-side once the
 *      upload lands. We patch Airtable with the public Blob URL,
 *      flip kycStatus on the first-doc transition, fire the receipt
 *      email, then `del()` the blob — Airtable has its own copy by
 *      then, so the Blob is just a 30-second relay. Storage stays
 *      at near-zero permanently, well inside the 1 GB free tier.
 *
 * Errors thrown inside `onBeforeGenerateToken` short-circuit the
 * upload before the token is minted — the user sees a "Forbidden" /
 * "Bad request" rather than a successful upload that gets orphaned.
 */
export async function POST(request: NextRequest) {
  let stage: string = "init";
  // Diagnostic: log every hit on this route with the event type so
  // we can correlate token-mint vs upload-completed in Vercel logs.
  // The 99%-loop bug means this route may be hit dozens of times
  // per attempted upload — we need to see WHICH events are firing
  // and whether the upload-completed callback is reaching us at all.
  const reqId = `${Date.now()}:${Math.random().toString(16).slice(2, 8)}`;
  try {
    const body = (await request.json()) as HandleUploadBody;
    console.log(
      `[member kyc-upload ${reqId}] event=${body.type} ua=${request.headers.get("user-agent")?.slice(0, 80) ?? "-"}`,
    );

    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayloadStr) => {
        stage = "session";
        const session = await getSession();
        if (!session) throw new Error("Unauthorized");

        stage = "validate_payload";
        let payload: { slot?: unknown; filename?: unknown } = {};
        try {
          payload = clientPayloadStr ? JSON.parse(clientPayloadStr) : {};
        } catch {
          throw new Error("Invalid client payload");
        }
        const slot = payload.slot;
        const filename = typeof payload.filename === "string" ? payload.filename.trim() : "";
        if (slot !== "id" && slot !== "poa") {
          throw new Error("slot must be 'id' or 'poa'");
        }
        if (!filename) {
          throw new Error("filename is required");
        }

        stage = "lookup_member";
        const existing = await getMemberByIdLite(session.memberId);
        if (!existing) throw new Error("Member not found");

        console.log(
          `[member kyc-upload] token mint: pathname=${pathname} member=${existing.memberNumber} slot=${slot} filename="${filename}"`,
        );

        // Token payload travels back to onUploadCompleted as an
        // opaque string — encode the bits we need to PATCH Airtable
        // afterwards. allowedContentTypes is required (omitting it
        // makes Blob reject the PUT silently — see admin route).
        return {
          allowedContentTypes: ALLOWED_MIME,
          tokenPayload: JSON.stringify({
            memberId: existing.id,
            memberEmail: existing.email,
            memberFullName: existing.fullName,
            memberNumber: existing.memberNumber,
            slot,
            filename,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // ⚠ This callback fires via webhook from Vercel Blob after
        // the upload PUT completes. If we throw here, the client's
        // upload() promise rejects and @vercel/blob may retry the
        // entire upload — which is the 99%-then-loop bug. Wrap
        // everything in try/catch so we always return cleanly.
        console.log(
          `[member kyc-upload] onUploadCompleted: url=${blob.url} pathname=${blob.pathname} contentType=${blob.contentType ?? "(unset)"}`,
        );
        try {
          if (!tokenPayload) {
            console.error(
              "[member kyc-upload] onUploadCompleted: no tokenPayload, blob orphaned at",
              blob.url,
            );
            return;
          }
          const {
            memberId,
            memberEmail,
            memberFullName,
            memberNumber,
            slot,
            filename,
          } = JSON.parse(tokenPayload) as {
            memberId: string;
            memberEmail: string;
            memberFullName: string;
            memberNumber: number;
            slot: "id" | "poa";
            filename: string;
          };

          let updated = await uploadKycAttachmentByUrl(
            memberId,
            slot,
            blob.url,
            filename,
          );
          console.log(
            `[member kyc-upload] Airtable PATCH ok for member=${memberId} slot=${slot}`,
          );

          // First-doc auto-flip — same logic as before.
          const idPresent = (updated.kycIdDocument?.length ?? 0) > 0;
          const poaPresent = (updated.kycProofOfAddress?.length ?? 0) > 0;
          const stillRequestingDocs = updated.kycStatus === "Docs Requested";
          if ((idPresent || poaPresent) && stillRequestingDocs) {
            updated = await setMemberKyc(updated.id, {
              kycStatus: "In Progress",
              markSubmittedNow: true,
            });
            if (memberEmail) {
              sendKycReceivedEmail({
                to: memberEmail,
                fullName: memberFullName,
                memberNumber,
              }).catch((err) =>
                console.error("KYC received email failed:", err),
              );
            }
          }

          // Defer Blob delete — Airtable fetches the URL
          // asynchronously after our PATCH. Deleting too soon means
          // Airtable can't fetch and the attachment stays empty. 30s
          // gives Airtable ample time.
          setTimeout(() => {
            del(blob.url).catch((err) =>
              console.error(
                `[member kyc-upload] Blob cleanup failed for ${blob.pathname}:`,
                err,
              ),
            );
          }, 30_000);
        } catch (err) {
          console.error(
            "[member kyc-upload] onUploadCompleted error:",
            err instanceof Error ? err.message : String(err),
            err instanceof Error ? err.stack : undefined,
          );
        }
      },
    });

    console.log(`[member kyc-upload ${reqId}] handleUpload OK`);
    return NextResponse.json(json);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `KYC upload error [${reqId}] [stage=${stage}]:`,
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
