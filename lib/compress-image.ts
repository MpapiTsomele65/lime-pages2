/**
 * Client-side image compression for KYC photo uploads.
 *
 * Vercel's serverless function body cap is 4.5 MB. Our routes accept
 * the file as base64 inside a JSON envelope, which adds ~33% overhead,
 * so the practical raw-file ceiling is ~3 MB. Modern phone cameras
 * typically produce 4–5 MB JPEGs that read perfectly well at lower
 * resolution / quality — compressing client-side in a canvas drops
 * those files into the 3 MB envelope without losing legibility for
 * KYC documents (ID photos, proof-of-address scans).
 *
 * PDFs are passed through unchanged — this function only touches
 * `image/*` MIME types. PDFs that exceed 3 MB still fail the size
 * gate; the user has to compress externally (or the future Vercel
 * Blob direct-upload path needs to land).
 */

/** Hard ceiling we aim for — matches the server's MAX_BYTES check. */
const TARGET_MAX_BYTES = 3 * 1024 * 1024;

/** Resize the longer edge down to this many pixels max. 2,000 px on
 *  the long edge is comfortably enough for KYC document legibility
 *  (an SA ID at 2,000 px wide is ~150 dpi at A6 — verifiable by eye). */
const MAX_LONG_EDGE_PX = 2000;

/** Quality ladder — keep stepping down until the JPEG fits.
 *  0.85 covers the vast majority of phone photos (~500 KB–1 MB out
 *  for a 5 MB in). The lower steps are guard-rails for unusually
 *  noisy or text-heavy images that don't compress as well. */
const QUALITY_LADDER = [0.85, 0.7, 0.55, 0.4];

interface CompressionInput {
  file: File;
  /** Override the target ceiling. Defaults to TARGET_MAX_BYTES. */
  targetMaxBytes?: number;
  /** Override the resize cap. Defaults to MAX_LONG_EDGE_PX. */
  maxLongEdgePx?: number;
}

/**
 * Compress an image File to fit under `targetMaxBytes`, returning
 * either the original (if it already fits or isn't an image) or a
 * new JPEG File that does fit.
 *
 * Throws only if the canvas runtime is unavailable (e.g. SSR mistake)
 * — not for "couldn't compress small enough", which falls through to
 * the lowest-quality JPEG and lets the server enforce the size gate.
 *
 * Browser-only: relies on `HTMLImageElement`, `HTMLCanvasElement`,
 * `URL.createObjectURL`. Don't call from a server component.
 */
export async function compressImage({
  file,
  targetMaxBytes = TARGET_MAX_BYTES,
  maxLongEdgePx = MAX_LONG_EDGE_PX,
}: CompressionInput): Promise<File> {
  // Pass-through for non-images and small files — the work below is
  // wasted effort otherwise, and we don't want to silently re-encode a
  // PDF or an ID photo that's already 200 KB.
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= targetMaxBytes) return file;

  // HEIC/HEIF needs a polyfill to decode (Safari natively, Chrome and
  // Firefox don't). Feature-detect by trying — if Image fails to load
  // we propagate the file as-is and let the server reject it with a
  // friendly message.
  let bitmap: ImageBitmap | HTMLImageElement;
  try {
    if (typeof createImageBitmap === "function") {
      bitmap = await createImageBitmap(file);
    } else {
      bitmap = await loadImageElement(file);
    }
  } catch {
    return file;
  }

  // Compute target dimensions — preserve aspect ratio, cap longer edge.
  const srcW =
    "naturalWidth" in bitmap ? bitmap.naturalWidth : (bitmap as ImageBitmap).width;
  const srcH =
    "naturalHeight" in bitmap
      ? bitmap.naturalHeight
      : (bitmap as ImageBitmap).height;

  if (!srcW || !srcH) return file;

  const longerEdge = Math.max(srcW, srcH);
  const scale = longerEdge > maxLongEdgePx ? maxLongEdgePx / longerEdge : 1;
  const targetW = Math.round(srcW * scale);
  const targetH = Math.round(srcH * scale);

  // Render to canvas + iterate JPEG quality until the encoded blob
  // fits the target ceiling. We always re-encode to JPEG (not PNG)
  // because lossy compression is the whole point.
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, targetW, targetH);

  // Free the bitmap right away — these can be 20 MB+ in memory for
  // 12 MP phone photos and the GC won't reclaim until next tick.
  if ("close" in bitmap && typeof bitmap.close === "function") bitmap.close();

  const baseName = file.name.replace(/\.(heic|heif|png|webp|jpg|jpeg)$/i, "");
  const outName = `${baseName}.jpg`;

  for (const quality of QUALITY_LADDER) {
    const blob = await canvasToBlob(canvas, quality);
    if (!blob) continue;
    if (blob.size <= targetMaxBytes) {
      return new File([blob], outName, { type: "image/jpeg" });
    }
  }

  // Last-resort fallback — the lowest-quality JPEG even if it still
  // exceeds the ceiling. The server's size check then surfaces a
  // friendly "still too large" message rather than us throwing here.
  const finalBlob = await canvasToBlob(
    canvas,
    QUALITY_LADDER[QUALITY_LADDER.length - 1]!,
  );
  if (finalBlob) return new File([finalBlob], outName, { type: "image/jpeg" });
  return file;
}

/**
 * Promise wrapper around `canvas.toBlob`. Older Safari / iOS still
 * uses the callback form, which doesn't compose with our async
 * pipeline.
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
  });
}

/**
 * Fallback image loader for browsers without `createImageBitmap`. Uses
 * the classic `Image` element + object-URL pattern.
 */
function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}
