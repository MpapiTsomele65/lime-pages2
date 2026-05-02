import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { del } from "@vercel/blob";

import { getAdminSession } from "@/lib/admin-auth";
import {
  getMemberByIdLite,
  uploadKycAttachmentByUrl,
  setMemberKyc,
} from "@/lib/airtable";

// Size + content-type constraints used to live on the signed token
// (allowedContentTypes / maximumSizeInBytes), but Vercel Blob's
// strict-equality MIME check caused 99%-loop retries on PDFs that
// sent slightly off content types (e.g. `application/pdf;charset=binary`).
// The client already filters via the file picker `accept` attr, the
// admin-session gate above protects the endpoint, and Airtable does
// its own content-type filtering on attachment fields downstream.

/**
 * Admin-on-behalf KYC upload — Vercel Blob direct-upload path.
 *
 * Mirrors the member-portal route but gated on `getAdminSession()`
 * and accepts an explicit `memberId` in the client payload (vs.
 * deriving from session.memberId for the member route). Use case:
 * a member emails their KYC docs to lehumo@limepages.co.za and the
 * admin uploads on their behalf from /lehumo/portal/admin.
 *
 * Same browser-uploads-to-Blob-then-server-PATCH-Airtable-then-
 * deletes-Blob lifecycle as the member route — see comments there
 * for the full story.
 */
export async function POST(request: NextRequest) {
  let stage: string = "init";
  try {
    const body = (await request.json()) as HandleUploadBody;

    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayloadStr) => {
        stage = "admin_session";
        const session = await getAdminSession();
        if (!session) throw new Error("Forbidden");

        stage = "validate_payload";
        let payload: {
          memberId?: unknown;
          slot?: unknown;
          filename?: unknown;
        } = {};
        try {
          payload = clientPayloadStr ? JSON.parse(clientPayloadStr) : {};
        } catch {
          throw new Error("Invalid client payload");
        }
        const memberId = payload.memberId;
        const slot = payload.slot;
        const filename =
          typeof payload.filename === "string" ? payload.filename.trim() : "";
        if (typeof memberId !== "string" || !memberId.startsWith("rec")) {
          throw new Error("memberId must be an Airtable record id");
        }
        if (slot !== "id" && slot !== "poa") {
          throw new Error("slot must be 'id' or 'poa'");
        }
        if (!filename) {
          throw new Error("filename is required");
        }

        stage = "lookup_member";
        const existing = await getMemberByIdLite(memberId);
        if (!existing) throw new Error("Member not found");

        // Diagnostic: log the token-mint context so we can correlate
        // with onUploadCompleted (or its absence) in Vercel logs.
        // Drop once the upload-loop bug is resolved.
        console.log(
          `[admin kyc-upload] token mint: pathname=${pathname} member=${existing.memberNumber} slot=${slot} filename="${filename}"`,
        );

        return {
          // No allowedContentTypes / maximumSizeInBytes for now — those
          // were the prime suspects for the 99%-then-loop bug Londani
          // hit on her 5.8 MB POA PDF. If the browser sends a content
          // type that doesn't *exactly* match our allowlist (e.g.
          // `application/pdf;charset=binary`), Vercel Blob rejects on
          // finalize and the client retries, looping forever. Dropping
          // these constraints relies on:
          //   - admin-session gate above (only authenticated admins)
          //   - file picker `accept` attr (UX-level only, but typical)
          //   - Airtable's own content-type filtering on attachment
          //     fields (it rejects non-document content)
          // A future revision can re-add these with wildcards once
          // we confirm what the browser actually sends.
          tokenPayload: JSON.stringify({
            memberId: existing.id,
            slot,
            filename,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // ⚠ This callback fires via webhook from Vercel Blob AFTER
        // the upload PUT completes. If we throw, the client's
        // upload() promise rejects and the @vercel/blob client may
        // retry the entire upload — which is exactly the
        // 99%-then-loop bug we're chasing. Wrap everything in
        // try/catch so we always return cleanly.
        console.log(
          `[admin kyc-upload] onUploadCompleted: url=${blob.url} pathname=${blob.pathname} contentType=${blob.contentType ?? "(unset)"}`,
        );
        try {
          if (!tokenPayload) {
            console.error(
              "[admin kyc-upload] onUploadCompleted: no tokenPayload, blob orphaned at",
              blob.url,
            );
            return;
          }
          const { memberId, slot, filename } = JSON.parse(tokenPayload) as {
            memberId: string;
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
            `[admin kyc-upload] Airtable PATCH ok for member=${memberId} slot=${slot}`,
          );

          // Same first-doc auto-flip as the member route — admin
          // uploads land in the queue identically.
          const idPresent = (updated.kycIdDocument?.length ?? 0) > 0;
          const poaPresent = (updated.kycProofOfAddress?.length ?? 0) > 0;
          const stillRequestingDocs = updated.kycStatus === "Docs Requested";
          if ((idPresent || poaPresent) && stillRequestingDocs) {
            updated = await setMemberKyc(updated.id, {
              kycStatus: "In Progress",
              markSubmittedNow: true,
            });
            console.log(
              `[admin kyc-upload] kycStatus flipped to In Progress for member=${memberId}`,
            );
          }

          // Defer the Blob delete — Airtable fetches the URL
          // asynchronously after our PATCH (it queues the download).
          // Deleting too soon means Airtable can't fetch and the
          // attachment stays empty. 30s gives Airtable ample time.
          // If it never deletes (function ends first), the blob
          // sits at near-zero cost on the free tier and gets
          // garbage-collected by Airtable's storage policy or
          // can be cleaned manually from the Vercel dashboard.
          setTimeout(() => {
            del(blob.url).catch((err) =>
              console.error(
                `[admin kyc-upload] Blob cleanup failed for ${blob.pathname}:`,
                err,
              ),
            );
          }, 30_000);
        } catch (err) {
          console.error(
            "[admin kyc-upload] onUploadCompleted error:",
            err instanceof Error ? err.message : String(err),
            err instanceof Error ? err.stack : undefined,
          );
        }
      },
    });

    return NextResponse.json(json);
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
