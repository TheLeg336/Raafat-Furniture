import { currencyForCountry, type StoreCurrency } from './currency';

/** Guess ISO2 country when the server has no geo header (local dev, some proxies). */
export function guessVisitorCountry(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz === 'Africa/Cairo' || tz.startsWith('Africa/Cairo')) return 'EG';
    if (tz.startsWith('America/') || tz.startsWith('US/') || tz === 'Pacific/Honolulu') return 'US';
    if (tz.startsWith('Europe/London')) return 'GB';
    if (tz.startsWith('Asia/Dubai')) return 'AE';
    const lang = navigator.language || '';
    if (lang.endsWith('-EG') || lang === 'ar-EG') return 'EG';
    if (lang.endsWith('-US')) return 'US';
  } catch { /* ignore */ }
  return null;
}

/** Browse currency from server geo, with sensible client fallback (defaults to USD). */
export function browseCurrencyFromGeo(ipCountry?: string | null): StoreCurrency {
  if (ipCountry) return currencyForCountry(ipCountry);
  return currencyForCountry(guessVisitorCountry());
}

export function defaultCheckoutCountry(ipCountry?: string | null): string {
  if (ipCountry) return ipCountry;
  return guessVisitorCountry() || 'US';
}

/** True when WebXR / mobile AR is likely available on this device. */
export function isArCapableDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const coarse = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const android = /Android/i.test(navigator.userAgent);
  return coarse || ios || android;
}
