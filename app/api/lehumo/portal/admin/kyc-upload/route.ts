import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { del } from "@vercel/blob";

import { getAdminSession } from "@/lib/admin-auth";
import {
  getMemberByIdLite,
  uploadKycAttachmentByUrl,
  setMemberKyc,
} from "@/lib/airtable";

const MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/heic",
  "image/heif",
  "application/pdf",
] as const;

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

        return {
          allowedContentTypes: [...ALLOWED_MIME],
          maximumSizeInBytes: MAX_BYTES,
          tokenPayload: JSON.stringify({
            memberId: existing.id,
            slot,
            filename,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          if (!tokenPayload) {
            console.error(
              "admin kyc-upload onUploadCompleted: no tokenPayload, blob orphaned at",
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
          }

          await del(blob.url).catch((err) =>
            console.error(
              `Admin Blob cleanup failed for ${blob.pathname}:`,
              err,
            ),
          );
        } catch (err) {
          console.error(
            "admin kyc-upload onUploadCompleted error:",
            err instanceof Error ? err.message : String(err),
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
