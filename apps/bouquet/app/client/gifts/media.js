/**
 * @file Browser-side media helpers for gifts: re-encode photos before
 * upload (resizes and drops EXIF/GPS, because a canvas never carries
 * metadata), check files, and upload raw bytes to /api/upload.
 */

export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const FILE_MAX_BYTES = 10 * 1024 * 1024;

/**
 * @param {Blob} file
 * @param {{max?: number, type?: string, quality?: number}} [opts]
 * @returns {Promise<Blob>}
 */
export async function reencodeImage(file, { max = 2000, type = 'image/jpeg', quality = 0.85 } = {}) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; // JPEG has no alpha; flatten transparent PNGs onto white
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  if (typeof bitmap.close === 'function') bitmap.close();
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('could not encode image'))), type, quality);
  });
}

/**
 * @param {File} file
 * @param {'photo'|'file'} kind
 * @returns {string|null} an error message, or null if acceptable
 */
export function checkFile(file, kind) {
  if (kind === 'photo') {
    if (!/^image\/(jpeg|png|webp|heic|heif|gif)$/i.test(file.type || '')) return 'Photos must be images.';
    return null;
  }
  if (!/^(application\/pdf|image\/(jpeg|png|webp))$/i.test(file.type || '')) return 'Add a PDF or an image.';
  if (file.size > FILE_MAX_BYTES) return 'That file is larger than 10 MB.';
  return null;
}

/**
 * @param {Blob} blob
 * @param {string} name
 * @returns {Promise<{ok:boolean, status:number, data:any}>}
 */
export async function uploadBlob(blob, name) {
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'content-type': blob.type || 'application/octet-stream', 'x-filename': encodeURIComponent(name || '') },
      body: blob,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.status === 201, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: "Couldn't reach the server." } };
  }
}
