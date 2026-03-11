import React from 'react';
import { motion, Variants } from 'framer-motion';
import type { TFunction } from '../types';

interface VisitUsSectionProps {
  t: TFunction;
}

const VisitUsSection: React.FC<VisitUsSectionProps> = ({ t }) => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.3, delayChildren: 0.2 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] },
    },
  };

  return (
    <section id="visit-us" className="bg-[var(--color-background)] py-16 sm:py-20 md:py-28 transition-colors duration-500">
      <motion.div
        className="container mx-auto px-6 text-center max-w-4xl"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.h2 variants={itemVariants} className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] mb-6">
          {t('visit_us_title')}
        </motion.h2>
        <motion.p variants={itemVariants} className="text-md sm:text-lg text-[var(--color-text-secondary)] leading-relaxed">
          {t('visit_us_p1')}
        </motion.p>
      </motion.div>
    </section>
  );
};

export default VisitUsSection;