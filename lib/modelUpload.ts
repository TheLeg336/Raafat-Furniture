/**
 * GLB upload with light mesh optimization before Firebase Storage.
 */
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

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
  if (!storage) throw new Error('Storage not configured');

  const optimized = await optimizeGlb(file);
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.[^.]+$/, '') || 'model';
  const r = storageRef(storage, `models/${Date.now()}-${safe}.glb`);
  // Always set an explicit contentType — Windows often leaves File.type empty for .glb,
  // and Storage rules reject empty types when they only allow model/*.
  try {
    await uploadBytes(r, optimized, {
      contentType: 'model/gltf-binary',
      customMetadata: { originalName: file.name.slice(0, 120) },
    });
  } catch (err: any) {
    const code = err?.code || '';
    const msg = String(err?.message || '');
    if (code === 'storage/unauthorized' || /insufficient permissions|permission/i.test(msg)) {
      throw new Error(
        'Missing or insufficient permissions to upload 3D models. Sign in as admin or developer, and deploy the latest storage.rules (firebase deploy --only storage).',
      );
    }
    throw err;
  }
  return getDownloadURL(r);
}
