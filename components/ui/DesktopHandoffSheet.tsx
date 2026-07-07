import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, X } from 'lucide-react';
import { QrCode } from './QrCode';

interface DesktopHandoffSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  url: string;
  qrLabel?: string;
}

/** Desktop modal with QR code — scan with phone to continue on mobile. */
export const DesktopHandoffSheet: React.FC<DesktopHandoffSheetProps> = ({
  open,
  onClose,
  title,
  description,
  url,
  qrLabel,
}) => (
  <AnimatePresence>
    {open && (
      <>
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[var(--z-modal-backdrop)] bg-black/55 backdrop-blur-sm"
          aria-label="Close"
          onClick={onClose}
        />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 340, damping: 32 }}
          className="fixed left-1/2 top-1/2 z-[var(--z-modal)] w-[min(92vw,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Smartphone size={20} className="text-[var(--color-primary)] shrink-0" />
              <h2 className="font-heading text-lg font-bold">{title}</h2>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]" aria-label="Close">
              <X size={18} />
            </button>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mb-5">{description}</p>
          <QrCode value={url} size={200} label={qrLabel || 'Scan with your phone camera'} className="mx-auto" />
          <p className="mt-4 text-[11px] text-center text-[var(--color-text-secondary)] break-all">{url}</p>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export default DesktopHandoffSheet;
