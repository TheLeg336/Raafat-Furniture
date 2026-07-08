/**
 * Silent client error reporting for the Dev → Errors inbox.
 *
 * Privacy / legal notes (see docs/ERROR-REPORTING.md + cookie/privacy copy):
 * - No camera frames, form field values, payment data, or passwords.
 * - Only technical diagnostics: message, stack (truncated), route, optional
 *   intended destination, coarse user-agent, and whether the visitor is signed in.
 * - Treated as a strictly necessary reliability signal (not analytics marketing).
 * - Developers resolve reports; customers never see a toast or modal from this.
 */
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';

export type ClientErrorReport = {
  id: string;
  message: string;
  stack?: string;
  name?: string;
  path: string;
  intendedPath?: string;
  href?: string;
  userAgent?: string;
  language?: string;
  signedIn: boolean;
  roleHint?: 'customer' | 'admin' | 'developer' | 'worker' | 'unknown';
  source: 'window.onerror' | 'unhandledrejection' | 'react' | 'manual';
  createdAt: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
};

const RATE_MS = 8_000;
const MAX_MSG = 500;
const MAX_STACK = 2_500;
let lastSentAt = 0;
let lastFingerprint = '';
let installed = false;

function fingerprint(message: string, path: string): string {
  return `${path}::${message.slice(0, 120)}`;
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n)}…`;
}

function safePath(): string {
  try {
    return `${location.pathname}${location.search}`.slice(0, 300);
  } catch {
    return '/';
  }
}

export type ReportErrorInput = {
  message: string;
  stack?: string;
  name?: string;
  source: ClientErrorReport['source'];
  intendedPath?: string;
  signedIn?: boolean;
  roleHint?: ClientErrorReport['roleHint'];
};

/** Fire-and-forget. Never throws to callers. Never surfaces UI. */
export async function reportClientError(input: ReportErrorInput): Promise<void> {
  try {
    if (!db) return;
    const message = truncate(String(input.message || 'Unknown error'), MAX_MSG);
    if (!message.trim()) return;
    // Skip noisy browser extensions / ResizeObserver loops.
    if (/ResizeObserver|Script error\.|Loading chunk|ChunkLoadError/i.test(message)) return;

    const path = safePath();
    const fp = fingerprint(message, path);
    const now = Date.now();
    if (fp === lastFingerprint && now - lastSentAt < RATE_MS) return;
    if (now - lastSentAt < 1_500) return;
    lastFingerprint = fp;
    lastSentAt = now;

    await addDoc(collection(db, 'client_errors'), {
      message,
      stack: input.stack ? truncate(input.stack, MAX_STACK) : null,
      name: input.name ? truncate(input.name, 80) : null,
      path,
      intendedPath: input.intendedPath ? truncate(input.intendedPath, 300) : null,
      href: typeof location !== 'undefined' ? truncate(location.href, 400) : null,
      userAgent: typeof navigator !== 'undefined' ? truncate(navigator.userAgent, 250) : null,
      language: typeof navigator !== 'undefined' ? navigator.language : null,
      signedIn: !!input.signedIn,
      roleHint: input.roleHint || 'unknown',
      source: input.source,
      createdAt: new Date().toISOString(),
      createdAtServer: serverTimestamp(),
      resolved: false,
    });
  } catch {
    /* silent — never break the storefront for telemetry */
  }
}

/** Install once at app boot. Safe to call multiple times. */
export function installClientErrorReporting(getContext?: () => {
  signedIn?: boolean;
  roleHint?: ClientErrorReport['roleHint'];
}): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const ctx = () => getContext?.() || {};

  window.addEventListener('error', (ev) => {
    const err = ev.error;
    void reportClientError({
      message: err?.message || ev.message || 'window.onerror',
      stack: err?.stack,
      name: err?.name,
      source: 'window.onerror',
      ...ctx(),
    });
  });

  window.addEventListener('unhandledrejection', (ev) => {
    const reason = ev.reason;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === 'string'
          ? reason
          : 'unhandledrejection';
    void reportClientError({
      message,
      stack: reason instanceof Error ? reason.stack : undefined,
      name: reason instanceof Error ? reason.name : undefined,
      source: 'unhandledrejection',
      ...ctx(),
    });
  });
}

export function subscribeClientErrors(
  onData: (rows: ClientErrorReport[]) => void,
  opts?: { unresolvedOnly?: boolean },
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  // Single-field order avoids a composite index; filter unresolved client-side.
  const q = query(collection(db, 'client_errors'), orderBy('createdAt', 'desc'), limit(100));
  return onSnapshot(
    q,
    (snap) => {
      let rows = snap.docs.map((d) => {
        const data = d.data() as Omit<ClientErrorReport, 'id'>;
        return { id: d.id, ...data };
      });
      if (opts?.unresolvedOnly) rows = rows.filter((r) => !r.resolved);
      onData(rows);
    },
    () => onData([]),
  );
}

export async function countUnresolvedErrors(): Promise<number> {
  if (!db) return 0;
  try {
    const snap = await getDocs(
      query(collection(db, 'client_errors'), where('resolved', '==', false), limit(100)),
    );
    return snap.size;
  } catch {
    return 0;
  }
}

export async function resolveClientError(id: string, by: string): Promise<void> {
  if (!db) throw new Error('Database not configured');
  await updateDoc(doc(db, 'client_errors', id), {
    resolved: true,
    resolvedAt: new Date().toISOString(),
    resolvedBy: by,
  });
}
