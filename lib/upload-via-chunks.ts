/**
 * Chunked upload helper for files 3–10 MB on networks that filter
 * `vercel.com`.
 *
 * Why this exists:
 *   The @vercel/blob CLIENT uploads from browser → vercel.com/api/blob
 *   directly. On some networks (notably some South African ISPs) that
 *   hostname is filtered or fails connection, surfacing as "Failed to
 *   fetch" with no recourse.
 *
 *   The server-relay path
 *   (`/api/lehumo/portal/{admin,member}/kyc-upload-direct`) sidesteps
 *   that by bouncing through our same-origin function — but Vercel's
 *   serverless function body cap is 4.5 MB, capping that path at
 *   ~3 MB raw after base64 expansion.
 *
 *   This helper handles the 3–10 MB range by splitting the file into
 *   2.5 MB chunks, sending each chunk to our server (same-origin), and
 *   letting the SERVER use @vercel/blob's server-side `put()` —
 *   server-to-server traffic that never touches the user's network.
 *   The server assembles the chunks and PATCHes Airtable with the
 *   resulting URL.
 *
 * Trade-offs:
 *   - Slightly slower than the @vercel/blob direct path on networks
 *     where direct works, because chunks upload sequentially.
 *   - Each chunk is its own function invocation, so 4 chunks = 4
 *     server roundtrips. For our typical 5–8 MB POA PDF that's still
 *     well under 30 seconds.
 *   - Chunks are stored in Vercel Blob temporarily; the server
 *     deletes them after assembly.
 */

export interface ChunkedUploadOptions {
  /** Endpoint that handles chunk POSTs. Each chunk hits the same URL. */
  endpoint: string;
  /** File to upload. Must already be size-validated by the caller. */
  file: File;
  /** JSON-serialisable extra fields sent with EVERY chunk (memberId,
   *  slot, etc). The server only reads them on the final chunk; we
   *  send them on every chunk for simplicity. */
  payload: Record<string, unknown>;
  /** Per-chunk size in bytes. Default 2.5 MB — base64 inflates ~33%
   *  → 3.4 MB JSON body, comfortably under Vercel's 4.5 MB cap with
   *  headroom for the JSON envelope. Don't raise without first
   *  measuring on a real Vercel deployment. */
  chunkSize?: number;
  /** Called as each chunk completes. Granularity = one progress
   *  event per chunk (not byte-level). For a 5 MB / 2.5 MB chunks
   *  upload, you get progress events at 50% and 100%. */
  onProgress?: (info: {
    loaded: number;
    total: number;
    percentage: number;
  }) => void;
  /** AbortSignal for cancelling. Aborts mid-upload reject the
   *  promise; chunks already uploaded become orphans (cleaned up
   *  by Vercel Blob's GC eventually). */
  signal?: AbortSignal;
}

const DEFAULT_CHUNK_SIZE = 2.5 * 1024 * 1024;

/** Read a Blob/File into a base64 string (no `data:` prefix). */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Unexpected FileReader result"));
        return;
      }
      const idx = result.indexOf(",");
      resolve(idx === -1 ? result : result.slice(idx + 1));
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error("FileReader failed"));
    reader.readAsDataURL(blob);
  });
}

/** Cheap collision-resistant id. crypto.randomUUID is widely
 *  available but we keep a fallback for older browsers. */
function makeUploadId(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `up_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function uploadViaChunks<T = unknown>(
  options: ChunkedUploadOptions,
): Promise<T> {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const uploadId = makeUploadId();
  const chunkCount = Math.max(1, Math.ceil(options.file.size / chunkSize));

  let lastResponse: T | undefined;
  let cumulativeBytes = 0;

  for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++) {
    if (options.signal?.aborted) {
      throw new Error("aborted");
    }
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, options.file.size);
    const chunkBlob = options.file.slice(start, end);
    const chunkBase64 = await blobToBase64(chunkBlob);

    const isLast = chunkIndex === chunkCount - 1;
    const body = JSON.stringify({
      ...options.payload,
      uploadId,
      chunkIndex,
      chunkCount,
      chunkBase64,
      // Always include filename / contentType so the server has
      // everything it needs on the final chunk without a state
      // lookup. Cheap to send, simpler to reason about.
      filename: options.file.name,
      contentType: options.file.type,
      isLast,
    });

    const res = await fetch(options.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: options.signal,
    });

    if (!res.ok) {
      let serverMsg = `Server returned ${res.status} on chunk ${chunkIndex}`;
      try {
        const parsed = (await res.json()) as {
          error?: string;
          stage?: string;
        };
        if (parsed.error) {
          serverMsg = parsed.error;
        }
      } catch {
        // Non-JSON error body — fall through with status code.
      }
      throw new Error(serverMsg);
    }

    if (isLast) {
      try {
        lastResponse = (await res.json()) as T;
      } catch {
        lastResponse = undefined;
      }
    } else {
      // Drain the body so the connection can be reused — small
      // {ok:true} acks but they still need consuming.
      await res.text();
    }

    cumulativeBytes += end - start;
    options.onProgress?.({
      loaded: cumulativeBytes,
      total: options.file.size,
      percentage: Math.round((cumulativeBytes / options.file.size) * 100),
    });
  }

  if (lastResponse === undefined) {
    throw new Error("Upload completed but server returned no response data");
  }
  return lastResponse;
}

/**
 * Upper bound for the chunked path. Set higher than the server-relay
 * cap (3 MB) but bounded by sanity — anything over 10 MB is almost
 * certainly a misclick or an unreduced raw scan that should be
 * compressed first.
 */
export const CHUNKED_MAX_BYTES = 10 * 1024 * 1024;
