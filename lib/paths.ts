/**
 * Non-obvious internal paths — set VITE_ADMIN_BASE / VITE_STAFF_BASE in env to customize.
 * Security is enforced by Firebase Auth + server APIs; obscuring URLs reduces casual probing.
 */
const trim = (s: string) => s.replace(/^\/+|\/+$/g, '');

export const ADMIN_BASE = trim((import.meta.env.VITE_ADMIN_BASE as string) || 'manage');
export const STAFF_BASE = trim((import.meta.env.VITE_STAFF_BASE as string) || 'workshop');
export const LOGIN_PATH = '/sign-in';

/** e.g. adminPath() → /manage, adminPath('orders') → /manage/orders */
export function adminPath(segment = ''): string {
  const seg = trim(segment);
  return seg ? `/${ADMIN_BASE}/${seg}` : `/${ADMIN_BASE}`;
}

export const STAFF_PATH = `/${STAFF_BASE}`;

/** Legacy guessable paths — show 404 (do not redirect, avoids leaking the new base). */
export const LEGACY_BLOCKED_PREFIXES = ['/admin', '/staff', '/login'];

export function isLegacyBlockedPath(pathname: string): boolean {
  return LEGACY_BLOCKED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
