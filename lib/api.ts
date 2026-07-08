/** Small fetch helpers for the server API (attaches the Firebase ID token when signed in). */
import { auth } from './firebase';
import { cacheGet, cacheSet } from './dataCache';

const CONFIG_CACHE_KEY = 'rf_payments_config';

export async function apiFetch<T = any>(path: string, body?: unknown, method = 'POST'): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const token = await auth?.currentUser?.getIdToken(true);
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch { /* signed out */ }
  const res = await fetch(path, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`);
  return json as T;
}

export interface PaymentsConfig {
  stripe: boolean;
  paymob: boolean;
  cardProvider: 'stripe' | 'paymob' | null;
  ipCountry: string | null;
  cashPickupAllowed: boolean;
  ordersConfigured: boolean;
}

let configCache: PaymentsConfig | null = null;
export async function getPaymentsConfig(): Promise<PaymentsConfig> {
  if (configCache) return configCache;
  const cached = cacheGet<PaymentsConfig>(CONFIG_CACHE_KEY, 10 * 60 * 1000);
  if (cached) {
    configCache = cached;
    return cached;
  }
  try {
    const res = await fetch('/api/config');
    configCache = await res.json();
    cacheSet(CONFIG_CACHE_KEY, configCache!);
  } catch {
    // Fail closed: do not advertise cash pickup when config cannot be verified.
    configCache = { stripe: false, paymob: false, cardProvider: null, ipCountry: null, cashPickupAllowed: false, ordersConfigured: false };
  }
  return configCache!;
}
