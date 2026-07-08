import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { isPageReload, scrollToSection, scrollToY, setScrollImpl } from '../lib/scrollNav';

/** Programmatic smooth-scroll (native — Lenis removed to fix desktop wheel scroll). */
export function smoothScrollTo(target: number | HTMLElement, _offset = 0) {
  if (typeof target === 'number') {
    window.scrollTo({ top: target, behavior: 'smooth' });
  } else {
    target.scrollIntoView({ behavior: 'smooth' });
  }
}

/**
 * Hash navigation helpers only — native document scroll everywhere so mouse
 * wheel and trackpad work reliably on desktop.
 */
export const SmoothScroll: React.FC = () => {
  const location = useLocation();
  const prev = useRef({ pathname: '', hash: '' });

  useLayoutEffect(() => {
    if (typeof window !== 'undefined') window.history.scrollRestoration = 'manual';
    setScrollImpl((top, immediate) => {
      window.scrollTo({ top, behavior: immediate ? 'auto' : 'smooth' });
    });
  }, []);

  useLayoutEffect(() => {
    const { pathname, hash } = location;
    const hashId = hash ? hash.slice(1) : '';
    const pathChanged = prev.current.pathname !== pathname;

    if (hashId) {
      if (isPageReload() || (pathChanged && prev.current.pathname)) {
        scrollToSection(hashId, true);
      }
    } else if (pathChanged && prev.current.pathname) {
      scrollToY(0, true);
    }
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const { pathname, hash } = location;
    const hashId = hash ? hash.slice(1) : '';
    const samePage = prev.current.pathname === pathname;
    const hashChanged = prev.current.hash !== hash;

    // Same-page hash changes (including first hash from empty) — one smooth scroll owner.
    if (hashId && samePage && hashChanged && !isPageReload()) {
      scrollToSection(hashId, false);
    }

    prev.current = { pathname, hash };
  }, [location.pathname, location.hash]);

  return null;
};

export default SmoothScroll;
