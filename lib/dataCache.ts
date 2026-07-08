/** Lightweight in-memory + sessionStorage cache for Firestore/API reads. */

const mem = new Map<string, { at: number; value: unknown }>();
const DEFAULT_TTL_MS = 5 * 60 * 1000;

export function cacheGet<T>(key: string, ttlMs = DEFAULT_TTL_MS): T | null {
  const m = mem.get(key);
  if (m && Date.now() - m.at < ttlMs) return m.value as T;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; value: T };
    if (Date.now() - parsed.at > ttlMs) return null;
    mem.set(key, parsed);
    return parsed.value;
  } catch {
    return null;
  }
}

export function cacheSet<T>(key: string, value: T) {
  const entry = { at: Date.now(), value };
  mem.set(key, entry);
  try { sessionStorage.setItem(key, JSON.stringify(entry)); } catch { /* quota */ }
}
