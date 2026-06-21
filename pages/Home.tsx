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
