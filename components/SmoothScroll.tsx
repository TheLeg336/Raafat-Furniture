import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';

let lenisInstance: Lenis | null = null;

/** Programmatic smooth-scroll to a target (used by in-page anchor nav). */
export function smoothScrollTo(target: number | HTMLElement, offset = 0) {
  if (lenisInstance) lenisInstance.scrollTo(target, { offset });
  else if (typeof target === 'number') window.scrollTo({ top: target, behavior: 'smooth' });
  else target.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Lenis smooth scroll — premium inertia. Disabled when the user prefers reduced
 * motion (falls back to native scrolling). Resets to top on route change.
 */
export const SmoothScroll: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // ease-out-expo
      smoothWheel: true,
      touchMultiplier: 1.4,
    });
    lenisInstance = lenis;

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
    };
  }, []);

  // Scroll to top on route change (but leave hash navigation alone).
  useEffect(() => {
    if (window.location.hash) return;
    if (lenisInstance) lenisInstance.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default SmoothScroll;
