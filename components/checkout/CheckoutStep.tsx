import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';

interface CheckoutStepProps {
  step: number;
  title: string;
  summary?: string;
  open: boolean;
  done: boolean;
  onToggle: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  children: React.ReactNode;
}

/** Animated accordion step for checkout — one section open at a time. */
export const CheckoutStep: React.FC<CheckoutStepProps> = ({
  step,
  title,
  summary,
  open,
  done,
  onToggle,
  onContinue,
  continueLabel = 'Continue',
  continueDisabled,
  children,
}) => (
  <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-[var(--shadow-sm)] min-w-0 w-full">
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-3 px-4 py-4 text-start transition-colors hover:bg-[var(--color-surface-2)]/50 min-w-0"
      aria-expanded={open}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
          done ? 'bg-[var(--color-primary)] text-[var(--color-ink-on-gold)]' : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]'
        }`}
      >
        {done ? <Check size={16} strokeWidth={2.5} /> : step}
      </span>
      <span className="flex-1 min-w-0 overflow-hidden">
        <span className="block font-heading font-bold text-[var(--color-text-primary)] truncate">{title}</span>
        {!open && summary && (
          <span className="block text-xs text-[var(--color-text-secondary)] truncate mt-0.5">{summary}</span>
        )}
      </span>
      <ChevronDown size={18} className={`shrink-0 text-[var(--color-text-secondary)] transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>

    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          key="body"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
          className="overflow-hidden min-w-0"
        >
          <div className="px-4 pb-4 pt-0 border-t border-[var(--color-border)]/60 min-w-0">
            <div className="pt-4 space-y-4 min-w-0 w-full max-w-full">{children}</div>
            {onContinue && (
              <Button
                type="button"
                className="w-full mt-4"
                disabled={continueDisabled}
                onClick={onContinue}
              >
                {continueLabel}
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default CheckoutStep;
