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
  try {
    const body = (await request.json()) as HandleUploadBody;

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

        // Token payload travels back to onUploadCompleted as an
        // opaque string — encode the bits we need to PATCH Airtable
        // afterwards (memberId, slot, filename) so we don't have to
        // re-derive them from the Blob pathname.
        return {
          allowedContentTypes: [...ALLOWED_MIME],
          maximumSizeInBytes: MAX_BYTES,
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
        // ⚠ Stage tracking inside this callback is best-effort — Vercel
        // doesn't surface errors here back to the client (the client
        // already got its 200 once the blob landed). Anything that
        // throws here just logs server-side, so check Vercel logs if
        // an attachment doesn't appear on the member's record.
        try {
          if (!tokenPayload) {
            console.error(
              "kyc-upload onUploadCompleted: no tokenPayload, blob orphaned at",
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

          // Patch Airtable with the Blob URL. Airtable downloads the
          // file from the URL within seconds and stores its own copy.
          let updated = await uploadKycAttachmentByUrl(
            memberId,
            slot,
            blob.url,
            filename,
          );

          // First-doc auto-flip — same logic as the legacy base64
          // route. Members upload one-at-a-time in real life; flipping
          // on the first doc surfaces partial submissions in the admin
          // queue immediately.
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

          // Clean up the Blob — Airtable now has its own copy, so the
          // Blob is redundant. Best-effort delete; if it fails we keep
          // the blob (worst case: free-tier storage gradually fills,
          // not a correctness issue). Don't `await` strictly — this
          // callback is async-ish from the browser's perspective.
          await del(blob.url).catch((err) =>
            console.error(
              `Blob cleanup failed for ${blob.pathname}:`,
              err,
            ),
          );
        } catch (err) {
          console.error(
            "kyc-upload onUploadCompleted error:",
            err instanceof Error ? err.message : String(err),
          );
        }
      },
    });

    return NextResponse.json(json);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `KYC upload error [stage=${stage}]:`,
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
