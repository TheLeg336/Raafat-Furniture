/**
 * DDP (Delivered Duty Paid) estimation engine — zero external services.
 *
 * Freight: zone rate tables (USD per chargeable kg with a per-shipment minimum).
 * Chargeable weight per furniture industry practice = max(actual, volumetric),
 * volumetric = L×W×H (cm) / divisor (default 5000).
 * Duties: per-country duty% + import-VAT% applied on CIF (goods + freight),
 * VAT on (CIF + duty) — the standard customs formula.
 *
 * Everything is editable in Admin → Dev → "International shipping & duties";
 * the defaults below are STARTER ESTIMATES for Egyptian-origin furniture
 * (HS 9403) — tune them to your freight forwarder's real rates.
 *
 * Shared by the client (checkout preview) and the server (authoritative
 * pricing in server/ordersApi.ts). Keep it dependency-free.
 */

export interface DdpZone {
  id: string;
  name: string;
  /** ISO2 codes; '*' matches any country (use for the catch-all zone). */
  countries: string[];
  perKgUSD: number;
  minUSD: number;
}

export interface DdpCountryRate {
  /** Customs duty % on CIF (goods + freight). */
  dutyPct: number;
  /** Import VAT/GST % on (CIF + duty). */
  vatPct: number;
}

export interface DdpConfig {
  enabled: boolean;
  volumetricDivisor: number;
  zones: DdpZone[];
  rates: Record<string, DdpCountryRate>;
  defaultRate: DdpCountryRate;
}

export const DEFAULT_DDP_CONFIG: DdpConfig = {
  enabled: false, // owner flips this on in Dev once rates are tuned
  volumetricDivisor: 5000,
  zones: [
    { id: 'gcc', name: 'Gulf & Middle East', countries: ['AE', 'SA', 'KW', 'QA', 'BH', 'OM', 'JO', 'LB'], perKgUSD: 3.5, minUSD: 120 },
    { id: 'europe', name: 'Europe & UK', countries: ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'SE', 'AT', 'PT', 'IE', 'DK', 'FI', 'GR', 'PL', 'CZ', 'CH', 'NO'], perKgUSD: 4.5, minUSD: 150 },
    { id: 'north-america', name: 'North America', countries: ['US', 'CA'], perKgUSD: 5.5, minUSD: 180 },
    { id: 'rest', name: 'Rest of world', countries: ['*'], perKgUSD: 6.5, minUSD: 200 },
  ],
  rates: {
    US: { dutyPct: 10, vatPct: 0 },
    CA: { dutyPct: 6, vatPct: 5 },
    GB: { dutyPct: 0, vatPct: 20 },
    DE: { dutyPct: 0, vatPct: 19 },
    FR: { dutyPct: 0, vatPct: 20 },
    IT: { dutyPct: 0, vatPct: 22 },
    ES: { dutyPct: 0, vatPct: 21 },
    NL: { dutyPct: 0, vatPct: 21 },
    AE: { dutyPct: 5, vatPct: 5 },
    SA: { dutyPct: 5, vatPct: 15 },
    KW: { dutyPct: 5, vatPct: 0 },
    QA: { dutyPct: 5, vatPct: 0 },
    BH: { dutyPct: 5, vatPct: 10 },
    OM: { dutyPct: 5, vatPct: 5 },
    JO: { dutyPct: 15, vatPct: 16 },
    AU: { dutyPct: 5, vatPct: 10 },
  },
  defaultRate: { dutyPct: 10, vatPct: 15 },
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const num = (v: unknown): number => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : 0);

