import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import type { ScanJob, ScanStatus } from '../types';

/**
 * Photogrammetry reconstruction backend.
 * Real multi-view-stereo cannot run in-browser to production quality, so the heavy
 * step is pluggable: set VITE_PHOTOGRAMMETRY_API_URL to a service that accepts
 * { scanId, frameUrls, dimensions } and (async) writes back a GLB url to the scan doc.
 * Without it, the scan is queued and an admin attaches the finished GLB manually.
 */
const PHOTOGRAMMETRY_API_URL = (import.meta.env.VITE_PHOTOGRAMMETRY_API_URL as string) || '';

export function reconstructionConfigured(): boolean {
  return !!PHOTOGRAMMETRY_API_URL;
}

export async function createScanJob(createdBy: string): Promise<string> {
  if (!db) throw new Error('Database not configured');
  const now = new Date().toISOString();
  const job: Omit<ScanJob, 'id'> = {
    createdBy,
    status: 'capturing',
    frameCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  const r = await addDoc(collection(db, 'scans'), job);
  return r.id;
}

/** Upload one captured frame to Storage; returns its download URL. */
export async function uploadFrame(scanId: string, index: number, blob: Blob): Promise<string> {
  if (!storage) throw new Error('Storage not configured');
  const path = `scans/${scanId}/frame-${String(index).padStart(3, '0')}.jpg`;
  const r = storageRef(storage, path);
  await uploadBytes(r, blob, { contentType: 'image/jpeg' });
  return getDownloadURL(r);
}

export async function patchScan(scanId: string, patch: Partial<ScanJob>) {
  if (!db) throw new Error('Database not configured');
  await updateDoc(doc(db, 'scans', scanId), { ...patch, updatedAt: new Date().toISOString() });
}

export async function setScanStatus(scanId: string, status: ScanStatus, error?: string) {
  await patchScan(scanId, { status, ...(error ? { error } : {}) });
}

/**
 * Hand the captured frames to the reconstruction service (if configured).
 * Returns true if a job was dispatched, false if it must be finished manually.
 */
export async function requestReconstruction(job: ScanJob): Promise<boolean> {
  if (!PHOTOGRAMMETRY_API_URL) {
    await setScanStatus(job.id, 'queued');
    return false;
  }
  try {
    await setScanStatus(job.id, 'processing');
    await fetch(PHOTOGRAMMETRY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scanId: job.id,
        frameUrls: job.frameUrls,
        dimensions: job.realDimensions,
      }),
    });
    return true;
  } catch (e: any) {
    await setScanStatus(job.id, 'failed', e?.message || 'Reconstruction request failed');
    return false;
  }
}

export function subscribeScans(cb: (scans: ScanJob[]) => void) {
  if (!db) return () => {};
  const q = query(collection(db, 'scans'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ScanJob))));
}

/** Listen to a single scan job (desktop handoff while phone captures). */
export function subscribeScan(scanId: string, cb: (scan: ScanJob | null) => void) {
  if (!db) return () => {};
  return onSnapshot(doc(db, 'scans', scanId), (snap) => {
    cb(snap.exists() ? ({ id: snap.id, ...snap.data() } as ScanJob) : null);
  });
}

/** Create a scan reserved for mobile handoff from desktop admin. */
export async function createHandoffScan(createdBy: string): Promise<string> {
  if (!db) throw new Error('Database not configured');
  const now = new Date().toISOString();
  const job: Omit<ScanJob, 'id'> = {
    createdBy,
    status: 'capturing',
    frameCount: 0,
    createdAt: now,
    updatedAt: now,
    handoffFrom: 'desktop',
  };
  const r = await addDoc(collection(db, 'scans'), job);
  return r.id;
}
