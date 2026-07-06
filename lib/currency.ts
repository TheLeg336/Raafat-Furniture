import type { Product } from '../types';

export type StoreCurrency = 'EGP' | 'USD';
export const SUPPORTED_CURRENCIES: StoreCurrency[] = ['EGP', 'USD'];

/** Egypt (and all pickups) → EGP; everywhere else → USD. */
export function currencyForCountry(iso2?: string | null): StoreCurrency {
  return iso2 === 'EG' ? 'EGP' : 'USD';
}

/** The price to show/charge for a product in a given currency (falls back to legacy `price`). */
export function priceFor(p: Pick<Product, 'price' | 'priceEGP' | 'priceUSD'> | undefined, currency: StoreCurrency): number | undefined {
  if (!p) return undefined;
  const v = currency === 'EGP' ? p.priceEGP : p.priceUSD;
  return v != null ? v : p.price ?? undefined;
}
