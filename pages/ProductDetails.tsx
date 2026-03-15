import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Check, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import type { TFunction } from '../types';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { useStore } from '../contexts/StoreContext';

interface ProductDetailsProps {
  t: TFunction;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ t }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, loading } = useProducts();
  const { categories } = useCategories();
  const { addToCart, toggleWishlist, wishlist } = useStore();
  
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const product = products.find(p => p.id.toString() === id);

  // Initialize selections when product loads
  React.useEffect(() => {
    if (product) {
      if (product.colors && product.colors.length > 0 && !selectedColor) {
        setSelectedColor(product.colors[0]);
      }
      if (product.materials && product.materials.length > 0 && !selectedMaterial) {
        setSelectedMaterial(product.materials[0]);
      }
    }
  }, [product, selectedColor, selectedMaterial]);

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
  const getCategoryObj = (catId?: string) => {
    if (!catId) return null;
    for (const cat of categories) {
      if (cat.id === catId) return cat;
      if (cat.subCategories) {
        const sub = cat.subCategories.find(s => s.id === catId);
        if (sub) return sub;
      }
    }
    return null;
  };

  const categoryObj = getCategoryObj(product.categoryKey);
  const category = getLocalizedText(product.category || categoryObj?.name, categoryObj?.labelKey);
  const description = getLocalizedText(product.description, undefined) || t('product_fallback_desc').replace('{name}', name);
  
  const isWishlisted = wishlist.includes(String(product.id));

  const images = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : [product.imageUrl];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleAddToCart = () => {
    setIsAdding(true);
    addToCart({
      productId: product.id,
      name,
      price: product.price,
      imageUrl: images[0],
      quantity: 1,
      color: selectedColor || undefined,
      material: selectedMaterial || undefined,
    });
    
    // Show animation
    setTimeout(() => {
      setIsAdding(false);
    }, 600);
  };

  return (
    <main className="container mx-auto px-6 pt-12 pb-24 md:pt-32 md:pb-32 min-h-[80vh]">
      <button 
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 mb-8 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
        title={t('nav_go_back')}
      >
        <span>&larr;</span> {t('nav_shop')}
      </button>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        <div className="flex flex-col gap-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-[var(--color-secondary)] rounded-3xl overflow-hidden relative shadow-xl group"
          >
          <div className="relative aspect-square w-full">
            <img 
              src={images[currentImageIndex]} 
              alt={`Photo of ${name} - Image ${currentImageIndex + 1}`} 
              className="w-full h-full object-cover transition-opacity duration-300"
            />
            
            {images.length > 1 && (
              <>
                <div className="absolute top-4 left-4 bg-black/50 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm z-10">
                  {currentImageIndex + 1} / {images.length}
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Next image"
                >
                  <ChevronRight size={24} />
                </button>
                
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'
                      }`}
                      aria-label={`Go to image ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all z-10"
            aria-label="Toggle Wishlist"
          >
            <Heart 
              className={`w-6 h-6 transition-colors ${isWishlisted ? 'fill-[var(--color-primary)] text-[var(--color-primary)]' : 'text-white'}`} 
            />
          </button>
        </motion.div>
        
        {images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x mt-4">
            {images.map((url, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all snap-start ${
                  idx === currentImageIndex ? 'border-[var(--color-primary)]' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] mb-4">
            {name}
          </h1>
          <p className="text-2xl text-[var(--color-primary)] mb-6 font-medium">
            {product.price ? `$${product.price.toLocaleString()}` : t('price_on_request')}
          </p>
          
          <div className="mb-8">
            <span className="inline-block px-3 py-1 bg-[var(--color-secondary)] text-[var(--color-text-secondary)] rounded-full text-sm font-medium">
              {category}
            </span>
          </div>
          
          <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed mb-10">
            {description}
          </p>
          
          {/* Options */}
          <div className="space-y-6 mb-10">
            {product.colors && product.colors.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
                  Color
                </h3>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-full border transition-all ${
                        selectedColor === color 
                          ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/10' 
                          : 'border-[var(--color-text-secondary)]/30 text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)]'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {product.materials && product.materials.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
                  Material
                </h3>
                <div className="flex flex-wrap gap-3">
                  {product.materials.map(material => (
                    <button
                      key={material}
                      onClick={() => setSelectedMaterial(material)}
                      className={`px-4 py-2 rounded-full border transition-all ${
                        selectedMaterial === material 
                          ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/10' 
                          : 'border-[var(--color-text-secondary)]/30 text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)]'
                      }`}
                    >
                      {material}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handleAddToCart}
              disabled={isAdding}
              className="flex-1 relative overflow-hidden px-8 py-4 bg-[var(--color-primary)] text-white rounded-full font-bold text-lg hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100"
            >
              <AnimatePresence mode="wait">
                {isAdding ? (
                  <motion.div
                    key="adding"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    <span>Added</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="add"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>{t('add_to_cart') || 'Add to Cart'}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
            
            <button 
              onClick={() => toggleWishlist(product.id)}
              className="px-8 py-4 border-2 border-[var(--color-primary)] text-[var(--color-primary)] rounded-full font-bold text-lg hover:bg-[var(--color-primary)] hover:text-white transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
              <span>{isWishlisted ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
};

export default ProductDetails;
