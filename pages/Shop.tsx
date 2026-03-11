import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { CATEGORIES } from '../constants';
import type { TFunction } from '../types';

interface ShopProps {
  t: TFunction;
}

const Shop: React.FC<ShopProps> = ({ t }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const categoryId = searchParams.get('category');
  const { products, loading } = useProducts();

  const category = CATEGORIES.find(c => c.id === categoryId);
  const filteredProducts = products.filter(p => p.categoryKey === categoryId);

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [categoryId]);

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="text-center">
          <p className="text-[var(--color-text-secondary)] mb-6">{t('shop_not_found')}</p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-[var(--color-primary)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            {t('shop_return_home')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Category Hero */}
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        <img 
          src={category.imageUrl} 
          alt={t(category.labelKey)} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
        
        {/* Back Button */}
        <button 
          onClick={() => navigate('/#shop')}
          className="absolute top-6 left-6 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md transition-colors z-50"
          title={t('nav_go_back')}
        >
          <span className="block"><ArrowLeft size={20} /></span>
        </button>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold text-white mb-4 font-heading"
          >
            {t(category.labelKey)}
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="w-24 h-1 bg-[var(--color-primary)] rounded-full"
          />
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-16">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-primary)]"></div>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-12">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.03, y: -8 }}
                className="relative group text-center flex flex-col h-full"
              >
                <div className="bg-[var(--color-secondary)] rounded-3xl overflow-hidden mb-4 transition-shadow duration-300 hover:shadow-xl aspect-[4/5] w-full relative">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name?.en} 
                    className="absolute inset-0 w-full h-full object-cover" 
                  />
                </div>
                <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-auto">
                  {document.documentElement.lang === 'ar' ? product.name?.ar : product.name?.en}
                </h3>
                <p className="text-md text-[var(--color-text-secondary)]">
                  {t(category.labelKey)}
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-4">
              {t('shop_artisans_work')}
            </h2>
            <p className="text-[var(--color-text-secondary)] max-w-md mx-auto">
              {t('shop_curating_desc')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
