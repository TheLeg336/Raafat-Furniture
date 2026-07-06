import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileBottomSheetProps {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  children: React.ReactNode;
}

/** Mobile menu sheet — slides up from bottom; top corners rounded only. */
export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({ open, onClose, ariaLabel, children }) => (
  <AnimatePresence>
    {open && (
      <>
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="md:hidden fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm"
          aria-label="Close menu"
          onClick={onClose}
        />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 340, damping: 36 }}
          className="md:hidden fixed inset-x-0 bottom-0 z-[130] max-h-[min(88dvh,640px)] overflow-y-auto rounded-t-3xl bg-[var(--color-background)] shadow-2xl border-t border-[var(--color-border)]/20 pb-[calc(env(safe-area-inset-bottom,0px)+var(--mobile-tab-height)+0.75rem)]"
        >
          <div className="sticky top-0 z-10 flex justify-center pt-3 pb-2 bg-[var(--color-background)]" aria-hidden>
            <span className="w-10 h-1 rounded-full bg-[var(--color-text-secondary)]/25" />
          </div>
          {children}
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export default MobileBottomSheet;
