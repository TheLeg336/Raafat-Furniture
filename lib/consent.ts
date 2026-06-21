/**
 * Cookie / tracking consent — GDPR + CCPA shaped.
 * Non-essential categories (analytics, marketing) are OFF until the user opts in.
 * Choice is persisted and broadcast so analytics can react live.
 */

export type ConsentCategory = 'necessary' | 'analytics' | 'marketing';

export interface ConsentState {
  necessary: true; // always on — required for the site to function
  analytics: boolean;
  marketing: boolean;
  decidedAt: string | null; // ISO; null = no decision yet (banner should show)
  version: number;
}

const STORAGE_KEY = 'rf_consent_v1';
const CONSENT_VERSION = 1;
export const CONSENT_EVENT = 'rf-consent-change';

const DEFAULT: ConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
  decidedAt: null,
  version: CONSENT_VERSION,
};

export function getConsent(): ConsentState {
  if (typeof localStorage === 'undefined') return DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed.version !== CONSENT_VERSION) return DEFAULT; // re-prompt on policy change
    return { ...DEFAULT, ...parsed, necessary: true };
  } catch {
    return DEFAULT;
  }
}

export function hasDecided(): boolean {
  return getConsent().decidedAt != null;
}

export function setConsent(next: Partial<Pick<ConsentState, 'analytics' | 'marketing'>>): ConsentState {
  const current = getConsent();
  const state: ConsentState = {
    ...current,
    ...next,
    necessary: true,
    decidedAt: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage blocked — session-only consent */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: state }));
  }
  return state;
}

export const acceptAll = () => setConsent({ analytics: true, marketing: true });
export const rejectAll = () => setConsent({ analytics: false, marketing: false });

export function onConsentChange(cb: (s: ConsentState) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent).detail as ConsentState);
  window.addEventListener(CONSENT_EVENT, handler);
  return () => window.removeEventListener(CONSENT_EVENT, handler);
}
