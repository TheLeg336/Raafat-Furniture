import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { TFunction } from '../types';
import Hero from '../components/Hero';
import ProductSection from '../components/ProductSection';
import VisitUsSection from '../components/VisitUsSection';

interface HomeProps {
  t: TFunction;
  headerHeight: number;
}

const Home: React.FC<HomeProps> = ({ t, headerHeight }) => {
  const location = useLocation();

  useEffect(() => {
    const sections = ['hero', 'shop', 'visit-us', 'contact'];
    const observerOptions = {
      root: null,
      rootMargin: `-${headerHeight}px 0px 0px 0px`,
      threshold: 0.5,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          if (id && location.hash !== `#${id}`) {
            // Update hash without triggering a full navigation scroll
            window.history.replaceState(null, '', `#${id}`);
          }
        }
      });
    }, observerOptions);

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headerHeight, location.hash]);

  return (
    <main>
      <div id="hero">
        <Hero t={t} />
      </div>
      <ProductSection t={t} headerHeight={headerHeight} />
      <div id="visit-us">
        <VisitUsSection t={t} />
      </div>
    </main>
  );
};

export default Home;
