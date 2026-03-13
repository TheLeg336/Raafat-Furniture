import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useNavigate } from 'react-router-dom';

export const AuthModal: React.FC<{ t: any }> = ({ t }) => {
  const { showAuthModal, setShowAuthModal } = useStore();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {showAuthModal && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAuthModal(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
          />
          <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[var(--color-background)] rounded-3xl shadow-2xl p-8 max-w-md w-full pointer-events-auto relative overflow-hidden"
            >
              {/* Decorative background element */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-[var(--color-primary)]/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[var(--color-secondary)]/10 rounded-full blur-3xl" />

              <button 
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-[var(--color-primary)]/10 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors z-10"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-8 relative z-10">
                <div className="w-16 h-16 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart size={32} className="text-[var(--color-primary)] fill-[var(--color-primary)]" />
                </div>
                <h2 className="text-2xl font-bold mb-2 font-heading-luxe">
                  {t('sign_in_to_save') || 'Sign in to save this item'}
                </h2>
                <p className="text-[var(--color-text-secondary)]">
                  {t('create_account_wishlist') || 'Create an account or log in to save items to your wishlist and access them on any device.'}
                </p>
              </div>

              <div className="space-y-4 relative z-10">
                <button
                  onClick={() => {
                    setShowAuthModal(false);
                    navigate('/login');
                  }}
                  className="w-full py-3 px-6 bg-[var(--color-primary)] text-white rounded-full font-bold hover:bg-[var(--color-primary)]/90 transition-all shadow-lg shadow-[var(--color-primary)]/20"
                >
                  {t('sign_in') || 'Sign In'}
                </button>
                <button
                  onClick={() => {
                    setShowAuthModal(false);
                    navigate('/login?signup=true');
                  }}
                  className="w-full py-3 px-6 bg-transparent border-2 border-[var(--color-primary)] text-[var(--color-primary)] rounded-full font-bold hover:bg-[var(--color-primary)]/5 transition-all"
                >
                  {t('create_account') || 'Create Account'}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
