import type { Product } from '../types';

export type StoreCurrency = 'EGP' | 'USD';
export const SUPPORTED_CURRENCIES: StoreCurrency[] = ['EGP', 'USD'];

/** Egypt (and all pickups) → EGP; everywhere else → USD. */
export function currencyForCountry(iso2?: string | null): StoreCurrency {
  return iso2 === 'EG' ? 'EGP' : 'USD';
}

/**
 * Price for a product in a given currency.
 * Never cross-fallback (EGP value shown as USD) — use legacy `price` only when it matches the currency context.
 */
export function priceFor(p: Pick<Product, 'price' | 'priceEGP' | 'priceUSD'> | undefined, currency: StoreCurrency): number | undefined {
  if (!p) return undefined;
  const specific = currency === 'EGP' ? p.priceEGP : p.priceUSD;
  if (specific != null) return specific;
  if (p.price == null) return undefined;
  if (currency === 'EGP' && p.priceEGP == null && p.priceUSD == null) return p.price;
  if (currency === 'USD' && p.priceUSD == null && p.priceEGP == null) return p.price;
  return undefined;
}
