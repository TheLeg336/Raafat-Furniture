/**
 * Firestore rejects `undefined` anywhere in a document (including nested fields).
 * Strip undefined recursively before addDoc / updateDoc / setDoc.
 * `null` is kept (explicit clear). Arrays are mapped; plain objects are walked.
 */
export function stripUndefined<T>(value: T): T {
  if (value === undefined) return value;
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)).filter((item) => item !== undefined) as T;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (v === undefined) continue;
    out[k] = stripUndefined(v);
  }
  return out as T;
}
