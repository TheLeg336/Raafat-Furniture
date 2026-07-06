/** Shared scroll helpers for route + hash navigation. */

export function getHeaderHeight(): number {
  const header = document.querySelector('header');
  if (!header) return 0;
  const pos = window.getComputedStyle(header).position;
  if (pos === 'sticky' || pos === 'fixed') return header.offsetHeight;
  return 0;
}

export function getScrollTopForId(id: string): number {
  if (!id || id === 'hero') return 0;
  const el = document.getElementById(id);
  if (!el) return 0;
  return Math.max(0, el.getBoundingClientRect().top + window.pageYOffset - getHeaderHeight());
}

export function isPageReload(): boolean {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  return nav?.type === 'reload';
}

export type ScrollImmediateFn = (top: number, immediate: boolean) => void;

let scrollImpl: ScrollImmediateFn = (top, immediate) => {
  window.scrollTo({ top, behavior: immediate ? 'auto' : 'smooth' });
};

/** Lenis registers here so hash navigation uses the same scroll engine. */
export function setScrollImpl(fn: ScrollImmediateFn) {
  scrollImpl = fn;
}

export function scrollToY(top: number, immediate: boolean) {
  scrollImpl(top, immediate);
}

export function scrollToSection(id: string, immediate: boolean) {
  scrollToY(getScrollTopForId(id), immediate);
}
