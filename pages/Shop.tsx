import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, SlidersHorizontal, X } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { CATEGORIES, TEXTS } from '../constants';
import type { TFunction } from '../types';

interface ShopProps {
  t: TFunction;
}

const Shop: React.FC<ShopProps> = ({ t }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const categoryId = searchParams.get('category');
  const searchQuery = searchParams.get('q') || '';
  const { products, loading } = useProducts();
  
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('relevance'); // relevance, price_asc, price_desc
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedColor, setSelectedColor] = useState<string>('all');

  const MOCK_COLORS = ['black', 'white', 'brown', 'grey', 'beige', 'blue'];

  const getCategoryObj = (catId: string | null) => {
    if (!catId) return null;
    for (const cat of CATEGORIES) {
      if (cat.id === catId) return cat;
      if (cat.subCategories) {
        const sub = cat.subCategories.find(s => s.id === catId);
        if (sub) return sub;
      }
    }
    return null;
  };

  const category = getCategoryObj(categoryId);
  const hasSubCategories = category?.subCategories && category.subCategories.length > 0;
  
  const isSearchMode = !!searchQuery;
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() });
    }
  };

  const filteredProducts = useMemo(() => {
    let result = [];

    if (isSearchMode) {
      const query = searchQuery.toLowerCase().trim();
      const queryWords = query.split(/\s+/).filter(w => w.length > 1);

      result = products.map(p => {
        let score = 0;
        const nameEn = p.name?.en?.toLowerCase() || '';
        const nameAr = p.name?.ar?.toLowerCase() || '';
        const descEn = p.description?.en?.toLowerCase() || '';
        const descAr = p.description?.ar?.toLowerCase() || '';
        
        // Find category labels to match against
        const catObj = getCategoryObj(p.categoryKey || null);
        const catLabelEn = catObj ? (TEXTS.en[catObj.labelKey] || '').toLowerCase() : '';
        const catLabelAr = catObj ? (TEXTS.ar[catObj.labelKey] || '').toLowerCase() : '';
        
        let parentCatLabelEn = '';
        let parentCatLabelAr = '';
        for (const cat of CATEGORIES) {
          if (cat.subCategories?.some(s => s.id === p.categoryKey)) {
            parentCatLabelEn = (TEXTS.en[cat.labelKey] || '').toLowerCase();
            parentCatLabelAr = (TEXTS.ar[cat.labelKey] || '').toLowerCase();
            break;
          }
        }
        
        // Exact matches
        if (nameEn.includes(query) || nameAr.includes(query)) score += 10;
        if (catLabelEn.includes(query) || parentCatLabelEn.includes(query) || catLabelAr.includes(query) || parentCatLabelAr.includes(query)) score += 8;
        if (descEn.includes(query) || descAr.includes(query)) score += 5;

        // Fuzzy/Word matches
        queryWords.forEach(word => {
          if (nameEn.includes(word) || nameAr.includes(word)) score += 3;
          if (catLabelEn.includes(word) || parentCatLabelEn.includes(word) || catLabelAr.includes(word) || parentCatLabelAr.includes(word)) score += 2;
          if (descEn.includes(word) || descAr.includes(word)) score += 1;
        });

        return { ...p, score };
      }).filter(p => p.score > 0);

      // Sort by relevance initially
      if (sortBy === 'relevance') {
        result.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          // Sort by subcategory if applicable
          return (a.categoryKey || '').localeCompare(b.categoryKey || '');
        });
      }
    } else {
      result = products.filter(p => p.categoryKey === categoryId);
    }

    // Apply Price Filter
    if (priceRange[1] < 10000) {
      result = result.filter(p => !p.price || (p.price >= priceRange[0] && p.price <= priceRange[1]));
    }

    // Apply Color Filter
    if (selectedColor !== 'all') {
      result = result.filter(p => p.colors?.includes(selectedColor));
    }

    // Apply Sorting
    if (sortBy === 'price_asc') {
      result.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => (b.price || 0) - (a.price || 0));
    }

    return result;
  }, [products, isSearchMode, searchQuery, categoryId, sortBy, priceRange, selectedColor]);

  React.useEffect(() => {
    window.scrollTo(0, 0);
    setSearchInput(searchQuery || '');
  }, [categoryId, searchQuery]);

  if (!category && !isSearchMode) {
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
    <div className="min-h-screen bg-[var(--color-background)] pt-12">
      {/* Category or Search Header */}
      {isSearchMode ? (
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full mb-2">
              <Search className="absolute start-4 text-[var(--color-text-secondary)]" size={20} />
              <input 
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('search_placeholder')}
                className="w-full bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/20 text-[var(--color-text-primary)] rounded-full py-4 ps-12 pe-4 outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
              />
              {searchInput && (
                <button 
                  type="button" 
                  onClick={() => setSearchInput('')}
                  className="absolute end-4 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                >
                  <X size={20} />
                </button>
              )}
            </form>
            
            <div className="flex items-center justify-between border-b border-[var(--color-secondary)]/10 pb-2">
              <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">
                {t('search_results_for')} {searchQuery}
              </h1>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${showFilters ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-secondary)]/10 text-[var(--color-text-primary)] hover:bg-[var(--color-secondary)]/20'}`}
              >
                <SlidersHorizontal size={18} />
                <span className="hidden sm:inline">Filters</span>
              </button>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="py-6 grid grid-cols-1 sm:grid-cols-3 gap-6 border-b border-[var(--color-secondary)]/10">
                    {/* Sort By */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Sort By</label>
                      <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full bg-transparent border border-[var(--color-secondary)]/30 rounded-xl px-4 py-2 text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                      >
                        <option value="relevance">Relevance</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                      </select>
                    </div>
                    {/* Color Filter */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Color</label>
                      <select 
                        value={selectedColor}
                        onChange={(e) => setSelectedColor(e.target.value)}
                        className="w-full bg-transparent border border-[var(--color-secondary)]/30 rounded-xl px-4 py-2 text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] capitalize"
                      >
                        <option value="all">All Colors</option>
                        {MOCK_COLORS.map(color => (
                          <option key={color} value={color}>{color}</option>
                        ))}
                      </select>
                    </div>
                    {/* Price Range */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Max Price: ${priceRange[1]}</label>
                      <input 
                        type="range" 
                        min="0" 
                        max="10000" 
                        step="100"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                        className="w-full accent-[var(--color-primary)]"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="relative h-[40vh] md:h-[50vh] overflow-hidden mb-12">
          <img 
            src={category?.imageUrl} 
            alt={category ? t(category.labelKey) : ''} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
          
          {/* Back Button */}
          <button 
            onClick={() => {
              let parentId = null;
              for (const cat of CATEGORIES) {
                if (cat.subCategories?.some(s => s.id === categoryId)) {
                  parentId = cat.id;
                  break;
                }
              }
              if (parentId) {
                navigate(`/shop?category=${parentId}`);
              } else {
                navigate('/#shop');
              }
            }}
            className="absolute top-6 start-6 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md transition-colors z-50"
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
              {category ? t(category.labelKey) : ''}
            </motion.h1>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="w-24 h-1 bg-[var(--color-primary)] rounded-full"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="container mx-auto px-6 pb-16 pt-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-primary)]"></div>
          </div>
        ) : hasSubCategories && !isSearchMode ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-12">
            {category.subCategories?.map((subCat, index) => (
              <motion.div
                key={subCat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.03, y: -8 }}
                onClick={() => navigate(`/shop?category=${subCat.id}`)}
                className="relative group text-center flex flex-col h-full cursor-pointer"
              >
                <div className="bg-[var(--color-secondary)] rounded-3xl overflow-hidden mb-4 transition-shadow duration-300 hover:shadow-xl aspect-[4/5] w-full relative">
                  <img 
                    src={subCat.imageUrl} 
                    alt={t(subCat.labelKey)} 
                    className="absolute inset-0 w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300"></div>
                </div>
                <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-auto">
                  {t(subCat.labelKey)}
                </h3>
              </motion.div>
            ))}
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
                onClick={() => navigate(`/product/${product.id}`)}
                className="relative group text-center flex flex-col h-full cursor-pointer"
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
                {category && (
                  <p className="text-md text-[var(--color-text-secondary)]">
                    {t(category.labelKey)}
                  </p>
                )}
                {isSearchMode && product.price && (
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <p className="text-sm font-medium text-[var(--color-primary)]">
                      ${product.price}
                    </p>
                    {product.colors && product.colors.length > 0 && (
                      <span className="text-xs text-[var(--color-text-secondary)] capitalize">
                        • {product.colors[0]}
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-4">
              {isSearchMode ? `${t('search_no_results')} ${searchQuery}` : t('shop_artisans_work')}
            </h2>
            <p className="text-[var(--color-text-secondary)] max-w-md mx-auto">
              {isSearchMode ? '' : t('shop_curating_desc')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
