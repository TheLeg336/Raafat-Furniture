import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { uploadCloudinaryImage } from './cloudinaryUpload';
import { uploadModel } from './modelUpload';
import { stripUndefined } from './firestoreSanitize';
import type { ScanJob, ScanStatus } from '../types';

/**
 * Photogrammetry reconstruction backend.
 *
 * Preferred (free) path: run `scan-worker/` on any PC with a decent GPU. It watches
 * the `scans` collection for status == 'queued', reconstructs a GLB locally
 * (Meshroom / RealityScan), uploads it and marks the scan 'ready' — auto-attaching
 * to the product when the scan carries a productId.
 *
 * Alternative: set VITE_PHOTOGRAMMETRY_API_URL to a hosted service that accepts
 * { scanId, frameUrls, dimensions } and (async) writes back a GLB url to the scan doc.
 * With neither, the scan stays queued and an admin attaches the finished GLB manually.
 */
const PHOTOGRAMMETRY_API_URL = (import.meta.env.VITE_PHOTOGRAMMETRY_API_URL as string) || '';

export function reconstructionConfigured(): boolean {
  return !!PHOTOGRAMMETRY_API_URL;
}

/** Create a scan job. Pass productId so the worker can auto-attach the finished model. */
export async function createScanJob(
  createdBy: string,
  opts?: { handoff?: boolean; productId?: string },
): Promise<string> {
  if (!db) throw new Error('Database not configured');
  const now = new Date().toISOString();
  const job: Omit<ScanJob, 'id'> = {
    createdBy,
    status: 'capturing',
    frameCount: 0,
    createdAt: now,
    updatedAt: now,
    ...(opts?.handoff ? { handoffFrom: 'desktop' as const } : {}),
    ...(opts?.productId ? { productId: opts.productId } : {}),
  };
  const r = await addDoc(collection(db, 'scans'), job);
  return r.id;
}

/** Upload one captured frame to Cloudinary; returns its HTTPS URL. */
export async function uploadFrame(scanId: string, index: number, blob: Blob): Promise<string> {
  const fileName = `frame-${String(index).padStart(3, '0')}.jpg`;
  return uploadCloudinaryImage(blob, {
    folder: `scans/${scanId}`,
    fileName,
  });
}

export async function patchScan(scanId: string, patch: Partial<ScanJob>) {
  if (!db) throw new Error('Database not configured');
  await updateDoc(
    doc(db, 'scans', scanId),
    stripUndefined({ ...patch, updatedAt: new Date().toISOString() }),
  );
}

export async function setScanStatus(scanId: string, status: ScanStatus, error?: string) {
  await patchScan(scanId, { status, ...(error ? { error } : {}) });
}

/** Attach a finished GLB (e.g. from Polycam/Blender) directly to a queued scan job. */
export async function attachModelToScan(scanId: string, file: File): Promise<string> {
  const url = await uploadModel(file);
  await patchScan(scanId, { status: 'ready', modelUrl: url });
  return url;
}

/**
 * Hand the captured frames to the reconstruction service (if configured).
 * Returns true if a job was dispatched, false if it goes to the queue
 * (picked up by scan-worker, or finished manually).
 */
export async function requestReconstruction(job: ScanJob): Promise<boolean> {
  if (!PHOTOGRAMMETRY_API_URL) {
    await setScanStatus(job.id, 'queued');
    return false;
  }
  try {
    await setScanStatus(job.id, 'processing');
    const res = await fetch(PHOTOGRAMMETRY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scanId: job.id,
        frameUrls: job.frameUrls,
        dimensions: job.realDimensions,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      await setScanStatus(
        job.id,
        'failed',
        `Reconstruction service returned ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`,
      );
      return false;
    }
    return true;
  } catch (e: any) {
    await setScanStatus(job.id, 'failed', e?.message || 'Reconstruction request failed');
    return false;
  }
}

export function subscribeScans(cb: (scans: ScanJob[]) => void) {
  if (!db) return () => {};
  // Bounded: the admin UI only shows recent jobs; unbounded reads grow with history.
  const q = query(collection(db, 'scans'), orderBy('createdAt', 'desc'), limit(20));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ScanJob))));
}

/** Listen to a single scan job (desktop handoff while phone captures). */
export function subscribeScan(scanId: string, cb: (scan: ScanJob | null) => void) {
  if (!db) return () => {};
  return onSnapshot(doc(db, 'scans', scanId), (snap) => {
    cb(snap.exists() ? ({ id: snap.id, ...snap.data() } as ScanJob) : null);
  });
}
