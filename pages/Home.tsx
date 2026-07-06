import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { TFunction } from '../types';
import Hero from '../components/Hero';
import ProductSection from '../components/ProductSection';
import VisitUsSection from '../components/VisitUsSection';
import { useSeo } from '../lib/seo';

interface HomeProps {
  t: TFunction;
  headerHeight: number;
}

const Home: React.FC<HomeProps> = ({ t, headerHeight }) => {
  const location = useLocation();
  useSeo({
    title: 'Raafat Furniture — Handcrafted Luxury Furniture | Egypt, USA & Worldwide',
    description: 'Egyptian-made handcrafted luxury furniture. Shop sofas, bedroom, dining, office and custom pieces in interactive 3D, preview them in your room with AR, and order for pickup or worldwide delivery.',
    path: '/',
  });

  const hasScrolledOnMount = React.useRef(false);

  useEffect(() => {
    if (location.hash && !hasScrolledOnMount.current) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        // If it's hero, we just want to be at the top
        const targetTop = id === 'hero' ? 0 : element.offsetTop - headerHeight;
        
        // Only scroll if we are not already at the target (with some tolerance)
        if (Math.abs(window.scrollY - targetTop) > 10) {
          setTimeout(() => {
            window.scrollTo({
              top: targetTop,
              behavior: 'smooth'
            });
          }, 100);
        }
        hasScrolledOnMount.current = true;
      }
    }
  }, [location.hash, headerHeight]);

  return (
    <main>
      <div id="hero">
        <Hero t={t} />
      </div>
      <ProductSection t={t} headerHeight={headerHeight} />
      <VisitUsSection t={t} />
    </main>
  );
};

export default Home;
