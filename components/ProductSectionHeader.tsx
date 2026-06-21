import React from 'react';
import { motion, Variants } from 'framer-motion';
import type { TFunction } from '../types';

interface ProductSectionHeaderProps {
  t: TFunction;
}

const ProductSectionHeader: React.FC<ProductSectionHeaderProps> = ({ t }) => {
  const headerVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] } }
  };

  return (
    <motion.div
      className="text-center"
      variants={headerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.5 }}
    >
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-text-primary)]">
        {t('products_title')}
      </h2>
      <p className="text-md sm:text-lg text-[var(--color-text-secondary)] mt-4 max-w-2xl mx-auto">
        {t('products_subtitle')}
      </p>
    </motion.div>
  );
};

export default ProductSectionHeader;