import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, SlidersHorizontal, X, Heart } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useVisibleCategories } from '../hooks/useVisibleCategories';
import { findCategory, getCategoryLabel, getCategorySearchText, findParentCategory, isCategoryVisible, productMatchesCategory } from '../lib/categoryUtils';
import { TEXTS } from '../constants';
import type { TFunction } from '../types';
import { useStore } from '../contexts/StoreContext';
import { formatMoney } from '../lib/format';
import { useCurrency } from '../contexts/CurrencyContext';
import { priceFor } from '../lib/currency';
import { useSeo } from '../lib/seo';
import { productGridCols, categoryGridCols } from '../lib/breakpoints';

interface ShopProps {
  t: TFunction;
}

const Shop: React.FC<ShopProps> = ({ t }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const categoryId = searchParams.get('category');
  const searchQuery = searchParams.get('q') || '';
  const { products, loading: productsLoading } = useProducts();
  const { categories: visibleCategories, allCategories, productCategoryIds, loading: categoriesLoading } = useVisibleCategories();
  const loading = productsLoading || categoriesLoading;
  const { wishlist, toggleWishlist, addToCart } = useStore();
  const { currency } = useCurrency();
  useSeo({
    title: 'Shop Luxury Furniture — Sofas, Bedroom, Dining & Custom | Raafat Furniture',
    description: 'Browse Raafat Furniture: handcrafted sofas, armchairs, bedroom, dining, office and custom pieces. View in 3D, preview in your room with AR, and order for pickup or worldwide delivery.',
    path: '/shop',
  });

  const [searchInput, setSearchInput] = useState(searchQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('relevance'); // relevance, price_asc, price_desc
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedColor, setSelectedColor] = useState<string>('all');

  const availableColors = useMemo(
    () => Array.from(new Set(products.flatMap(p => p.colors || []))).slice(0, 12),
    [products],
  );

  const getCategoryObj = (catId: string | null) => findCategory(allCategories, catId);

  const isSearchMode = !!searchQuery.trim();
  const isBrowseMode = !isSearchMode && !categoryId;

  const category = categoryId ? getCategoryObj(categoryId) : null;
  const catalogParent = categoryId ? visibleCategories.find((c) => c.id === categoryId) : null;
  const visibleSubs = catalogParent?.subCategories ?? [];
  const hasSubCategories = visibleSubs.length > 0 && !isSearchMode;
  const parentCategory = category && !hasSubCategories
    ? visibleCategories.find((c) => c.subCategories?.some((s) => s.id === category.id)) ?? null
    : null;
  const showCategoryHero = !!categoryId && !!category && !isSearchMode;

  const openCategory = (id: string) => setSearchParams({ category: id });
  const openSearch = (q: string) => setSearchParams(q.trim() ? { q: q.trim() } : {});
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) openSearch(searchInput);
    else setSearchParams({});
  };

  const searchResultsBeforeFilters = useMemo(() => {
    let result = [];

    if (isSearchMode) {
      const query = searchQuery.toLowerCase().trim();

      result = products.map(p => {
        let score = 0;
        const nameEn = p.name?.en?.toLowerCase() || '';
        const nameAr = p.name?.ar?.toLowerCase() || '';
        const descEn = p.description?.en?.toLowerCase() || '';
        const descAr = p.description?.ar?.toLowerCase() || '';
        
        // Find category labels to match against
        const catObj = getCategoryObj(p.categoryKey || null);
        const catSearchText = catObj ? getCategorySearchText(catObj, TEXTS) : '';
        const parentCat = p.categoryKey ? findParentCategory(allCategories, String(p.categoryKey)) : null;
        const parentSearchText = parentCat ? getCategorySearchText(parentCat, TEXTS) : '';
        
        // Exact / phrase matches
        if (nameEn.includes(query) || nameAr.includes(query)) score += 10;
        if (catSearchText.includes(query) || parentSearchText.includes(query)) score += 8;
        if (descEn.includes(query) || descAr.includes(query)) score += 5;

        const queryWords = query.split(/\s+/).filter((w) => w.length > 0);
        queryWords.forEach((word) => {
          if (word.length < 2) return;
          if (nameEn.includes(word) || nameAr.includes(word)) score += 3;
          if (catSearchText.includes(word) || parentSearchText.includes(word)) score += 2;
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
    } else if (categoryId) {
      result = products.filter((p) => productMatchesCategory(p, categoryId, allCategories, productCategoryIds));
    } else {
      result = [...products];
    }
    return result;
  }, [products, isSearchMode, searchQuery, categoryId, sortBy, allCategories, productCategoryIds]);

  const filteredProducts = useMemo(() => {
    let result = [...searchResultsBeforeFilters];

    // Apply Price Filter
    if (priceRange[1] < 10000) {
      result = result.filter(p => { const pr = priceFor(p, currency); return pr == null || (pr >= priceRange[0] && pr <= priceRange[1]); });
    }

    // Apply Color Filter
    if (selectedColor !== 'all') {
      result = result.filter(p => p.colors?.includes(selectedColor));
    }

    // Apply Sorting
    if (sortBy === 'price_asc') {
      result.sort((a, b) => (priceFor(a, currency) || 0) - (priceFor(b, currency) || 0));
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => (priceFor(b, currency) || 0) - (priceFor(a, currency) || 0));
    }

    return result;
  }, [searchResultsBeforeFilters, sortBy, priceRange, selectedColor, currency]);

  // Reset view + filters whenever the category or search changes, so switching
  // between categories never carries stale filters into the next one.
  React.useEffect(() => {
    window.scrollTo(0, 0);
    setSearchInput(searchQuery || '');
    setSelectedColor('all');
    setPriceRange([0, 10000]);
    setSortBy('relevance');
    setShowFilters(false);
  }, [categoryId, searchQuery]);

  // Drop invalid or empty category URLs once catalog + products have loaded.
  React.useEffect(() => {
    if (!categoryId || loading || isSearchMode) return;
    if (!getCategoryObj(categoryId) || !isCategoryVisible(categoryId, visibleCategories)) {
      navigate('/shop', { replace: true });
    }
  }, [categoryId, loading, isSearchMode, visibleCategories, allCategories, navigate]);

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Category or Search Header */}
      {!showCategoryHero ? (
        <div className="container mx-auto px-6 mb-4 md:mb-8 pt-4 md:pt-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-base md:text-2xl font-bold text-[var(--color-text-primary)] mb-4 md:mb-6 font-heading">
              {isSearchMode ? (
                <>{t('search_results_for')} <span className="text-[var(--color-primary)]">{searchQuery}</span></>
              ) : (
                <>{t('nav_shop')}</>
              )}
            </h1>
            
            <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full mb-4 md:mb-6 group">
              <button 
                type="submit"
                className="absolute start-4 text-[var(--color-primary)] group-focus-within:scale-110 transition-transform hover:text-[var(--color-primary)] z-10"
                aria-label={t('nav_shop')}
              >
                <Search size={20} />
              </button>
              <input 
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('search_placeholder')}
                className="w-full bg-[var(--color-surface-2)] text-[var(--color-text-primary)] rounded-full py-3 md:py-4 ps-12 pe-12 outline-none focus-visible:outline-none transition-shadow placeholder:text-[var(--color-text-secondary)] focus:shadow-[0_0_0_2px_hsla(var(--color-primary-hsl-values),0.5)]"
              />
              {searchInput && (
                <button 
                  type="button" 
                  onClick={() => { setSearchInput(''); setSearchParams({}); }}
                  className="absolute end-4 p-1 rounded-full hover:bg-[var(--color-primary)]/10 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-all"
                >
                  <X size={18} />
                </button>
              )}
            </form>

            {/* Mobile-only filter toggle */}
            <div className="md:hidden flex justify-end mb-4">
               <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${showFilters ? 'bg-[var(--color-primary)] text-[var(--color-ink-on-gold)]' : 'bg-[var(--color-secondary)]/10 text-[var(--color-text-primary)] hover:bg-[var(--color-secondary)]/20'}`}
              >
                <SlidersHorizontal size={18} />
                <span className="text-sm font-medium">Filters</span>
              </button>
            </div>
            
            {/* Mobile-only expandable filters */}
            <div className="md:hidden">
              <AnimatePresence>
                {showFilters && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mb-8"
                  >
                    <div className="py-6 grid grid-cols-1 sm:grid-cols-2 gap-8">
                      {/* Sort By */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-secondary)] opacity-60">Sort By</label>
                        <div className="flex flex-wrap gap-2">
                          {['relevance', 'price_asc', 'price_desc'].map((option) => (
                            <button
                              key={option}
                              onClick={() => setSortBy(option)}
                              className={`px-4 py-2 rounded-xl text-xs transition-all ${sortBy === option ? 'bg-[var(--color-primary)] text-[var(--color-ink-on-gold)] shadow-md' : 'bg-[var(--color-secondary)]/5 text-[var(--color-text-secondary)] hover:bg-[var(--color-secondary)]/10'}`}
                            >
                              {option === 'relevance' ? 'Relevance' : option === 'price_asc' ? 'Price: Low to High' : 'Price: High to Low'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Color Filter */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-secondary)] opacity-60">Color</label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setSelectedColor('all')}
                            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${selectedColor === 'all' ? 'bg-[var(--color-primary)] border-transparent text-[var(--color-ink-on-gold)] shadow-md' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'}`}
                          >
                            All
                          </button>
                          {availableColors.map(color => (
                            <button
                              key={color}
                              onClick={() => setSelectedColor(color)}
                              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border capitalize ${selectedColor === color ? 'bg-[var(--color-primary)] border-transparent text-[var(--color-ink-on-gold)] shadow-md' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'}`}
                            >
                              {color}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Price Range */}
                      <div className="space-y-3 sm:col-span-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-secondary)] opacity-60">Price Range</label>
                          <span className="text-sm font-bold text-[var(--color-primary)]">{new Intl.NumberFormat(document.documentElement.lang === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(priceRange[0])} - {new Intl.NumberFormat(document.documentElement.lang === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(priceRange[1])}</span>
                        </div>
                        <div className="relative h-6 flex items-center">
                          <div className="absolute w-full h-1.5 bg-[var(--color-secondary)]/20 rounded-lg"></div>
                          <div 
                            className="absolute h-1.5 bg-[var(--color-primary)] rounded-lg"
                            style={{ 
                              left: `${(priceRange[0] / 10000) * 100}%`, 
                              right: `${100 - (priceRange[1] / 10000) * 100}%` 
                            }}
                          ></div>
                          <input 
                            type="range" 
                            min="0" 
                            max="10000" 
                            step="100"
                            value={priceRange[0]}
                            onChange={(e) => {
                              const val = Math.min(parseInt(e.target.value), priceRange[1] - 100);
                              setPriceRange([val, priceRange[1]]);
                            }}
                            className="absolute w-full appearance-none bg-transparent pointer-events-none z-10 
                              [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--color-primary)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md
                              [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[var(--color-primary)] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-none"
                          />
                          <input 
                            type="range" 
                            min="0" 
                            max="10000" 
                            step="100"
                            value={priceRange[1]}
                            onChange={(e) => {
                              const val = Math.max(parseInt(e.target.value), priceRange[0] + 100);
                              setPriceRange([priceRange[0], val]);
                            }}
                            className="absolute w-full appearance-none bg-transparent pointer-events-none z-10 
                              [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--color-primary)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md
                              [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[var(--color-primary)] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-none"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="relative h-[30vh] md:h-[40vh] overflow-hidden mb-12">
            <img 
              src={category.imageUrl} 
              alt={getCategoryLabel(category, t)} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
            
            {/* Back Button */}
            <button 
              onClick={() => {
                if (parentCategory) {
                  openCategory(parentCategory.id);
                } else {
                  navigate('/shop');
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
                {getCategoryLabel(category, t)}
              </motion.h1>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="w-24 h-1 bg-[var(--color-primary)] rounded-full mb-6"
              />
              
              {/* Mobile Filter Toggle for Category */}
              {!hasSubCategories && (
                <div className="md:hidden">
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full transition-colors backdrop-blur-md ${showFilters ? 'bg-[var(--color-primary)] text-[var(--color-ink-on-gold)]' : 'bg-black/30 text-white hover:bg-black/50 '}`}
                  >
                    <SlidersHorizontal size={18} />
                    <span className="text-sm font-medium">Filters</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile Expandable Filters for Category */}
          {category && !hasSubCategories && (
            <div className="container mx-auto px-6 md:hidden">
              <AnimatePresence>
                {showFilters && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mb-8"
                  >
                    <div className="py-6 grid grid-cols-1 sm:grid-cols-2 gap-8">
                      {/* Sort By */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-secondary)] opacity-60">Sort By</label>
                        <div className="flex flex-wrap gap-2">
                          {['relevance', 'price_asc', 'price_desc'].map((option) => (
                            <button
                              key={option}
                              onClick={() => setSortBy(option)}
                              className={`px-4 py-2 rounded-xl text-xs transition-all ${sortBy === option ? 'bg-[var(--color-primary)] text-[var(--color-ink-on-gold)] shadow-md' : 'bg-[var(--color-secondary)]/5 text-[var(--color-text-secondary)] hover:bg-[var(--color-secondary)]/10'}`}
                            >
                              {option === 'relevance' ? 'Relevance' : option === 'price_asc' ? 'Price: Low to High' : 'Price: High to Low'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Color Filter */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-secondary)] opacity-60">Color</label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setSelectedColor('all')}
                            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${selectedColor === 'all' ? 'bg-[var(--color-primary)] border-transparent text-[var(--color-ink-on-gold)] shadow-md' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'}`}
                          >
                            All
                          </button>
                          {availableColors.map(color => (
                            <button
                              key={color}
                              onClick={() => setSelectedColor(color)}
                              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border capitalize ${selectedColor === color ? 'bg-[var(--color-primary)] border-transparent text-[var(--color-ink-on-gold)] shadow-md' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'}`}
                            >
                              {color}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Price Range */}
                      <div className="space-y-3 sm:col-span-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-secondary)] opacity-60">Price Range</label>
                          <span className="text-sm font-bold text-[var(--color-primary)]">{new Intl.NumberFormat(document.documentElement.lang === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(priceRange[0])} - {new Intl.NumberFormat(document.documentElement.lang === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(priceRange[1])}</span>
                        </div>
                        <div className="relative h-6 flex items-center">
                          <div className="absolute w-full h-1.5 bg-[var(--color-secondary)]/20 rounded-lg"></div>
                          <div 
                            className="absolute h-1.5 bg-[var(--color-primary)] rounded-lg"
                            style={{ 
                              left: `${(priceRange[0] / 10000) * 100}%`, 
                              right: `${100 - (priceRange[1] / 10000) * 100}%` 
                            }}
                          ></div>
                          <input 
                            type="range" 
                            min="0" 
                            max="10000" 
                            step="100"
                            value={priceRange[0]}
                            onChange={(e) => {
                              const val = Math.min(parseInt(e.target.value), priceRange[1] - 100);
                              setPriceRange([val, priceRange[1]]);
                            }}
                            className="absolute w-full appearance-none bg-transparent pointer-events-none z-10 
                              [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--color-primary)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md
                              [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[var(--color-primary)] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-none"
                          />
                          <input 
                            type="range" 
                            min="0" 
                            max="10000" 
                            step="100"
                            value={priceRange[1]}
                            onChange={(e) => {
                              const val = Math.max(parseInt(e.target.value), priceRange[0] + 100);
                              setPriceRange([priceRange[0], val]);
                            }}
                            className="absolute w-full appearance-none bg-transparent pointer-events-none z-10 
                              [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--color-primary)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md
                              [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[var(--color-primary)] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-none"
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-[var(--color-text-secondary)] font-medium">
                          <span>{new Intl.NumberFormat(document.documentElement.lang === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(0)}</span>
                          <span>{new Intl.NumberFormat(document.documentElement.lang === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(10000)}+</span>
                        </div>
                      </div>

                      {/* Reset Filters */}
                      {(sortBy !== 'relevance' || selectedColor !== 'all' || priceRange[1] < 10000) && (
                        <button 
                          onClick={() => {
                            setSortBy('relevance');
                            setSelectedColor('all');
                            setPriceRange([0, 10000]);
                          }}
                          className="w-full py-3 text-xs font-bold text-[var(--color-primary)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-surface-2)] transition-colors"
                        >
                          Reset All Filters
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {/* Content Layout */}
      <div className="container mx-auto px-5 md:px-8 lg:px-6 pb-20 md:pb-24 lg:pb-24">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 lg:gap-12">
          {/* Desktop sidebar — unchanged at lg+ */}
          <aside className="hidden lg:block lg:w-64 shrink-0">
            <div className="lg:sticky lg:top-32 max-h-[calc(100vh-160px)] overflow-y-auto pe-1">
              
              {/* Navigation Links (Categories / Subcategories) */}
              {!isSearchMode && !hasSubCategories && (
                <div className="mb-10">
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 font-heading">
                    {parentCategory ? getCategoryLabel(parentCategory, t) : 'Categories'}
                  </h2>
                  <div className="flex flex-col gap-2">
                    {(parentCategory ? parentCategory.subCategories : visibleCategories)?.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => openCategory(sub.id)}
                        className={`text-left px-4 py-2 rounded-xl text-sm transition-all ${category?.id === sub.id ? 'bg-[var(--color-primary)] text-[var(--color-ink-on-gold)] shadow-md font-bold' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-secondary)]/10'}`}
                      >
                        {getCategoryLabel(sub, t)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Filters (Hidden for parent categories) */}
              {(!hasSubCategories || isSearchMode) && (
                <>
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                      <SlidersHorizontal size={20} className="text-[var(--color-primary)]" />
                      Filters
                    </h2>
                  </div>

                  <div className="space-y-8">
                    {/* Sort By */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-secondary)] opacity-60">Sort By</label>
                      <div className="flex flex-col gap-2">
                        {['relevance', 'price_asc', 'price_desc'].map((option) => (
                          <button
                            key={option}
                            onClick={() => setSortBy(option)}
                            className={`text-left px-4 py-2 rounded-xl text-sm transition-all ${sortBy === option ? 'bg-[var(--color-primary)] text-[var(--color-ink-on-gold)] shadow-md' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-secondary)]/10'}`}
                          >
                            {option === 'relevance' ? 'Relevance' : option === 'price_asc' ? 'Price: Low to High' : 'Price: High to Low'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color Filter */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-secondary)] opacity-60">Color</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setSelectedColor('all')}
                          className={`px-2 py-2 rounded-xl text-xs font-medium transition-all border ${selectedColor === 'all' ? 'bg-[var(--color-primary)] border-transparent text-[var(--color-ink-on-gold)] shadow-md' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'}`}
                        >
                          All
                        </button>
                        {availableColors.map(color => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`px-2 py-2 rounded-xl text-xs font-medium transition-all border capitalize ${selectedColor === color ? 'bg-[var(--color-primary)] border-transparent text-[var(--color-ink-on-gold)] shadow-md' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'}`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Price Range */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-secondary)] opacity-60">Price Range</label>
                        <span className="text-sm font-bold text-[var(--color-primary)]">
                          {new Intl.NumberFormat(document.documentElement.lang === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(priceRange[0])} - {new Intl.NumberFormat(document.documentElement.lang === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(priceRange[1])}
                        </span>
                      </div>
                      <div className="relative h-6 flex items-center">
                        <div className="absolute w-full h-1.5 bg-[var(--color-primary)]/10 rounded-lg"></div>
                        <div 
                          className="absolute h-1.5 bg-[var(--color-primary)] rounded-lg"
                          style={{ 
                            left: `${(priceRange[0] / 10000) * 100}%`, 
                            right: `${100 - (priceRange[1] / 10000) * 100}%` 
                          }}
                        ></div>
                        <input 
                          type="range" 
                          min="0" 
                          max="10000" 
                          step="100"
                          value={priceRange[0]}
                          onChange={(e) => {
                            const val = Math.min(parseInt(e.target.value), priceRange[1] - 100);
                            setPriceRange([val, priceRange[1]]);
                          }}
                          className="absolute w-full appearance-none bg-transparent pointer-events-none z-10 
                            [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--color-primary)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md
                            [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[var(--color-primary)] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-none"
                        />
                        <input 
                          type="range" 
                          min="0" 
                          max="10000" 
                          step="100"
                          value={priceRange[1]}
                          onChange={(e) => {
                            const val = Math.max(parseInt(e.target.value), priceRange[0] + 100);
                            setPriceRange([priceRange[0], val]);
                          }}
                          className="absolute w-full appearance-none bg-transparent pointer-events-none z-10 
                            [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--color-primary)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md
                            [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[var(--color-primary)] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-none"
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-[var(--color-text-secondary)] font-medium">
                        <span>{new Intl.NumberFormat(document.documentElement.lang === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(0)}</span>
                        <span>{new Intl.NumberFormat(document.documentElement.lang === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(10000)}+</span>
                      </div>
                    </div>

                    {/* Reset Filters */}
                    {(sortBy !== 'relevance' || selectedColor !== 'all' || priceRange[1] < 10000) && (
                      <button 
                        onClick={() => {
                          setSortBy('relevance');
                          setSelectedColor('all');
                          setPriceRange([0, 10000]);
                        }}
                        className="w-full py-3 text-xs font-bold text-[var(--color-primary)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-surface-2)] transition-colors"
                      >
                        Reset All Filters
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </aside>

          {/* Tablet sidebar — dedicated 768px–1023px layout */}
          <aside className="hidden md:block lg:hidden w-52 shrink-0">
            <div className="sticky top-28 max-h-[calc(100dvh-8rem)] overflow-y-auto pe-1 space-y-8">
              {!isSearchMode && !hasSubCategories && (
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-3">
                    {parentCategory ? getCategoryLabel(parentCategory, t) : (t('nav_shop') || 'Categories')}
                  </h2>
                  <div className="flex flex-col gap-1.5">
                    {(parentCategory ? parentCategory.subCategories : visibleCategories)?.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => openCategory(sub.id)}
                        className={`text-start px-3 py-2 rounded-xl text-sm transition-all ${category?.id === sub.id ? 'bg-[var(--color-primary)] text-[var(--color-ink-on-gold)] font-bold' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-secondary)]/10'}`}
                      >
                        {getCategoryLabel(sub, t)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {(!hasSubCategories || isSearchMode) && (
                <div className="space-y-6">
                  <h2 className="text-sm font-bold flex items-center gap-2 text-[var(--color-text-primary)]">
                    <SlidersHorizontal size={16} className="text-[var(--color-primary)]" />
                    Filters
                  </h2>
                  <div className="space-y-2">
                    {['relevance', 'price_asc', 'price_desc'].map((option) => (
                      <button
                        key={option}
                        onClick={() => setSortBy(option)}
                        className={`w-full text-start px-3 py-2 rounded-xl text-sm transition-all ${sortBy === option ? 'bg-[var(--color-primary)] text-[var(--color-ink-on-gold)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-secondary)]/10'}`}
                      >
                        {option === 'relevance' ? 'Relevance' : option === 'price_asc' ? 'Price: Low to High' : 'Price: High to Low'}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setSelectedColor('all')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs border ${selectedColor === 'all' ? 'bg-[var(--color-primary)] text-[var(--color-ink-on-gold)] border-transparent' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}
                    >
                      All
                    </button>
                    {availableColors.slice(0, 8).map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs border capitalize ${selectedColor === color ? 'bg-[var(--color-primary)] text-[var(--color-ink-on-gold)] border-transparent' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-primary)]"></div>
                <p className="text-[var(--color-text-secondary)] font-medium animate-pulse">Curating excellence...</p>
              </div>
            ) : hasSubCategories && !isSearchMode ? (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
                {visibleSubs.map((subCat, index) => (
                  <motion.div
                    key={subCat.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -10 }}
                    onClick={() => openCategory(subCat.id)}
                    className="group cursor-pointer"
                  >
                    <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden mb-6 shadow-sm group-hover:shadow-2xl transition-all duration-500">
                      <img
                        src={subCat.imageUrl}
                        alt={getCategoryLabel(subCat, t)}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
                        <span className="text-white font-bold text-lg flex items-center gap-2">
                          {t('nav_shop')} <ArrowLeft className="rotate-180" size={20} />
                        </span>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors font-heading text-center">
                      {getCategoryLabel(subCat, t)}
                    </h3>
                  </motion.div>
                ))}
              </div>
            ) : isBrowseMode && visibleCategories.length > 0 ? (
              <div className={`grid ${categoryGridCols} gap-4 md:gap-6 lg:gap-8`}>
                {visibleCategories.map((cat, index) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    whileHover={{ y: -10 }}
                    onClick={() => openCategory(cat.id)}
                    className="group cursor-pointer"
                  >
                    <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden mb-4 shadow-sm group-hover:shadow-2xl transition-all duration-500 bg-[var(--color-secondary)]/10">
                      {cat.imageUrl && (
                        <img
                          src={cat.imageUrl}
                          alt={getCategoryLabel(cat, t)}
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors font-heading text-center">
                      {getCategoryLabel(cat, t)}
                    </h3>
                  </motion.div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className={`grid ${productGridCols} gap-x-3 gap-y-5 md:gap-x-6 md:gap-y-10 lg:gap-x-8 lg:gap-y-12 items-stretch`}>
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -10 }}
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="group cursor-pointer h-full flex flex-col"
                  >
                    <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden mb-4 md:mb-5 shadow-sm group-hover:shadow-2xl transition-all duration-500 bg-[var(--color-secondary)]/5 shrink-0">
                      <img
                        src={product.imageUrl}
                        alt={product.name?.en}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      {product.model3d?.url && (
                        <span className="absolute top-4 left-4 z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md text-white text-[10px] font-bold tracking-wider">
                          3D · AR
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(product.id);
                        }}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/80 backdrop-blur-md hover:bg-white transition-colors z-10"
                      >
                        <Heart
                          size={20} 
                          className={`transition-colors ${wishlist.includes(String(product.id)) ? 'text-[var(--color-primary)] fill-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'}`} 
                        />
                      </button>
                    </div>
                    <div className="flex flex-col flex-1 min-h-0">
                      <h3 className="text-lg md:text-xl font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors font-heading leading-snug line-clamp-2 min-h-[2.75rem]">
                        {(() => {
                          const lang = document.documentElement.lang as 'en' | 'ar';
                          return product.name?.[lang] || (product.nameKey ? t(product.nameKey) : '');
                        })()}
                      </h3>
                      <p className="text-[var(--color-primary)] font-semibold mt-1">
                        {priceFor(product, currency) != null ? formatMoney(priceFor(product, currency), { currency }) : t('price_on_request')}
                      </p>
                      <div className="flex items-center justify-between mt-1 min-h-[1.25rem]">
                        <p className="text-sm text-[var(--color-text-secondary)] font-medium truncate pe-2">
                          {(() => {
                            const lang = document.documentElement.lang as 'en' | 'ar';
                            // 1. Try CMS category object
                            if (product.category?.[lang]) return product.category[lang];
                            
                            // 2. Try categoryKey from product
                            const catObj = getCategoryObj(product.categoryKey || null);
                            if (catObj) return getCategoryLabel(catObj, t);
                            
                            // 3. Try current page category
                            if (category) return getCategoryLabel(category, t);
                            
                            // 4. Final fallback - use "Shop" or "Collection" but translated
                            return t('nav_shop');
                          })()}
                        </p>
                        {product.colors && product.colors.length > 0 && (
                          <div className="flex gap-1">
                            {product.colors.slice(0, 3).map(c => (
                              <div key={c} className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: c }} title={c} />
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Quick add to cart with default options
                          addToCart({
                            productId: product.id,
                            name: document.documentElement.lang === 'ar' ? product.name?.ar || '' : product.name?.en || '',
                            price: priceFor(product, currency),
                            imageUrl: product.imageUrl,
                            quantity: 1,
                            color: product.colors?.[0],
                            material: product.materials?.[0],
                          });
                        }}
                        className="w-full mt-auto pt-3 md:pt-4 py-2.5 bg-[var(--color-primary)] text-[var(--color-ink-on-gold)] rounded-xl font-bold text-sm hover:bg-opacity-90 transition-all max-md:opacity-100 max-md:translate-y-0 md:opacity-0 md:group-hover:opacity-100 md:translate-y-2 md:group-hover:translate-y-0"
                      >
                        {t('add_to_cart') || 'Add to Cart'}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-32 text-center bg-[var(--color-secondary)]/5 rounded-[3rem] px-8">
                <div className="w-20 h-20 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search size={32} className="text-[var(--color-primary)]" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-4 font-heading">
                  {isSearchMode ? `${t('search_no_results')} ${searchQuery}` : t('shop_artisans_work')}
                </h2>
                <p className="text-[var(--color-text-secondary)] max-w-md mx-auto text-lg">
                  {isSearchMode ? 'Try adjusting your filters or searching for something else.' : t('shop_curating_desc')}
                </p>
                {isSearchMode && (
                  <button 
                    onClick={() => {
                      setSortBy('relevance');
                      setSelectedColor('all');
                      setPriceRange([0, 10000]);
                      if (searchResultsBeforeFilters.length === 0) {
                        setSearchParams({});
                      }
                    }}
                    className="mt-8 px-8 py-3 bg-[var(--color-primary)] text-[var(--color-ink-on-gold)] rounded-full font-bold hover:shadow-lg transition-all"
                  >
                    {t('clear_filters')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
