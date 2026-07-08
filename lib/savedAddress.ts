import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { OrderContact } from '../types';

const CHECKOUT_DRAFT_KEY = 'rf_checkout_draft';

export async function loadSavedAddress(uid: string): Promise<OrderContact | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  const addr = snap.data()?.savedAddress;
  if (!addr || typeof addr !== 'object') return null;
  return addr as OrderContact;
}

export async function saveAddressForUser(uid: string, address: OrderContact): Promise<void> {
  if (!db) throw new Error('Database not configured');
  await setDoc(doc(db, 'users', uid), {
    savedAddress: address,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

export function persistCheckoutDraft(draft: unknown) {
  try { sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft)); } catch { /* private mode */ }
}

export function readCheckoutDraft<T>(): T | null {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

export function clearCheckoutDraft() {
  try { sessionStorage.removeItem(CHECKOUT_DRAFT_KEY); } catch { /* ignore */ }
}
