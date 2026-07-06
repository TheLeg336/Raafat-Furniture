import type { LocalizedString } from '../types';

/** Store currency. Override with VITE_STORE_CURRENCY (e.g. "EGP", "USD"). */
export const STORE_CURRENCY = (import.meta.env.VITE_STORE_CURRENCY as string) || 'USD';

const isAr = () => typeof document !== 'undefined' && document.documentElement.lang === 'ar';

export function formatMoney(
  amount: number | undefined | null,
  opts: { currency?: string; compact?: boolean } = {},
): string {
  if (amount == null || Number.isNaN(amount)) return '';
  const currency = opts.currency || STORE_CURRENCY;
  try {
    return new Intl.NumberFormat(isAr() ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: opts.compact ? 0 : 2,
      minimumFractionDigits: opts.compact ? 0 : 2,
    }).format(amount);
  } catch {
    // Unknown currency code → fall back to plain number + code
    return `${amount.toFixed(opts.compact ? 0 : 2)} ${currency}`;
  }
}

export function formatDate(iso: string | number | Date, withTime = false): string {
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(isAr() ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(d);
}

/** Resolve a LocalizedString | string for the current language. */
export function localized(
  value: LocalizedString | string | undefined,
  lang: 'en' | 'ar' = isAr() ? 'ar' : 'en',
  fallback = '',
): string {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  return value[lang] || value.en || value.ar || fallback;
}

// Order numbers are generated server-side (see server/ordersApi.ts) so uniqueness
// can be guaranteed via orderNumbers/{n} reservation docs.
