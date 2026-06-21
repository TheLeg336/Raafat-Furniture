import React, { createContext, useCallback, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastTone = 'success' | 'error' | 'info';
interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
}

interface ToastCtx {
  toast: (message: string, tone?: ToastTone) => void;
  success: (m: string) => void;
  error: (m: string) => void;
  info: (m: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export const useToast = (): ToastCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Fail soft — toasts are non-critical; never crash a tree for a missing provider.
    const noop = () => {};
    return { toast: noop, success: noop, error: noop, info: noop };
  }
  return ctx;
};

const icons = {
  success: <CheckCircle2 size={18} className="text-[#3ba55d]" />,
  error: <AlertCircle size={18} className="text-[var(--color-danger)]" />,
  info: <Info size={18} className="text-[var(--color-primary)]" />,
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((t) => [...t, { id, message, tone }]);
      setTimeout(() => remove(id), 4200);
    },
    [remove],
  );

  const value: ToastCtx = {
    toast,
    success: (m) => toast(m, 'success'),
    error: (m) => toast(m, 'error'),
    info: (m) => toast(m, 'info'),
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed bottom-4 inset-x-0 flex flex-col items-center gap-2 px-4 pointer-events-none"
            style={{ zIndex: 'var(--z-toast)' as any }}
            role="region"
            aria-live="polite"
            aria-label="Notifications"
          >
            <AnimatePresence>
              {toasts.map((t) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 16, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  className="pointer-events-auto flex items-center gap-3 max-w-md w-full sm:w-auto bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-[var(--radius-pill)] shadow-[var(--shadow-lg)] ps-4 pe-2 py-2.5"
                >
                  {icons[t.tone]}
                  <span className="text-sm flex-1">{t.message}</span>
                  <button
                    onClick={() => remove(t.id)}
                    aria-label="Dismiss"
                    className="p-1 rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>,
          document.body,
        )}
    </Ctx.Provider>
  );
};

export default ToastProvider;
