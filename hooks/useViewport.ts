import { useEffect, useState } from 'react';
import { BREAKPOINTS, tierFromWidth, type ViewportTier } from '../lib/breakpoints';

export function useViewport(): ViewportTier {
  const [tier, setTier] = useState<ViewportTier>(() =>
    typeof window !== 'undefined' ? tierFromWidth(window.innerWidth) : 'desktop',
  );

  useEffect(() => {
    const mqTablet = window.matchMedia(`(min-width: ${BREAKPOINTS.tablet}px)`);
    const mqDesktop = window.matchMedia(`(min-width: ${BREAKPOINTS.desktop}px)`);

    const update = () => setTier(tierFromWidth(window.innerWidth));
    mqTablet.addEventListener('change', update);
    mqDesktop.addEventListener('change', update);
    update();
    return () => {
      mqTablet.removeEventListener('change', update);
      mqDesktop.removeEventListener('change', update);
    };
  }, []);

  return tier;
}
