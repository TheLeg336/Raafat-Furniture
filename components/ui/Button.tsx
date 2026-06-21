import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref' | 'children'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  children?: React.ReactNode;
}

const sizes: Record<Size, string> = {
  sm: 'text-sm px-4 py-2 gap-1.5',
  md: 'text-[0.95rem] px-6 py-3 gap-2',
  lg: 'text-base px-8 py-4 gap-2.5',
};

/**
 * The house button — pill geometry, ink-on-gold (never white on gold).
 * Primary casts the signature gold glow.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', loading, fullWidth, iconLeft, iconRight, className = '', children, disabled, ...props },
    ref,
  ) => {
    const base =
      'relative inline-flex items-center justify-center font-bold rounded-[var(--radius-pill)] ' +
      'transition-[background-color,box-shadow,transform,color] duration-200 ' +
      'focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--color-primary)] ' +
      'disabled:opacity-55 disabled:pointer-events-none select-none';

    const variants: Record<Variant, string> = {
      // Ink-on-gold rule: navy text, never white.
      primary:
        'bg-[var(--color-primary)] text-[var(--color-ink-on-gold)] shadow-[var(--gold-glow)] ' +
        'hover:shadow-[var(--gold-glow-strong)] hover:brightness-[1.03]',
      secondary:
        'bg-[var(--color-surface-2)] text-[var(--color-text-primary)] border border-[var(--color-border)] ' +
        'hover:bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]',
      ghost:
        'bg-transparent text-[var(--color-text-primary)] ' +
        'hover:bg-[var(--color-surface-2)]',
      danger:
        'bg-[var(--color-danger)] text-white hover:brightness-110',
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || loading ? 1 : 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`${base} ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && (
          <span
            className="absolute inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"
            aria-hidden="true"
          />
        )}
        <span className={`inline-flex items-center ${sizes[size].split(' ').pop()} ${loading ? 'opacity-0' : ''}`}>
          {iconLeft}
          {children}
          {iconRight}
        </span>
      </motion.button>
    );
  },
);
Button.displayName = 'Button';

export default Button;
