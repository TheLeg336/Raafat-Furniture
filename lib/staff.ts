/** Bootstrap developer — matches firestore.rules isBootstrapDeveloper(). */
export const BOOTSTRAP_DEVELOPER_EMAIL = 'youssefhanna336@gmail.com';

export function isBootstrapDeveloperEmail(email?: string | null, verified?: boolean): boolean {
  if (!email || verified === false) return false;
  return email.toLowerCase() === BOOTSTRAP_DEVELOPER_EMAIL;
}

export type StaffRole = 'developer' | 'admin' | 'worker';

export function normalizeStaffRole(role: unknown): StaffRole | null {
  if (typeof role !== 'string' || !role.trim()) return null;
  const r = role.trim().toLowerCase();
  if (r === 'developer' || r === 'admin' || r === 'worker') return r;
  if (r === 'dev') return 'developer';
  return 'admin';
}
