/**
 * GLB upload with light mesh optimization → Cloudinary (not Firebase Storage).
 */
import { uploadCloudinaryRaw, cloudinaryConfigured } from './cloudinaryUpload';

const MAX_INPUT_BYTES = 50 * 1024 * 1024;

export function validateModelFile(file: File): string | null {
  const name = file.name.toLowerCase();
  const okType = file.type === 'model/gltf-binary' || file.type === 'model/gltf+json' || name.endsWith('.glb') || name.endsWith('.gltf');
  if (!okType) return 'Please choose a GLB or glTF file.';
  if (file.size > MAX_INPUT_BYTES) return `Model is too large (max ${MAX_INPUT_BYTES / 1024 / 1024}MB).`;
  return null;
}

/** Prune unused nodes and weld vertices — typically cuts 20–60% with no visible loss. */
export async function optimizeGlb(file: File): Promise<Blob> {
  if (file.size < 800 * 1024) return file;
  try {
    const [{ WebIO }, { dedup, prune, weld }] = await Promise.all([
      import('@gltf-transform/core'),
      import('@gltf-transform/functions'),
    ]);
    const io = new WebIO();
    const doc = await io.readBinary(new Uint8Array(await file.arrayBuffer()));
    await doc.transform(dedup(), prune(), weld());
    const out = await io.writeBinary(doc);
    return new Blob([out], { type: 'model/gltf-binary' });
  } catch {
    return file;
  }
}

export async function uploadModel(file: File): Promise<string> {
  const problem = validateModelFile(file);
  if (problem) throw new Error(problem);
  if (!cloudinaryConfigured()) {
    throw new Error(
      'Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET (same as product images).',
    );
  }

  const optimized = await optimizeGlb(file);
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.[^.]+$/, '') || 'model';
  const fileName = `${Date.now()}-${safe}.glb`;
  const blob =
    optimized instanceof File
      ? optimized
      : new File([optimized], fileName, { type: 'model/gltf-binary' });

  try {
    return await uploadCloudinaryRaw(blob, { folder: 'models', fileName });
  } catch (err: any) {
    const msg = String(err?.message || '');
    if (/unsigned|preset|not allowed|Unauthorized/i.test(msg)) {
      throw new Error(
        'Cloudinary rejected the GLB upload. In Cloudinary → Settings → Upload → your unsigned preset, allow “Raw” (or “Auto”) resource types and formats including glb.',
      );
    }
    throw err;
  }
}
