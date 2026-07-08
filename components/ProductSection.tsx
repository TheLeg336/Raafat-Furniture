import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import type { Category, TFunction } from '../types';
import ProductSectionHeader from './ProductSectionHeader';
import { Link } from 'react-router-dom';
import { useVisibleCategories } from '../hooks/useVisibleCategories';
import { getCategoryLabel } from '../lib/categoryUtils';
import { revealItem } from './ui/Reveal';
import { Button } from './ui/Button';
import { homeCategoryGridCols } from '../lib/breakpoints';

const CategoryCard: React.FC<{ category: Category; t: TFunction }> = ({ category, t }) => {
  const name = getCategoryLabel(category, t);
  return (
    <motion.div variants={revealItem}>
      <Link to={`/shop?category=${category.id}`} className="group relative block">
        <div className="zoom-img glow-on-hover relative rounded-[var(--radius-lg)] overflow-hidden bg-[var(--color-secondary)] aspect-[4/5]">
          <img src={category.imageUrl} alt={name} loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 shine-effect pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 p-5 flex items-end justify-between">
            <h3 className="font-heading text-lg md:text-xl lg:text-2xl font-bold text-white drop-shadow-sm translate-y-1 group-hover:translate-y-0 transition-transform">{name}</h3>
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
  const { categories, loading } = useVisibleCategories();
  const featured = useMemo(() => categories, [categories]);

  // headerHeight kept for API compatibility with Home; sticky snap removed (was causing
  // "clip to section" jumps when scrolling near Featured Collections).
  void headerHeight;

  return (
    <section id="shop" className="relative bg-[var(--color-background)] transition-colors duration-500" style={{ overflowAnchor: 'none' }}>
      <div className="relative">
        <div className="container mx-auto px-5 md:px-8 lg:px-6 min-h-[5.5rem] md:min-h-[6.5rem] flex items-center py-4 md:py-5">
          <ProductSectionHeader t={t} compact={false} />
        </div>

        <div className="container mx-auto px-5 md:px-8 lg:px-6 mt-3 md:mt-6 lg:mt-8">
          {loading ? (
            <div className={`grid ${homeCategoryGridCols} gap-4 md:gap-6 lg:gap-8 pb-12 md:pb-14 lg:pb-16`}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] rounded-[var(--radius-lg)] bg-[var(--color-surface-2)] shimmer" />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <p className="text-center text-[var(--color-text-secondary)] pb-16">{t('shop_curating_desc') || 'New collections are on their way.'}</p>
          ) : (
            <motion.div
              className={`grid ${homeCategoryGridCols} gap-4 md:gap-6 lg:gap-8 pb-8 md:pb-10`}
              initial="hidden"
              animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
            >
              {featured.map((cat) => (
                <CategoryCard key={cat.id} category={cat} t={t} />
              ))}
            </motion.div>
          )}

          <div className="flex justify-center pb-16 max-md:pb-20 md:pb-24 lg:pb-28">
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
