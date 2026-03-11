import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { TFunction } from '../types';
import { useProducts } from '../hooks/useProducts';

interface ProductDetailsProps {
  t: TFunction;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ t }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, loading } = useProducts();
  
  const product = products.find(p => p.id.toString() === id);

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-32 text-center min-h-[60vh] flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-6 py-32 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">{t('product_not_found')}</h1>
        <Link to="/" className="text-[var(--color-primary)] hover:underline">{t('product_return_home')}</Link>
      </div>
    );
  }

  // Helper to get the correct localized string
  const getLocalizedText = (field?: { en: string; ar: string }, fallbackKey?: string) => {
      const lang = document.documentElement.lang as 'en' | 'ar';
      if (field && field[lang]) return field[lang];
      if (fallbackKey) return t(fallbackKey);
      return '';
  };

  const name = getLocalizedText(product.name, product.nameKey);
  const category = getLocalizedText(product.category, product.categoryKey);
  const description = getLocalizedText(product.description, undefined) || t('product_fallback_desc').replace('{name}', name);

  return (
    <main className="container mx-auto px-6 py-24 md:py-32 min-h-[80vh]">
      <button 
        onClick={() => navigate('/#shop')}
        className="inline-flex items-center gap-2 mb-8 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
        title={t('nav_go_back')}
      >
        <span>&larr;</span> {t('nav_shop')}
      </button>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-[var(--color-secondary)] rounded-3xl overflow-hidden aspect-[4/5] relative shadow-xl"
        >
          <img 
            src={product.imageUrl} 
            alt={`Photo of ${name}`} 
            className="absolute inset-0 w-full h-full object-cover"
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] mb-4">
            {name}
          </h1>
          <p className="text-xl text-[var(--color-primary)] mb-8 font-medium">
            {category}
          </p>
          <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed mb-10">
            {description}
          </p>
          
          <button className="w-full md:w-auto px-10 py-4 bg-[var(--color-primary)] text-white rounded-full font-bold text-lg hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-lg">
            {t('product_inquire_now')}
          </button>
        </motion.div>
      </div>
    </main>
  );
};

export default ProductDetails;
