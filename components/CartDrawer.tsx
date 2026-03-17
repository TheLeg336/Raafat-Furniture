import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';

export const CartDrawer: React.FC<{ t: any }> = ({ t }) => {
  const { 
    cart, 
    savedForLater, 
    isCartOpen, 
    setIsCartOpen, 
    removeFromCart, 
    updateCartQuantity, 
    moveToSavedForLater,
    moveToCart,
    removeFromSavedForLater
  } = useStore();
  const navigate = useNavigate();
  const { products } = useProducts();

  const subtotal = cart.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);

  const getSyncedProduct = (item: any) => {
    const product = products.find(p => p.id.toString() === item.productId.toString());
    const lang = document.documentElement.lang as 'en' | 'ar';
    
    if (!product) return { name: item.name, imageUrl: item.imageUrl, price: item.price };

    return {
      name: product.name?.[lang] || (product.nameKey ? t(product.nameKey) : item.name),
      imageUrl: product.images?.[0] || product.imageUrl || item.imageUrl,
      price: product.price || item.price
    };
  };

  const handleProductClick = (productId: string | number) => {
    setIsCartOpen(false);
    navigate(`/product/${productId}`);
  };

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCartOpen]);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[var(--color-background)] shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-[var(--color-primary)]/10">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <ShoppingBag className="text-[var(--color-primary)]" />
                {t('cart') || 'Your Cart'}
              </h2>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-full hover:bg-[var(--color-primary)]/10 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Cart Items */}
              <div>
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-[var(--color-text-secondary)]">
                    <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
                    <p>{t('cart_empty') || 'Your cart is empty.'}</p>
                    <button 
                      onClick={() => {
                        setIsCartOpen(false);
                        navigate('/#shop');
                      }}
                      className="mt-6 px-6 py-2 bg-[var(--color-primary)] text-white rounded-full font-medium"
                    >
                      {t('continue_shopping') || 'Continue Shopping'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {cart.map((item) => {
                      const synced = getSyncedProduct(item);
                      return (
                        <div key={item.id} className="flex gap-4">
                          <button 
                            onClick={() => handleProductClick(item.productId)}
                            className="w-24 h-24 rounded-xl overflow-hidden bg-[var(--color-secondary)]/10 flex-shrink-0 hover:opacity-80 transition-opacity"
                          >
                            <img src={synced.imageUrl} alt={synced.name} className="w-full h-full object-cover" />
                          </button>
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start">
                                <button 
                                  onClick={() => handleProductClick(item.productId)}
                                  className="font-bold text-lg leading-tight text-left hover:text-[var(--color-primary)] transition-colors"
                                >
                                  {synced.name}
                                </button>
                                <span className="font-bold text-[var(--color-primary)]">
                                  {synced.price ? new Intl.NumberFormat(document.documentElement.lang === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'USD' }).format(synced.price) : t('price_on_request')}
                                </span>
                              </div>
                              <div className="text-sm text-[var(--color-text-secondary)] mt-1 flex gap-2">
                                {item.color && <span>Color: {item.color}</span>}
                                {item.material && <span>Material: {item.material}</span>}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center border border-[var(--color-primary)]/20 rounded-full">
                                <button 
                                  onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                  className="w-8 h-8 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
                                >-</button>
                                <span className="w-8 text-center text-sm font-medium">{new Intl.NumberFormat(document.documentElement.lang === 'ar' ? 'ar-EG' : 'en-US').format(item.quantity)}</span>
                                <button 
                                  onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                  className="w-8 h-8 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
                                >+</button>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => moveToSavedForLater(item.id)}
                                  className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] underline underline-offset-2"
                                >
                                  {t('save_for_later') || 'Save for later'}
                                </button>
                                <button 
                                  onClick={() => removeFromCart(item.id)}
                                  className="p-1.5 text-[var(--color-text-secondary)] hover:text-red-500 transition-colors rounded-full hover:bg-red-500/10"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Saved for Later */}
              {savedForLater.length > 0 && (
                <div className="pt-8 border-t border-[var(--color-primary)]/10">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Heart size={18} className="text-[var(--color-primary)]" />
                    {t('saved_for_later') || 'Saved for later'} ({savedForLater.length})
                  </h3>
                  <div className="space-y-4">
                    {savedForLater.map((item) => {
                      const synced = getSyncedProduct(item);
                      return (
                        <div key={item.id} className="flex gap-4 opacity-70 hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleProductClick(item.productId)}
                            className="w-16 h-16 rounded-lg overflow-hidden bg-[var(--color-secondary)]/10 flex-shrink-0 hover:opacity-80 transition-opacity"
                          >
                            <img src={synced.imageUrl} alt={synced.name} className="w-full h-full object-cover" />
                          </button>
                          <div className="flex-1 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                              <button 
                                onClick={() => handleProductClick(item.productId)}
                                className="font-semibold text-sm text-left hover:text-[var(--color-primary)] transition-colors"
                              >
                                {synced.name}
                              </button>
                              <span className="font-bold text-sm">
                                {synced.price ? new Intl.NumberFormat(document.documentElement.lang === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'USD' }).format(synced.price) : t('price_on_request')}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <button 
                                onClick={() => moveToCart(item.id)}
                                className="text-xs font-medium text-[var(--color-primary)] hover:underline"
                              >
                                {t('move_to_cart') || 'Move to cart'}
                              </button>
                              <button 
                                onClick={() => removeFromSavedForLater(item.id)}
                                className="text-xs text-[var(--color-text-secondary)] hover:text-red-500"
                              >
                                {t('remove') || 'Remove'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer / Checkout */}
            {cart.length > 0 && (
              <div className="p-6 bg-[var(--color-secondary)]/5 border-t border-[var(--color-primary)]/10">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[var(--color-text-secondary)]">{t('subtotal') || 'Subtotal'}</span>
                  <span className="text-2xl font-bold">{new Intl.NumberFormat(document.documentElement.lang === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'USD' }).format(subtotal)}</span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mb-6">
                  {t('shipping_taxes_calculated') || 'Shipping and taxes calculated at checkout.'}
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate('/checkout');
                    }}
                    className="w-full py-4 bg-[var(--color-primary)] text-white rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:bg-[var(--color-primary)]/90 transition-colors shadow-lg shadow-[var(--color-primary)]/20"
                  >
                    {t('checkout') || 'Checkout'}
                    <ArrowRight size={20} />
                  </button>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="w-full py-3 bg-[var(--color-secondary)]/10 text-[var(--color-text-primary)] rounded-full font-bold text-lg hover:bg-[var(--color-secondary)]/20 transition-colors"
                  >
                    {t('close') || 'Close'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