/** Merge a settings/shipping Firestore doc over the defaults (tolerates partial/garbage docs). */
export function normalizeDdpConfig(raw: any): DdpConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_DDP_CONFIG;
  const zones: DdpZone[] = Array.isArray(raw.zones) && raw.zones.length
    ? raw.zones.map((z: any, i: number) => ({
        id: String(z?.id || `zone-${i}`),
        name: String(z?.name || `Zone ${i + 1}`),
        countries: Array.isArray(z?.countries) ? z.countries.map((c: any) => String(c).trim().toUpperCase()).filter(Boolean) : [],
        perKgUSD: num(z?.perKgUSD),
        minUSD: num(z?.minUSD),
      })).filter((z: DdpZone) => z.countries.length && z.perKgUSD > 0)
    : DEFAULT_DDP_CONFIG.zones;
  const rates: Record<string, DdpCountryRate> = {};
  const rawRates = raw.rates && typeof raw.rates === 'object' ? raw.rates : DEFAULT_DDP_CONFIG.rates;
  for (const [cc, r] of Object.entries<any>(rawRates)) {
    const code = cc.trim().toUpperCase();
    if (/^[A-Z]{2}$/.test(code)) rates[code] = { dutyPct: num(r?.dutyPct), vatPct: num(r?.vatPct) };
  }
  return {
    enabled: raw.enabled === true,
    volumetricDivisor: num(raw.volumetricDivisor) || DEFAULT_DDP_CONFIG.volumetricDivisor,
    zones,
    rates: Object.keys(rates).length ? rates : DEFAULT_DDP_CONFIG.rates,
    defaultRate: {
      dutyPct: num(raw.defaultRate?.dutyPct) || DEFAULT_DDP_CONFIG.defaultRate.dutyPct,
      vatPct: raw.defaultRate?.vatPct != null ? num(raw.defaultRate.vatPct) : DEFAULT_DDP_CONFIG.defaultRate.vatPct,
    },
  };
}

export interface PackedItem {
  quantity: number;
  packedWeightKg?: number;
  packedLengthCm?: number;
  packedWidthCm?: number;
  packedHeightCm?: number;
}

/** max(actual, volumetric) per unit; null when the product has no shipping data. */
export function chargeableWeightKg(item: PackedItem, divisor: number): number | null {
  const actual = num(item.packedWeightKg);
  const l = num(item.packedLengthCm), w = num(item.packedWidthCm), h = num(item.packedHeightCm);
  const volumetric = l && w && h ? (l * w * h) / (divisor || 5000) : 0;
  const per = Math.max(actual, volumetric);
  return per > 0 ? per : null;
}

export function zoneForCountry(cfg: DdpConfig, iso2: string): DdpZone | null {
  const cc = iso2.toUpperCase();
  return cfg.zones.find((z) => z.countries.includes(cc))
    || cfg.zones.find((z) => z.countries.includes('*'))
    || null;
}

export interface DdpQuote {
  freightUSD: number;
  dutiesUSD: number;       // duty + import VAT combined
  chargeableKg: number;
  zoneName: string;
  dutyPct: number;
  vatPct: number;
}

/**
 * Full DDP quote in USD for an export shipment, or null when it cannot be
 * computed (config disabled, missing product shipping data, or no zone) —
 * callers then fall back to "shipping quoted after order".
 */
export function computeDdpQuote(
  cfg: DdpConfig,
  items: PackedItem[],
  destinationISO2: string,
  subtotalUSD: number,
): DdpQuote | null {
  if (!cfg.enabled || destinationISO2 === 'EG' || !items.length) return null;
  const zone = zoneForCountry(cfg, destinationISO2);
  if (!zone) return null;
  let totalKg = 0;
  for (const it of items) {
    const per = chargeableWeightKg(it, cfg.volumetricDivisor);
    if (per == null) return null; // any item without data → quote manually
    totalKg += per * Math.max(1, it.quantity);
  }
  const freightUSD = round2(Math.max(zone.minUSD, totalKg * zone.perKgUSD));
  const rate = cfg.rates[destinationISO2.toUpperCase()] || cfg.defaultRate;
  const cif = subtotalUSD + freightUSD;
  const duty = cif * (rate.dutyPct / 100);
  const importVat = (cif + duty) * (rate.vatPct / 100);
  return {
    freightUSD,
    dutiesUSD: round2(duty + importVat),
    chargeableKg: round2(totalKg),
    zoneName: zone.name,
    dutyPct: rate.dutyPct,
    vatPct: rate.vatPct,
  };
}
