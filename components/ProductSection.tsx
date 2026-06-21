import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import type { TFunction } from '../types';
import ProductSectionHeader from './ProductSectionHeader';
import { Link } from 'react-router-dom';
import { useCategories } from '../hooks/useCategories';
import { revealItem } from './ui/Reveal';

const CategoryCard: React.FC<{ category: any; t: TFunction; index: number }> = ({ category, t, index }) => {
  const name = t(category.labelKey);
  return (
    <motion.div variants={revealItem}>
      <Link to={`/shop?category=${category.id}`} className="group relative block">
        <div className="zoom-img glow-on-hover relative rounded-[var(--radius-lg)] overflow-hidden bg-[var(--color-secondary)] aspect-[4/5]">
          <img src={category.imageUrl} alt={name} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
          {/* gradient scrim for legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
          {/* gold shine sweep on hover */}
          <div className="absolute inset-0 shine-effect pointer-events-none" />
          {/* index marker */}
          <span className="absolute top-4 start-4 text-white/60 text-xs font-mono tracking-widest">{String(index + 1).padStart(2, '0')}</span>
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
      if (sentinelRef.current) setIsSticky(sentinelRef.current.getBoundingClientRect().top <= headerHeight + 1);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [headerHeight]);

  return (
    <section id="shop" className="relative bg-[var(--color-background)] transition-colors duration-500">
      <div className="relative">
        <div ref={sentinelRef} className="absolute w-full h-px pointer-events-none" />
        <div className={`sticky z-10 transition-all duration-300 ${isSticky ? 'glass-panel shadow-[var(--shadow-sm)]' : ''}`} style={{ top: 'var(--header-height)' }}>
          <div className="container mx-auto px-6 pt-8 pb-4 md:pt-20 md:pb-10">
            <ProductSectionHeader t={t} />
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
              className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 pb-16 sm:pb-20 md:pb-28"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
            >
              {categories.map((cat, i) => (
                <CategoryCard key={cat.id} category={cat} t={t} index={i} />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductSection;
