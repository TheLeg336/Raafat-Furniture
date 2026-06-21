import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Check, ShoppingCart, ArrowLeft, ChevronLeft, ChevronRight, Images, Box, Ruler } from 'lucide-react';
import type { TFunction } from '../types';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { useStore } from '../contexts/StoreContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { PageSpinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { ModelViewer3D } from '../components/ModelViewer3D';
import { formatMoney } from '../lib/format';
import { trackEvent } from '../lib/analytics';

interface ProductDetailsProps { t: TFunction; }

const ProductDetails: React.FC<ProductDetailsProps> = ({ t }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, loading } = useProducts();
  const { categories } = useCategories();
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const toast = useToast();

  const product = products.find((p) => p.id.toString() === id);
  const has3D = !!product?.model3d?.url;

  const [selectedColor, setSelectedColor] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [customDims, setCustomDims] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [mediaMode, setMediaMode] = useState<'photos' | '3d'>('photos');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const images = (product?.images?.length ? product.images : [product?.imageUrl]).filter(Boolean) as string[];

  useEffect(() => { if (has3D) setMediaMode('3d'); }, [has3D]);

  useEffect(() => {
    if (product) {
      if (product.colors?.length && !selectedColor) setSelectedColor(product.colors[0]);
      if (product.materials?.length && !selectedMaterial) setSelectedMaterial(product.materials[0]);
    }
  }, [product, selectedColor, selectedMaterial]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (el && el.offsetWidth > 0) {
      const index = Math.round(el.scrollLeft / el.offsetWidth);
      if (index !== currentImageIndex) setCurrentImageIndex(index);
    }
  };
  const scrollToImage = (index: number) =>
    scrollRef.current?.scrollTo({ left: index * scrollRef.current.offsetWidth, behavior: 'smooth' });

  if (loading) return <PageSpinner />;

  if (!product) {
    return (
      <div className="container mx-auto px-6 py-32 text-center min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <h1 className="font-heading text-4xl font-bold">{t('product_not_found')}</h1>
        <Link to="/"><Button>{t('product_return_home')}</Button></Link>
      </div>
    );
  }

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
      const sub = cat.subCategories?.find((s) => s.id === catId);
      if (sub) return sub;
    }
    return null;
  };
  const categoryObj = getCategoryObj(product.categoryKey);
  const category = getLocalizedText(product.category || categoryObj?.name, categoryObj?.labelKey);
  const description = getLocalizedText(product.description, undefined) || t('product_fallback_desc').replace('{name}', name);
  const isWishlisted = wishlist.includes(String(product.id));

  const handleAddToCart = () => {
    setIsAdding(true);
    addToCart({
      productId: product.id,
      name,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity: 1,
      color: selectedColor || undefined,
      material: selectedMaterial || undefined,
      customDimensions: customDims.trim() || undefined,
    });
    trackEvent('add_to_cart', { product: name, value: product.price });
    toast.success(t('added_to_cart') || 'Added to cart');
    setTimeout(() => setIsAdding(false), 800);
  };

  return (
    <div className="container mx-auto px-6 pt-10 pb-24 md:pt-16 min-h-[80vh]">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 mb-8 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
      >
        <ArrowLeft size={18} /> {t('nav_shop')}
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14 items-start">
        {/* MEDIA */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }} className="md:sticky md:top-24">
          {/* media toggle */}
          {has3D && (
            <div className="inline-flex gap-1 p-1 mb-3 rounded-[var(--radius-pill)] bg-[var(--color-surface-2)] border border-[var(--color-border)]">
              {(['3d', 'photos'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMediaMode(m)}
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[var(--radius-pill)] text-sm font-semibold transition-colors ${mediaMode === m ? 'bg-[var(--color-primary)] text-[var(--color-ink-on-gold)]' : 'text-[var(--color-text-secondary)]'}`}
                >
                  {m === '3d' ? <Box size={15} /> : <Images size={15} />}
                  {m === '3d' ? (t('view_3d') || '3D & AR') : (t('view_photos') || 'Photos')}
                </button>
              ))}
            </div>
          )}

          {mediaMode === '3d' && has3D ? (
            <div className="rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-border)] aspect-square">
              <ModelViewer3D model={product.model3d!} productName={name} t={t} className="h-full" />
            </div>
          ) : (
            <div className="bg-[var(--color-secondary)] rounded-[var(--radius-lg)] overflow-hidden relative shadow-[var(--shadow-lg)] group aspect-square">
              <div ref={scrollRef} onScroll={handleScroll} className="flex h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth" style={{ touchAction: 'pan-x pan-y' }}>
                {images.map((img, idx) => (
                  <div key={idx} className="w-full h-full flex-shrink-0 snap-center">
                    <img src={img} alt={`${name} — view ${idx + 1}`} draggable="false" className="w-full h-full object-cover" loading={idx === 0 ? 'eager' : 'lazy'} />
                  </div>
                ))}
              </div>
              {images.length > 1 && (
                <>
                  <button onClick={() => scrollToImage((currentImageIndex - 1 + images.length) % images.length)} aria-label={t('prev_image') || 'Previous image'} className="absolute start-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/35 text-white backdrop-blur-md md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10"><ChevronLeft size={22} /></button>
                  <button onClick={() => scrollToImage((currentImageIndex + 1) % images.length)} aria-label={t('next_image') || 'Next image'} className="absolute end-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/35 text-white backdrop-blur-md md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10"><ChevronRight size={22} /></button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/35 px-3 py-1.5 rounded-full backdrop-blur-md">
                    {images.map((_, idx) => (
                      <button key={idx} onClick={() => scrollToImage(idx)} aria-label={`Go to image ${idx + 1}`} className="relative w-2 h-2 flex items-center justify-center">
                        <motion.div className="absolute rounded-full bg-white" initial={false} animate={{ width: idx === currentImageIndex ? 16 : 8, height: 8, opacity: idx === currentImageIndex ? 1 : 0.5 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                      </button>
                    ))}
                  </div>
                </>
              )}
              <button onClick={() => toggleWishlist(product.id)} className="absolute top-5 end-5 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all z-10" aria-label={t('toggle_wishlist') || 'Toggle wishlist'}>
                <Heart className={`w-5 h-5 transition-colors ${isWishlisted ? 'fill-[var(--color-primary)] text-[var(--color-primary)]' : 'text-white'}`} />
              </button>
            </div>
          )}
        </motion.div>

        {/* INFO */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 1, 0.5, 1] }} className="flex flex-col">
          {category && <Badge tone="navy" className="self-start mb-4">{category}</Badge>}
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] mb-3 text-balance">{name}</h1>
          <p className="text-2xl text-[var(--color-primary)] mb-6 font-semibold">
            {product.price ? formatMoney(product.price) : t('price_on_request')}
          </p>
          <p className="text-[var(--color-text-secondary)] leading-relaxed mb-8 measure" style={{ textWrap: 'pretty' as any }}>{description}</p>

          <div className="flex flex-col gap-6 mb-8">
            {product.colors && product.colors.length > 0 && (
              <Selector label={t('color') || 'Color'} options={product.colors} value={selectedColor} onPick={setSelectedColor} />
            )}
            {product.materials && product.materials.length > 0 && (
              <Selector label={t('material') || 'Material'} options={product.materials} value={selectedMaterial} onPick={setSelectedMaterial} />
            )}

            {product.dimensions && (
              <div className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
                <Ruler size={16} className="mt-0.5 shrink-0 text-[var(--color-primary)]" />
                <span><span className="font-semibold text-[var(--color-text-primary)]">{t('dimensions') || 'Dimensions'}:</span> {product.dimensions}</span>
              </div>
            )}

            {product.customDimensionsEnabled && (
              <Input
                label={t('custom_dimensions') || 'Custom dimensions (optional)'}
                hint={t('custom_dimensions_hint') || 'Tell us the size you need — we make to order.'}
                value={customDims}
                onChange={(e) => setCustomDims(e.target.value)}
                placeholder={t('custom_dimensions_ph') || 'e.g. 220cm W × 95cm D'}
              />
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleAddToCart} loading={isAdding} size="lg" className="flex-1" iconLeft={!isAdding ? <ShoppingCart size={18} /> : undefined}>
              <AnimatePresence mode="wait" initial={false}>
                {isAdding ? (
                  <motion.span key="added" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="inline-flex items-center gap-2"><Check size={18} /> {t('added') || 'Added'}</motion.span>
                ) : (
                  <motion.span key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{t('add_to_cart') || 'Add to Cart'}</motion.span>
                )}
              </AnimatePresence>
            </Button>
            <Button variant="secondary" size="lg" onClick={() => toggleWishlist(product.id)} iconLeft={<Heart size={18} className={isWishlisted ? 'fill-current' : ''} />}>
              {isWishlisted ? (t('saved') || 'Saved') : (t('save') || 'Save')}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const Selector: React.FC<{ label: string; options: string[]; value: string; onPick: (v: string) => void }> = ({ label, options, value, onPick }) => (
  <div>
    <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">{label}</h3>
    <div className="flex flex-wrap gap-2.5">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onPick(o)}
          aria-pressed={value === o}
          className={`px-4 py-2 rounded-[var(--radius-pill)] border text-sm capitalize transition-colors ${value === o ? 'bg-[var(--color-primary)] text-[var(--color-ink-on-gold)] border-transparent' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'}`}
        >
          {o}
        </button>
      ))}
    </div>
  </div>
);

export default ProductDetails;
