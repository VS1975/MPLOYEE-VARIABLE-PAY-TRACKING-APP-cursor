/**
 * Downscale and re-encode as JPEG to keep upload size within Vercel limits.
 */
export async function compressJpegBlob(
  blob: Blob,
  maxEdge = 1600,
  quality = 0.82
): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const ratio = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * ratio);
  const h = Math.round(bitmap.height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return blob;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (out) => {
        if (out) resolve(out);
        else reject(new Error("Could not compress image"));
      },
      "image/jpeg",
      quality
    );
  });
}
