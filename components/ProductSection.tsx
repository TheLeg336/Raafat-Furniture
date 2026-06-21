import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import type { TFunction } from '../types';
import ProductSectionHeader from './ProductSectionHeader';
import { Link } from 'react-router-dom';
import { useCategories } from '../hooks/useCategories';
import { revealItem } from './ui/Reveal';
import { Button } from './ui/Button';

const CategoryCard: React.FC<{ category: any; t: TFunction }> = ({ category, t }) => {
  const name = t(category.labelKey);
  return (
    <motion.div variants={revealItem}>
      <Link to={`/shop?category=${category.id}`} className="group relative block">
        <div className="zoom-img glow-on-hover relative rounded-[var(--radius-lg)] overflow-hidden bg-[var(--color-secondary)] aspect-[4/5]">
          <img src={category.imageUrl} alt={name} loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }} className="absolute inset-0 w-full h-full object-cover" />
          {/* gradient scrim for legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
          {/* gold shine sweep on hover */}
          <div className="absolute inset-0 shine-effect pointer-events-none" />
          {/* label */}
          <div className="absolute inset-x-0 bottom-0 p-5 flex items-end justify-between">
            <h3 className="font-heading text-2xl font-bold text-white drop-shadow-sm translate-y-1 group-hover:translate-y-0 transition-transform">{name}</h3>
            <span className="shrink-0 w-9 h-9 rounded-full bg-[var(--color-primary)] text-[var(--color-ink-on-gold)] flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all rtl:rotate-[-90deg]">
              <ArrowUpRight size={18} />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const ProductSection: React.FC<{ t: TFunction; headerHeight: number }> = ({ t, headerHeight }) => {
  const { categories, loading } = useCategories();
  const [isSticky, setIsSticky] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      // Frost once the heading reaches the very top of the viewport.
      if (sentinelRef.current) setIsSticky(sentinelRef.current.getBoundingClientRect().top <= 1);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [headerHeight]);

  return (
    <section id="shop" className="relative bg-[var(--color-background)] transition-colors duration-500">
      <div className="relative">
        <div ref={sentinelRef} className="absolute w-full h-px pointer-events-none" />
        {/* Sticks to the very top of the screen and frosts into glass while the section scrolls. */}
        <div
          className={`sticky top-0 transition-all duration-300 ${isSticky ? 'glass-panel shadow-[var(--shadow-md)]' : ''}`}
          style={{ zIndex: 90 }}
        >
          <div className={`container mx-auto px-6 transition-all duration-300 ${isSticky ? 'py-4 md:py-5' : 'pt-8 pb-4 md:pt-20 md:pb-10'}`}>
            <ProductSectionHeader t={t} compact={isSticky} />
          </div>
        </div>

        <div className="container mx-auto px-6 mt-4 md:mt-8">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 pb-16">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] rounded-[var(--radius-lg)] bg-[var(--color-surface-2)] shimmer" />
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 pb-10"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
            >
              {categories.map((cat) => (
                <CategoryCard key={cat.id} category={cat} t={t} />
              ))}
            </motion.div>
          )}

          <div className="flex justify-center pb-20 sm:pb-24 md:pb-28">
            <Link to="/shop">
              <Button size="lg">{t('explore_collections') || 'Explore the collections'}</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductSection;
