import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { TFunction } from '../types';
import { Button } from '../components/ui/Button';

const NotFound: React.FC<{ t: TFunction }> = ({ t }) => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 py-24">
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <p className="font-heading text-[var(--color-primary)] text-7xl md:text-8xl font-bold mb-2">404</p>
      <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4">{t('notfound_title') || 'Page not found'}</h1>
      <p className="text-[var(--color-text-secondary)] max-w-md mx-auto mb-8 measure">
        {t('notfound_desc') || 'The page you’re looking for has moved or no longer exists.'}
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link to="/"><Button>{t('product_return_home') || 'Return home'}</Button></Link>
        <Link to="/shop"><Button variant="secondary">{t('nav_shop') || 'Shop'}</Button></Link>
      </div>
    </motion.div>
  </div>
);

export default NotFound;
