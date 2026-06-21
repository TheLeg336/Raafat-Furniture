import React from 'react';
import { motion, Variants } from 'framer-motion';
import type { TFunction } from '../types';

const ProductSectionHeader: React.FC<{ t: TFunction }> = ({ t }) => {
  const v: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 1, 0.5, 1] } },
  };
  return (
    <motion.div className="text-center" variants={v} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }}>
      <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] text-balance">
        {t('products_title')}
      </h2>
      <p className="text-md sm:text-lg text-[var(--color-text-secondary)] mt-4 max-w-2xl mx-auto measure">
        {t('products_subtitle')}
      </p>
    </motion.div>
  );
};

export default ProductSectionHeader;
