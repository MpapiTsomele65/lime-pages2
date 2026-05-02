/**
 * Upload a file to one of our KYC server-relay routes
 * (/api/lehumo/portal/{admin,member}/kyc-upload-direct).
 *
 * Why this exists:
 *   The @vercel/blob client uploads from the browser DIRECTLY to
 *   `vercel.com/api/blob`, which on some networks (notably some
 *   South African ISPs) is filtered or fails to connect. The user
 *   sees "Failed to fetch" with no recourse. This helper bounces
 *   the upload through OUR own function on `limepages.co.za` —
 *   the same origin the user is already loading — sidestepping the
 *   filter entirely.
 *
 *   Trade-off: Vercel functions cap at 4.5 MB request body, so this
 *   path is only viable for files ≤ ~3 MB after base64 expansion.
 *   Larger files still need the @vercel/blob direct-upload route.
 *
 * Why XHR instead of fetch:
 *   fetch() has no upload progress event in browsers. XHR does.
 *   We keep XHR purely for the progress callback — the response
 *   handling is just JSON parsing. Without this, the slot UI would
 *   sit at 0% for the full duration of the upload, which on a slow
 *   connection (5–10 seconds for a 2 MB file) feels broken.
 */
export interface ServerRelayUploadOptions {
  /** Path of our server-relay endpoint, e.g. "/api/lehumo/portal/admin/kyc-upload-direct". */
  endpoint: string;
  /** Compressed/prepared file ready for upload. */
  file: File;
  /** JSON-serialisable extra fields to send alongside the file
   *  (memberId, slot, etc). The file itself is added by this helper. */
  payload: Record<string, unknown>;
  /** Called as bytes go up the wire. `loaded` and `total` are in
   *  bytes; `percentage` is rounded. Fires roughly every event the
   *  browser emits (browser-throttled, typically 50–100ms). */
  onProgress?: (info: {
    loaded: number;
    total: number;
    percentage: number;
  }) => void;
  /** AbortSignal for cancelling. Aborting rejects the returned
   *  promise with an Error whose message starts with "aborted". */
  signal?: AbortSignal;
}

/** Read a File into a base64 string (no `data:` prefix). */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Unexpected FileReader result"));
        return;
      }
      // result is "data:<mime>;base64,<base64>" — strip the prefix.
      const idx = result.indexOf(",");
      resolve(idx === -1 ? result : result.slice(idx + 1));
    };
    reader.onerror = () => reject(reader.error ?? new Error("FileReader failed"));
    reader.readAsDataURL(file);
  });
}

export async function uploadViaServerRelay(
  options: ServerRelayUploadOptions,
): Promise<void> {
  const base64 = await fileToBase64(options.file);
  const body = JSON.stringify({
    ...options.payload,
    filename: options.file.name,
    contentType: options.file.type,
    file: base64,
  });

  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", options.endpoint);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable || !options.onProgress) return;
      const percentage = Math.round((e.loaded / e.total) * 100);
      options.onProgress({
        loaded: e.loaded,
        total: e.total,
        percentage,
      });
    };

    xhr.onload = () => {
      // 2xx → success; otherwise try to extract the server's
      // {error, stage} payload for an actionable message.
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      let serverMsg = `Server returned ${xhr.status}`;
      try {
        const parsed = JSON.parse(xhr.responseText) as {
          error?: string;
          stage?: string;
        };
        if (parsed.error) {
          serverMsg = parsed.error;
        }
      } catch {
        // Response wasn't JSON — fall back to status code.
      }
      reject(new Error(serverMsg));
    };

    xhr.onerror = () => {
      // Network-level failure. Same origin so this is rare but
      // possible if the user lost connectivity mid-upload.
      reject(new Error("Network error during upload"));
    };
    xhr.ontimeout = () => reject(new Error("Upload timed out"));

    if (options.signal) {
      const onAbort = () => {
        xhr.abort();
        reject(new Error("aborted"));
      };
      if (options.signal.aborted) {
        onAbort();
        return;
      }
      options.signal.addEventListener("abort", onAbort, { once: true });
    }

    xhr.send(body);
  });
}

/**
 * Upper bound (in bytes) for the server-relay path. Vercel
 * serverless functions hard-cap request bodies at 4.5 MB. Base64
 * adds ~33% overhead, plus we need headroom for the JSON envelope.
 * 3 MB raw fits with comfortable margin. Files larger than this
 * MUST take the @vercel/blob direct-upload route.
 */
export const SERVER_RELAY_MAX_BYTES = 3 * 1024 * 1024;
