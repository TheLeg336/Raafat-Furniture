import React from 'react';
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
  useSeo({
    title: 'Raafat Furniture — Handcrafted Luxury Furniture | Egypt, USA & Worldwide',
    description: 'Egyptian-made handcrafted luxury furniture. Shop sofas, bedroom, dining, office and custom pieces in interactive 3D, preview them in your room with AR, and order for pickup or worldwide delivery.',
    path: '/',
  });

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
