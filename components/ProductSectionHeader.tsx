import React from 'react';
import { motion, Variants } from 'framer-motion';
import type { TFunction } from '../types';

const ProductSectionHeader: React.FC<{ t: TFunction; compact?: boolean }> = ({ t, compact }) => {
  const v: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 1, 0.5, 1] } },
  };
  return (
    <motion.div className="text-center w-full" variants={v} initial="hidden" animate="visible">
      <h2 className={`font-heading font-bold text-[var(--color-text-primary)] text-balance transition-all duration-300 ${compact ? 'text-2xl md:text-3xl' : 'text-3xl sm:text-4xl md:text-5xl'}`}>
        {t('products_title')}
      </h2>
      <p
        className={`text-md sm:text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto measure transition-all duration-300 overflow-hidden ${
          compact ? 'mt-0 max-h-0 opacity-0' : 'mt-4 max-h-24 opacity-100'
        }`}
        aria-hidden={compact}
      >
        {t('products_subtitle')}
      </p>
    </motion.div>
  );
};

export default ProductSectionHeader;
