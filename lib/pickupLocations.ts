/** Showroom pickup locations — synced with lib/siteConfig SITE.branches. */
export interface PickupLocation {
  id: string;
  name: { en: string; ar: string };
  street: { en: string; ar: string };
  city: string;
}

export const PICKUP_LOCATIONS: PickupLocation[] = [
  {
    id: 'cairo',
    name: { en: 'Cairo', ar: 'القاهرة' },
    street: { en: '66 Mohamed Refaat St, El Nozha El Gadida', ar: '66 ش محمد رفعت، النزهة الجديدة' },
    city: 'Cairo',
  },
  {
    id: 'minya',
    name: { en: 'Minya', ar: 'المنيا' },
    street: { en: '6 Mostafa Kamel St, Ard Sultan', ar: '6 ش مصطفى كامل، أرض سلطان' },
    city: 'Minya',
  },
  {
    id: 'new-minya',
    name: { en: 'New Minya', ar: 'المنيا الجديدة' },
    street: { en: 'Corner Plaza Mall, 2nd Floor, Third District', ar: 'Corner Plaza Mall، الدور الثاني، الحي الثالث' },
    city: 'New Minya',
  },
];

export function pickupLabel(loc: PickupLocation, lang: 'en' | 'ar') {
  return `${loc.name[lang]} — ${loc.street[lang]}`;
}
