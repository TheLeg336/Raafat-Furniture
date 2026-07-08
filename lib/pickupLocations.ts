/** Showroom pickup locations — synced with lib/siteConfig SITE.branches. */
export interface PickupLocation {
  id: string;
  name: { en: string; ar: string };
  street: { en: string; ar: string };
  city: string;
  /** WGS84 — used for nearest-showroom sorting */
  lat: number;
  lng: number;
}

export const PICKUP_LOCATIONS: PickupLocation[] = [
  {
    id: 'cairo',
    name: { en: 'Cairo', ar: 'القاهرة' },
    street: { en: '66 Mohamed Refaat St, El Nozha El Gadida', ar: '66 ش محمد رفعت، النزهة الجديدة' },
    city: 'Cairo',
    lat: 30.1285,
    lng: 31.3737,
  },
  {
    id: 'minya',
    name: { en: 'Minya', ar: 'المنيا' },
    street: { en: '6 Mostafa Kamel St, Ard Sultan', ar: '6 ش مصطفى كامل، أرض سلطان' },
    city: 'Minya',
    lat: 28.1099,
    lng: 30.7503,
  },
  {
    id: 'new-minya',
    name: { en: 'New Minya', ar: 'المنيا الجديدة' },
    street: { en: 'Corner Plaza Mall, 2nd Floor, Third District', ar: 'Corner Plaza Mall، الدور الثاني، الحي الثالث' },
    city: 'New Minya',
    lat: 28.1195,
    lng: 30.7975,
  },
];

/** Rough city centroids for Egypt when the customer types a city instead of using GPS. */
const EG_CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  cairo: { lat: 30.0444, lng: 31.2357 },
  giza: { lat: 30.0131, lng: 31.2089 },
  alexandria: { lat: 31.2001, lng: 29.9187 },
  alex: { lat: 31.2001, lng: 29.9187 },
  minya: { lat: 28.1099, lng: 30.7503 },
  assiut: { lat: 27.1809, lng: 31.1837 },
  asyut: { lat: 27.1809, lng: 31.1837 },
  luxor: { lat: 25.6872, lng: 32.6396 },
  aswan: { lat: 24.0889, lng: 32.8998 },
  mansoura: { lat: 31.0409, lng: 31.3785 },
  tanta: { lat: 30.7865, lng: 31.0004 },
  ismailia: { lat: 30.5965, lng: 32.2715 },
  suez: { lat: 29.9668, lng: 32.5498 },
  portsaid: { lat: 31.2653, lng: 32.3019 },
  'port said': { lat: 31.2653, lng: 32.3019 },
  hurghada: { lat: 27.2579, lng: 33.8116 },
  sharm: { lat: 27.9158, lng: 34.3300 },
  'new minya': { lat: 28.1195, lng: 30.7975 },
  'new-minya': { lat: 28.1195, lng: 30.7975 },
};

export function pickupLabel(loc: PickupLocation, lang: 'en' | 'ar') {
  return `${loc.name[lang]} — ${loc.street[lang]}`;
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function resolveEgyptHintCoords(cityOrZip: string): { lat: number; lng: number } | null {
  const raw = cityOrZip.trim().toLowerCase();
  if (!raw) return null;
  // Egypt postal codes are 5 digits — map common prefixes to regions (approximate).
  if (/^\d{5}$/.test(raw)) {
    const prefix = raw.slice(0, 2);
    if (['11', '12', '13', '14', '15'].includes(prefix)) return EG_CITY_COORDS.cairo;
    if (['21', '22'].includes(prefix)) return EG_CITY_COORDS.alexandria;
    if (['61', '62'].includes(prefix)) return EG_CITY_COORDS.minya;
    return EG_CITY_COORDS.cairo;
  }
  return EG_CITY_COORDS[raw] || EG_CITY_COORDS[raw.replace(/\s+/g, ' ')] || null;
}

export function sortPickupByDistance(
  origin: { lat: number; lng: number },
  locs: PickupLocation[] = PICKUP_LOCATIONS,
): { loc: PickupLocation; km: number }[] {
  return locs
    .map((loc) => ({ loc, km: haversineKm(origin, { lat: loc.lat, lng: loc.lng }) }))
    .sort((a, b) => a.km - b.km);
}
