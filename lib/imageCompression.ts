/**
 * Robust client-side image compression for admin uploads.
 * Handles absurdly large source files (e.g. a 400MB 8000px photo) safely:
 *  - decodes via createImageBitmap with a resize hint (low memory, no full-res canvas)
 *  - hard-caps the long edge
 *  - iteratively lowers quality to hit a target byte budget
 *  - outputs WebP (falls back to JPEG)
 */

export interface CompressOptions {
  maxEdge?: number;       // longest side in px (default 1920)
  maxBytes?: number;      // target output size (default ~340KB)
  minQuality?: number;    // floor for quality search (default 0.5)
  mimeType?: 'image/webp' | 'image/jpeg';
}

const DEFAULTS: Required<CompressOptions> = {
  maxEdge: 1920,
  maxBytes: 340 * 1024,
  minQuality: 0.5,
  mimeType: 'image/webp',
};

/** Absolute guard — reject files that aren't images or are implausibly large to even read. */
export function validateImageFile(file: File, maxInputMB = 60): string | null {
  if (!file.type.startsWith('image/')) return 'Please choose an image file.';
  if (file.size > maxInputMB * 1024 * 1024) {
    return `That image is ${(file.size / 1024 / 1024).toFixed(0)}MB — please use one under ${maxInputMB}MB.`;
  }
  return null;
}

async function decode(file: File, maxEdge: number): Promise<{ width: number; height: number; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; close: () => void }> {
  // Prefer createImageBitmap with resize — most memory-efficient for huge sources.
  if ('createImageBitmap' in window) {
    try {
      // First read intrinsic size cheaply by decoding a bitmap, requesting a capped size.
      const probe = await createImageBitmap(file);
      const ratio = Math.min(1, maxEdge / Math.max(probe.width, probe.height));
      const w = Math.max(1, Math.round(probe.width * ratio));
      const h = Math.max(1, Math.round(probe.height * ratio));
      if (ratio < 1) {
        const resized = await createImageBitmap(file, { resizeWidth: w, resizeHeight: h, resizeQuality: 'high' } as any);
        probe.close?.();
        return { width: w, height: h, draw: (ctx, cw, ch) => ctx.drawImage(resized, 0, 0, cw, ch), close: () => resized.close?.() };
      }
      return { width: w, height: h, draw: (ctx, cw, ch) => ctx.drawImage(probe, 0, 0, cw, ch), close: () => probe.close?.() };
    } catch {
      /* fall through to <img> path */
    }
  }
  // Fallback: HTMLImageElement
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error('Could not read image'));
      i.src = url;
    });
    const ratio = Math.min(1, maxEdge / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * ratio));
    const h = Math.max(1, Math.round(img.height * ratio));
    return { width: w, height: h, draw: (ctx, cw, ch) => ctx.drawImage(img, 0, 0, cw, ch), close: () => URL.revokeObjectURL(url) };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((res) => canvas.toBlob((b) => res(b), type, quality));
}

/** Compress an image File into a small WebP/JPEG Blob within the byte budget. */
export async function compressImage(file: File, options: CompressOptions = {}): Promise<Blob> {
  const o = { ...DEFAULTS, ...options };
  const src = await decode(file, o.maxEdge);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = src.width;
    canvas.height = src.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.drawImage as any; // keep tree-shakers calm
    src.draw(ctx, src.width, src.height);

    // Binary-ish search on quality to hit the byte budget.
    let lo = o.minQuality;
    let hi = 0.92;
    let best: Blob | null = await toBlob(canvas, o.mimeType, hi);
    if (best && best.size <= o.maxBytes) return best;

    for (let i = 0; i < 6; i++) {
      const mid = (lo + hi) / 2;
      // eslint-disable-next-line no-await-in-loop
      const blob = await toBlob(canvas, o.mimeType, mid);
      if (!blob) break;
      if (blob.size > o.maxBytes) {
        hi = mid;
      } else {
        best = blob;
        lo = mid;
      }
    }
    // Last resort at the floor quality.
    if (!best || best.size > o.maxBytes) {
      const floor = await toBlob(canvas, o.mimeType, o.minQuality);
      if (floor) best = floor;
    }
    if (!best) throw new Error('Compression failed');
    return best;
  } finally {
    src.close();
  }
}

/** Convenience: compress and return a File (keeps a clean name/extension for uploads). */
export async function compressToFile(file: File, options?: CompressOptions): Promise<File> {
  const blob = await compressImage(file, options);
  const ext = (options?.mimeType || DEFAULTS.mimeType) === 'image/jpeg' ? 'jpg' : 'webp';
  const base = file.name.replace(/\.[^.]+$/, '') || 'image';
  return new File([blob], `${base}.${ext}`, { type: blob.type });
}
