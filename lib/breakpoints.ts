/** Viewport tiers — desktop layout is unchanged at lg (1024px+). */
export const BREAKPOINTS = {
  tablet: 768,
  desktop: 1024,
} as const;

export type ViewportTier = 'mobile' | 'tablet' | 'desktop';

export function tierFromWidth(width: number): ViewportTier {
  if (width >= BREAKPOINTS.desktop) return 'desktop';
  if (width >= BREAKPOINTS.tablet) return 'tablet';
  return 'mobile';
}

/** Tailwind visibility helpers (Play CDN — use in className strings). */
export const onlyMobile = 'md:hidden';
export const onlyTablet = 'hidden md:flex lg:hidden';
export const onlyDesktop = 'hidden lg:block';

/** Product grid density per tier */
export const productGridCols = 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
export const categoryGridCols = 'grid-cols-2 md:grid-cols-2 lg:grid-cols-3';
export const homeCategoryGridCols = 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
