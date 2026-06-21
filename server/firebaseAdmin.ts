/**
 * Optional Firebase Admin. Enables server-side trust: verifying user ID tokens,
 * recomputing order totals from Firestore (never trust client prices), and letting
 * the Stripe webhook mark orders paid.
 *
 * Configure with EITHER:
 *   FIREBASE_SERVICE_ACCOUNT = <the service-account JSON, single line>
 *   or GOOGLE_APPLICATION_CREDENTIALS = <path to the JSON file>
 * Absent → admin features degrade gracefully (logged once).
 */
import type { App } from 'firebase-admin/app';

let app: App | null = null;
let initTried = false;

export async function getAdmin(): Promise<App | null> {
  if (app) return app;
  if (initTried) return null;
  initTried = true;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  const hasADC = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!raw && !hasADC) {
    console.warn('[firebase-admin] not configured — server-side order/webhook trust disabled.');
    return null;
  }
  try {
    const { initializeApp, cert, applicationDefault, getApps } = await import('firebase-admin/app');
    if (getApps().length) {
      app = getApps()[0];
      return app;
    }
    if (raw) {
      const creds = JSON.parse(raw);
      app = initializeApp({ credential: cert(creds) });
    } else {
      app = initializeApp({ credential: applicationDefault() });
    }
    return app;
  } catch (e) {
    console.error('[firebase-admin] init failed:', (e as Error).message);
    return null;
  }
}

export async function getDb() {
  const a = await getAdmin();
  if (!a) return null;
  const { getFirestore } = await import('firebase-admin/firestore');
  return getFirestore(a);
}

/** Verify a Firebase ID token from the Authorization: Bearer header. Returns decoded or null. */
export async function verifyIdToken(authHeader?: string) {
  const a = await getAdmin();
  if (!a || !authHeader?.startsWith('Bearer ')) return null;
  try {
    const { getAuth } = await import('firebase-admin/auth');
    return await getAuth(a).verifyIdToken(authHeader.slice(7));
  } catch {
    return null;
  }
}
