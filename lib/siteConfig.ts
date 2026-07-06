/**
 * Central business facts used for SEO / structured data / AI discovery.
 * Fill the FILL_ME values before launch (domain, socials, email) — see LAUNCH_GUIDE.md.
 */

// Runtime origin wins (so previews/staging get correct canonicals); falls back to
// VITE_SITE_URL, then the production domain.
export const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string) ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://www.raafatfurniture.com');

export const SITE = {
  name: 'Raafat Furniture',
  legalName: 'Raafat Furniture', // FILL_ME: registered legal name once known
  tagline: 'Handcrafted luxury furniture, made to last.',
  description:
    'Raafat Furniture is an Egyptian maker of handcrafted luxury furniture — sofas, bedroom, dining, office and custom pieces. Shop in interactive 3D, preview items in your room with AR, and order for pickup or worldwide delivery. Based in Egypt, serving Egypt, the United States and worldwide.',
  phone: '+201010279777',
  phoneDisplay: '01010279777',
  email: 'FILL_ME@raafatfurniture.com', // FILL_ME
  currenciesAccepted: 'EGP, USD',
  areaServed: ['EG', 'US', 'Worldwide'],
  hours: 'Mo-Sa 12:00-22:00',
  // FILL_ME: real profile URLs — used for `sameAs` (helps Google + AI trust the entity)
  social: [
    // 'https://www.instagram.com/...',
    // 'https://www.facebook.com/...',
    // 'https://www.tiktok.com/@...',
  ] as string[],
  branches: [
    { name: 'Raafat Furniture — Cairo', street: '66 Mohamed Refaat Street, next to KFC, El Nozha El Gadida', city: 'Cairo', region: 'Cairo', country: 'EG' },
    { name: 'Raafat Furniture — Minya', street: '6 Mostafa Kamel Street, Ard Sultan', city: 'Minya', region: 'Minya', country: 'EG' },
    { name: 'Raafat Furniture — New Minya', street: 'Corner Plaza Mall, 2nd Floor, Third District', city: 'New Minya', region: 'Minya', country: 'EG' },
  ],
};

export const OG_IMAGE = `${SITE_URL}/og-image.png`; // FILL_ME: add a 1200x630 image at public/og-image.png
