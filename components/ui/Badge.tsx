import React from 'react';

type Tone = 'neutral' | 'gold' | 'navy' | 'success' | 'danger' | 'info';

const tones: Record<Tone, string> = {
  neutral: 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]',
  gold: 'bg-[hsla(var(--color-primary-hsl-values),0.18)] text-[var(--color-ink-on-gold)] dark:text-[var(--color-primary)]',
  navy: 'bg-[var(--color-secondary)] text-white',
  success: 'bg-[var(--color-primary)] text-[var(--color-ink-on-gold)]',
  danger: 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]',
  info: 'bg-[rgba(20,33,61,0.10)] text-[var(--color-secondary)] dark:text-[#9db4e0] dark:bg-[rgba(157,180,224,0.14)]',
};

interface BadgeProps {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', className = '', children }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1 text-xs font-semibold ${tones[tone]} ${className}`}
  >
    {children}
  </span>
);

export default Badge;
