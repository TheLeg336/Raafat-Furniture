import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { isPageReload, scrollToSection, scrollToY, setScrollImpl } from '../lib/scrollNav';

let lenisInstance: Lenis | null = null;

/** Programmatic smooth-scroll to a target (used by in-page anchor nav). */
export function smoothScrollTo(target: number | HTMLElement, offset = 0) {
  if (lenisInstance) {
    if (typeof target === 'number') lenisInstance.scrollTo(target, { offset });
    else {
      const top = target.getBoundingClientRect().top + window.pageYOffset + offset;
      lenisInstance.scrollTo(top);
    }
  } else if (typeof target === 'number') {
    window.scrollTo({ top: target, behavior: 'smooth' });
  } else {
    target.scrollIntoView({ behavior: 'smooth' });
  }
}

/**
 * Lenis smooth scroll — premium inertia. Disabled when the user prefers reduced
 * motion (falls back to native scrolling). Central place for route/hash scroll.
 */
export const SmoothScroll: React.FC = () => {
  const location = useLocation();
  const prev = useRef({ pathname: '', hash: '' });

  useLayoutEffect(() => {
    if (typeof window !== 'undefined') window.history.scrollRestoration = 'manual';
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });
    lenisInstance = lenis;
    setScrollImpl((top, immediate) => {
      lenis.scrollTo(top, { immediate });
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisInstance = null;
      setScrollImpl((top, immediate) => {
        window.scrollTo({ top, behavior: immediate ? 'auto' : 'smooth' });
      });
    };
  }, []);

  // Snap immediately on reload or cross-page hash links (prevents top-then-scroll flash).
  useLayoutEffect(() => {
    const { pathname, hash } = location;
    const hashId = hash ? hash.slice(1) : '';
    const pathChanged = prev.current.pathname !== pathname;

    if (hashId) {
      if (isPageReload() || pathChanged) scrollToSection(hashId, true);
    } else if (pathChanged && prev.current.pathname) {
      scrollToY(0, true);
    }
  }, [location.pathname, location.hash]);

  // Smooth scroll when only the hash changes on the same page (nav clicks).
  useEffect(() => {
    const { pathname, hash } = location;
    const hashId = hash ? hash.slice(1) : '';
    const samePage = prev.current.pathname === pathname;
    const hashChanged = prev.current.hash !== hash;

    if (hashId && samePage && hashChanged && !isPageReload()) {
      scrollToSection(hashId, false);
    }

    prev.current = { pathname, hash };
  }, [location.pathname, location.hash]);

  return null;
};

export default SmoothScroll;
