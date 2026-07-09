/** Small fetch helpers for the server API (attaches the Firebase ID token when signed in). */
import { auth } from './firebase';
import { cacheClear, cacheGet, cacheSet } from './dataCache';

const CONFIG_CACHE_KEY = 'rf_payments_config';
/** Short TTL — Dev toggles must show up quickly; still avoids hammering /api/config. */
const CONFIG_TTL_MS = 30 * 1000;

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
  /** Dev-toggled rails (false = hidden at checkout even if env keys exist). */
  methods: {
    stripe: boolean;
    paymob: boolean;
    instapay: boolean;
    bank_transfer: boolean;
  };
  env?: { stripe: boolean; paymob: boolean };
}

const defaultMethods = { stripe: true, paymob: true, instapay: true, bank_transfer: true };

let configCache: PaymentsConfig | null = null;
let configCacheAt = 0;

function normalizeConfig(json: any): PaymentsConfig {
  return {
    stripe: !!json.stripe,
    paymob: !!json.paymob,
    cardProvider: json.cardProvider || null,
    ipCountry: json.ipCountry || null,
    cashPickupAllowed: !!json.cashPickupAllowed,
    ordersConfigured: !!json.ordersConfigured,
    methods: { ...defaultMethods, ...(json.methods || {}) },
    env: json.env ? { stripe: !!json.env.stripe, paymob: !!json.env.paymob } : undefined,
  };
}

export async function getPaymentsConfig(opts?: { force?: boolean }): Promise<PaymentsConfig> {
  if (!opts?.force && configCache && Date.now() - configCacheAt < CONFIG_TTL_MS) {
    return configCache;
  }
  if (!opts?.force) {
    const cached = cacheGet<PaymentsConfig>(CONFIG_CACHE_KEY, CONFIG_TTL_MS);
    if (cached) {
      configCache = cached;
      configCacheAt = Date.now();
      return cached;
    }
  }
  try {
    const res = await fetch(`/api/config?_=${Date.now()}`, { cache: 'no-store' });
    const json = await res.json();
    configCache = normalizeConfig(json);
    configCacheAt = Date.now();
    cacheSet(CONFIG_CACHE_KEY, configCache!);
  } catch {
    // Fail closed: do not advertise cash pickup when config cannot be verified.
    configCache = {
      stripe: false, paymob: false, cardProvider: null, ipCountry: null,
      cashPickupAllowed: false, ordersConfigured: false, methods: { ...defaultMethods },
    };
    configCacheAt = Date.now();
  }
  return configCache!;
}

/** Clear cached config after Dev toggles payment methods. */
export function clearPaymentsConfigCache() {
  configCache = null;
  configCacheAt = 0;
  cacheClear(CONFIG_CACHE_KEY);
}
