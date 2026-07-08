/**
 * Unsigned Cloudinary uploads (same preset as product images).
 * We do not use Firebase Storage — files live on Cloudinary; Firestore holds metadata only.
 */
const cloudName = () => (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string) || '';
const uploadPreset = () => (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string) || '';

export function cloudinaryConfigured(): boolean {
  return !!(cloudName() && uploadPreset());
}

function requireCloudinary() {
  if (!cloudinaryConfigured()) {
    throw new Error(
      'Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.',
    );
  }
}

type ResourceType = 'image' | 'raw' | 'auto';

async function uploadToCloudinary(
  file: Blob | File,
  opts: { resourceType: ResourceType; folder?: string; publicId?: string; fileName?: string },
): Promise<string> {
  requireCloudinary();
  const formData = new FormData();
  const name = opts.fileName || (file instanceof File ? file.name : 'upload.bin');
  formData.append('file', file, name);
  formData.append('upload_preset', uploadPreset());
  if (opts.folder) formData.append('folder', opts.folder);
  if (opts.publicId) formData.append('public_id', opts.publicId);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName()}/${opts.resourceType}/upload`,
    { method: 'POST', body: formData },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || `Cloudinary upload failed (${res.status})`);
  }
  if (!data.secure_url) throw new Error('Cloudinary did not return a URL');
  return data.secure_url as string;
}

/** Product / scan photos. */
export async function uploadCloudinaryImage(
  file: Blob | File,
  opts?: { folder?: string; fileName?: string },
): Promise<string> {
  return uploadToCloudinary(file, {
    resourceType: 'image',
    folder: opts?.folder,
    fileName: opts?.fileName,
  });
}

/**
 * GLB / other binary assets.
 * Uses `raw` so Cloudinary stores the file as-is (needed for model-viewer).
 * Your unsigned preset must allow raw uploads (Cloudinary dashboard → Upload presets).
 */
export async function uploadCloudinaryRaw(
  file: Blob | File,
  opts?: { folder?: string; fileName?: string },
): Promise<string> {
  try {
    return await uploadToCloudinary(file, {
      resourceType: 'raw',
      folder: opts?.folder || 'models',
      fileName: opts?.fileName,
    });
  } catch (err: any) {
    // Some presets only allow auto — retry once.
    const msg = String(err?.message || '');
    if (/raw|resource_type|not allowed|Invalid/i.test(msg)) {
      return uploadToCloudinary(file, {
        resourceType: 'auto',
        folder: opts?.folder || 'models',
        fileName: opts?.fileName,
      });
    }
    throw err;
  }
}
